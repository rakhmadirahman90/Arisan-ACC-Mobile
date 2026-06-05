import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArisanHistory, Member, ArisanConfig, PaymentStatus } from "../types";
import { formatRupiah } from "../data";
import toast from "react-hot-toast";
import { exportToExcel, exportToPDF } from "../lib/exportUtils";
import { 
  History, 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign, 
  Award, 
  FileText, 
  TrendingUp, 
  Banknote, 
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Bot,
  Loader2,
  Wrench,
  Coins,
  MessageSquare
} from "lucide-react";

interface HistoryViewProps {
  history: ArisanHistory[];
  activeLivery: any;
  members?: Member[];
  config?: ArisanConfig;
  payments?: PaymentStatus[];
}

export default function HistoryView({ 
  history, 
  activeLivery,
  members,
  config,
  payments
}: HistoryViewProps) {
  // Tabs: "silsilah" (Original Winner list), "keuangan" (New Financial Recap), "ai-advisor" (New AI Financial Advisor)
  const [subTab, setSubTab] = useState<"silsilah" | "keuangan" | "ai-advisor">("silsilah");
  const [searchQuery, setSearchQuery] = useState("");

  const memberList = members || [];
  const activeConfig = config || { contributionAmount: 60000, currentRound: 11, totalRounds: 26, currentWinner: "" };
  const paymentsList = payments || [];

  // Sort history reverse to show newest first
  const sortedHistory = [...history].sort((a, b) => b.round - a.round);
  
  // Calculate aggregated stats
  const totalPaidOut = history.reduce((sum, h) => sum + h.prizeAmount, 0);
  const totalWinnersCount = history.length;

  // --- FINANCIAL BREAKDOWN MATHEMATICS ---
  const arisanShare = Math.round((activeConfig.contributionAmount * 5) / 6); // e.g. Rp 50.000,- (Arisan)
  const consumptionShare = activeConfig.contributionAmount - arisanShare; // e.g. Rp 10.000,- (Konsumsi)

  // 1. Past Completed Rounds math (Rounds 1 to 10)
  // Each history round is 100% lunas by all its participants
  const totalPastArisanCollected = totalPaidOut; // directly corresponds to sum of prizeAmount in history
  const totalPastConsumptionCollected = history.reduce((sum, h) => sum + (h.participantsCount * consumptionShare), 0);
  const totalPastGrandTotal = totalPastArisanCollected + totalPastConsumptionCollected;

  // 2. Current Round (Active kocokan)
  const currentRoundPayments = paymentsList.filter((p) => p.round === activeConfig.currentRound && p.isPaid);
  const paidCountCurrent = currentRoundPayments.length;
  
  const currentPaidArisan = paidCountCurrent * arisanShare;
  const currentPaidConsumption = paidCountCurrent * consumptionShare;
  const currentPaidTotal = paidCountCurrent * activeConfig.contributionAmount;

  // 3. Grand Combined Totals (Seeding + current)
  const grandTotalArisan = totalPastArisanCollected + currentPaidArisan;
  const grandTotalConsumption = totalPastConsumptionCollected + currentPaidConsumption;
  const grandTotalDanaTerkumpul = totalPastGrandTotal + currentPaidTotal; // All cash received in database

  // 4. Arrears & Unpaid stats for current round
  const unpaidCountCurrent = Math.max(0, memberList.length - paidCountCurrent);
  const currentUnpaidArisan = unpaidCountCurrent * arisanShare;
  const currentUnpaidConsumption = unpaidCountCurrent * consumptionShare;
  const currentUnpaidTotal = unpaidCountCurrent * activeConfig.contributionAmount;

  // Find paid & unpaid list for current round
  const paidMembersInCurrentRound = memberList.filter((m) =>
    currentRoundPayments.some((p) => p.memberId === m.id)
  );

  const unpaidMembersInCurrentRound = memberList.filter((m) =>
    !currentRoundPayments.some((p) => p.memberId === m.id)
  );

  // Search filtered rosters
  const filteredUnpaid = unpaidMembersInCurrentRound.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPaid = paidMembersInCurrentRound.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Remaining draws left
  const completedRounds = history.length;
  const remainingRounds = Math.max(0, activeConfig.totalRounds - completedRounds);

  // --- AI ADVISOR STATES ---
  const [selectedDriverId, setSelectedDriverId] = useState(() => {
    if (history.length > 0) {
      return history[0].winnerId;
    }
    return memberList[0]?.id || "";
  });

  const [aiCategory, setAiCategory] = useState<"umum" | "otomotif" | "traktir" | "custom">("umum");
  const [customPrompt, setCustomPrompt] = useState("");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<string>("");
  const [advisorSource, setAdvisorSource] = useState<string>("");
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);

  const LOADING_QUOTES = [
    "Menyetel kompresi keuangan...",
    "Mendiagnosis oli mesin berperforma tinggi...",
    "Merancang porsi traktiran kopi di Paddock...",
    "Mengkalibrasi rasio tabungan darurat...",
    "Merancang rute konvoi Claser yang aman..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (advisorLoading) {
      interval = setInterval(() => {
        setLoadingQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [advisorLoading]);

  // Handle active selected driver change based on history trigger or dropdown change
  const handleGetAdvisorResponse = async () => {
    const driver = memberList.find((m) => m.id === selectedDriverId);
    if (!driver) return;

    setAdvisorLoading(true);
    setAdvisorError(null);
    setAdvisorResponse("");

    const prizeValue = memberList.length * arisanShare;

    try {
      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerName: driver.name,
          vehicle: driver.vehicle,
          prizeAmount: prizeValue,
          category: aiCategory === "umum" ? "Umum" : aiCategory === "otomotif" ? "modern" : aiCategory === "traktir" ? "Traktiran & Solidaritas" : "Custom",
          customPrompt: aiCategory === "custom" ? customPrompt : ""
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAdvisorResponse(data.text);
        setAdvisorSource(data.source);
      } else {
        setAdvisorError("Gagal mengambil data advisor dari server. Skenario template luring gagal.");
      }
    } catch (err) {
      console.error("Client Advisor query error:", err);
      setAdvisorError("Koneksi gagal atau rute server terinterupsi.");
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Safe and clean custom Markdown formatter
  function renderMarkdownCompact(text: string) {
    if (!text) return null;
    
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-[10.5px] leading-relaxed text-zinc-300">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Headers: e.g. ### Header
          if (trimmed.startsWith("###")) {
            const headerText = trimmed.replace("###", "").trim();
            return (
              <h4 key={idx} className="text-[11.5px] font-black text-white mt-3 mb-1 flex items-center gap-1 border-b border-white/5 pb-1 font-sans uppercase tracking-tight">
                🏁 {headerText}
              </h4>
            );
          }
          if (trimmed.startsWith("##")) {
            const headerText = trimmed.replace("##", "").trim();
            return (
              <h4 key={idx} className="text-[12.5px] font-black text-white mt-4 mb-2 font-sans uppercase tracking-wide">
                🔥 {headerText}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            const bulletText = trimmed.substring(1).trim();
            return (
              <div key={idx} className="flex gap-2 items-start pl-1 my-1">
                <span className="text-emerald-400 mt-1">✦</span>
                <p className="flex-1 text-[10px]">{parseBoldText(bulletText)}</p>
              </div>
            );
          }

          // Numeric bullets (e.g. 1. item)
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            const num = numMatch[1];
            const textPart = numMatch[2];
            return (
              <div key={idx} className="flex gap-2 items-start pl-1 my-1 bg-white/5 p-2 rounded-xl border border-white/5">
                <span className={`w-4 h-4 rounded-full ${activeLivery.bgPill} border ${activeLivery.borderAccent} ${activeLivery.textAccent} font-bold text-[8.5px] flex items-center justify-center shrink-0 mt-0.5`}>
                  {num}
                </span>
                <p className="flex-1 text-[10px] font-sans">{parseBoldText(textPart)}</p>
              </div>
            );
          }

          return <p key={idx} className="text-[10px] pl-0.5 leading-snug">{parseBoldText(trimmed)}</p>;
        })}
      </div>
    );
  }

  function parseBoldText(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className={`font-black ${activeLivery.textAccent} font-sans`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  const activeWinner = memberList.find((m) => m.id === selectedDriverId);
  const potentialPrize = memberList.length * arisanShare;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c]">
      
      {/* Tab Switcher */}
      <div className="px-5 pt-4 shrink-0">
        <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-0.5">
          <button
            type="button"
            onClick={() => setSubTab("silsilah")}
            className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-mono font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === "silsilah"
                ? `bg-gradient-to-r ${activeLivery.btnGrad} text-white shadow-md`
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            DATA ARISAN
          </button>
          
          <button
            type="button"
            onClick={() => setSubTab("keuangan")}
            className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-mono font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === "keuangan"
                ? `bg-gradient-to-r ${activeLivery.btnGrad} text-white shadow-md`
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 shrink-0" />
            REKAP
          </button>

          <button
            type="button"
            onClick={() => setSubTab("ai-advisor")}
            className={`flex-1 py-1.5 rounded-lg text-[9.5px] font-mono font-black uppercase transition flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === "ai-advisor"
                ? `bg-gradient-to-r ${activeLivery.btnGrad} text-white shadow-md`
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            AI ADVISOR
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[62vh] px-5 pb-24 pt-3 scrollbar-none font-sans">
        <AnimatePresence mode="wait">
          {subTab === "silsilah" && (
            <motion.div
              key="silsilah-pane"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Visual Aggregation Stats Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3 overflow-hidden relative">
                  <div className="absolute right-0 bottom-0 opacity-5">
                    <DollarSign className="w-16 h-16 text-zinc-100" />
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                    Total Jackpot Cair
                  </div>
                  <div className={`text-xs font-black ${activeLivery.textAccent} font-mono mt-0.5`}>
                    {formatRupiah(totalPaidOut)}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3 overflow-hidden relative">
                  <div className="absolute right-0 bottom-0 opacity-5">
                    <Trophy className="w-16 h-16 text-zinc-100" />
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                    Total Pembalap Menang
                  </div>
                  <div className="text-xs font-black text-zinc-100 font-mono mt-0.5">
                    {totalWinnersCount} <span className="text-[9px] text-zinc-500 font-normal">Suku</span>
                  </div>
                </div>
              </div>

              {/* History Timeline block */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2 px-1">
                  <History className="w-4 h-4 text-zinc-500" />
                  Data Arisan Pemenang
                </h3>

                <div className="space-y-3 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                  {sortedHistory.length > 0 ? (
                     sortedHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex gap-4 relative font-sans"
                      >
                        {/* Timeline Node Icon */}
                        <div className={`w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 z-10 ${activeLivery.textAccent} font-mono text-xs font-bold shadow-md`}>
                          R{item.round}
                        </div>

                        {/* Log Details Card */}
                        <div className="flex-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-extrabold text-zinc-100 truncate">
                                {item.winnerName}
                              </h4>
                              <Award className={`w-3 h-3 ${activeLivery.textAccent} shrink-0`} />
                            </div>
                            <p className="text-[9px] text-zinc-400 truncate mt-0.5 font-medium">
                              🚙 {item.winnerVehicle}
                            </p>
                            
                            <div className="flex items-center gap-2 text-[8px] text-zinc-500 font-mono mt-1.5">
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-2 h-2" />
                                {item.drawnAt}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Users className="w-2 h-2" />
                                {item.participantsCount} kuota
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-1">
                            <span className={`text-[11px] font-black ${activeLivery.textAccent} font-mono block`}>
                              {formatRupiah(item.prizeAmount)}
                            </span>
                            <div className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1 py-0.5 rounded font-mono font-bold mt-1 inline-block uppercase tracking-wider">
                              Lunas Cair
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center bg-black/25 border border-white/5 rounded-xl p-6 text-zinc-650 text-xs font-mono ml-4">
                      🏁 Belum ada putaran selesai. Ayo gas kocokan pertamamu!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {subTab === "keuangan" && (
            <motion.div
              key="keuangan-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-left"
            >
              
              {/* COMPREHENSIVE CASH GRADIENT HERO */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-950 via-[#0a1122] to-zinc-950 border border-white/15 relative overflow-hidden shadow-lg">
                <div className="absolute -right-3 -top-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
                <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  💰 Total Rekapitulasi Dana Masuk
                </p>
                <h2 className="text-2xl font-mono font-black text-[#10b981] tracking-tight mt-1">
                  {formatRupiah(grandTotalDanaTerkumpul)}
                </h2>
                <div className="text-[9px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                  <span>Sirkulasi kumulatif dari Putaran 1 s.d {activeConfig.currentRound}</span>
                </div>

                {/* Arisan & Consumption Shares */}
                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-white/5">
                  <div className="bg-black/30 px-2 py-1.5 rounded-xl border border-white/5">
                    <span className="text-[7.5px] text-zinc-500 font-mono uppercase block">Dana Arisan</span>
                    <strong className="text-[10px] font-mono font-black text-white">{formatRupiah(grandTotalArisan)}</strong>
                    <span className="block text-[7.5px] text-emerald-400 font-mono mt-0.5">Rp {arisanShare.toLocaleString("id-ID")} x {completedRounds * memberList.length + paidCountCurrent} lunas</span>
                  </div>
                  <div className="bg-black/30 px-2 py-1.5 rounded-xl border border-white/5">
                    <span className="text-[7.5px] text-zinc-500 font-mono uppercase block">Dana Konsumsi</span>
                    <strong className="text-[10px] font-mono font-black text-amber-400">{formatRupiah(grandTotalConsumption)}</strong>
                    <span className="block text-[7.5px] text-amber-500/80 font-mono mt-0.5">Rp {consumptionShare.toLocaleString("id-ID")} x {completedRounds * memberList.length + paidCountCurrent} lunas</span>
                  </div>
                </div>
              </div>

              {/* EXPORT ACTION DECK */}
              <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-[0.02]">
                  <FileText className="w-24 h-24 text-zinc-100" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[10.5px] font-black uppercase text-zinc-200 font-sans flex items-center gap-1.5 leading-none">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Unduh Rekap Laporan Lengkap
                  </h3>
                  <p className="text-[9px] text-zinc-400 leading-tight">
                    Cetak pembukuan arisan format resmi PDF atau Excel siap dibagikan ke grup Whatsapp Kopdar.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      exportToExcel({
                        history,
                        members: memberList,
                        config: activeConfig as ArisanConfig,
                        payments: paymentsList,
                      });
                      toast.success("Berhasil mengunduh rekap Excel!");
                    }}
                    className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-black px-3 py-2 rounded-xl transition duration-150"
                  >
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToPDF({
                        history,
                        members: memberList,
                        config: activeConfig as ArisanConfig,
                        payments: paymentsList,
                      });
                      toast.success("Berhasil mengunduh rekap PDF!");
                    }}
                    className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-400 font-mono text-[9px] font-black px-3 py-2 rounded-xl transition duration-150"
                  >
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              </div>

              {/* CURRENT ROUND SUMMARY HEADER */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3 font-sans">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-[8.5px] font-black font-mono px-1.5 py-0.5 rounded ${activeLivery.bgPill} ${activeLivery.textPill} border ${activeLivery.borderAccent} uppercase`}>
                      PUTARAN {activeConfig.currentRound}
                    </span>
                    <h4 className="text-xs font-black text-white mt-1">Status Pembayaran Aktif</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold">
                      {paidCountCurrent} / {memberList.length} LUNAS
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">
                      {unpaidCountCurrent} belum bayar
                    </span>
                  </div>
                </div>

                {/* Progress bar representing paying progress for current round */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${(paidCountCurrent / Math.max(1, memberList.length)) * 100}%` }}
                  ></div>
                </div>

                {/* Current Round Receivables Pending */}
                <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[8px] text-zinc-500 font-mono uppercase block leading-none">Piutang Menunggu (Sisa Putaran Ini)</span>
                      <strong className="text-[10.5px] font-mono text-amber-400 font-bold block mt-1">
                        {formatRupiah(currentUnpaidTotal)}
                      </strong>
                    </div>
                  </div>
                  <div className="text-right text-[7.5px] font-mono text-zinc-500 leading-tight">
                    <div>Pembalap Unpaid:</div>
                    <div className="text-zinc-300 font-bold">{unpaidCountCurrent} @ {formatRupiah(activeConfig.contributionAmount)}</div>
                  </div>
                </div>
              </div>

              {/* SEARCH FILTER FOR TRANSPARENCY CHECKLIST */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                    🔎 Transparansi Anggota Pembayaran
                  </h3>
                  <span className="text-[8px] font-mono text-zinc-500">Kocokan R{activeConfig.currentRound}</span>
                </div>

                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari nama pembalap kopdar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 text-[10.5px] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[#f4f4f5] focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-650"
                  />
                </div>

                {/* UNPAID/PAID ACCORDIAN TABS */}
                <div className="space-y-3 pt-1">
                  
                  {/* Category: BELUM LUNAS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] text-[#f43f5e] font-mono font-bold uppercase tracking-wider px-1">
                      <span>❌ BELUM BAYAR ({unpaidMembersInCurrentRound.length})</span>
                      <span>Piutang: {formatRupiah(currentUnpaidTotal)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto scrollbar-none pr-0.5">
                      {filteredUnpaid.length > 0 ? (
                        filteredUnpaid.map((m) => (
                          <div 
                            key={m.id}
                            className="bg-[#ffe4e6]/5 border border-red-500/10 rounded-xl p-2 flex justify-between items-center gap-2 hover:bg-[#ffe4e6]/10 transition"
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-zinc-200 truncate">{m.name}</p>
                              <p className="text-[7.5px] text-zinc-500 font-mono truncate">{m.vehicle}</p>
                            </div>
                            <span className="text-[9px] text-[#f43f5e] font-mono font-bold shrink-0">
                              {formatRupiah(activeConfig.contributionAmount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8.5px] font-mono text-zinc-650 text-center py-2 italic">
                          {searchQuery ? "Tidak ditemukan pembalap belum bayar." : "🎉 SENGIT! Semua pembalap di putaran ini telah lunas!"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category: SUDAH LUNAS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] text-[#10b981] font-mono font-bold uppercase tracking-wider px-1">
                      <span>✔ LUNAS ({paidMembersInCurrentRound.length})</span>
                      <span>Masuk: {formatRupiah(currentPaidTotal)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto scrollbar-none pr-0.5">
                      {filteredPaid.length > 0 ? (
                        filteredPaid.map((m) => {
                          const pObj = currentRoundPayments.find((p) => p.memberId === m.id);
                          return (
                            <div 
                              key={m.id}
                              className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex justify-between items-center gap-2 hover:bg-emerald-500/10 transition"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-zinc-200 truncate">{m.name}</p>
                                <p className="text-[7.5px] text-zinc-500 font-mono truncate">📅 {pObj?.paidAt || "01 Jun 2026"}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] text-emerald-400 font-mono font-extrabold block">
                                  {formatRupiah(activeConfig.contributionAmount)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[8.5px] font-mono text-zinc-650 text-center py-2 italic">
                          {searchQuery ? "Tidak ditemukan pembalap lunas." : "Belum ada pembayaran yang masuk di putaran ini."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL ROUND-BY-ROUND PAYMENT RECAP */}
              <div className="space-y-2 pt-1">
                <h3 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5 px-1">
                  📊 Laporan Per Putaran & Sisa Arisan
                </h3>

                <div className="space-y-2">
                  
                  {/* Active Round Card Ledger */}
                  <div className="bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        PUTARAN {activeConfig.currentRound} (AKTIF SEKARANG)
                      </span>
                      <span className="text-[8.5px] text-zinc-400 font-bold font-mono">
                        {paidCountCurrent}/{memberList.length} Pembalap
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono text-zinc-400 pt-1">
                      <div>
                        <span className="text-zinc-500 block uppercase text-[7.5px]">Arisan Terkumpul:</span>
                        <strong className="text-zinc-200">{formatRupiah(currentPaidArisan)}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase text-[7.5px]">Konsumsi Terkumpul:</span>
                        <strong className="text-zinc-200">{formatRupiah(currentPaidConsumption)}</strong>
                      </div>
                    </div>
                    
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[8px] font-mono text-zinc-400">
                      <span>Sisa kas yg belum bayar:</span>
                      <span className="text-red-400 font-bold">{formatRupiah(currentUnpaidTotal)}</span>
                    </div>
                  </div>

                  {/* Historical Rounds Ledgers */}
                  {history.map((h) => {
                    const rArisan = h.prizeAmount; // total prize which is participants * 50k
                    const rConsum = h.participantsCount * consumptionShare; // 26 members * 10k
                    return (
                      <div 
                        key={h.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5 hover:border-white/15 transition relative"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-black text-zinc-400">
                            PUTARAN {h.round} • {h.winnerName} 👑
                          </span>
                          <span className="text-[8px] text-emerald-400 font-bold font-mono bg-emerald-500/10 border border-emerald-500/15 px-1 py-0.5 rounded uppercase">
                            100% LUNAS
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-zinc-400">
                          <div>
                            <span className="text-zinc-500 uppercase block text-[7px]">Arisan Lunas:</span>
                            <span className="text-zinc-300 font-bold">{formatRupiah(rArisan)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 uppercase block text-[7px]">Konsumsi Lunas:</span>
                            <span className="text-zinc-300 font-bold">{formatRupiah(rConsum)}</span>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-1.5 flex justify-between text-[7.5px] font-mono text-zinc-500">
                          <span>Ditarik pada {h.drawnAt}</span>
                          <span>{h.participantsCount}/{h.participantsCount} Pembalap</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Estimated Remaining Rounds Summary */}
                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl font-sans text-center relative overflow-hidden">
                    <div className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-1 col-span-2">
                      🔮 SISA TIMELINE PUTARAN LAINNYA
                    </div>
                    <p className="text-[9.5px] text-zinc-400 leading-relaxed font-sans px-1">
                      Ada <strong className="text-white font-mono">{remainingRounds} putaran lagi</strong> yang belum kumpul, dengan total kuota tersisa sebanyak <strong className="text-white font-mono">{remainingRounds * memberList.length} partisipasi</strong> yang akan terus digulirkan sampai Putaran {activeConfig.totalRounds}.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {subTab === "ai-advisor" && (
            <motion.div
              key="ai-advisor-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-left"
            >
              {/* BRAND HEADER CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-[#0d1222] to-zinc-950 border border-white/10 relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${activeLivery.btnGrad} text-white`}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[12px] font-black text-white uppercase tracking-tight">Claser AI Financial Advisor</h2>
                    <p className="text-[8.5px] text-zinc-400 font-mono">Modification & Money Planner</p>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-300 leading-relaxed font-sans">
                  Pemenang arisan kocokan berhak berkonsultasi seputar strategi alokasi uang rupiah agar tetap hoki, dompet sehat, dan agenda modifikasi kendaraan seimbang!
                </p>
              </div>

              {/* INPUT FORM DECK */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
                <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  🔧 Parameter Konsultasi Keuangan
                </p>

                {/* Dropdown Driver */}
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 font-mono uppercase block">Pilih Pembalap Berjaya (Nama Naik)</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-black/60 text-[10.5px] text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {memberList.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.wonRound ? `Round ${m.wonRound} Winner` : `Belum Naik`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info Box derived from active driver details */}
                {activeWinner && (
                  <div className="bg-black/35 p-2.5 rounded-xl border border-white/5 divide-y divide-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[8.5px]">
                      <span className="text-zinc-500 font-mono">Unit Kendaraan:</span>
                      <strong className="text-zinc-200">🚙 {activeWinner.vehicle}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[8.5px] pt-1.5">
                      <span className="text-zinc-500 font-mono font-bold">Uang Arisan Cair:</span>
                      <strong className={`font-mono text-emerald-400 font-black`}>
                        {formatRupiah(potentialPrize)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Choose Strategy Category Tabs */}
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 font-mono uppercase block mb-1">Pilih Sudut Pandang AI</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAiCategory("umum")}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold font-mono transition flex items-center gap-1 border ${
                        aiCategory === "umum"
                          ? `${activeLivery.bgPill} ${activeLivery.textPill} ${activeLivery.borderAccent}`
                          : "bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60"
                      }`}
                    >
                      <Coins className="w-3 h-3 text-amber-400" />
                      Umum & Bijak
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiCategory("otomotif")}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold font-mono transition flex items-center gap-1 border ${
                        aiCategory === "otomotif"
                          ? `${activeLivery.bgPill} ${activeLivery.textPill} ${activeLivery.borderAccent}`
                          : "bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60"
                      }`}
                    >
                      <Wrench className="w-3 h-3 text-blue-400" />
                      Modif Sehat
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiCategory("traktir")}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold font-mono transition flex items-center gap-1 border ${
                        aiCategory === "traktir"
                          ? `${activeLivery.bgPill} ${activeLivery.textPill} ${activeLivery.borderAccent}`
                          : "bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60"
                      }`}
                    >
                      <Users className="w-3 h-3 text-[#10b981]" />
                      Solidaritas Club
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiCategory("custom")}
                      className={`py-1.5 px-2 rounded-lg text-[9px] font-bold font-mono transition flex items-center gap-1 border ${
                        aiCategory === "custom"
                          ? `${activeLivery.bgPill} ${activeLivery.textPill} ${activeLivery.borderAccent}`
                          : "bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60"
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-fuchsia-400" />
                      Custom Tanya
                    </button>
                  </div>
                </div>

                {/* Custom Prompt Context for Custom Mode */}
                {aiCategory === "custom" && (
                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-400 font-mono uppercase block">Pertanyaan Khusus Anda</label>
                    <textarea
                      placeholder="e.g. Saya ingin beli ban radial baru seharga Rp 800 ribu, sisa dananya lebih baik ditaruh reksa dana mana ya?"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full h-14 bg-black/50 text-[9.5px] border border-white/10 rounded-xl p-2 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                    />
                  </div>
                )}

                {/* Trigger Request button */}
                <button
                  type="button"
                  onClick={handleGetAdvisorResponse}
                  disabled={advisorLoading}
                  className={`w-full py-2 bg-gradient-to-r ${activeLivery.btnGrad} text-white font-mono font-black text-[10px] rounded-xl flex items-center justify-center gap-2 relative overflow-hidden transition shadow-lg cursor-pointer ${
                    advisorLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {advisorLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                      <span>{LOADING_QUOTES[loadingQuoteIndex]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                      <span>MINTA REKOMENDASI CLASER AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* RESPONSE PANEL DISPLAY */}
              <AnimatePresence mode="wait">
                {(advisorResponse || advisorError) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
                  >
                    {/* Ambient visual badge on source */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                        <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Rekomendasi Terbit</span>
                      </div>
                      <span className="text-[7.5px] bg-white/5 text-zinc-400 border border-white/10 rounded px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider scale-95 shrink-0">
                        {advisorSource || "Offline Mode"}
                      </span>
                    </div>

                    {/* Logic Error Prompt */}
                    {advisorError ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-center text-red-400 font-sans text-[10px] space-y-1">
                        <AlertCircle className="w-4 h-4 mx-auto text-red-400" />
                        <p className="font-bold">{advisorError}</p>
                      </div>
                    ) : (
                      // Renders Markdown beautifully
                      <div className="font-sans text-left leading-relaxed">
                        {renderMarkdownCompact(advisorResponse)}
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-500 leading-none">
                      <span>*Rekomendasi bersifat saran hobi & finansial.</span>
                      <span>Putaran {activeConfig.currentRound}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
