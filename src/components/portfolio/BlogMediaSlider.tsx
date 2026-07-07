'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface BlogMediaSliderProps {
  urls: string[];
}

export default function BlogMediaSlider({ urls }: BlogMediaSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!urls || urls.length === 0) return null;

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const currentUrl = urls[currentIndex];

  return (
    <div className="relative w-full h-[250px] sm:h-[350px] bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group">
      {currentUrl.toLowerCase().endsWith('.pdf') ? (
        <iframe 
          src={currentUrl} 
          className="w-full h-full rounded-xl border-none" 
          title="PDF Document"
        />
      ) : /\.(mp4|webm|ogg|mov)$/i.test(currentUrl) ? (
        <video 
          src={currentUrl} 
          controls 
          className="max-w-full max-h-full object-contain" 
        />
      ) : (
        <motion.img 
          key={currentUrl}
          src={currentUrl} 
          alt="Blog attachment" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-full max-h-full object-contain"
        />
      )}

      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/85 transition-colors"
            title="Previous image"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/85 transition-colors"
            title="Next image"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 right-3 z-10 bg-black/70 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-white border border-white/5">
            {currentIndex + 1} / {urls.length}
          </div>
        </>
      )}
    </div>
  );
}
