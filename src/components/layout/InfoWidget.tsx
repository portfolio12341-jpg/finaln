'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Clock, Calendar } from 'lucide-react';

export default function InfoWidget() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('--:--');
  const [dateStr, setDateStr] = useState('-- ---');
  const [isDayTime, setIsDayTime] = useState(true);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hh}:${mm}`);

      const day = now.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      setDateStr(`${day} ${month}`);

      setIsDayTime(now.getHours() >= 6 && now.getHours() < 18);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeather = () => {
    if (!mounted) return { temp: '26°C', cond: 'CLEAR' };
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { temp: '24°C', cond: 'CALM' };
    if (hour >= 12 && hour < 17) return { temp: '29°C', cond: 'SUNNY' };
    if (hour >= 17 && hour < 21) return { temp: '25°C', cond: 'COOL' };
    return { temp: '21°C', cond: 'CLEAR' };
  };

  const weather = getWeather();

  return (
    <div className="relative group select-none">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes breathing-blue {
          0%, 100% { box-shadow: 0 0 15px rgba(30, 58, 138, 0.45), inset 0 0 15px rgba(30, 58, 138, 0.2); }
          50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.65), inset 0 0 20px rgba(59, 130, 246, 0.35); }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite ease-in-out;
        }
        .breathing-neon {
          animation: breathing-blue 5s infinite ease-in-out;
        }
      `}</style>

      {/* Outer ambient blur shadow glow */}
      <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-xl opacity-80 group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none" />

      {/* Main Capsule */}
      <div className="relative w-[320px] md:w-[350px] h-[46px] md:h-[50px] rounded-full bg-[#0a0808]/92 backdrop-blur-lg border border-[#cda052]/35 flex items-center justify-between px-5 breathing-neon overflow-hidden transition-all duration-500 hover:border-[#f7e0a3] hover:scale-[1.02] shadow-[0_0_15px_rgba(30,58,138,0.45)]">
        
        {/* Shimmer light sweep */}
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-[#f7e0a3]/8 to-transparent skew-x-12 animate-shimmer pointer-events-none" />

        {/* Section 1: Weather */}
        <div className="flex items-center space-x-2.5 z-10">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-950/40 border border-blue-900/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
            {isDayTime ? (
              <Sun className="w-3.5 h-3.5 text-[#d4af37] animate-[spin_40s_linear_infinite]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#e5dec9]" />
            )}
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-[10px] md:text-[11px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans">
              {weather.temp}
            </span>
            <span className="text-[7.5px] font-mono tracking-widest text-[#e5dec9]/60 font-semibold uppercase mt-0.5">
              {weather.cond}
            </span>
          </div>
        </div>

        {/* Divider 1 */}
        <div className="w-px h-5 bg-gradient-to-b from-transparent via-[#cda052]/25 to-transparent z-10" />

        {/* Section 2: Live Time */}
        <div className="flex items-center space-x-2.5 z-10">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-950/40 border border-blue-900/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-[10px] md:text-[11px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans font-semibold">
              {time}
            </span>
            <span className="text-[7.5px] font-mono tracking-widest text-blue-400/80 font-semibold uppercase mt-0.5">
              LIVE
            </span>
          </div>
        </div>

        {/* Divider 2 */}
        <div className="w-px h-5 bg-gradient-to-b from-transparent via-[#cda052]/25 to-transparent z-10" />

        {/* Section 3: Date */}
        <div className="flex items-center space-x-2.5 z-10">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-950/40 border border-[#cda052]/25 shadow-[0_0_8px_rgba(212,175,55,0.15)]">
            <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="text-[10px] md:text-[11px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans">
              {dateStr}
            </span>
            <span className="text-[7.5px] font-mono tracking-widest text-[#e5dec9]/60 font-semibold uppercase mt-0.5">
              DATE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
