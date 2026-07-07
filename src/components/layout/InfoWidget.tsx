'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Clock, Calendar } from 'lucide-react';

export default function InfoWidget() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('--:--');
  const [dateStr, setDateStr] = useState('-- ---');
  const [isDayTime, setIsDayTime] = useState(true);
  const [weather, setWeather] = useState({ temp: '26°C', cond: 'CLEAR' });

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (res.ok) {
        const data = await res.json();
        const current = data.current_weather;
        if (current) {
          const tempVal = Math.round(current.temperature);
          const code = current.weathercode;
          
          let condStr = 'CLEAR';
          if (code === 0) condStr = 'CLEAR';
          else if ([1, 2, 3].includes(code)) condStr = 'PARTLY';
          else if ([45, 48].includes(code)) condStr = 'FOGGY';
          else if ([51, 53, 55].includes(code)) condStr = 'DRIZZLE';
          else if ([61, 63, 65, 80, 81, 82].includes(code)) condStr = 'RAINY';
          else if ([71, 73, 75].includes(code)) condStr = 'SNOWY';
          else if ([95, 96, 99].includes(code)) condStr = 'STORM';
          
          setWeather({
            temp: `${tempVal}°C`,
            cond: condStr
          });
        }
      }
    } catch (err) {
      console.warn("Weather fetch failed:", err);
    }
  };

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
    const clockInterval = setInterval(updateTime, 1000);

    // Dynamic Geolocation Weather Setup
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation failed/denied, falling back to Mumbai:", error);
          fetchWeather(19.0760, 72.8777); // Mumbai fallback coordinates
        },
        { timeout: 6000 }
      );
    } else {
      fetchWeather(19.0760, 72.8777);
    }

    return () => clearInterval(clockInterval);
  }, []);

  return (
    <div className="relative group select-none">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes breathing-blue {
          0%, 100% { box-shadow: 0 0 12px rgba(30, 58, 138, 0.35), inset 0 0 12px rgba(30, 58, 138, 0.15); }
          50% { box-shadow: 0 0 18px rgba(59, 130, 246, 0.55), inset 0 0 12px rgba(59, 130, 246, 0.3); }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite ease-in-out;
        }
        .breathing-neon {
          animation: breathing-blue 5s infinite ease-in-out;
        }
      `}</style>

      {/* Outer ambient blur shadow glow */}
      <div className="absolute inset-0 rounded-full bg-blue-600/5 blur-lg opacity-85 group-hover:bg-blue-500/15 transition-all duration-700 pointer-events-none" />

      {/* Main Capsule - side-by-side minimal profile */}
      <div className="relative w-[230px] md:w-[250px] h-[30px] md:h-[34px] rounded-full bg-[#0a0808]/92 backdrop-blur-lg border border-[#cda052]/30 flex items-center justify-between px-3 breathing-neon overflow-hidden transition-all duration-500 hover:border-[#f7e0a3] hover:scale-[1.02] shadow-[0_0_12px_rgba(30,58,138,0.35)]">
        
        {/* Shimmer light sweep */}
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-[#f7e0a3]/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />

        {/* Section 1: Weather */}
        <div className="flex items-center space-x-1 z-10">
          <div className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-950/40 border border-blue-900/30 shadow-[0_0_4px_rgba(59,130,246,0.1)] shrink-0">
            {isDayTime ? (
              <Sun className="w-2.5 h-2.5 text-[#d4af37] animate-[spin_40s_linear_infinite]" />
            ) : (
              <Moon className="w-2.5 h-2.5 text-[#e5dec9]" />
            )}
          </div>
          <div className="flex flex-col justify-center leading-none text-left">
            <span className="text-[8px] md:text-[9px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans">
              {weather.temp}
            </span>
            <span className="text-[5.5px] font-mono tracking-widest text-[#e5dec9]/60 font-semibold uppercase mt-0.5">
              {weather.cond}
            </span>
          </div>
        </div>

        {/* Divider 1 */}
        <div className="w-px h-3 bg-gradient-to-b from-transparent via-[#cda052]/20 to-transparent z-10" />

        {/* Section 2: Live Time */}
        <div className="flex items-center space-x-1 z-10">
          <div className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-950/40 border border-blue-900/30 shadow-[0_0_4px_rgba(59,130,246,0.1)] shrink-0">
            <Clock className="w-2.5 h-2.5 text-blue-400" />
          </div>
          <div className="flex flex-col justify-center leading-none text-left">
            <span className="text-[8px] md:text-[9px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans font-semibold">
              {time}
            </span>
            <span className="text-[5.5px] font-mono tracking-widest text-blue-400/80 font-semibold uppercase mt-0.5">
              LIVE
            </span>
          </div>
        </div>

        {/* Divider 2 */}
        <div className="w-px h-3 bg-gradient-to-b from-transparent via-[#cda052]/20 to-transparent z-10" />

        {/* Section 3: Date */}
        <div className="flex items-center space-x-1 z-10">
          <div className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-950/40 border border-[#cda052]/25 shadow-[0_0_4px_rgba(212,175,55,0.08)] shrink-0">
            <Calendar className="w-2.5 h-2.5 text-[#d4af37]" />
          </div>
          <div className="flex flex-col justify-center leading-none text-left">
            <span className="text-[8px] md:text-[9px] font-bold tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9f5d8] to-[#aa7c11] text-transparent bg-clip-text font-sans">
              {dateStr}
            </span>
            <span className="text-[5.5px] font-mono tracking-widest text-[#e5dec9]/60 font-semibold uppercase mt-0.5">
              DATE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
