'use client';
import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 900;
const BUFFER = 20;        // frames to preload ahead/behind current
const MAX_CACHE = 60;     // max decoded ImageBitmaps in GPU memory

// URL-encode the folder name that contains spaces and parentheses
function getFrameUrl(index: number): string {
  const n = index.toString().padStart(3, '0');
  return `/bg-frames-webp/ezgif-frame-${n}.webp`;
}

class FrameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Storage
  private blobCache   = new Map<number, Blob>();
  private bitmapCache = new Map<number, ImageBitmap>();
  private lruOrder: number[] = [];
  private fetching    = new Map<number, AbortController>();

  // Physics
  private targetProg  = 0;
  private currentProg = 0;
  private velocity    = 0;
  private lastTime    = 0;
  private raf: number | null = null;
  private lastFrame   = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  private async fetchFrame(i: number): Promise<Blob> {
    if (this.blobCache.has(i)) return this.blobCache.get(i)!;
    const ctrl = new AbortController();
    this.fetching.set(i, ctrl);
    try {
      const res = await fetch(getFrameUrl(i), { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for frame ${i}`);
      const blob = await res.blob();
      this.blobCache.set(i, blob);
      return blob;
    } finally {
      this.fetching.delete(i);
    }
  }

  private async loadBitmap(i: number): Promise<ImageBitmap> {
    if (this.bitmapCache.has(i)) return this.bitmapCache.get(i)!;
    const blob   = await this.fetchFrame(i);
    const bitmap = await createImageBitmap(blob);
    this.bitmapCache.set(i, bitmap);
    this.lruOrder.push(i);
    // Evict oldest if cache too large
    while (this.lruOrder.length > MAX_CACHE) {
      const evict = this.lruOrder.shift()!;
      this.bitmapCache.get(evict)?.close();
      this.bitmapCache.delete(evict);
    }
    return bitmap;
  }

  // Preload the first ~15 frames so first render is instant
  async preloadInitial(onProgress: (p: number) => void): Promise<void> {
    const frames = Array.from({ length: 15 }, (_, i) => i + 1);
    let done = 0;
    await Promise.all(frames.map(i =>
      this.loadBitmap(i).then(() => {
        done++;
        onProgress(Math.round((done / frames.length) * 100));
      }).catch(() => { done++; onProgress(Math.round((done / frames.length) * 100)); })
    ));
  }

  // ── Prefetch buffer around current frame ─────────────────────────────────

  private prefetch(frame: number) {
    const start = Math.max(1, frame - BUFFER);
    const end   = Math.min(TOTAL_FRAMES, frame + BUFFER);
    for (let i = start; i <= end; i++) {
      if (!this.bitmapCache.has(i) && !this.blobCache.has(i) && !this.fetching.has(i)) {
        this.loadBitmap(i).catch(() => null);
      }
    }
    // Abort fetches too far outside window
    this.fetching.forEach((ctrl, fi) => {
      if (fi < start - 5 || fi > end + 5) { ctrl.abort(); this.fetching.delete(fi); }
    });
  }

  // ── Physics ───────────────────────────────────────────────────────────────

  setTarget(progress: number) {
    this.targetProg = Math.min(1, Math.max(0, progress));
    if (!this.raf) {
      this.lastTime = 0;
      this.raf = requestAnimationFrame(ts => this.loop(ts));
    }
  }

  private loop(ts: number) {
    if (!this.lastTime) this.lastTime = ts;
    let dt = (ts - this.lastTime) / 1000;
    this.lastTime = ts;
    if (dt > 0.1) dt = 0.1;

    // Critically-damped spring  ω=12, ζ=1
    const k = 12, c = 2 * Math.sqrt(k);
    const diff = this.targetProg - this.currentProg;
    this.velocity  += (k * diff - c * this.velocity) * dt;
    this.currentProg = Math.min(1, Math.max(0, this.currentProg + this.velocity * dt));

    const fi = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(this.currentProg * (TOTAL_FRAMES - 1)) + 1));
    this.prefetch(fi);

    const bitmap = this.bitmapCache.get(fi);
    if (bitmap && fi !== this.lastFrame) {
      this.draw(bitmap);
      this.lastFrame = fi;
    } else if (!bitmap) {
      // Try to load on demand; meanwhile show nearest cached frame
      this.loadBitmap(fi).then(bm => {
        if (this.lastFrame !== fi) { this.draw(bm); this.lastFrame = fi; }
      }).catch(() => null);
    }

    const settled = Math.abs(this.targetProg - this.currentProg) < 0.0001
                 && Math.abs(this.velocity) < 0.0001;
    if (settled) {
      this.currentProg = this.targetProg;
      this.velocity    = 0;
      this.raf         = null;
    } else {
      this.raf = requestAnimationFrame(t => this.loop(t));
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private draw(bm: ImageBitmap) {
    const { width: cw, height: ch } = this.canvas;
    const scale = Math.max(cw / bm.width, ch / bm.height);
    const w = bm.width  * scale;
    const h = bm.height * scale;
    this.ctx.drawImage(bm, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const bm = this.bitmapCache.get(this.lastFrame);
    if (bm) this.draw(bm);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.fetching.forEach(c => c.abort());
    this.bitmapCache.forEach(bm => { try { bm.close(); } catch {} });
  }
}

// ── React component ──────────────────────────────────────────────────────────

export default function ScrollCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const engineRef  = useRef<FrameEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FrameEngine(canvas);
    engineRef.current = engine;
    engine.resize();

    const onResize  = () => engine.resize();
    const onScroll  = () => {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      engine.setTarget(total > 0 ? scrolled / total : 0);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Preload first frames then mark ready
    engine.preloadInitial(() => {}).then(() => {
      setReady(true);
      onScroll(); // sync to current scroll position
    });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-20 bg-[#0b0908]"
      style={{ pointerEvents: 'none' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: ready ? 0.6 : 0,
          transition: 'opacity 0.6s ease',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
