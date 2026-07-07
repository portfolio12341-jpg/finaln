'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Shield, LogOut, Menu, X, ArrowUpRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [decoyDenied, setDecoyDenied] = useState(false);

  const handleDecoyAdmin = () => {
    setDecoyDenied(true);
    setTimeout(() => setDecoyDenied(false), 2000);
  };

  // ── SECRET ADMIN GESTURE STATE ──
  // Step 0: Initial
  // Step 1: Clicked logo 3 times
  // Step 2: Clicked Connect nav link
  // Step 3 (Unlocked): Clicked Skills nav link
  const [adminSequenceStep, setAdminSequenceStep] = useState(0);
  const clickTimestamps = useRef<number[]>([]);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const lockTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    // Keep only clicks within the last 3 seconds
    const recentClicks = [...clickTimestamps.current.filter(t => now - t < 3000), now];
    clickTimestamps.current = recentClicks;

    if (recentClicks.length >= 3) {
      setAdminSequenceStep(1); // Set to step 1
      clickTimestamps.current = [];
      // Auto-reset sequence if no action is taken within 8 seconds
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => {
        setAdminSequenceStep(0);
        setSecretUnlocked(false);
      }, 8000);
    }
  }, [adminSequenceStep]);

  const handleNavItemClick = (label: string) => {
    const l = label.toLowerCase();
    if (adminSequenceStep === 1) {
      if (l === 'connect' || l === 'contact') {
        setAdminSequenceStep(2);
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => setAdminSequenceStep(0), 8000);
      } else {
        setAdminSequenceStep(0);
      }
    } else if (adminSequenceStep === 2) {
      if (l === 'skills') {
        setSecretUnlocked(true);
        setAdminSequenceStep(0);
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => setSecretUnlocked(false), 8000);
      } else {
        setAdminSequenceStep(0);
      }
    } else {
      setAdminSequenceStep(0);
    }
  };

  useEffect(() => {
    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Journey', href: '#journey' },
    { label: 'Education', href: '#education' },
    { label: 'Skills', href: '#skills' },
    { label: 'Supreme Court', href: '#supremecourt' },
    { label: 'Research', href: '#research' },
    { label: 'Blogs', href: '#blogs' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (pathname !== '/') {
      router.push('/' + href);
      return;
    }

    const element = document.querySelector(href);
    if (element) {
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.scrollTo(element, {
          offset: -80,
          duration: 1.2
        });
      } else {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
        scrolled || mobileMenuOpen
          ? 'bg-deep-blue/70 backdrop-blur-md border-b border-white/5 py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Logo / Brand — click 3× to reveal secret admin button */}
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-3 cursor-pointer bg-transparent border-none p-0 select-none"
          aria-label="Nency Soni home"
        >
          <div className="relative">
            {/* Ambient Deep Navy / Midnight Blue dark glow */}
            <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-blue-900/60 to-indigo-950/70 blur-md opacity-80 pointer-events-none" />
            <img
              src="/ns_logo.webp"
              alt="Nency Soni Logo"
              className="relative z-10 h-10 w-10 object-contain rounded-full border border-blue-950/40 bg-[#0e0c0a]/60 shadow-[0_0_10px_rgba(30,58,138,0.5)]"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="serif-heading text-sm font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gold">
              Nency Soni
            </span>
            <span className="text-[9px] uppercase font-mono tracking-widest text-gold/60">
              Legal Research &amp; Insights
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        {!isAdmin ? (
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  handleScrollTo(e, item.href);
                  handleNavItemClick(item.label);
                }}
                className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white transition-colors duration-300"
              >
                {item.label}
              </a>
            ))}


            {/* ── REAL Admin — only appears after 3× logo click ── */}
            {secretUnlocked && (
              <Link
                href="/admin"
                onClick={() => setSecretUnlocked(false)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-all text-xs font-semibold text-gold shadow-[0_0_12px_rgba(212,175,55,0.3)] animate-pulse"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        ) : (
          <div className="hidden md:flex items-center space-x-6">
            <span className="text-xs font-mono text-gold uppercase tracking-widest bg-gold/5 px-3 py-1 rounded-full border border-gold/10">
              Admin Session Active
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-semibold text-gray-300"
            >
              <span>View Site</span>
              <ArrowUpRight className="w-3 h-3 text-gold" />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button 
          title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-full left-0 w-full bg-[#120e0d]/95 border-b border-white/5 backdrop-blur-lg overflow-hidden"
          >
            <div className="flex flex-col space-y-4 px-6 py-6 font-mono text-xs">
              {!isAdmin ? (
                <>
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        handleScrollTo(e, item.href);
                        handleNavItemClick(item.label);
                      }}
                      className="text-gray-400 hover:text-white uppercase tracking-widest font-semibold py-1 border-b border-white/5"
                    >
                      {item.label}
                    </a>
                  ))}

                  {/* ── REAL mobile Admin ── */}
                  {secretUnlocked && (
                    <Link
                      href="/admin"
                      onClick={() => { setMobileMenuOpen(false); setSecretUnlocked(false); }}
                      className="inline-flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 font-semibold animate-pulse"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-400 hover:text-white uppercase tracking-widest font-semibold py-2 border-b border-white/5"
                  >
                    View Live Site
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left text-red-400 hover:text-red-300 uppercase tracking-widest font-semibold py-2"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
