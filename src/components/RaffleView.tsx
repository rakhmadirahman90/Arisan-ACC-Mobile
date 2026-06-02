import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Member, ArisanConfig, PaymentStatus } from "../types";
import { formatRupiah } from "../data";
import { 
  Play, 
  Crown, 
  Trophy, 
  Tv, 
  Compass, 
  Car, 
  AlertCircle, 
  Check, 
  RotateCcw,
  Share2,
  Bell,
  Gauge,
  Flame,
  UserCheck,
  Lock,
  Unlock
} from "lucide-react";

interface RaffleViewProps {
  members: Member[];
  config: ArisanConfig;
  payments: PaymentStatus[];
  onConfirmWinner: (winnerId: string, prizeAmount: number) => void;
  onNavigateToDashboard: () => void;
  onInstantPayAll: () => void;
  activeLivery: any;
  isAdmin?: boolean;
  onSetAdmin?: (val: boolean) => void;
  onUpdateConfig?: (newConfig: Partial<ArisanConfig>) => void;
}

export default function RaffleView({
  members,
  config,
  payments,
  onConfirmWinner,
  onNavigateToDashboard,
  onInstantPayAll,
  activeLivery,
  isAdmin = false,
  onSetAdmin = () => {},
  onUpdateConfig = () => {},
}: RaffleViewProps) {
  const currentRound = config.currentRound;
  
  // 1. Identify who has paid for the current round
  const currentPayments = payments.filter((p) => p.round === currentRound);
  const paidMemberIds = currentPayments.filter((p) => p.isPaid).map((p) => p.memberId);
  const paidCount = paidMemberIds.length;
  
  // 2. Identify who hasn't won a round in the past (wonRound === null)
  const nonWinners = members.filter((m) => m.wonRound === null);
  
  // 3. Eligible candidates: must have paid AND must not have won in the past
  const eligibleCandidates = nonWinners.filter((m) => paidMemberIds.includes(m.id));
  
  // Current Pot size (excluding Rp 10.000 consumption)
  const arisanShare = Math.round((config.contributionAmount * 5) / 6);
  const prizePool = paidCount * arisanShare;

  // Raffle flow state
  // "idle" | "preparing" | "rolling" | "slowing" | "winner_selected"
  const [raffleState, setRaffleState] = useState<"idle" | "rolling" | "winner_selected">("idle");
  const [highlightMember, setHighlightMember] = useState<Member | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Member | null>(null);
  const [rollCount, setRollCount] = useState(0);
  const [rpmGauge, setRpmGauge] = useState(0);

  // Time Lock State & Countdown calculations
  const [timeLeftCode, setTimeLeftCode] = useState("");
  const [isCurrentlyLocked, setIsCurrentlyLocked] = useState(false);
  const [localPass, setLocalPass] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      if (!config.raffleActiveTime) {
        setIsCurrentlyLocked(false);
        setTimeLeftCode("");
        return;
      }
      
      const diff = new Date(config.raffleActiveTime).getTime() - new Date().getTime();
      if (diff <= 0) {
        setIsCurrentlyLocked(false);
        setTimeLeftCode("");
      } else {
        setIsCurrentlyLocked(true);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        let str = "";
        if (days > 0) str += `${days} Hari `;
        str += `${hours.toString().padStart(2, "0")} Jam ${minutes.toString().padStart(2, "0")} Menit ${seconds.toString().padStart(2, "0")} Detik`;
        setTimeLeftCode(str);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.raffleActiveTime]);

  const isLocked = isCurrentlyLocked && !isAdmin;

  // Sound and vibration loops
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean layout effects
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    };
  }, []);

  const startRaffle = () => {
    if (eligibleCandidates.length === 0) return;
    
    setRaffleState("rolling");
    setSelectedWinner(null);
    setRollCount(0);
    setRpmGauge(8000); // Max Revving RPM

    let duration = 60; // start speed index
    let step = 0;
    const totalSteps = 45; // total cycles of shuffle

    const runRoll = () => {
      // Pick a random candidate from eligible list for the rapid highlight effect
      const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
      const chosen = eligibleCandidates[randomIndex];
      setHighlightMember(chosen);
      setRpmGauge(Math.floor(Math.random() * 2000) + 6500);

      step++;
      setRollCount(step);

      if (step < totalSteps) {
        // Linear deceleration simulation
        if (step > totalSteps * 0.6) {
          duration += 25; // slow down
          setRpmGauge(Math.floor(Math.random() * 2000) + 3000);
        }
        if (step > totalSteps * 0.85) {
          duration += 70; // slow down even more
          setRpmGauge(Math.floor(Math.random() * 1000) + 1200);
        }

        if (rollIntervalRef.current) clearTimeout(rollIntervalRef.current);
        // @ts-ignore
        rollIntervalRef.current = setTimeout(runRoll, duration);
      } else {
        // Completed rolling: choose true final winner!
        const trueWinnerIndex = Math.floor(Math.random() * eligibleCandidates.length);
        const finalWinner = eligibleCandidates[trueWinnerIndex];
        
        setHighlightMember(finalWinner);
        setSelectedWinner(finalWinner);
        setRaffleState("winner_selected");
        setRpmGauge(0);
      }
    };

    // Begin recursion timeout loop
    runRoll();
  };

  const handleConfirm = () => {
    if (selectedWinner) {
      onConfirmWinner(selectedWinner.id, prizePool);
      // reset component state
      setRaffleState("idle");
      setSelectedWinner(null);
      setHighlightMember(null);
    }
  };

  // Pre-generate WhatsApp notification deep link
  const generateWaLink = (winner: Member) => {
    const text = `🏆 *PENGUMUMAN PEMENANG ARISAN AUTO CLASER CLUB!* 🏆\n\nSelamat kepada *${winner.name.toUpperCase()}* yang menggunakan unit *${winner.vehicle}* telah sah terpilih memenangkan kocokan arisan *Putaran ke-${currentRound}* hari ini! 🎉🏁\n\n💰 *Total Jackpot Cash:* ${formatRupiah(prizePool)}\n🎁 *Tgl Kocok:* ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n\nSelamat gass polll Bro/Sist! Ditunggu traktirannya pas kopdar nanti! 🥂💨🏎️\n\n_Auto Claser Club - Speed, Pride & Family_`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-5 space-y-4 overflow-y-auto max-h-[71vh] pb-24 scrollbar-none"
    >
      {/* Kocokan Chamber Viewport */}
      <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl p-6 text-center min-h-[300px] flex flex-col justify-between">
        
        {/* RPM dashboard lights decoration */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <div className={`w-2.5 h-1.5 rounded-3xs border ${rpmGauge > 1000 ? `${activeLivery.dotBg} ${activeLivery.borderAccent}` : "bg-zinc-800 border-zinc-900"}`}></div>
          <div className={`w-2.5 h-1.5 rounded-3xs border ${rpmGauge > 3000 ? `${activeLivery.dotBg} ${activeLivery.borderAccent}` : "bg-zinc-800 border-zinc-900"}`}></div>
          <div className={`w-2.5 h-1.5 rounded-3xs border ${rpmGauge > 5000 ? `${activeLivery.dotBg} ${activeLivery.borderAccent}` : "bg-zinc-800 border-zinc-900"}`}></div>
          <div className={`w-2.5 h-1.5 rounded-3xs border ${rpmGauge > 7000 ? "bg-purple-500 border-purple-500/20 animate-pulse" : "bg-zinc-800 border-zinc-900"}`}></div>
          <div className={`w-2.5 h-1.5 rounded-3xs border ${rpmGauge > 8000 ? "bg-pink-500 border-pink-500/20 animate-ping" : "bg-zinc-800 border-zinc-900"}`}></div>
        </div>

        {/* Outer Finish Line Flag Pattern Border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)] opacity-10"></div>

        {/* Dynamic Display Chamber */}
        {isLocked ? (
          <div className="my-auto space-y-4 py-3 font-sans">
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/25 shadow-lg shadow-red-500/5 cursor-pointer"
            >
              <Lock className="w-6 h-6 animate-pulse" />
            </motion.div>
            
            <div className="space-y-0.5">
              <h2 className="text-[10px] font-black tracking-widest text-red-400 font-mono uppercase">
                MESIN KOCOK DIKUNCI MARSHALL
              </h2>
              <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Menunggu jadwal aktif berikutnya yang telah ditentukan oleh Admin.
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 py-2.5 px-3 rounded-xl max-w-[270px] mx-auto space-y-0.5">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Kocokan Aktif</span>
              <p className="text-[11px] font-bold text-white leading-tight">
                {new Date(config.raffleActiveTime!).toLocaleString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })} WIB
              </p>
              <div className="pt-1.5 text-xs font-mono font-black text-amber-400 animate-pulse">
                ⏳ {timeLeftCode || "Menyiapkan mesin..."}
              </div>
            </div>

            {/* Inline Admin bypass / login challenge */}
            <div className="border-t border-white/5 pt-3 max-w-[270px] mx-auto space-y-1.5">
              <p className="text-[9px] text-zinc-400">Apakah Anda Marshall? Masuk untuk bypass gembok:</p>
              <div className="flex gap-1.5 justify-center">
                <input
                  type="password"
                  placeholder="Password Marshall"
                  value={localPass}
                  onChange={(e) => setLocalPass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (localPass === "admin123") {
                        onSetAdmin(true);
                        setLocalPass("");
                      } else {
                        alert("Sandi Marshall Salah! Bantuan: admin123");
                      }
                    }
                  }}
                  className="w-full max-w-[155px] bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-red-500/50 font-mono"
                />
                <button
                  onClick={() => {
                    if (localPass === "admin123") {
                      onSetAdmin(true);
                      setLocalPass("");
                    } else {
                      alert("Sandi Marshall Salah! Bantuan: admin123");
                    }
                  }}
                  className="bg-red-600/10 hover:bg-red-650 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg text-[9px] font-mono font-bold transition cursor-pointer shrink-0"
                >
                  MASUK
                </button>
              </div>
              <p className="text-[8px] text-zinc-500 font-mono italic">Sandi default: admin123</p>
            </div>
          </div>
        ) : raffleState === "idle" && (
          <div className="my-auto space-y-4">
            <motion.div
              animate={{ rotate: [0, 2, -2, 2, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className={`mx-auto w-16 h-16 rounded-full ${activeLivery.bgPill} flex items-center justify-center ${activeLivery.textAccent} border ${activeLivery.borderAccent}`}
            >
              <Gauge className="w-8 h-8 font-light" />
            </motion.div>
            
            <div>
              <h2 className={`text-[10px] font-black tracking-widest ${activeLivery.textAccent} font-mono uppercase`}>
                MESIN KOCOK CLASER
              </h2>
              <p className="text-[11px] text-zinc-404 mt-1 max-w-xs mx-auto font-medium">
                Pembalap terdaftar yang lunas bayar putaran {currentRound} & belum pernah menang akan diacak otomatis.
              </p>
            </div>

            {/* Candidate Breakdown pill */}
            <div className="inline-flex gap-4 items-center bg-black/45 px-3 py-2 border border-white/10 rounded-xl max-w-[290px] mx-auto shadow-md">
              <div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase">Drivers</div>
                <div className={`text-xs font-black ${activeLivery.textAccent} font-mono`}>{eligibleCandidates.length}</div>
              </div>
              <div className="w-[1px] h-6 bg-zinc-800"></div>
              <div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase">Pot Arisan</div>
                <div className="text-xs font-black text-emerald-400 font-mono">{formatRupiah(prizePool)}</div>
              </div>
              <div className="w-[1px] h-6 bg-zinc-800"></div>
              <div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase">Konsumsi</div>
                <div className="text-xs font-black text-amber-500 font-mono">{formatRupiah(paidCount * (config.contributionAmount - arisanShare))}</div>
              </div>
            </div>

            {eligibleCandidates.length === 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 max-w-xs mx-auto text-left space-y-1.5">
                <div className="flex gap-1.5 items-center text-red-100 font-bold text-[10px] font-mono uppercase">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  Kocokan Terkunci!
                </div>
                <p className="text-[9.5px] text-zinc-400 tracking-tight leading-relaxed">
                  Tidak ada anggota yang memenuhi syarat kocokan. Seluruh sisa anggota belum lunas bayar atau semua sudah menang di putaran sebelumnya.
                </p>
                <div className="pt-1 flex gap-1.5">
                  <button 
                    onClick={onInstantPayAll}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[9px] py-1 px-2 rounded font-mono transition cursor-pointer"
                  >
                    LUNASI SEMUA ✔
                  </button>
                  <button 
                    onClick={onNavigateToDashboard}
                    className={`flex-1 bg-white/5 border border-white/10 hover:bg-white/10 ${activeLivery.textAccent} font-bold text-[9px] py-1 px-2 rounded font-mono transition cursor-pointer`}
                  >
                    CEK SETORAN 📋
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {raffleState === "rolling" && (
          <div className="my-auto space-y-4">
            {/* Spinning Dashboard Tachometer effect */}
            <div className={`relative mx-auto w-20 h-20 rounded-full border-4 border-dashed ${activeLivery.borderAccent} animate-spin flex items-center justify-center`}>
              <Flame className={`w-8 h-8 ${activeLivery.textAccent} animate-pulse`} />
            </div>

            <div className="space-y-1.5 z-10">
              <span className={`text-[9px] font-black uppercase tracking-widest text-[#0a0a0c] ${activeLivery.dotBg} px-2 py-0.5 rounded font-mono`}>
                GAS KOPLING REDLINE: {rpmGauge} RPM
              </span>
              
              <div className="h-14 overflow-hidden relative border-y border-white/5 py-2">
                <AnimatePresence mode="popLayout">
                  {highlightMember && (
                    <motion.div
                      key={highlightMember.id}
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -25, opacity: 0 }}
                      transition={{ duration: 0.08 }}
                      className={`text-base font-black italic uppercase tracking-tight ${activeLivery.textAccent}`}
                    >
                      🏎️ {highlightMember.name}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {highlightMember && (
                <p className="text-[10px] font-mono text-zinc-500 italic mt-0.5 block truncate">
                  {highlightMember.vehicle}
                </p>
              )}
            </div>
          </div>
        )}

        {raffleState === "winner_selected" && selectedWinner && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="my-auto space-y-4"
          >
            {/* Golden Winner HUD */}
            <div className={`relative mx-auto w-16 h-16 rounded-full bg-gradient-to-tr ${activeLivery.btnGrad} flex items-center justify-center font-bold text-white shadow-lg ${activeLivery.shadowAccent}`}>
              <Trophy className="w-8 h-8 text-white" />
              <motion.div 
                className={`absolute inset-0 rounded-full border ${activeLivery.borderAccent}`}
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest font-mono uppercase bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded">
                WINNER SAH PUTARAN {currentRound}
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                {selectedWinner.name}
              </h2>
              <div className="text-xs text-zinc-400 font-semibold block truncate">
                🚙 {selectedWinner.vehicle}
              </div>
              <div className={`text-base font-black ${activeLivery.textAccent} font-mono mt-1`}>
                {formatRupiah(prizePool)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic primary Action Button */}
        {/* Dynamic primary Action Button */}
        <div className="pt-4 z-10">
          {isLocked ? (
            <button
              disabled
              className="w-full bg-[#1c080a]/60 text-red-500/50 font-black font-mono tracking-tight py-3 px-4 rounded-xl border border-red-500/10 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Lock className="w-4 h-4 text-red-500/40" /> GERBANG ARISAN DIKUNCI TIMER 🔒
            </button>
          ) : raffleState === "idle" && eligibleCandidates.length > 0 && (
            <button
              onClick={startRaffle}
              className={`w-full bg-gradient-to-r ${activeLivery.btnGrad} text-white font-black font-mono tracking-tight py-3 px-4 rounded-xl ${activeLivery.shadowAccent} border ${activeLivery.borderAccent} transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              {isCurrentlyLocked && isAdmin ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-300" /> BYPASS & PUTAR DI KOPDAR {currentRound} 🏎️💨
                </>
              ) : (
                <>
                  <Gauge className="w-4 h-4" /> GAS PUTAR MESIN {currentRound} 🏎️💨
                </>
              )}
            </button>
          )}

          {raffleState === "rolling" && (
            <button
              disabled
              className="w-full bg-white/5 text-zinc-650 font-black font-mono tracking-tight py-3 px-4 rounded-xl border border-white/5 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              RPM JALAN REVVING... 🏁
            </button>
          )}

          {raffleState === "winner_selected" && selectedWinner && (
            <div className="space-y-2">
              <button
                onClick={handleConfirm}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black font-mono tracking-tight py-2.5 px-4 rounded-xl transition active:scale-98 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4 font-bold" /> KONFIRMASI PEMENANG SAH ✔
              </button>
              
              <div className="flex gap-2">
                <a
                  href={generateWaLink(selectedWinner)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-green-400 py-2 px-3 rounded-xl font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <Share2 className="w-3.5 h-3.5" /> BROADCAST WA 🏁
                </a>
                <button
                  onClick={() => {
                    setRaffleState("idle");
                    setSelectedWinner(null);
                    setHighlightMember(null);
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-400 py-2 px-3 rounded-xl font-mono text-[10px] font-bold flex items-center justify-center gap-1 border border-white/10 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> ULANG KOCOK 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Eligible Candidates breakdown list */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1 text-slate-400 font-mono text-xs font-black">
          <span className="flex items-center gap-1 text-[10px]">
            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
            PARTISIPAN KOCOK (LUNAS)
          </span>
          <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-400 px-2 rounded-full py-0.5">
            {eligibleCandidates.length} Pembalap
          </span>
        </div>

        <div className="max-h-[17vh] overflow-y-auto space-y-1.5 border border-white/5 rounded-xl p-2.5 bg-black/25 font-sans">
          {eligibleCandidates.length > 0 ? (
            eligibleCandidates.map((candidate) => (
              <div 
                key={candidate.id}
                className="flex items-center justify-between text-xs font-semibold px-2 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-zinc-200"
              >
                <span className="truncate max-w-[180px]">{candidate.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">{candidate.vehicle}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">
              Tidak ada partisipan lunas. Tandai "LUNAS" pada menu Beranda atau Anggota terlebih dahulu.
            </div>
          )}
        </div>
      </div>

      {/* Live Admin Schedule Panel (Inside-Page Shortcut) */}
      {isAdmin && raffleState === "idle" && (
        <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-2 text-left font-sans shadow-lg">
          <label className="text-[9.5px] uppercase font-mono font-black text-amber-400 flex items-center gap-1.5">
            <Unlock className="w-3 h-3 text-amber-400" />
            <span>Atur Pengatur Waktu Mesin Kocokan (Marshall Only)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={config.raffleActiveTime || ""}
              onChange={(e) => onUpdateConfig({ raffleActiveTime: e.target.value || undefined })}
              className="flex-1 bg-black/55 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 font-mono"
            />
            {config.raffleActiveTime && (
              <button
                onClick={() => onUpdateConfig({ raffleActiveTime: undefined })}
                className="bg-red-550 hover:bg-red-600 hover:text-white text-red-400 px-3 py-1 rounded-lg text-[9px] font-mono border border-red-500/20 cursor-pointer text-center font-bold"
              >
                UNSET 🔓
              </button>
            )}
          </div>
          <p className="text-[8px] text-zinc-500 font-mono leading-relaxed">
            * Parameter tanggal dan jam dimari terkoneksi langsung dengan sistem keamanan gembok. Bila Unset/Kosong, maka kocokan aktif instan.
          </p>
        </div>
      )}
    </motion.div>
  );
}
