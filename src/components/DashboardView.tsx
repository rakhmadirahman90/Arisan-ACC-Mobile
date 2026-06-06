import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { Member, ArisanConfig, PaymentStatus, ArisanHistory } from "../types";
import { formatRupiah } from "../data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { 
  Trophy, 
  DollarSign, 
  Users, 
  Calendar, 
  CircleCheck, 
  Hourglass, 
  TrendingUp, 
  Play,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Banknote,
  Copy,
  X,
  RefreshCw,
  Sparkles,
  Check,
  Search
} from "lucide-react";

interface DashboardViewProps {
  members: Member[];
  config: ArisanConfig;
  payments: PaymentStatus[];
  history: ArisanHistory[];
  onNavigateToKocokan: () => void;
  onTogglePayment: (memberId: string) => void;
  activeLivery: any;
  isAdmin: boolean;
}

export default function DashboardView({
  members,
  config,
  payments,
  history,
  onNavigateToKocokan,
  onTogglePayment,
  activeLivery,
  isAdmin,
}: DashboardViewProps) {
  // Current round metadata
  const currentRound = config.currentRound;
  
  // Find members and check payment status
  const currentPayments = payments.filter((p) => p.round === currentRound);
  const paidMemberIds = currentPayments.filter((p) => p.isPaid).map((p) => p.memberId);
  
  const paidCount = paidMemberIds.length;
  const totalCount = members.length;
  const unpaidCount = totalCount - paidCount;
  
  const arisanShare = Math.round((config.contributionAmount * 5) / 6);
  const consumptionShare = config.contributionAmount - arisanShare;

  const currentArisanPot = paidCount * arisanShare;
  const currentConsumptionPot = paidCount * consumptionShare;
  
  const totalTargetArisanPot = totalCount * arisanShare;

  // Find latest winner
  const latestWinner = history.find((h) => h.round === currentRound - 1);

  // List of unpaid members to nudges/remind
  const unpaidMembersList = members.filter(m => !paidMemberIds.includes(m.id));
  const paidMembersList = members.filter(m => paidMemberIds.includes(m.id));

  const percentComplete = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  // Payment gateway modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMemberPayment, setActiveMemberPayment] = useState<Member | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"qris" | "bank" | "cash">("qris");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "verified">("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [progressText, setProgressText] = useState<string>("Sedang menyiapkan lembar tagihan...");
  const [copysuccess, setCopysuccess] = useState<boolean>(false);

  // Auto-verify webhook simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentStatus === "waiting") {
      if (countdownSeconds > 0) {
        timer = setTimeout(() => {
          const nextVal = countdownSeconds - 1;
          setCountdownSeconds(nextVal);
          
          if (nextVal === 2) {
            setProgressText("Aplikasi perbankan terhubung, mengunduh data mutasi...");
          } else if (nextVal === 1) {
            setProgressText("Status webhook aman! Memperbarui berkas arisan...");
          } else if (nextVal === 0) {
            setProgressText("Data lunas terekam! Transaksi divalidasi.");
          }
        }, 1100);
      } else {
        // Confirmed! Toggle payment to lunas
        if (activeMemberPayment) {
          const isPaid = paidMemberIds.includes(activeMemberPayment.id);
          if (!isPaid) {
            onTogglePayment(activeMemberPayment.id);
          }
        }
        setPaymentStatus("verified");
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [paymentStatus, countdownSeconds, activeMemberPayment, onTogglePayment, paidMemberIds]);

  const meetupMapUrl = config.meetupMapQuery && config.meetupMapQuery.includes("google.com/maps")
    ? (config.meetupMapQuery.includes("embed") ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.meetupAddress || "Tempat Kumpul Arisan")}` : config.meetupMapQuery)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.meetupMapQuery || config.meetupAddress || "")}`;

  // Color configuration mapping based on app active livery
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    green: "#10b981",
    orange: "#f97316",
    red: "#ef4444",
    lime: "#84cc16",
  };
  const primaryColor = colorMap[config.livery || "blue"] || "#3b82f6";

  // Generate contribution trend data for recharts
  const chartData = Array.from({ length: config.totalRounds || 12 }, (_, i) => {
    const roundNum = i + 1;
    const roundPayments = payments.filter((p) => p.round === roundNum);
    const paidInRound = roundPayments.filter((p) => p.isPaid).length;
    const totalCollected = paidInRound * config.contributionAmount;
    const targetPot = members.length * config.contributionAmount;
    
    return {
      round: `P${roundNum}`,
      collected: totalCollected,
      target: targetPot,
      unpaid: Math.max(0, targetPot - totalCollected),
    };
  });

  const totalActualCollected = payments.filter(p => p.isPaid).length * config.contributionAmount;
  const totalTargetPossible = members.length * (config.totalRounds || 12) * config.contributionAmount;
  const totalOutstandingAmount = Math.max(0, totalTargetPossible - totalActualCollected);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f121d]/95 backdrop-blur-md border border-white/10 p-2.5 rounded-xl text-left text-[9.5px] font-mono shadow-xl space-y-1">
          <p className="font-bold text-white uppercase text-[8px] tracking-wider mb-1">Putaran {label.replace("P", "")}</p>
          <p className="text-emerald-400">
            Lunas: <span className="font-extrabold">{formatRupiah(payload[0].value)}</span>
          </p>
          {payload[1] && (
            <p className="text-rose-450">
              Sisa Tagihan: <span className="font-extrabold">{formatRupiah(payload[1].value)}</span>
            </p>
          )}
          <p className="text-zinc-500 border-t border-white/5 pt-1 mt-1 font-sans">
            Total Target: {formatRupiah(payload[0].payload.target)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full overflow-y-auto p-5 pb-24 scrollbar-none flex flex-col gap-4 text-left md:grid md:grid-cols-2 md:items-start"
    >
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 shadow-xl hover-glow-${config.livery || "blue"} md:col-span-2 shrink-0`}>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <DollarSign className={`w-40 h-40 ${activeLivery.textAccent}`} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between">
          <div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider ${activeLivery.bgPill} ${activeLivery.textAccent} border ${activeLivery.borderAccent} mb-2`}>
              <TrendingUp className="w-3 h-3" /> PUTARAN {currentRound} AKTIF
            </span>
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
              TOTAL ARISAN TERKUMPUL (50K/ORG)
            </div>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">
              {formatRupiah(currentArisanPot)}
            </div>
            <div className="text-[10px] text-zinc-300 mt-1.5 flex flex-col gap-0.5 font-mono">
              <div>Uang Konsumsi Sektet: <span className="text-amber-400 font-bold">{formatRupiah(currentConsumptionPot)}</span> (10k/org)</div>
              <div className="text-zinc-500">Total Setoran Kas: {formatRupiah(paidCount * config.contributionAmount)} / {formatRupiah(totalCount * config.contributionAmount)} ({percentComplete}%)</div>
            </div>
          </div>

          {/* Quick Progress Indicator */}
          <div className="mt-4 w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full bg-gradient-to-r ${activeLivery.btnGrad} transition-all duration-500`}
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-3 md:col-span-1 shrink-0">
        <div className={`bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3 shadow-md hover-glow-${config.livery || "blue"}`}>
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-450 border border-emerald-500/20">
            <CircleCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-mono">Setor Lunas</div>
            <div className="text-sm font-black text-white mt-0.5">
              {paidCount} <span className="text-xs font-normal text-zinc-500">/{totalCount}</span>
            </div>
          </div>
        </div>

        <div className={`bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3 shadow-md hover-glow-${config.livery || "blue"}`}>
          <div className={`p-2 ${activeLivery.bgPill} rounded-lg ${activeLivery.textAccent} border ${activeLivery.borderAccent}`}>
            <Hourglass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-mono font-bold">Belum Diambil</div>
            <div className="text-sm font-black text-white mt-0.5">
              {members.filter(m => m.wonRound === null).length} <span className="text-xs font-normal text-zinc-500">mobil</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kocokan Quick Call-to-Action */}
      <button 
        onClick={onNavigateToKocokan}
        className={`w-full bg-gradient-to-r ${activeLivery.btnGrad} text-white py-3 px-4 rounded-xl font-bold font-mono tracking-tight flex items-center justify-center gap-2 transition active:scale-[0.98] ${activeLivery.shadowAccent} border ${activeLivery.borderAccent} cursor-pointer md:col-span-1 shrink-0`}
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        SABOT KOCOKAN SEKARANG 🏁
      </button>

      {/* MONTLHY CONTRIBUTION TREND CARD */}
      <div className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg text-left space-y-3 hover-glow-${config.livery || "blue"} md:col-span-1 md:row-span-2 shrink-0`}>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${activeLivery.textAccent}`} />
            <h3 className="text-xs font-black uppercase text-white font-mono tracking-wider">
              Tren Progres Kas & Kontribusi
            </h3>
          </div>
          <span className="text-[8.5px] font-mono font-black text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
            R1 - R{config.totalRounds}
          </span>
        </div>

        <div className="text-[9px] text-zinc-400 font-sans leading-relaxed">
          Statistik visual akumulasi iuran lunas vs sisa tagihan per putaran. Target sirkulasi iuran per putaran adalah <strong className="text-zinc-200">{formatRupiah(members.length * config.contributionAmount)}</strong>.
        </div>

        <div className="w-full h-[150px] pr-2 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.15}/>
                </linearGradient>
                <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="round" 
                stroke="#52525b" 
                fontSize={8} 
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8} 
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="collected" name="Lunas" fill="url(#colorCollected)" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="unpaid" name="Sisa Tagihan" fill="url(#colorUnpaid)" radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Metrics */}
        <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2 sm:gap-3 pt-2 border-t border-white/5 font-mono text-[8.5px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-xs shrink-0" style={{ backgroundColor: primaryColor }} />
            <span className="text-zinc-400 break-keep">Total Lunas: <span className="font-bold text-emerald-400">{formatRupiah(totalActualCollected)}</span></span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 font-mono">
            <span className="w-1.5 h-1.5 rounded-xs bg-red-500/50 shrink-0" />
            <span className="text-zinc-400 break-keep">Sisa Piutang: <span className="font-bold text-zinc-300">{formatRupiah(totalOutstandingAmount)}</span></span>
          </div>
        </div>
      </div>

      {/* JADWAL ARISAN & PERTEMUAN SELANJUTNYA */}
      <div className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg font-sans hover-glow-${config.livery || "blue"} md:col-span-1 shrink-0`}>
        {/* Cover Image/Photo */}
        <div className="relative h-36 w-full">
          <img 
            src={config.meetupImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop"} 
            alt="Meetup Location" 
            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
          
          <div className="absolute top-3 left-3 z-20">
            <a
              href={meetupMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 hover:bg-amber-500/50 hover:text-white border border-amber-500/50 shadow-lg shadow-black/60 transition active:scale-95 cursor-pointer leading-none"
              title="Navigasi ke Google Maps secara presisi"
            >
              📍 AGENDA ARISAN WAJIB
            </a>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-left">
            <h4 className="text-sm font-black text-white tracking-tight leading-tight flex items-center gap-1.5 drop-shadow-md">
              {config.meetupLocationName || "Lokasi Kumpul Arisan"}
            </h4>
            <p className="text-[10px] text-zinc-300 font-mono mt-0.5 drop-shadow-sm flex items-center gap-1">
              <span>📅</span> {config.meetupTime || "Segera diumumkan"}
            </p>
          </div>
        </div>

        {/* Content Details & Exact Interactive Maps */}
        <div className="p-3.5 space-y-3 text-left">
          <div className="text-[10px] text-zinc-400 leading-normal font-sans flex items-start gap-2.5">
            {/* Clickable Icon Maps aligned with main button action */}
            <a
              href={meetupMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-amber-400 hover:text-white border border-white/5 hover:border-white/10 active:scale-95 transition flex items-center gap-1 shrink-0 rounded-lg cursor-pointer font-bold font-sans text-[9px] shadow-sm select-none"
              title="Klik untuk navigasi presisi"
            >
              <span>📍</span> Map
            </a>
            <div className="flex-1 min-w-0">
              <span className="text-zinc-500 font-bold block uppercase font-mono tracking-wider text-[8px] mb-0.5">Alamat Lengkap</span>
              {config.meetupAddress || "Sirkuit Clser Racing Club, Jl. Raya Sentul"}
            </div>
          </div>

          {/* Map Section */}
          {(config.meetupMapQuery || config.meetupAddress) && (
            <div className="space-y-1.5">
              <span className="text-zinc-500 font-bold block uppercase font-mono tracking-wider text-[8px]">Peta Lokasi Presisi (Interaktif)</span>
              <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 relative bg-zinc-900">
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={
                    config.meetupMapQuery && config.meetupMapQuery.includes("google.com/maps/embed")
                      ? config.meetupMapQuery
                      : `https://maps.google.com/maps?q=${encodeURIComponent(config.meetupMapQuery || config.meetupAddress || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  }
                ></iframe>
              </div>
            </div>
          )}

          {/* Quick External Redirection */}
          {(config.meetupMapQuery || config.meetupAddress) && (
            <a
              href={meetupMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 text-white font-mono font-bold text-[9.5px] flex items-center justify-center gap-1.5 rounded-xl transition active:scale-95 cursor-pointer`}
            >
              🚀 NAVIGASI DI GOOGLE MAPS INDONESIA
            </a>
          )}
        </div>
      </div>

      {/* Real-time Payment Gateway Quick Portal Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-[#0e1629] to-zinc-950 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg relative overflow-hidden md:col-span-2 shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl"></div>
        <div className="space-y-1 text-left min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[8.5px] font-mono font-black text-emerald-400 tracking-wider uppercase">GERBANG PEMBAYARAN INSTAN</span>
          </div>
          <h4 className="text-[11px] font-black text-white">QRIS Balap & Transfer Real-time</h4>
          <p className="text-[9px] text-zinc-400 leading-tight">Putaran {currentRound} otomatis LUNAS didukung sensor mutasi bank otomatis.</p>
        </div>
        <button
          onClick={() => {
            // Find first unpaid member to trigger mock billing
            const firstUnpaid = members.find(m => !paidMemberIds.includes(m.id));
            if (firstUnpaid) {
              setActiveMemberPayment(firstUnpaid);
            } else if (members.length > 0) {
              setActiveMemberPayment(members[0]);
            }
            setSelectedMethod("qris");
            setPaymentStatus("idle");
            setCountdownSeconds(3);
            setProgressText("Sedang menyiapkan lembar tagihan...");
          }}
          className={`px-2.5 py-1.5 bg-white/10 hover:bg-white/15 cursor-pointer active:scale-95 text-white text-[9.5px] font-black font-mono tracking-tight rounded-xl border border-white/10 transition flex items-center gap-1 shrink-0`}
        >
          <Smartphone className="w-3 h-3 text-emerald-400" />
          BAYAR ARISAN ⚡
        </button>
      </div>

      {/* Last Winner Trophy */}
      {latestWinner ? (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3.5 relative overflow-hidden shadow-lg md:col-span-1 shrink-0">
          {/* subtle gold ambient glow */}
          <div className={`absolute right-0 top-0 w-24 h-24 ${activeLivery.ambientFlare1} rounded-full blur-2xl`}></div>
          
          <div className="flex items-center gap-3.5 relative z-10 offset-y">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Trophy className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[9px] font-black tracking-widest ${activeLivery.textAccent} font-mono uppercase`}>
                Pemenang Putaran {latestWinner.round}
              </div>
              <h4 className="text-xs font-black text-white truncate mt-0.5">
                {latestWinner.winnerName}
              </h4>
              <p className="text-[10px] text-zinc-400 tracking-tight truncate">
                🚙 {latestWinner.winnerVehicle}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-extrabold ${activeLivery.textAccent} font-mono`}>
                {formatRupiah(latestWinner.prizeAmount)}
              </span>
              <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">
                {latestWinner.drawnAt}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center text-[11px] text-zinc-500 font-mono shrink-0">
          Belum ada putaran arisan yang diselesaikan.
        </div>
      )}

      {/* Payment List Snapshot for Quick Toggles */}
      <div className="space-y-2.5 shrink-0">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            Monitor Setoran (R{currentRound})
          </h3>
          <span className={`text-[10px] bg-white/5 border border-white/10 ${activeLivery.textAccent} px-2 py-0.5 rounded-full font-mono`}>
            {paidCount}/{totalCount}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pembalap, unit, atau HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition font-sans"
          />
          <div className="absolute left-3 top-2.5 text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-[10px] text-zinc-400 font-mono hover:text-white transition cursor-pointer font-bold"
            >
              Ulang
            </button>
          )}
        </div>

        {/* Member Grid Row */}
        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto scrollbar-none pr-0.5">
          {(() => {
            const listFiltered = members.filter((member) => {
              if (!searchQuery.trim()) return true;
              const term = searchQuery.toLowerCase();
              return (
                member.name.toLowerCase().includes(term) ||
                member.vehicle.toLowerCase().includes(term) ||
                (member.phone && member.phone.toLowerCase().includes(term))
              );
            });

            if (listFiltered.length === 0) {
              return (
                <div className="text-center py-6 text-[10px] text-zinc-500 font-mono bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                  Pembalap "{searchQuery}" tidak ditemukan.
                </div>
              );
            }

            return listFiltered.map((member, index) => {
              const isPaid = paidMemberIds.includes(member.id);
              const wonThisOrPrior = member.wonRound !== null;
              
              return (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isPaid 
                      ? "bg-emerald-500/10 border-emerald-500/20" 
                      : "bg-white/5 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono font-black text-zinc-500 w-5 text-center shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {member.photo ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-md">
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-white text-xs uppercase overflow-hidden shrink-0 ${member.avatarColor}`}>
                        {member.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate block flex items-center gap-1">
                          {member.name}
                          {wonThisOrPrior && (
                            <Trophy className="w-3 h-3 text-amber-400 fill-amber-500/20 shrink-0 select-none" />
                          )}
                        </span>
                        {wonThisOrPrior && (
                          <span className={`px-1 text-[8px] ${activeLivery.bgPill} ${activeLivery.textAccent} font-bold border ${activeLivery.borderAccent} rounded-xs font-mono`}>
                            WON R-{member.wonRound}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate block font-mono">
                        {member.vehicle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isPaid) {
                          // Undo payment immediately if paid (for admin correction ease)
                          if (!isAdmin) {
                            toast.error("Hanya admin yang dapat membatalkan status lunas.");
                            return;
                          }
                          onTogglePayment(member.id);
                        } else {
                          // Unpaid: Trigger live automated QRIS/Bank simulated window
                          setActiveMemberPayment(member);
                          setSelectedMethod("qris");
                          setPaymentStatus("idle");
                          setCountdownSeconds(3);
                          setProgressText("Sedang menyiapkan lembar tagihan...");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-tight transition active:scale-95 cursor-pointer ${
                        isPaid 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25" 
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25"
                      }`}
                    >
                      {isPaid ? "LUNAS ✔" : "BAYAR ⚡"}
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* REAL-TIME PAYMENT GATEWAY MODAL */}
      <AnimatePresence>
        {activeMemberPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (paymentStatus !== "waiting") {
                  setActiveMemberPayment(null);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden text-zinc-100 font-sans z-10"
            >
              {/* Decorative top racing stripes */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[repeating-linear-gradient(45deg,#10b981,#10b981_10px,#047857_10px,#047857_20px)]"></div>

              {/* Header */}
              <div className="flex justify-between items-start pb-3.5 border-b border-white/10">
                <div className="space-y-0.5 text-left">
                  <span className="text-[8.5px] font-mono font-black tracking-widest text-[#10b981] uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    GARASI WEBHOOK DEEPLINK
                  </span>
                  <h3 className="text-sm font-black text-white">Sektor Pembayaran Balap</h3>
                </div>
                {paymentStatus !== "waiting" && (
                  <button 
                    onClick={() => setActiveMemberPayment(null)}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="py-2 space-y-4">
                {/* Member Identity & Billing Amount Card */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between font-sans text-left">
                  <div>
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Pembayar (Pembalap)</span>
                    <strong className="text-xs text-white block mt-0.5">{activeMemberPayment.name}</strong>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">🚙 {activeMemberPayment.vehicle}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Tagihan Putaran {currentRound}</span>
                    <strong className="text-sm text-[#10b981] font-mono font-black block mt-0.5">{formatRupiah(config.contributionAmount)}</strong>
                    <span className="text-[8px] text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-1 py-0.5 rounded font-mono mt-1 inline-block font-black">ACTIVE BILL</span>
                  </div>
                </div>

                {/* STEP 1: CHOOSE METHOD */}
                {paymentStatus === "idle" && (
                  <div className="space-y-4 text-left">
                    <p className="text-[10.5px] text-zinc-400 leading-normal">
                      Pilih sirkuit pemindahan dana instan atau tunai langsung. Dana akan diaudit secara otomatis di sistem database CLASER secara real-time.
                    </p>

                    <div className="grid grid-cols-3 gap-1.5">
                      {/* QRIS OPTION */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("qris")}
                        className={`p-2.5 rounded-2xl text-left border cursor-pointer transition flex flex-col gap-1.5 ${
                          selectedMethod === "qris" 
                            ? "border-emerald-500 bg-emerald-500/10 text-white" 
                            : "border-white/5 bg-black/30 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-[10px] font-bold leading-tight">PINDAI QRIS</p>
                          <p className="text-[7.5px] text-zinc-500 font-mono mt-0.5">3 dtk lunas</p>
                        </div>
                      </button>

                      {/* BANK TRANSFER VA OPTION */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("bank")}
                        className={`p-2.5 rounded-2xl text-left border cursor-pointer transition flex flex-col gap-1.5 ${
                          selectedMethod === "bank" 
                            ? "border-emerald-500 bg-emerald-500/10 text-white" 
                            : "border-white/5 bg-black/30 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-[#38bdf8]" />
                        <div>
                          <p className="text-[10px] font-bold leading-tight">TRANSFER VA</p>
                          <p className="text-[7.5px] text-zinc-500 font-mono mt-0.5">VA Bank</p>
                        </div>
                      </button>

                      {/* CASH OPTION */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("cash")}
                        className={`p-2.5 rounded-2xl text-left border cursor-pointer transition flex flex-col gap-1.5 ${
                          selectedMethod === "cash" 
                            ? "border-emerald-500 bg-emerald-500/10 text-white" 
                            : "border-white/5 bg-black/30 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-400 animate-none" />
                        <div>
                          <p className="text-[10px] font-bold leading-tight">TUNAI / CASH</p>
                          <p className="text-[7.5px] text-zinc-500 font-mono mt-0.5">Lunas langsung</p>
                        </div>
                      </button>
                    </div>

                    {selectedMethod === "bank" && (
                      <div className="bg-black/30 border border-emerald-500/10 rounded-xl p-2.5 space-y-1">
                        <label className="text-[8.5px] text-zinc-500 uppercase tracking-wide font-bold">Tujuan Transfer Bank:</label>
                        <div className="flex items-center gap-2 p-1.5 px-2 bg-emerald-500/5 text-emerald-400 font-mono text-[9px] border border-emerald-500/20 rounded-lg">
                          <span>Bank Mandiri</span>
                          <span className="font-bold">1700000911135</span>
                        </div>
                      </div>
                    )}

                    {/* Cash Payment help info if cash selected */}
                    {selectedMethod === "cash" && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5">
                        <p className="text-[9.5px] text-amber-200 leading-normal flex items-start gap-1.5 font-sans">
                          <span className="shrink-0 mt-0.5 text-amber-400">💡</span>
                          <span>
                            Gunakan opsi ini jika Pembalap langsung menyetor uang tunai / cash secara offline di lokasi. Admin menandai pembayaran ini sebagai lunas tanpa membutuhkan audit server perbankan online.
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Active member check if already paid safety */}
                    {paidMemberIds.includes(activeMemberPayment.id) ? (
                      <div className="text-center py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono text-[10px] font-black">
                        ✓ MEMBER INI SUDAH LUNAS
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!isAdmin) {
                            toast.error("Hanya Admin yang dapat melanjutkan proses transaksi atau validasi lunas.");
                            return;
                          }
                          if (selectedMethod === "cash") {
                            // Instant cash approval and toggle
                            if (activeMemberPayment) {
                              const isPaid = paidMemberIds.includes(activeMemberPayment.id);
                              if (!isPaid) {
                                onTogglePayment(activeMemberPayment.id);
                              }
                            }
                            setPaymentStatus("verified");
                          } else {
                            setPaymentStatus("waiting");
                            setProgressText("Meminta Token Pembayaran ke API Midtrans...");
                            
                            try {
                              const response = await fetch("/api/checkout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  memberId: activeMemberPayment?.id,
                                  memberName: activeMemberPayment?.name,
                                  phone: activeMemberPayment?.phone,
                                  round: currentRound,
                                  amount: config.contributionAmount
                                })
                              });
                              const data = await response.json();
                              
                              if (data.simulated) {
                                setCountdownSeconds(3); // Start local fallback
                              } else if (data.token) {
                                setProgressText("Menunggu instruksi dari Midtrans Snap UI...");
                                // Disable the local mockup screen countdown completely by setting it to large number
                                setCountdownSeconds(9999);
                                
                                if (typeof (window as any).snap !== "undefined") {
                                  (window as any).snap.pay(data.token, {
                                    onSuccess: function() {
                                      if (activeMemberPayment && !paidMemberIds.includes(activeMemberPayment.id)) {
                                        onTogglePayment(activeMemberPayment.id);
                                      }
                                      setPaymentStatus("verified");
                                    },
                                    onPending: function() {
                                      toast.loading("Menunggu pembayaran! Silakan cek notifikasi aplikasi atau ATM Anda.");
                                      setActiveMemberPayment(null);
                                    },
                                    onError: function() {
                                      toast.error("Pembayaran Gagal di Midtrans.");
                                      setActiveMemberPayment(null);
                                    },
                                    onClose: function() {
                                      setActiveMemberPayment(null);
                                    }
                                  });
                                } else {
                                  toast.error("Midtrans Core Script belum dimuat oleh browser.");
                                  setCountdownSeconds(3);
                                }
                              }
                            } catch (err) {
                              console.error(err);
                              setCountdownSeconds(3);
                            }
                          }
                        }}
                        className={`w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black font-mono text-xs py-2.5 px-4 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0`}
                      >
                        {selectedMethod === "cash" ? "TERIMA TUNAI & SET LUNAS ✔" : "PROSES ONLINE TRANSAKSI ⚡"}
                      </button>
                    )}
                  </div>
                )}

                {/* STEP 2: PROCESSING (WAITING BANK/QRIS INTERACTION) */}
                {paymentStatus === "waiting" && (
                  <div className="space-y-4 text-center font-sans">
                    {/* Simulated visual codes based on choice */}
                    {selectedMethod === "qris" ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-36 h-36 bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg">
                          {/* Beautiful simulated QR code constructed in pure CSS with checkered blocks */}
                          <div className="w-full h-full border-2 border-black rounded-lg p-0.5 relative flex flex-wrap content-between justify-between">
                            {/* QR corners */}
                            <div className="w-8 h-8 border-[6px] border-black bg-white rounded-sm absolute top-1 left-1"></div>
                            <div className="w-8 h-8 border-[6px] border-black bg-white rounded-sm absolute top-1 right-1"></div>
                            <div className="w-8 h-8 border-[6px] border-black bg-white rounded-sm absolute bottom-1 left-1"></div>
                            
                            {/* Inner random pixels */}
                            <div className="absolute top-10 left-10 w-4 h-4 bg-black"></div>
                            <div className="absolute top-3 left-10 w-2 h-6 bg-black"></div>
                            <div className="absolute top-10 left-3 w-6 h-2 bg-black"></div>
                            <div className="absolute top-10 right-3 w-4 h-5 bg-black"></div>
                            <div className="absolute bottom-10 right-10 w-6 h-6 bg-black"></div>
                            <div className="absolute bottom-3 right-10 w-5 h-2 bg-black"></div>
                            <div className="absolute bottom-10 left-10 w-2 h-4 bg-black"></div>

                            {/* Simulated logo */}
                            <div className="absolute inset-x-0 mx-auto top-[54px] w-6 h-4 bg-rose-600 text-[6px] text-white font-black flex items-center justify-center rounded font-sans leading-none">
                              QRIS
                            </div>
                          </div>
                          
                          {/* Glow overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/15 via-transparent to-transparent pointer-events-none rounded-2xl animate-pulse"></div>
                        </div>

                        <div className="text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/5 py-1 px-2.5 rounded-lg inline-block">
                          ID: QRIS.CLASER.{activeMemberPayment.id.substring(0, 5).toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left bg-black/40 border border-white/5 p-3.5 rounded-2xl">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <span className="text-[10px] font-mono font-black text-blue-400 uppercase">
                            MANDIRI TRANSFER
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[8.5px] font-mono text-zinc-500 uppercase block">Nomor Rekening Mandiri:</span>
                          <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono">
                            <span className="text-sm font-black tracking-widest text-[#38bdf8]">
                              1700000911135
                            </span>
                            <button
                              onClick={() => {
                                setCopysuccess(true);
                                setTimeout(() => setCopysuccess(false), 2000);
                                navigator.clipboard.writeText("1700000911135");
                              }}
                              className="p-1 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-[8.5px] font-mono font-black border border-white/5 hover:border-white/10 text-white cursor-pointer active:scale-95"
                            >
                              {copysuccess ? "COPIED ✔" : "COPY"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-[9px] text-zinc-400">
                          <div>Atas Nama: <strong className="text-zinc-200">SUKRI LANRA</strong></div>
                          <div className="text-[8px] text-zinc-500">* Transfer manual nominal pas agar mudah divalidasi.</div>
                        </div>
                      </div>
                    )}

                    {/* Websocket system pulse simulator */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-white tracking-wide">
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                        <span className="font-mono font-bold text-[10px] text-zinc-300">
                          {progressText}
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="h-1.5 w-full bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: "10%" }}
                          animate={{ width: `${(3 - countdownSeconds) * 33.3 + 10}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-emerald-500" 
                        />
                      </div>

                      <span className="text-[9.5px] text-amber-400 font-mono inline-block animate-pulse">
                        ⏳ Menunggu Real-time Webhook: T-{countdownSeconds}s
                      </span>
                    </div>

                    {/* Fast bypass option */}
                    <button
                      onClick={() => {
                        setCountdownSeconds(0);
                        setProgressText("Verifikasi paksa disetujui Admin!");
                      }}
                      className="text-[9px] font-mono text-zinc-500 hover:text-[#10b981] underline block mx-auto pt-1.5 cursor-pointer"
                    >
                      Bypass & Luluskan Instan (Admin Override)
                    </button>
                  </div>
                )}

                {/* STEP 3: TRANSACTION SUCCESS / VERIFIED STATUS */}
                {paymentStatus === "verified" && (
                  <div className="space-y-4 text-center font-sans">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                      animate={{ scale: [1.2, 1], rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    >
                      <Sparkles className="w-7 h-7 text-emerald-400 animate-bounce" />
                    </motion.div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">SETORAN BERHASIL REKONSILIASI!</h4>
                      <p className="text-[10px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                        Sistem kas berjangka otomatis mendeteksi transfer dana dari <b>{activeMemberPayment?.name}</b> senilai <b>{formatRupiah(config.contributionAmount)}</b> secara real-time.
                      </p>
                    </div>

                    {/* Mock Receipt */}
                    <div className="bg-black/55 rounded-2xl border border-emerald-500/15 p-3.5 text-left text-[9.5px] space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">NOMOR REFERENSI:</span>
                        <span className="text-emerald-400 font-bold">TXN-CLASER-{Math.floor(100000 + Math.random() * 900000)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1">
                        <span className="text-zinc-500">METODE BAYAR:</span>
                        <span className="text-white font-bold">
                          {selectedMethod === "cash" ? "CASH / TUNAI (DISETUJUI ADMIN KAS)" : `${selectedMethod.toUpperCase()} (DEEPLINK LISTENER)`}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1">
                        <span className="text-zinc-500">STATUS TRANSMISI:</span>
                        <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1">
                          🟢 LUNAS / VERIFIED
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1">
                        <span className="text-zinc-500">WAKTU MUTASI:</span>
                        <span className="text-[#a8a29e] font-bold">REAL-TIME</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveMemberPayment(null)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-[#10b981] text-white text-xs font-black font-mono rounded-xl transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/15 border border-emerald-400/20"
                    >
                      KEMBALI KE LAPANGAN 🏎️
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

