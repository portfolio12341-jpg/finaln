'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import CursiveAutograph from './ScrollTextSignature';

import { 
  Mail, Phone, Linkedin, MapPin, Calendar, 
  GraduationCap, Briefcase, Award, FileText, Send, 
  Clock, ArrowRight, User, BookOpen, Layers, X,
  CheckCircle, AlertCircle, Sparkles, Book, ChevronRight, ChevronLeft,
  ExternalLink, Search
} from 'lucide-react';
import { DatabaseSchema, Blog, GalleryItem, Certificate } from '@/lib/db';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

interface PortfolioClientProps {
  initialDb: DatabaseSchema;
}

const LightboxModal = dynamic(() => import('./LightboxModal'), {
  ssr: false
});

const BlogMediaSlider = dynamic(() => import('./BlogMediaSlider'), {
  ssr: false
});

// ── SECTION WRAPPER WITH SCROLL-DRIVEN PARALLAX AND FOCUS EFFECTS ──
// As each section scrolls past the viewport center, it gently sharpens from a blur (12px -> 0px),
// scales (0.97 -> 1.0), and fades in (10% -> 100%), drifting slowly upward.
function SectionWrapper({ children, id }: { children: React.ReactNode; id: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0.05, 0.22, 0.78, 0.95], [0.35, 1, 1, 0.35]);
  const scale = useTransform(scrollYProgress, [0.05, 0.22, 0.78, 0.95], [0.99, 1, 1, 0.99]);
  const yTranslate = useTransform(scrollYProgress, [0, 1], [15, -15]);

  return (
    <motion.section
      id={id}
      ref={containerRef}
      style={{ 
        opacity, 
        scale, 
        y: yTranslate,
        willChange: "transform, opacity"
      }}
      className="min-h-screen flex items-center justify-center py-24 px-6 sm:px-8 w-full relative"
    >
      <div className="max-w-5xl mx-auto w-full relative z-10">
        {children}
      </div>
    </motion.section>
  );
}

