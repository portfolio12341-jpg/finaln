import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/5 bg-deep-blue/40 backdrop-blur-sm py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xxs text-gray-500">
        <div>
          <span>© {currentYear} Nency Soni. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/admin" className="hover:text-gold transition-colors">
            Administrative Access
          </Link>
        </div>
      </div>
    </footer>
  );
}
