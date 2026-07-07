'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

export default function CursiveAutograph() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'center 40%'],
  });

  // 0 → 1 as section scrolls into view
  const maskEdge = useTransform(scrollYProgress, [0, 1], ['-5%', '112%']);
  const opacity  = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity }}
      className="relative select-none pointer-events-none w-full flex justify-end pr-2 pt-3"
    >
      {/* Soft guide underline */}
      <div className="relative flex flex-col items-end gap-0.5">
        <RevealText maskEdge={maskEdge} />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-gold/5 mt-1" />
      </div>
    </motion.div>
  );
}

function RevealText({ maskEdge }: { maskEdge: MotionValue<string> }) {
  const webkitMask = useTransform(
    maskEdge,
    (v) =>
      `linear-gradient(to right, black 0%, black calc(${v} - 5%), transparent calc(${v} + 5%), transparent 100%)`
  );

  return (
    <motion.span
      className="cursive-text leading-none whitespace-nowrap"
      style={{
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        // Gold gradient text
        background: 'linear-gradient(135deg, #c9a227 0%, #f0d060 40%, #d4af37 70%, #b8952a 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        // Subtle dreamy glow
        filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.45)) drop-shadow(0 0 4px rgba(212,175,55,0.25))',
        letterSpacing: '0.02em',
        // Scroll-driven writing mask
        WebkitMaskImage: webkitMask as unknown as string,
        maskImage: webkitMask as unknown as string,
      }}
    >
      Nency Soni
    </motion.span>
  );
}
