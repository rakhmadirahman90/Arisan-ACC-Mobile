import React, { useState, useEffect } from "react";
import { Sparkles, Car } from "lucide-react";

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSelectedTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const [selectedTime, setSelectedTime] = useState("12:00");

  return (
    <div className="w-full select-none">
      {/* Phone Status Bar Simulation */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-mono tracking-tight text-zinc-400 bg-[#0b0c10] border-b border-zinc-900/60">
        <div>{selectedTime}</div>
        {/* Rounded Notch Speaker Placeholder */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1.5 w-28 h-5.5 bg-[#000] rounded-b-2xl border-x border-b border-zinc-800/40 z-50 items-center justify-center">
          <div className="w-10 h-1 bg-zinc-800 rounded-full mb-1"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <span>5G</span>
          <div className="flex gap-0.5 items-end h-2.5">
            <span className="w-0.5 h-1 bg-amber-500 rounded-2xs"></span>
            <span className="w-0.5 h-1.5 bg-amber-500 rounded-2xs"></span>
            <span className="w-0.5 h-2 bg-amber-500 rounded-2xs"></span>
            <span className="w-0.5 h-2.5 bg-zinc-600 rounded-2xs"></span>
          </div>
          <div className="w-5 h-2.5 border border-zinc-500 rounded-3xs p-0.5 flex items-center">
            <div className="w-full h-full bg-amber-500 rounded-4xs"></div>
          </div>
        </div>
      </div>

      {/* Sporty Brand Header */}
      <div className="px-5 pt-4 pb-3 bg-[#0a0c10] bg-gradient-to-b from-blue-950/30 via-[#0c0d13] to-transparent border-b border-zinc-900 relative overflow-hidden">
        {/* Subtle decorative grid/stripes lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-40"></div>
        
        <div className="relative flex justify-between items-center z-10 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping shrink-0"></span>
              <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase font-mono truncate">
                Auto Claser Club
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
              Arisan Portal
            </h1>
          </div>
          <div className="shrink-0 flex items-center bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-[5px] px-2.5 rounded-lg border border-white/10 shadow-lg select-none">
            {/* ACC Mini Styled Vector Logo - Compact badge size */}
            <svg viewBox="0 0 180 75" className="w-[84px] h-[35px] shrink-0 drop-shadow-[0_0_6px_rgba(59,130,246,0.35)]" xmlns="http://www.w3.org/2000/svg">
              {/* Car upper contour line */}
              <path d="M 5,26 Q 30,13 60,9 Q 85,4 115,9 Q 135,13 165,22" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 55,16 Q 80,10 115,15" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
              
              {/* Styled alphabets "ACC" - heavy bold, italicized, layered 3D outlines */}
              {/* 'A' */}
              <text x="14" y="50" fill="#000000" stroke="#000000" strokeWidth="3" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">A</text>
              <text x="12" y="48" fill="#1e40af" stroke="#2563eb" strokeWidth="1.2" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">A</text>
              
              {/* First 'C' */}
              <text x="39" y="50" fill="#000000" stroke="#000000" strokeWidth="3" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">C</text>
              <text x="37" y="48" fill="#1e40af" stroke="#2563eb" strokeWidth="1.2" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">C</text>
              
              {/* Second 'C' */}
              <text x="64" y="50" fill="#000000" stroke="#000000" strokeWidth="3" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">C</text>
              <text x="62" y="48" fill="#ef4444" stroke="#ff8f8f" strokeWidth="1" strokeLinejoin="round" fontSize="28" fontWeight="900" fontStyle="italic" fontFamily="Impact, 'Arial Black', sans-serif">C</text>

              {/* Perfectly rendering the modular tech pixel cross on the right of the logo */}
              <g transform="translate(108, 12) scale(0.6)" fill="#ffffff">
                {/* Horizontal blocks */}
                <rect x="15" y="14" width="8" height="8" />
                <rect x="24" y="14" width="8" height="8" />
                <rect x="33" y="14" width="8" height="8" />
                <rect x="42" y="14" width="8" height="8" />
                {/* Vertical blocks */}
                <rect x="24" y="5" width="8" height="8" />
                <rect x="24" y="23" width="8" height="8" />
                <rect x="24" y="32" width="8" height="8" />
                {/* Floating auxiliary squares */}
                <rect x="42" y="5" width="6" height="6" opacity="0.8" />
                <rect x="15" y="23" width="6" height="6" opacity="0.6" />
                <rect x="6" y="15" width="6" height="6" opacity="0.4" />
              </g>

              {/* Left wing needle */}
              <path d="M 8,63.5 L 44,63.5 L 44,62.5 Z" fill="#ffffff" />
              
              {/* Bottom text: "Auto Claser Club" with exact color schemes */}
              <text x="94" y="66" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.2">
                <tspan fill="#2563eb">A</tspan><tspan fill="#ffffff">uto</tspan>
                <tspan fill="#ffffff" xmlSpace="preserve"> </tspan>
                <tspan fill="#2563eb">C</tspan><tspan fill="#ffffff">laser</tspan>
                <tspan fill="#ffffff" xmlSpace="preserve"> </tspan>
                <tspan fill="#ef4444">Club</tspan>
              </text>
              
              {/* Right wing needle */}
              <path d="M 172,63.5 L 136,63.5 L 136,62.5 Z" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
