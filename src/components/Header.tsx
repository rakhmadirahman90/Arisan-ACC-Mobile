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
        <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-28 h-5.5 bg-[#000] rounded-b-2xl border-x border-b border-zinc-800/40 z-50 flex items-center justify-center">
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
        
        <div className="relative flex justify-between items-center z-10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase font-mono">
                Auto Claser Club
              </span>
            </div>
            <h1 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
              Arisan Portal
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 p-1.5 px-2.5 rounded-xl border border-white/5 shadow-inner">
            {/* ACC Mini Styled Vector Logo matching user branding */}
            <svg viewBox="0 0 160 55" className="w-18 h-auto drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" xmlns="http://www.w3.org/2000/svg">
              {/* Car upper contour line */}
              <path d="M 5,24 Q 35,15 65,11 Q 85,8 115,13 Q 135,17 155,24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 60,17 C 75,14 90,14 110,17" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
              {/* Styled alphabets "ACC" */}
              <text x="14" y="47" fill="#2563eb" fontSize="30" fontWeight="900" fontStyle="italic" fontFamily="Impact, sans-serif">A</text>
              <text x="39" y="47" fill="#2563eb" fontSize="30" fontWeight="900" fontStyle="italic" fontFamily="Impact, sans-serif">C</text>
              <text x="64" y="47" fill="#ef4444" fontSize="30" fontWeight="900" fontStyle="italic" fontFamily="Impact, sans-serif">C</text>
              {/* plus shape on far right */}
              <g transform="translate(112, 35) scale(0.18)">
                <rect x="0" y="-15" width="15" height="40" fill="#ffffff" />
                <rect x="-12" y="-2" width="40" height="15" fill="#ffffff" />
                <rect x="18" y="-18" width="10" height="10" fill="#ffffff" opacity="0.6"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
