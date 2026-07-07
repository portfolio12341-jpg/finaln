'use client';
import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 900; // Using all 900 frames
const BUFFER = 20;        // frames to preload ahead/behind current
const MAX_CACHE = 80;     // max decoded ImageBitmaps in GPU memory

function getFrameUrl(index: number): string {
  const n = index.toString().padStart(3, '0');
  return `/bg-frames-webp/ezgif-frame-${n}.webp`;
}

class FrameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Storage
  private blobCache   = new Map<number, Blob>();
  private bitmapCache = new Map<number, ImageBitmap | HTMLImageElement>();
  private lruOrder: number[] = [];
  private fetching    = new Map<number, AbortController>();

  // Scroll Tracking
  private targetProg  = 0;
  private currentProg = 0;
  private lastFrame   = -1;
  private screenFrame = -1;
  private lastScrollTime = 0;
  private ticking = false;
  private lastDrawTime = 0;

  // Adaptive Optimization Settings
  private stride = 1;
  private bufferSize = 8;
  private maxCache = 60;
  private maxConcurrent = 3;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    this.detectDeviceCapabilities();
  }

  private detectDeviceCapabilities() {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || (width < 768);
    const isTablet = width >= 768 && width < 1024;
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile || cores <= 4) {
      this.stride = 4;         // Fetch and render every 4th frame (225 frames total)
      this.bufferSize = 3;     // Low buffer to minimize parallel requests
      this.maxCache = 25;      // Small VRAM footprint to prevent tab crashes
      this.maxConcurrent = 3;  // Limit concurrent HTTP requests to 3
    } else if (isTablet) {
      this.stride = 2;         // Fetch and render every 2nd frame (450 frames total)
      this.bufferSize = 6;
      this.maxCache = 45;
      this.maxConcurrent = 4;
    } else {
      this.stride = 1;         // Full quality on desktop (900 frames total)
      this.bufferSize = 12;
      this.maxCache = 80;
      this.maxConcurrent = 4;
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  private async fetchFrame(i: number): Promise<Blob> {
    if (this.blobCache.has(i)) return this.blobCache.get(i)!;

    // Active Connection Throttling (Priority Queue via Abort)
    const refFrame = this.lastFrame !== -1 ? this.lastFrame : 1;
    if (this.fetching.size >= this.maxConcurrent) {
      let maxDist = -1;
      let maxDistFrame = -1;

      for (const activeFrame of this.fetching.keys()) {
        const dist = Math.abs(activeFrame - refFrame);
        if (dist > maxDist) {
          maxDist = dist;
          maxDistFrame = activeFrame;
        }
      }

      const thisDist = Math.abs(i - refFrame);
      if (thisDist === 0) {
        // This is the current frame we want to render immediately!
        // We MUST load it. Abort the furthest active fetch to make room.
        if (maxDistFrame !== -1) {
          this.fetching.get(maxDistFrame)?.abort();
          this.fetching.delete(maxDistFrame);
        }
      } else if (maxDistFrame !== -1 && maxDist > thisDist) {
        // This is a prefetch frame that is closer than the furthest active fetch.
        // Abort the furthest active fetch to free up a slot.
        this.fetching.get(maxDistFrame)?.abort();
        this.fetching.delete(maxDistFrame);
      } else {
        // This prefetch frame is too far, throttle/skip it.
        throw new Error(`Fetch throttled for frame ${i}`);
      }
    }

    const ctrl = new AbortController();
    this.fetching.set(i, ctrl);

    // 5-second timeout to prevent hanging fetches from freezing the engine
    const timeoutId = setTimeout(() => {
      ctrl.abort();
    }, 5000);

    try {
      const res = await fetch(getFrameUrl(i), { signal: ctrl.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status} for frame ${i}`);
      const blob = await res.blob();
      this.blobCache.set(i, blob);
      return blob;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      this.fetching.delete(i);
    }
  }

  private async loadBitmap(i: number): Promise<ImageBitmap | HTMLImageElement> {
    if (this.bitmapCache.has(i)) return this.bitmapCache.get(i)!;
    const blob   = await this.fetchFrame(i);
    
    try {
      if (typeof createImageBitmap !== 'undefined') {
        const bitmap = await createImageBitmap(blob);
        this.bitmapCache.set(i, bitmap);
        this.lruOrder.push(i);
        this.evictCache();
        return bitmap;
      }
    } catch (e) {
      console.warn(`createImageBitmap failed for frame ${i}, falling back to HTMLImageElement:`, e);
    }

    // Fallback using HTMLImageElement
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        this.bitmapCache.set(i, img);
        this.lruOrder.push(i);
        this.evictCache();
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  private evictCache() {
    while (this.lruOrder.length > this.maxCache) {
      const evict = this.lruOrder.shift()!;
      const cached = this.bitmapCache.get(evict);
      if (cached) {
        if (typeof ImageBitmap !== 'undefined' && cached instanceof ImageBitmap) {
          try { cached.close(); } catch {}
        }
        this.bitmapCache.delete(evict);
      }
    }
  }

  // Preload the first ~15 active frames so first render is instant
  async preloadInitial(onProgress: (p: number) => void): Promise<void> {
    const frames = Array.from({ length: 15 }, (_, i) => i * this.stride + 1).filter(f => f <= TOTAL_FRAMES);
    let done = 0;
    await Promise.all(frames.map(i =>
      this.loadBitmap(i).then(() => {
        done++;
        onProgress(Math.round((done / frames.length) * 100));
      }).catch(() => { done++; onProgress(Math.round((done / frames.length) * 100)); })
    ));
  }

  // Start loading all remaining WebP Blobs sequentially in the background
  startBackgroundPreload() {
    let index = 1;
    
    const loadNext = async () => {
      if (index > TOTAL_FRAMES) {
        console.log("Background preloading of all frames complete.");
        return;
      }
      
      // If the user is scrolling, pause background loading to save bandwidth
      if (Date.now() - this.lastScrollTime < 300) {
        setTimeout(loadNext, 200); // Check again in 200ms
        return;
      }
      
      const frameIndex = index;
      index++;
      
      if (!this.blobCache.has(frameIndex) && !this.fetching.has(frameIndex)) {
        try {
          const ctrl = new AbortController();
          this.fetching.set(frameIndex, ctrl);
          const res = await fetch(getFrameUrl(frameIndex), { signal: ctrl.signal });
          if (res.ok) {
            const blob = await res.blob();
            this.blobCache.set(frameIndex, blob);
          }
        } catch (e) {
          index--; 
        } finally {
          this.fetching.delete(frameIndex);
        }
      }
      
      setTimeout(loadNext, 30);
    };
    
    setTimeout(loadNext, 1000);
  }

  // ── Prefetch buffer around current frame ─────────────────────────────────

  private prefetch(frame: number) {
    const start = Math.max(1, frame - this.bufferSize * this.stride);
    const end   = Math.min(TOTAL_FRAMES, frame + this.bufferSize * this.stride);

    // Prefetch only at the correct stride grid
    for (let i = start; i <= end; i += this.stride) {
      if (!this.bitmapCache.has(i) && !this.blobCache.has(i) && !this.fetching.has(i)) {
        this.loadBitmap(i).catch(() => null);
      }
    }

    // Abort fetches too far outside our active window
    this.fetching.forEach((ctrl, fi) => {
      if (fi < start - 3 * this.stride || fi > end + 3 * this.stride) {
        ctrl.abort();
        this.fetching.delete(fi);
      }
    });
  }

  // ── Scroll Handling ───────────────────────────────────────────────────────

  setTarget(progress: number) {
    this.targetProg = Math.min(1, Math.max(0, progress));
    this.lastScrollTime = Date.now();

    if (!this.ticking) {
      this.ticking = true;
      this.lastDrawTime = performance.now();
      requestAnimationFrame(this.tick.bind(this));
    }
  }

  private tick() {
    if (!this.canvas || !this.ctx) {
      this.ticking = false;
      return;
    }

    const now = performance.now();
    const dt = this.lastDrawTime ? (now - this.lastDrawTime) : 16.67;

    // Limit maximum FPS to 80 (draw interval must be at least 12.5ms)
    if (now - this.lastDrawTime < 12.5) {
      requestAnimationFrame(this.tick.bind(this));
      return;
    }

    // Keep minimum FPS at 20 (cap maximum physics time-step to 50ms)
    const clampedDt = Math.min(50, dt);

    const diff = this.targetProg - this.currentProg;

    if (Math.abs(diff) < 0.0001) {
      this.currentProg = this.targetProg;
      this.ticking = false;
    } else {
      // Speed Limit: Cap maximum change rate per frame to make transitions smooth
      // A maxStep of 0.015 per 16.67ms frame (takes at least ~1.1s for a full 100% top-to-bottom scroll)
      // limits rapid scroll jumps while keeping it highly responsive.
      const maxStep = 0.015 * (clampedDt / 16.67);
      const step = Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
      this.currentProg += step;
      
      requestAnimationFrame(this.tick.bind(this));
    }

    this.lastDrawTime = now;

    // Resolve frame index based on stride
    const rawFi = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(this.currentProg * (TOTAL_FRAMES - 1)) + 1));
    const step = Math.round((rawFi - 1) / this.stride);
    const fi = Math.min(TOTAL_FRAMES, Math.max(1, step * this.stride + 1));

    this.prefetch(fi);
    this.renderFrame(fi);
  }

  private renderFrame(fi: number) {
    const bitmap = this.bitmapCache.get(fi);
    if (bitmap) {
      if (fi !== this.screenFrame) {
        this.draw(bitmap);
        this.screenFrame = fi;
      }
      this.lastFrame = fi;
    } else {
      // Nearest-neighbor fallback: find nearest cached frame
      let nearestFrame = -1;
      let minDiff = Infinity;
      for (const cachedFrame of this.bitmapCache.keys()) {
        const d = Math.abs(cachedFrame - fi);
        if (d < minDiff) {
          minDiff = d;
          nearestFrame = cachedFrame;
        }
      }

      if (nearestFrame !== -1 && nearestFrame !== this.screenFrame) {
        const nearestBitmap = this.bitmapCache.get(nearestFrame);
        if (nearestBitmap) {
          this.draw(nearestBitmap);
          this.screenFrame = nearestFrame;
        }
      }

      // Load on demand
      this.loadBitmap(fi).then(bm => {
        if (this.currentProg === this.targetProg && fi !== this.screenFrame) {
          this.draw(bm);
          this.screenFrame = fi;
        }
      }).catch(() => null);

      this.lastFrame = fi;
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private draw(bm: ImageBitmap | HTMLImageElement) {
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
    this.fetching.forEach(c => c.abort());
    this.bitmapCache.forEach(bm => {
      if (typeof ImageBitmap !== 'undefined' && bm instanceof ImageBitmap) {
        try { bm.close(); } catch {}
      }
    });
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

    // 2.5s Failsafe Timeout: Ensure the page is shown even if preloading hangs or takes too long
    const failsafeId = setTimeout(() => {
      setReady(true);
      onScroll();
    }, 2500);

    // Preload first frames then mark ready
    engine.preloadInitial(() => {}).then(() => {
      clearTimeout(failsafeId);
      setReady(true);
      onScroll(); // sync to current scroll position
      engine.startBackgroundPreload(); // Start silent background loading!
    }).catch((err) => {
      console.warn("Preload failed, falling back to instant render:", err);
      clearTimeout(failsafeId);
      setReady(true);
      onScroll();
      engine.startBackgroundPreload(); // Start silent background loading!
    });

    return () => {
      clearTimeout(failsafeId);
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
          opacity: ready ? 0.22 : 0,
          filter: 'saturate(110%) brightness(0.92)',
          transition: 'opacity 0.6s ease',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