// ── HORIZONTAL SCROLL GALLERY COMPONENT ──
// Locks into view (sticky) while the user scrolls vertically, moving images smoothly horizontally.
const HorizontalGallery = React.memo(function HorizontalGallery({ items, onSelect }: { items: GalleryItem[]; onSelect: (item: GalleryItem) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Track vertical scroll progress relative to this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Slide gallery horizontal coordinates
  const xTranslate = useTransform(scrollYProgress, [0.0, 1.0], ["0%", "-55%"]);

  const catNames: Record<string, string> = {
    court: 'Supreme Court',
    district: 'District Court',
    moot: 'Moot Court',
    college: 'CS Programme',
    internship: 'Internship',
    event: 'Seminars',
    other: 'Other'
  };

  return (
    <div ref={containerRef} className="h-[250vh] w-full relative">
      {/* Pinned sticky viewport container */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
        <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 mb-8 z-10">
          <span className="font-mono text-xxs tracking-widest text-gold uppercase">Credentials Gallery</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white serif-heading mt-2">Visual Showcase</h2>
        </div>
        
        <div className="relative w-full h-[55vh] flex items-center">
          <motion.div 
            style={{ 
              x: xTranslate,
              willChange: "transform"
            }} 
            className="flex space-x-8 px-12 md:px-24"
          >
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelect(item)}
                className="w-[380px] h-[250px] rounded-2xl overflow-hidden border border-white/8 bg-[#120e0d]/60 flex-shrink-0 group shadow-2xl cursor-pointer relative"
              >
                {/* Image — always visible, brightens on hover */}
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-55 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 ease-out" 
                  loading="lazy"
                />
                {/* Gradient overlay — always rendered so label is always readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Labels — always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col">
                  <span className="text-[9px] font-mono text-gold/80 uppercase tracking-widest">
                    {catNames[item.category] || item.category}
                  </span>
                  <h4 className="text-sm font-serif font-semibold text-white mt-0.5 truncate">{item.title}</h4>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
});

export default function PortfolioClient({ initialDb }: PortfolioClientProps) {
  const [db, setDb] = useState<DatabaseSchema>(initialDb);

  useEffect(() => {
    setDb(initialDb);
  }, [initialDb]);
  
  // Modal / Selection states
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | Certificate | null>(null);
  // Helper to resolve settings
  const getSectionSettings = (sectionId: string) => {
    const settings = (db.layoutSettings?.[sectionId as keyof typeof db.layoutSettings] || {}) as any;
    const defaultAlign = ['home', 'skills', 'certificates', 'contact'].includes(sectionId) ? 'center' : 'left';
    return {
      textPosition: settings.textPosition || defaultAlign,
      layoutSide: settings.layoutSide || 'left'
    };
  };

  const getDividerAlignClass = (align: string) => {
    if (align === 'left') return 'ml-0 mr-auto';
    if (align === 'right') return 'mr-0 ml-auto';
    return 'mx-auto';
  };

  const renderHome = () => {
    const settings = getSectionSettings('home');
    const alignClass = settings.textPosition === 'left' ? 'items-start text-left' : settings.textPosition === 'right' ? 'items-end text-right' : 'items-center text-center';

    return (
      <SectionWrapper id="home" key="home">
        <div className={`flex flex-col ${alignClass} space-y-8 py-20`}>
          <div className="relative group">
            <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-blue-900/50 via-indigo-950/60 to-blue-950/50 blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
            <img
              src="/ns_logo.webp"
              alt="Nency Soni – Legal Research & Insights"
              className="relative z-10 w-32 h-32 sm:w-44 sm:h-44 object-contain drop-shadow-[0_0_20px_rgba(30,58,138,0.55)] group-hover:scale-102 transition-transform duration-500"
            />
          </div>

          <div className="space-y-4 w-full">
            <h1 
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter serif-heading leading-none text-transparent bg-clip-text bg-[linear-gradient(135deg,#664400_0%,#d4af37_25%,#ffd700_45%,#fff3b3_50%,#ffd700_55%,#d4af37_75%,#855800_100%)] drop-shadow-[0_0_15px_rgba(212,175,55,0.35)] select-none box-reflect"
            >
              {(db.personal.name || "NENCY SONI").toUpperCase()}
            </h1>
            <div className={`h-[1px] w-24 bg-gold/40 my-6 ${getDividerAlignClass(settings.textPosition)}`} />
            <p className="text-sm sm:text-base md:text-lg font-mono tracking-widest text-gold/80 uppercase font-light">
              {db.personal.title || "Corporate Law • Company Secretary • Legal Research"}
            </p>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderAbout = () => {
    const settings = getSectionSettings('about');
    const alignClass = settings.textPosition === 'left' ? 'text-left items-start' : settings.textPosition === 'right' ? 'text-right items-end' : 'text-center items-center';
    const photoOrder = settings.layoutSide === 'right' ? 'md:order-last' : 'md:order-first';
    const textOrder = settings.layoutSide === 'right' ? 'md:order-first' : 'md:order-last';

    return (
      <SectionWrapper id="about" key="about">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Profile Photo */}
          <div className={`md:col-span-5 flex justify-center ${photoOrder}`}>
            <div className="relative group max-w-sm w-full">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-royal-blue/20 to-gold/25 opacity-30 blur-md" />
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-deep-blue shadow-2xl">
                <img src={db.personal.profilePhoto || "/nency_profile_avatar.webp"} alt={db.personal.name || "Nency Soni"} className="w-full h-full object-cover opacity-80" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={`md:col-span-7 space-y-6 flex flex-col ${alignClass} ${textOrder}`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase block">Introduction</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading">{db.personal.name || "Nency Soni"}</h2>
            <p className="text-xs sm:text-sm text-[#ffe899] font-medium leading-relaxed font-sans drop-shadow-[0_0_6px_rgba(212,175,55,0.3)]">
              {db.personal.intro}
            </p>
            {db.personal.objective && (
              <div className={`space-y-1 pt-2 border-t border-white/5 w-full flex flex-col ${alignClass}`}>
                <span className="font-mono text-[9px] tracking-widest text-gold/60 uppercase block">Career Objective</span>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed font-sans">
                  {db.personal.objective}
                </p>
              </div>
            )}
            <div className="p-4 rounded-xl bg-gold/[0.03] border-l-2 border-gold/60 italic font-serif text-xs sm:text-sm text-[#ffdf7a] font-medium leading-relaxed drop-shadow-[0_0_8px_rgba(212,175,55,0.35)] w-full">
              "{db.personal.quote}"
            </div>
            <CursiveAutograph />
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderJourney = () => {
    const settings = getSectionSettings('journey');
    const alignClass = settings.textPosition === 'left' ? 'text-left' : settings.textPosition === 'right' ? 'text-right' : 'text-center';
    const flexAlignClass = settings.textPosition === 'left' ? 'items-start text-left' : settings.textPosition === 'right' ? 'items-end text-right' : 'items-center text-center';
    const eduOrder = settings.layoutSide === 'right' ? 'md:order-last' : 'md:order-first';
    const milestonesOrder = settings.layoutSide === 'right' ? 'md:order-first' : 'md:order-last';

    return (
      <SectionWrapper id="journey" key="journey">
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-12 items-start ${alignClass}`}>
          {/* Education Details */}
          <div className={`md:col-span-7 space-y-8 ${eduOrder}`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase block">Credentials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading" id="education">Education</h2>
            
            <div className="space-y-6 font-sans">
              {(db.education || []).map((edu) => {
                const isCS = edu.degree.toLowerCase().includes('cs') || edu.degree.toLowerCase().includes('secretary');
                const borderColorClass = isCS ? 'hover:border-royal-blue/30' : 'hover:border-gold/30';
                const gradientColorClass = isCS ? 'via-royal-blue/20' : 'via-gold/20';
                const textColorClass = isCS ? 'text-royal-blue' : 'text-gold';
                const bgColorClass = isCS ? 'bg-royal-blue/10 border-royal-blue/20' : 'bg-gold/10 border-gold/20';

                return (
                  <div key={edu.id} className={`group relative bg-[#090718]/60 border border-white/5 ${borderColorClass} rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(212,175,55,0.05)] text-left`}>
                    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${gradientColorClass} to-transparent`} />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xxs font-mono">
                        <span className={textColorClass}>{edu.startYear} — {edu.endYear}</span>
                        <span className={`px-2.5 py-0.5 rounded ${bgColorClass} uppercase tracking-widest text-[8px] font-bold`}>{edu.fieldOfStudy}</span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white leading-snug group-hover:text-gold transition-colors">{edu.degree}</h3>
                      <p className="text-xs text-gray-300 font-medium">{edu.institution}</p>
                      <p className="text-xs text-gray-400 font-light leading-relaxed">
                        {edu.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className={`md:col-span-5 space-y-6 ${milestonesOrder} flex flex-col ${flexAlignClass}`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase block">Milestones</span>
            <div className="relative bg-[#090718]/60 border border-white/5 rounded-2xl p-6 space-y-6 w-full text-left">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
              
              {/* Timeline line */}
              <div className="absolute left-[27px] top-[40px] bottom-[40px] w-[1px] bg-gradient-to-b from-royal-blue/45 via-gold/45 to-transparent" />
              
              {(db.milestones || []).map((mile, idx) => {
                const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
                const numeral = romanNumerals[idx] || (idx + 1).toString();
                const colors = [
                  { bg: 'bg-royal-blue/10 border-royal-blue/30 text-royal-blue', text: 'text-royal-blue' },
                  { bg: 'bg-gold/10 border-gold/30 text-gold', text: 'text-gold' },
                  { bg: 'bg-white/5 border-white/20 text-gray-300', text: 'text-gray-400' }
                ];
                const color = colors[idx % colors.length] || colors[2];

                return (
                  <div key={mile.id || idx} className="relative flex items-start space-x-4 pt-2 first:pt-0">
                    <div className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center text-[10px] font-bold font-mono shrink-0 mt-0.5 z-10 bg-[#090718]`}>
                      {numeral}
                    </div>
                    <div className="space-y-1">
                      <span className={`text-[10px] font-mono ${color.text} uppercase tracking-wider font-semibold`}>{mile.year}</span>
                      <p className="text-white text-xs font-serif font-bold">{mile.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderSkills = () => {
    const settings = getSectionSettings('skills');
    const headerAlign = settings.textPosition === 'left' ? 'text-left items-start' : settings.textPosition === 'right' ? 'text-right items-end' : 'text-center items-center';

    return (
      <SectionWrapper id="skills" key="skills">
        <div className="space-y-12 w-full">
          <div className={`flex flex-col ${headerAlign} space-y-3 max-w-2xl mx-auto`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase">Capabilities Matrix</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading">Core Skills</h2>
            <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed font-sans">
              A structured breakdown of corporate governance, legal advocacy, secretarial audits, and professional assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Category 1: Corporate & Compliance */}
            <div className="relative bg-[#090718]/60 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-gold/20 transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <div className="flex items-center space-x-3 text-gold">
                <span className="text-[10px] font-mono border border-gold/30 px-1.5 py-0.5 rounded bg-gold/5">CS</span>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-white">Corporate & Compliance</h3>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-gray-400 pt-2 text-left">
                {(db.skillsGroup?.cs || [
                  'Companies Act Compliance',
                  'Corporate Governance',
                  'Compliance Audits',
                  'SEBI Disclosures'
                ]).map((s, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                    <span className="group-hover:text-gray-300 transition-colors">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category 2: Advocacy & Research */}
            <div className="relative bg-[#090718]/60 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-royal-blue/20 transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-royal-blue/20 to-transparent" />
              <div className="flex items-center space-x-3 text-royal-blue">
                <span className="text-[10px] font-mono border border-royal-blue/30 px-1.5 py-0.5 rounded bg-royal-blue/5">LAW</span>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-white">Advocacy & Research</h3>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-gray-400 pt-2 text-left">
                {(db.skillsGroup?.law || [
                  'Legal Research',
                  'Legal Drafting',
                  'Constitutional Law',
                  'Appellate Advocacy Support'
                ]).map((s, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-royal-blue shrink-0" />
                    <span className="group-hover:text-gray-300 transition-colors">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category 3: Professional Execution */}
            <div className="relative bg-[#090718]/60 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-white/20 transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center space-x-3 text-gray-400">
                <span className="text-[10px] font-mono border border-white/20 px-1.5 py-0.5 rounded bg-white/5">PRO</span>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-white">Professional Assets</h3>
              </div>
              <ul className="space-y-2.5 font-mono text-[11px] text-gray-400 pt-2 text-left">
                {(db.skillsGroup?.pro || [
                  'Strategic Communication',
                  'Presentation & Briefing',
                  'Office Productivity Suite',
                  'Analytical Drafting'
                ]).map((s, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                    <span className="group-hover:text-gray-300 transition-colors">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderSupremeCourt = () => {
    const settings = getSectionSettings('supremecourt');
    const headerAlign = settings.textPosition === 'left' ? 'text-left items-start' : settings.textPosition === 'right' ? 'text-right items-end' : 'text-center items-center';
    const textAlign = settings.textPosition === 'left' ? 'text-left' : settings.textPosition === 'right' ? 'text-right' : 'text-center';

    return (
      <SectionWrapper id="supremecourt" key="supremecourt">
        <div className="space-y-12">
          <div className={`flex flex-col ${headerAlign} space-y-2`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase">Academic Landmark</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading">Supreme Court visit</h2>
          </div>

          {/* Large image */}
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden border border-white/5 bg-white/2 relative">
            <img src="/supreme_court_india.webp" alt="Supreme Court India" className="w-full h-full object-cover opacity-100" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-space-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 space-y-1 text-left">
              <span className="text-[10px] font-mono text-gold uppercase tracking-wider">New Delhi Delegation</span>
              <h3 className="text-lg font-serif font-bold text-white">Supreme Court of India</h3>
            </div>
          </div>

          {/* 3-Column details */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm font-sans font-light text-gray-400 ${textAlign}`}>
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">{db.supremeCourt?.tourTitle || "The Tour"}</h4>
              <p className="leading-relaxed">
                {db.supremeCourt?.tourText || "I visited the Supreme Court of India in New Delhi to attend the hearings of a live court session. Having the opportunity to tour the entire Supreme Court was incredibly insightful and deepened my respect for the judiciary."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">{db.supremeCourt?.opportunityTitle || "The Opportunity"}</h4>
              <p className="leading-relaxed">
                {db.supremeCourt?.opportunityText || "It was an unforgettable experience, and I would like to thank my college, KNK Law College, for providing me with this opportunity. I am grateful that I achieved this chance based on my academic performance and personality."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">{db.supremeCourt?.horizonsTitle || "Expanded Horizons"}</h4>
              <p className="leading-relaxed">
                {db.supremeCourt?.horizonsText || "It is truly a huge achievement for me, expanding my horizons from studying law within the four walls of a classroom to experiencing the Supreme Court in Delhi. It was an amazing journey, and I'm excited about what the future holds."}
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderGallery = () => {
    return (
      <HorizontalGallery key="gallery" items={db.gallery} onSelect={(item) => setSelectedPhoto(item)} />
    );
  };

  const renderResearch = () => {
    const settings = getSectionSettings('research');
    const alignClass = settings.textPosition === 'left' ? 'text-left' : settings.textPosition === 'right' ? 'text-right' : 'text-center';
    const flexAlignClass = settings.textPosition === 'left' ? 'items-start text-left' : settings.textPosition === 'right' ? 'items-end text-right' : 'items-center text-center';
    const projectsOrder = settings.layoutSide === 'right' ? 'lg:order-last' : 'lg:order-first';
    const blogsOrder = settings.layoutSide === 'right' ? 'lg:order-first' : 'lg:order-last';

    return (
      <SectionWrapper id="research" key="research">
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-start ${alignClass}`}>
          
          {/* Research Dissertations */}
          <div className={`lg:col-span-6 space-y-8 ${projectsOrder} flex flex-col ${flexAlignClass}`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase block">Academic Studies</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading w-full">Research Projects</h2>
            
            <div className="space-y-6 font-sans w-full text-left">
              {[
                { title: 'Environmental Law', desc: 'Detailed dissertation outlining sustainable business frameworks, environmental regulation enforcement, and ESG policy audits.' },
                { title: 'Surrogacy Regulation Analysis', desc: 'Analyzing legal protections surrounding reproductive contracts, surrogacy clinic compliance, and parentage rules.' },
                { title: 'Old Age Home Survey', desc: 'Field research survey analyzing institutional protections, socio-economic challenges, and elderly care policies.' }
              ].map((project, i) => (
                <div key={i} className="relative p-6 rounded-2xl bg-[#090718]/60 border border-white/5 hover:border-gold/30 transition-all duration-300 space-y-3 group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
                  <h3 className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors">{project.title}</h3>
                  <p className="text-xs text-gray-200 font-semibold leading-relaxed">{project.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Magazine Blogs */}
          <div className={`lg:col-span-6 space-y-8 ${blogsOrder} flex flex-col ${flexAlignClass}`} id="blogs">
            <span className="font-mono text-xxs tracking-widest text-gold uppercase block">Insights</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading w-full">Legal Blogs</h2>

            {/* Featured Blog */}
            {db.blogs[0] && (
              <div 
                onClick={() => setSelectedBlog(db.blogs[0])}
                className="relative p-6 rounded-2xl bg-[#090718]/60 border border-white/10 hover:border-gold/45 transition-all duration-300 cursor-pointer space-y-4 group w-full text-left"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
                <div className="flex items-center justify-between text-xxs font-mono text-gold font-bold">
                  <span>{db.blogs[0].publishDate}</span>
                  <span className="uppercase tracking-wider">{db.blogs[0].category}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold transition-colors leading-snug">
                  {db.blogs[0].title}
                </h3>
                <p className="text-xs text-gray-200 font-semibold leading-relaxed line-clamp-3">
                  {db.blogs[0].summary}
                </p>
                <div className="text-xxs font-mono text-gold flex items-center space-x-1.5 pt-2 font-bold">
                  <span>Read Article</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Secondary Blogs */}
            <div className="space-y-4 font-sans w-full text-left">
              {db.blogs.slice(1, 3).map((blog) => (
                <div 
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  className="relative p-4 rounded-xl bg-[#090718]/40 border border-white/5 hover:border-gold/30 transition-all duration-300 cursor-pointer flex justify-between items-center group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-gray-300 font-bold">{blog.publishDate}</span>
                    <h4 className="text-xs font-bold text-white group-hover:text-gold transition-colors leading-snug">{blog.title}</h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderCertificates = () => {
    const settings = getSectionSettings('certificates');
    const headerAlign = settings.textPosition === 'left' ? 'text-left items-start' : settings.textPosition === 'right' ? 'text-right items-end' : 'text-center items-center';

    return (
      <SectionWrapper id="certificates" key="certificates">
        <div className="space-y-12">
          <div className={`flex flex-col ${headerAlign} space-y-2`}>
            <span className="font-mono text-xxs tracking-widest text-gold uppercase">Credentials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white serif-heading">Certificates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {db.certificates.map(cert => (
              <div 
                key={cert.id}
                onClick={() => setSelectedPhoto(cert)}
                className="certificate-frame p-6 rounded bg-[#090d22]/40 border border-white/5 backdrop-blur-md cursor-pointer flex justify-between items-center group relative overflow-hidden text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/0 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center space-x-1.5 text-xxs font-mono text-gold">
                    <Award className="w-3.5 h-3.5" />
                    <span>{cert.date}</span>
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm serif-heading">{cert.name}</h3>
                  <p className="text-[10px] text-gray-500 font-mono">Issued by {cert.issuer}</p>
                </div>
                <div className="flex flex-col items-end justify-between h-full relative z-10 pl-4">
                  <ExternalLink className="w-4 h-4 text-gold/30 group-hover:text-gold transition-colors" />
                  <span className="text-[9px] font-mono text-gold/60 underline group-hover:text-gold mt-8">View certificate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderContact = () => {
    const settings = getSectionSettings('contact');
    const alignClass = settings.textPosition === 'left' ? 'text-left items-start' : settings.textPosition === 'right' ? 'text-right items-end' : 'text-center items-center';
    const flexJustify = settings.textPosition === 'left' ? 'justify-start' : settings.textPosition === 'right' ? 'justify-end' : 'justify-center';

    return (
      <SectionWrapper id="contact" key="contact">
        <div className={`flex flex-col ${alignClass} space-y-10 py-16 w-full`}>
          <h2 
            className="font-gothic text-6xl sm:text-8xl md:text-9xl tracking-wider select-none leading-none pb-2 uppercase text-transparent bg-clip-text bg-[linear-gradient(135deg,#8a7355_0%,#d4af37_25%,#fff6d6_50%,#d4af37_75%,#8a7355_100%)] drop-shadow-[0_0_20px_rgba(212,175,55,0.35)]"
          >
            Let's Connect
          </h2>

          <div className={`flex flex-wrap ${flexJustify} gap-8 pt-4 font-mono text-xs sm:text-sm font-bold w-full`}>
            <a 
              href={`mailto:${db.personal.email}`} 
              className="flex items-center space-x-2 text-[#ea4335] hover:text-white transition-colors group drop-shadow-[0_0_8px_rgba(234,67,53,0.2)]"
            >
              <Mail className="w-4 h-4 text-[#ea4335] group-hover:text-white transition-colors" />
              <span>Email</span>
            </a>
            <a 
              href={db.personal.linkedin} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center space-x-2 text-[#0a66c2] hover:text-white transition-colors group drop-shadow-[0_0_8px_rgba(10,102,194,0.25)]"
            >
              <Linkedin className="w-4 h-4 text-[#0a66c2] group-hover:text-white transition-colors" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const sectionOrder = db.sectionOrder || ['home', 'about', 'journey', 'skills', 'supremecourt', 'gallery', 'research', 'certificates', 'contact'];

  return (
    <>
      <Header />

      {sectionOrder.map((sectionId) => {
        switch (sectionId) {
          case 'home':
            return renderHome();
          case 'about':
            return renderAbout();
          case 'journey':
            return renderJourney();
          case 'skills':
            return renderSkills();
          case 'supremecourt':
            return renderSupremeCourt();
          case 'gallery':
            return renderGallery();
          case 'research':
            return renderResearch();
          case 'certificates':
            return renderCertificates();
          case 'contact':
            return renderContact();
          default:
            return null;
        }
      })}

      {/* ── AMBIENT FOOTER ── */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-[#0b0908]/85 to-transparent flex flex-col items-center justify-center px-6 sm:px-8 text-center min-h-[40vh] z-30">
        <div className="max-w-xl mx-auto space-y-6">
          <blockquote className="serif-heading text-lg sm:text-2xl text-gray-300 italic max-w-lg leading-relaxed">
            "{db.personal.motto}"
          </blockquote>

          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            © {new Date().getFullYear()} Nency Soni. All rights reserved.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xxs font-mono text-gold hover:text-white uppercase tracking-widest border-b border-gold/20 pb-1 cursor-pointer"
            >
              Back to Top
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── MODALS & FORMS (PORTALS) ── */}
      <AnimatePresence>
        {/* Blog Article Reader Modal */}
        {selectedBlog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b0908] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="sticky top-0 bg-[#0b0908]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 flex items-center justify-between z-10">
                <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 text-[9px] uppercase tracking-widest font-mono">
                  {selectedBlog.category}
                </span>
                <button 
                  title="Close article"
                  aria-label="Close article"
                  onClick={() => setSelectedBlog(null)}
                  className="p-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 font-sans">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white serif-heading leading-tight">{selectedBlog.title}</h1>
                  <div className="flex items-center space-x-3 text-xxs font-mono text-gray-500 mt-2">
                    <span>Published: {selectedBlog.publishDate}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{selectedBlog.readTime}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gold italic font-mono bg-gold/5 border border-gold/15 p-4 rounded-xl leading-relaxed">
                  {selectedBlog.summary}
                </p>

                {/* Multi-image support in blogs */}
                {selectedBlog.urls && selectedBlog.urls.length > 0 && (
                  <div className="my-4">
                    <BlogMediaSlider urls={selectedBlog.urls} />
                  </div>
                )}

                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans space-y-4 whitespace-pre-wrap pt-2">
                  {selectedBlog.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lightbox Photo / Certificate Modal with Multi-media Carousel */}
        {selectedPhoto && (
          <LightboxModal item={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
