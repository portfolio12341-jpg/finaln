'use client';

import React, { useEffect } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0, // Responsive, buttery-smooth scroll duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo for instant 60fps+ responsiveness
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.75, // Speed limit: controlled desktop increments
      touchMultiplier: 0.85, // Speed limit: controlled mobile swipes
      infinite: false,
    });

    // Expose lenis globally for programmatic page transitions
    if (typeof window !== 'undefined') {
      (window as any).lenis = lenis;
    }

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      if (typeof window !== 'undefined') {
        delete (window as any).lenis;
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <>{children}</>;
}
