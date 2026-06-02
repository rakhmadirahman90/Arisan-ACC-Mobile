import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Play, VolumeX, Volume2 } from "lucide-react";

interface OpeningIntroProps {
  onComplete: () => void;
  activeLivery?: any;
}

export default function OpeningIntro({ onComplete, activeLivery }: OpeningIntroProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Automatically finish the intro after 4.5 seconds
    const timer = setTimeout(() => {
      setIsPlaying(false);
      setTimeout(onComplete, 400); // Allow exit transition
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setIsPlaying(false);
    setTimeout(onComplete, 300);
  };

  // Play a subtle high-tech sound effect if enabled
  const playBeep = (freq: number, type: OscillatorType, duration: number, delay = 0) => {
    if (!soundEnabled) return;
    setTimeout(() => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {
        console.log("Audio contexts blocked or not supported yet");
      }
    }, delay);
  };

  // Trigger tech sound syncs with letters
  useEffect(() => {
    if (soundEnabled) {
      playBeep(220, "sawtooth", 0.1, 400);  // Sound on opening flare
      playBeep(440, "sine", 0.08, 1200);  // Sound on A
      playBeep(554, "sine", 0.08, 1600);  // Sound on C1
      playBeep(659, "sine", 0.08, 2000);  // Sound on C2
      playBeep(880, "triangle", 0.3, 2605); // Final high synth pad chord
    }
  }, [soundEnabled]);

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          id="opening-intro-screen"
          className="fixed inset-0 z-[9999] bg-[#020202] flex flex-col justify-center items-center select-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle Ambient Matrix grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.04)_1.2px,transparent_1.2px),linear-gradient(90deg,rgba(30,58,138,0.04)_1.2px,transparent_1.2px)] bg-[size:24px_24px] pointer-events-none opacity-80" />
          
          {/* Futuristic radar sweeps & flares */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none animate-pulse duration-[3000ms]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-red-500/5 blur-[90px] pointer-events-none animate-pulse duration-[4000ms]" />

          {/* Interactive controls bar in absolute screen corner */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-lg"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>SUARA AKTIF</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>SUARA NONAKTIF</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600/20 to-red-600/20 hover:from-blue-600/35 hover:to-red-600/35 active:scale-95 border border-white/15 hover:border-white/30 rounded-full text-[10px] font-mono tracking-widest font-black text-white flex items-center gap-1.5 transition cursor-pointer shadow-xl"
            >
              LEWATI INTRO
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>

          {/* Core Masterpiece ACC Logo Vector Container */}
          <div className="w-full max-w-4xl px-8 flex flex-col items-center justify-center relative translate-y-[-20px]">
            
            {/* SVG Wrapper representing fully customized ACC logo */}
            <svg
              viewBox="0 0 1000 420"
              className="w-full h-auto max-w-xl md:max-w-2xl drop-shadow-[0_12px_45px_rgba(30,58,138,0.35)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="primary-car-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
                </linearGradient>

                <linearGradient id="letter-blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e40af" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id="letter-red-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#991b1b" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>

                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Sleek Car Upper Contour (Animate path length drawing) */}
              <motion.path
                d="M 50,225 C 90,215 130,205 180,185 C 240,165 310,135 380,122 C 450,110 520,110 610,122 C 700,135 780,158 870,180 C 930,195 970,212 990,225"
                fill="none"
                stroke="url(#primary-car-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
              />

              {/* 2. Sleek Car Side Window Contour (Inner Line) */}
              <motion.path
                d="M 370,165 C 420,150 490,145 550,147 C 610,148 660,158 720,172 C 750,180 770,188 780,192 C 785,195 760,195 720,195 C 620,195 500,188 400,174 C 380,171 365,167 370,165 Z"
                fill="#ffffff"
                opacity="0.9"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.95 }}
                transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                style={{ transformOrigin: "center" }}
              />

              {/* 3. Sporty letters "ACC" (Individually Staggered Glitch-fades) */}
              <g transform="translate(110, 190)" className="select-none">
                {/* 3A. Letter "A" (Blue Accent) */}
                <g>
                  {/* Subtle 3D shadow offset */}
                  <motion.text
                    x="2"
                    y="102"
                    fill="#000033"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    letterSpacing="1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 0.6, x: 2 }}
                    transition={{ delay: 1.1, duration: 0.3 }}
                  >
                    A
                  </motion.text>
                  <motion.text
                    x="0"
                    y="100"
                    fill="url(#letter-blue-grad)"
                    stroke="#ffffff"
                    strokeWidth="4"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    letterSpacing="1"
                    filter="url(#neon-glow)"
                    initial={{ scale: 0.6, opacity: 0, y: 150 }}
                    animate={{ scale: 1, opacity: 1, y: 100 }}
                    transition={{ 
                      delay: 1.0, 
                      type: "spring",
                      stiffness: 140,
                      damping: 10
                    }}
                  >
                    A
                  </motion.text>
                </g>

                {/* 3B. Letter "C" (Middle Blue Accent) */}
                <g>
                  <motion.text
                    x="252"
                    y="102"
                    fill="#000033"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 1.5, duration: 0.3 }}
                  >
                    C
                  </motion.text>
                  <motion.text
                    x="250"
                    y="100"
                    fill="url(#letter-blue-grad)"
                    stroke="#ffffff"
                    strokeWidth="4"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    filter="url(#neon-glow)"
                    initial={{ scale: 0.6, opacity: 0, y: 150 }}
                    animate={{ scale: 1, opacity: 1, y: 100 }}
                    transition={{ 
                      delay: 1.4, 
                      type: "spring",
                      stiffness: 140,
                      damping: 10
                    }}
                  >
                    C
                  </motion.text>
                </g>

                {/* 3C. Letter "C" (Dynamic Red Accent) */}
                <g>
                  <motion.text
                    x="482"
                    y="102"
                    fill="#330000"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 1.9, duration: 0.3 }}
                  >
                    C
                  </motion.text>
                  <motion.text
                    x="480"
                    y="100"
                    fill="url(#letter-red-grad)"
                    stroke="#ffffff"
                    strokeWidth="4"
                    fontSize="135"
                    fontWeight="900"
                    fontStyle="italic"
                    fontFamily="Impact, sans-serif"
                    filter="url(#neon-glow)"
                    initial={{ scale: 0.6, opacity: 0, y: 150 }}
                    animate={{ scale: 1, opacity: 1, y: 100 }}
                    transition={{ 
                      delay: 1.8, 
                      type: "spring",
                      stiffness: 140,
                      damping: 10
                    }}
                  >
                    C
                  </motion.text>
                </g>
              </g>

              {/* 4. Elegant digital pixelated square cross/plus on the right */}
              <g transform="translate(850, 240)">
                {/* Horizontal boxes */}
                <motion.rect
                  x="-60" y="-12" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, duration: 0.2 }}
                />
                <motion.rect
                  x="-30" y="-12" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, duration: 0.2 }}
                />
                {/* Center Core */}
                <motion.rect
                  x="0" y="-12" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.7, duration: 0.2 }}
                />
                <motion.rect
                  x="30" y="-12" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, duration: 0.2 }}
                />
                <motion.rect
                  x="60" y="-12" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.9, duration: 0.2 }}
                />

                {/* Vertical boxes */}
                <motion.rect
                  x="0" y="-72" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4, duration: 0.2 }}
                />
                <motion.rect
                  x="0" y="-42" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, duration: 0.2 }}
                />
                <motion.rect
                  x="0" y="18" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, duration: 0.2 }}
                />
                <motion.rect
                  x="0" y="48" width="24" height="24" fill="#ffffff"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.0, duration: 0.2 }}
                />

                {/* Little auxiliary offset squares */}
                <motion.rect
                  x="40" y="-60" width="16" height="16" fill="#ffffff" opacity="0.65"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.1, duration: 0.2 }}
                />
                <motion.rect
                  x="-55" y="32" width="16" height="16" fill="#ffffff" opacity="0.45"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, duration: 0.2 }}
                />
              </g>

              {/* 5. Sub-banner: Horizontal Lines and "Auto Claser Club" text */}
              {/* Left Line */}
              <motion.line
                x1="60"
                y1="375"
                x2="330"
                y2="375"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2.3, duration: 0.7, ease: "easeOut" }}
                style={{ transformOrigin: "right" }}
              />

              {/* Right Line */}
              <motion.line
                x1="670"
                y1="375"
                x2="940"
                y2="375"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 2.3, duration: 0.7, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
              />

              {/* Under-alignment text: "Auto Claser Club" with mixed colors mapping */}
              <g transform="translate(500, 386)">
                <motion.text
                  textAnchor="middle"
                  fontSize="28"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="18"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.6 }}
                >
                  {/* AUTO (Blue Accent Highlight) */}
                  <tspan fill="#60a5fa">A U T O</tspan>
                  <tspan fill="#ffffff"> </tspan>
                  {/* CLASER (Pure White) */}
                  <tspan fill="#ffffff">C L A S E R</tspan>
                  <tspan fill="#ffffff"> </tspan>
                  {/* CLUB (Red Accent Highlight) */}
                  <tspan fill="#f87171">C L U B</tspan>
                </motion.text>
              </g>
            </svg>

            {/* Subtitle status line simulation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 1] }}
              transition={{ delay: 3.1, duration: 0.5 }}
              className="mt-12 text-center flex flex-col items-center gap-2 font-mono"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-black tracking-[0.25em] text-[10px] uppercase">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping shrink-0" />
                MEMPERSINGKAT PADDOCK GEARS... OK
              </div>
              <p className="text-[9px] text-zinc-500 max-w-sm tracking-wide leading-relaxed">
                Menghubungkan Server Anggota • Menyeimbangkan Putaran Arisan v1.0.2
              </p>
            </motion.div>
          </div>

          {/* Quick Technical Footers mimicking high end automotive system */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[9px] font-mono text-zinc-650 tracking-wider">
            <span>CHASSIS: PLATFORM REBORN</span>
            <span>AUTO CLASER CLUB ID • VERIFIED v1.02</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
