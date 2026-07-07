'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryItem, Certificate } from '@/lib/db';

interface LightboxModalProps {
  item: GalleryItem | Certificate;
  onClose: () => void;
}

export default function LightboxModal({ item, onClose }: LightboxModalProps) {
  const allUrls = item.urls && item.urls.length > 0 ? item.urls : [item.url];
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allUrls.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allUrls.length) % allUrls.length);
  };

  const currentUrl = allUrls[currentIndex] || '';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm cursor-pointer"
    >
      <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button 
          title="Close photo"
          aria-label="Close photo"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/50 border border-white/10 text-gray-400 hover:text-white z-30 shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative w-full flex items-center justify-center min-h-[50vh] max-h-[80vh]">
          {currentUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe 
              src={currentUrl} 
              className="w-[80vw] h-[80vh] rounded-lg border border-white/10" 
              title="PDF Document"
            />
          ) : /\.(mp4|webm|ogg|mov)$/i.test(currentUrl) ? (
            <video 
              src={currentUrl} 
              controls 
              autoPlay 
              className="max-w-full max-h-[80vh] rounded-lg border border-white/10" 
            />
          ) : (
            <motion.img 
              key={currentUrl}
              src={currentUrl} 
              alt={'title' in item ? item.title : item.name} 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-white/10"
              loading="lazy"
            />
          )}

          {allUrls.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/85 transition-colors"
                title="Previous media"
                aria-label="Previous media"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/85 transition-colors"
                title="Next media"
                aria-label="Next media"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl mt-4 text-center border border-white/5 max-w-xl flex flex-col items-center gap-2 z-20">
          <span className="font-serif text-sm font-semibold text-white">{'title' in item ? item.title : item.name}</span>
          
          {item.description && (
            <p className="text-[11px] sm:text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-line border-t border-white/10 pt-2 mt-1">
              {item.description}
            </p>
          )}

          {allUrls.length > 1 && (
            <span className="text-[10px] font-mono text-gold/70 mt-1">{currentIndex + 1} of {allUrls.length}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
