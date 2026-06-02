import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import MembersView from "./components/MembersView";
import RaffleView from "./components/RaffleView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import OpeningIntro from "./components/OpeningIntro";
import { Member, ArisanConfig, PaymentStatus, ArisanHistory } from "./types";
import { 
  INITIAL_MEMBERS, 
  INITIAL_CONFIG, 
  INITIAL_PAYMENTS, 
  INITIAL_HISTORY,
  formatRupiah,
  LIVERY_THEMES
} from "./data";
import { 
  Home, 
  Users, 
  Gauge, 
  Trophy, 
  SlidersHorizontal,
  Car
} from "lucide-react";

// Clear old local cache values once to update everyone to the new clean Round 1 starting state
if (typeof window !== "undefined" && !localStorage.getItem("claser_v1_reset_reborn_v2")) {
  localStorage.removeItem("claser_members");
  localStorage.removeItem("claser_config");
  localStorage.removeItem("claser_payments");
  localStorage.removeItem("claser_history");
  localStorage.setItem("claser_v1_reset_reborn_v2", "true");
}

export default function App() {
  // --- STATE PERSISTENCE CLIENT-SIDE ---
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem("claser_members");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Member[];
        if (parsed.some((m) => m.name.includes("Adrian")) || parsed.length !== INITIAL_MEMBERS.length) {
          localStorage.removeItem("claser_members");
          localStorage.removeItem("claser_config");
          localStorage.removeItem("claser_payments");
          localStorage.removeItem("claser_history");
          return INITIAL_MEMBERS;
        }
        return parsed;
      } catch (e) {
        return INITIAL_MEMBERS;
      }
    }
    return INITIAL_MEMBERS;
  });

  const [config, setConfig] = useState<ArisanConfig>(() => {
    const saved = localStorage.getItem("claser_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.meetupLocationName || !parsed.meetupMapQuery) {
          return {
            ...INITIAL_CONFIG,
            ...parsed,
            meetupLocationName: parsed.meetupLocationName || INITIAL_CONFIG.meetupLocationName,
            meetupAddress: parsed.meetupAddress || INITIAL_CONFIG.meetupAddress,
            meetupMapQuery: parsed.meetupMapQuery || INITIAL_CONFIG.meetupMapQuery || "-6.534289,106.879432",
            meetupTime: parsed.meetupTime || INITIAL_CONFIG.meetupTime,
            meetupImage: parsed.meetupImage || INITIAL_CONFIG.meetupImage
          };
        }
        return parsed;
      } catch (e) {
        return INITIAL_CONFIG;
      }
    }
    return INITIAL_CONFIG;
  });

  const [payments, setPayments] = useState<PaymentStatus[]>(() => {
    const saved = localStorage.getItem("claser_payments");
    if (localStorage.getItem("claser_members") === null) {
      return INITIAL_PAYMENTS;
    }
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [history, setHistory] = useState<ArisanHistory[]>(() => {
    const saved = localStorage.getItem("claser_history");
    if (localStorage.getItem("claser_members") === null) {
      return INITIAL_HISTORY;
    }
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "anggota" | "kocok" | "riwayat" | "setelan">("dashboard");

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem("claser_is_admin");
    return saved === "true";
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const viewed = sessionStorage.getItem("acc_intro_viewed");
      return viewed !== "true";
    }
    return true;
  });

  const handleSetAdmin = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem("claser_is_admin", val ? "true" : "false");
  };

  // Save changes automatically
  useEffect(() => {
    localStorage.setItem("claser_members", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("claser_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("claser_payments", JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem("claser_history", JSON.stringify(history));
  }, [history]);

  // --- ACTIONS & HANDLERS ---

  // Add Member
  const handleAddMember = (m: Omit<Member, "id" | "joinDate" | "wonRound">) => {
    const newId = `mem-${Date.now()}`;
    const newMember: Member = {
      ...m,
      id: newId,
      joinDate: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      wonRound: null,
    };

    setMembers([...members, newMember]);
    
    // Auto-create payment entry of false for this round
    const newPayment: PaymentStatus = {
      memberId: newId,
      round: config.currentRound,
      isPaid: false,
    };
    setPayments([...payments, newPayment]);
  };

  // Delete Member
  const handleDeleteMember = (id: string) => {
    if (confirm("Keluarkan unit claser ini dari keanggotaan arisan?")) {
      setMembers(members.filter((m) => m.id !== id));
      setPayments(payments.filter((p) => p.memberId !== id));
    }
  };

  // Toggle Payment for a specific member in the current round
  const handleTogglePayment = (memberId: string) => {
    const round = config.currentRound;
    const existingIndex = payments.findIndex(
      (p) => p.memberId === memberId && p.round === round
    );

    if (existingIndex > -1) {
      // Toggle
      const updated = [...payments];
      updated[existingIndex] = {
        ...updated[existingIndex],
        isPaid: !updated[existingIndex].isPaid,
        paidAt: !updated[existingIndex].isPaid 
          ? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) 
          : undefined,
      };
      setPayments(updated);
    } else {
      // Create new
      const newPay: PaymentStatus = {
        memberId,
        round,
        isPaid: true,
        paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      };
      setPayments([...payments, newPay]);
    }
  };

  // Admin Instant Payout Utility (Lunas semua)
  const handleInstantPayAll = () => {
    const round = config.currentRound;
    const updatedPayments = [...payments];

    members.forEach((m) => {
      const idx = updatedPayments.findIndex(
        (p) => p.memberId === m.id && p.round === round
      );
      if (idx > -1) {
        updatedPayments[idx] = {
          ...updatedPayments[idx],
          isPaid: true,
          paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        };
      } else {
        updatedPayments.push({
          memberId: m.id,
          round,
          isPaid: true,
          paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        });
      }
    });

    setPayments(updatedPayments);
  };

  // Confirm raffle winner & transition rounds
  const handleConfirmWinner = (winnerId: string, prizeAmount: number) => {
    const winnerMember = members.find((m) => m.id === winnerId);
    if (!winnerMember) return;

    // 1. Mark winner in member database
    setMembers(
      members.map((m) =>
        m.id === winnerId ? { ...m, wonRound: config.currentRound } : m
      )
    );

    // 2. Add log entry to history
    const newHistory: ArisanHistory = {
      id: `hist-${Date.now()}`,
      round: config.currentRound,
      winnerId,
      winnerName: winnerMember.name,
      winnerVehicle: winnerMember.vehicle,
      drawnAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      prizeAmount,
      participantsCount: members.length,
    };
    setHistory([...history, newHistory]);

    // 3. Auto-increment current round settings & set next payments schema
    const nextRound = config.currentRound + 1;
    setConfig({
      ...config,
      currentRound: nextRound,
    });

    // 4. Prime empty payments list for the next round
    const nextRoundPayments: PaymentStatus[] = members.map((m) => ({
      memberId: m.id,
      round: nextRound,
      isPaid: false,
    }));
    setPayments([...payments, ...nextRoundPayments]);

    // Go to history tab to reflect victory
    setActiveTab("riwayat");
  };

  // General Setup updates
  const handleUpdateConfig = (newConfig: Partial<ArisanConfig>) => {
    setConfig({
      ...config,
      ...newConfig,
    });
  };

  // Danger wipe out
  const handleResetData = () => {
    const resetMembers = INITIAL_MEMBERS.map((m) => ({
      ...m,
      wonRound: null,
    }));
    const resetConfig = {
      ...INITIAL_CONFIG,
      currentRound: 1,
    };
    const resetPayments = INITIAL_MEMBERS.map((m) => ({
      memberId: m.id,
      round: 1,
      isPaid: false,
    }));

    setMembers(resetMembers);
    setConfig(resetConfig);
    setPayments(resetPayments);
    setHistory([]);
    setActiveTab("dashboard");
  };

  // Backup file exporter
  const handleExportData = () => {
    const dataObj = { members, config, payments, history };
    const jsonString = JSON.stringify(dataObj, null, 2);
    
    // Create direct copyable clipboard or down-folder text popup
    navigator.clipboard.writeText(jsonString);
    alert("Berhasil mengeksekusi ekspor! Seluruh data JSON berhasil disalin ke papan klip (clipboard) Anda. Anda dapat menyimpannya di catatan aman.");
  };

  // Backup file importer
  const handleImportData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.members && parsed.config && parsed.payments && parsed.history) {
        setMembers(parsed.members);
        setConfig(parsed.config);
        setPayments(parsed.payments);
        setHistory(parsed.history);
        setActiveTab("dashboard");
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Dynamic side panel statistics calculations
  const arisanShare = Math.round((config.contributionAmount * 5) / 6);
  const consumptionShare = config.contributionAmount - arisanShare;

  const totalPaidOut = history.reduce((sum, h) => sum + h.prizeAmount, 0);
  const currentRoundPayments = payments.filter((p) => p.round === config.currentRound && p.isPaid);
  const currentPotSum = currentRoundPayments.length * arisanShare;
  const currentConsumptionSum = currentRoundPayments.length * consumptionShare;
  const grandTotalPool = totalPaidOut + currentPotSum;

  const nextEventDate = config.nextDrawDate 
    ? new Date(config.nextDrawDate).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short"
      })
    : "TBC";

  // Compute dynamic recent activity stream
  const dynamicLogs = [
    ...history.map(h => ({
      text: `${h.winnerName} won Rp ${(h.prizeAmount / 1000).toFixed(0)}k`,
      time: h.drawnAt,
      type: "win"
    })),
    ...currentRoundPayments.map(p => {
      const match = members.find(m => m.id === p.memberId);
      return {
        text: `${match ? match.name : "Driver"} paid dues`,
        time: p.paidAt || "Baru saja",
        type: "pay"
      };
    })
  ].reverse().slice(0, 4);

  const activeLivery = LIVERY_THEMES[config.livery || "blue"] || LIVERY_THEMES.blue;

  return (
    <div 
      className="min-h-screen w-full bg-[#020203] text-slate-200 font-sans flex items-center justify-center p-4 lg:p-8 select-none relative overflow-x-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, #0a111a 0%, #020203 100%)" }}
    >
      {showIntro && (
        <OpeningIntro
          onComplete={() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("acc_intro_viewed", "true");
            }
            setShowIntro(false);
          }}
          activeLivery={activeLivery}
        />
      )}

      {/* Decorative ambient flares from the original setup, adjusted for space tone */}
      <div className={`absolute top-10 left-10 w-96 h-96 ${activeLivery.ambientFlare1} rounded-full blur-3xl pointer-events-none`}></div>
      <div className={`absolute bottom-10 right-10 w-96 h-96 ${activeLivery.ambientFlare2} rounded-full blur-3xl pointer-events-none`}></div>

      {/* Main Container embracing sidebars + phone */}
      <div className="flex flex-row items-center justify-center gap-8 lg:gap-12 w-full max-w-5xl">
        
        {/* LEFT DOCK SIDEBAR (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex flex-col gap-5 w-64 shrink-0 transition-all duration-300">
          
          {/* Club Status Indicator */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <p className={`text-[10px] uppercase tracking-widest ${activeLivery.textAccent} font-bold mb-2 font-mono`}>
              Club Status
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${activeLivery.bgPill} flex items-center justify-center border ${activeLivery.borderAccent} shadow-md`}>
                <span className={`font-bold text-xs ${activeLivery.textAccent}`}>✓</span>
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">Verified Club</p>
                <p className="text-[10px] text-zinc-500 font-mono">Auto Claser ID: 492</p>
              </div>
            </div>
          </div>

          {/* Dynamic Pool Cash Amount */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3 font-sans">
            <div>
              <p className={`text-[10px] uppercase tracking-widest ${activeLivery.textAccent} font-bold mb-1 font-mono`}>
                Paddock Jackpot (Arisan)
              </p>
              <p className="text-lg font-mono font-black text-white tracking-tight">
                {formatRupiah(currentPotSum)}
              </p>
              <p className="text-[9px] text-zinc-500 font-mono">
                Rp {arisanShare.toLocaleString("id-ID")} per pembalap lunas
              </p>
            </div>
            <div className="border-t border-white/5 pt-2.5">
              <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1 font-mono">
                Uang Konsumsi Kopdar
              </p>
              <p className="text-sm font-mono font-black text-white tracking-tight">
                {formatRupiah(currentConsumptionSum)}
              </p>
              <p className="text-[9px] text-zinc-500 font-mono">
                Rp {consumptionShare.toLocaleString("id-ID")} per pembalap lunas
              </p>
            </div>
          </div>

          {/* Next Speed meetup / draw schedules */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1.5 font-mono">
              Target Agenda
            </p>
            <p className="text-xs font-black text-white">Kopdar Claser Senayan</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
              {nextEventDate} • 14:00 WIB
            </p>
          </div>

          {/* Admin Control Sidebar Card */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[#a8a29e] font-bold mb-1 font-mono flex items-center justify-between">
              <span>Admin Control</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" : "bg-zinc-650"}`}></span>
            </p>
            {isAdmin ? (
              <div className="space-y-2 font-sans">
                <p className={`text-xs font-bold ${activeLivery.textAccent} font-mono`}>✓ MARSHALL ON</p>
                <p className="text-[9.5px] text-zinc-400 leading-tight">Akses penuh bypass hitung mundur & ganti tanggal/jam putar.</p>
                <button
                  onClick={() => handleSetAdmin(false)}
                  className="w-full py-1 text-center bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 hover:bg-red-500/20 font-bold transition font-mono cursor-pointer"
                >
                  LOGOUT ADMIN
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 font-sans">
                <p className="text-[9.5px] text-zinc-400 leading-tight">Konfigurasi jadwal balap & aktifkan mesin kocok.</p>
                <div className="flex gap-1">
                  <input
                    type="password"
                    placeholder="Sandi Admin"
                    id="sidebar-admin-pwd"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value;
                        if (val === "admin123") {
                          handleSetAdmin(true);
                          (e.target as HTMLInputElement).value = "";
                        } else {
                          alert("Sandi Admin Salah! Bantuan: 'admin123'");
                        }
                      }
                    }}
                    className="flex-1 bg-black/40 border border-white/15 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("sidebar-admin-pwd") as HTMLInputElement;
                      if (input) {
                        const val = input.value;
                        if (val === "admin123") {
                          handleSetAdmin(true);
                          input.value = "";
                        } else {
                          alert("Sandi Admin Salah! Bantuan: 'admin123'");
                        }
                      }
                    }}
                    className={`px-2.5 py-1 bg-gradient-to-r ${activeLivery.btnGrad} text-white font-bold text-[10px] rounded font-mono transition cursor-pointer`}
                  >
                    GO
                  </button>
                </div>
                <p className="text-[8.5px] text-zinc-500 italic font-mono text-center">Petunjuk: admin123</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER MOBILE SIMULATOR */}
        <div className="w-[360px] h-[740px] bg-[#0a0a0c] rounded-[48px] border-[10px] border-[#1a1a1e] shadow-[0_10px_70px_rgba(0,0,0,0.85)] overflow-hidden relative flex flex-col justify-between select-none shrink-0 hover:border-[#222228] transition-colors duration-300">
          
          {/* Device camera lens cover decoration */}
          <div className="absolute left-[34%] top-5 w-3 h-3 bg-zinc-900 border border-zinc-800 rounded-full z-50"></div>
          
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
            
            {/* Header Bar Area */}
            <Header />

            {/* Active Router Frame */}
            <div className="flex-1 overflow-hidden relative bg-[#0a0a0c]">
              <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-neutral-950/40"></div>
              
              {activeTab === "dashboard" && (
                <DashboardView
                  members={members}
                  config={config}
                  payments={payments}
                  history={history}
                  onNavigateToKocokan={() => setActiveTab("kocok")}
                  onTogglePayment={handleTogglePayment}
                  activeLivery={activeLivery}
                />
              )}

              {activeTab === "anggota" && (
                <MembersView
                  members={members}
                  onAddMember={handleAddMember}
                  onDeleteMember={handleDeleteMember}
                  activeLivery={activeLivery}
                  payments={payments}
                  config={config}
                />
              )}

              {activeTab === "kocok" && (
                <RaffleView
                  members={members}
                  config={config}
                  payments={payments}
                  onConfirmWinner={handleConfirmWinner}
                  onNavigateToDashboard={() => setActiveTab("dashboard")}
                  onInstantPayAll={handleInstantPayAll}
                  activeLivery={activeLivery}
                  isAdmin={isAdmin}
                  onSetAdmin={handleSetAdmin}
                  onUpdateConfig={handleUpdateConfig}
                />
              )}

              {activeTab === "riwayat" && (
                <HistoryView 
                  history={history} 
                  activeLivery={activeLivery} 
                  members={members}
                  config={config}
                  payments={payments}
                />
              )}

              {activeTab === "setelan" && (
                <SettingsView
                  config={config}
                  onUpdateConfig={handleUpdateConfig}
                  onResetData={handleResetData}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  activeLivery={activeLivery}
                  isAdmin={isAdmin}
                  onSetAdmin={handleSetAdmin}
                  onReplayIntro={() => setShowIntro(true)}
                />
              )}
            </div>

            {/* Bottom Custom Navigation Dock Bar */}
            <div className="bg-[#0a0a0c] border-t border-white/5 px-2 py-2 flex justify-around items-center h-16 shrink-0 relative z-40">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === "dashboard" ? `${activeLivery.textAccent} scale-105` : "text-zinc-600 hover:text-zinc-400"
                } cursor-pointer`}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "dashboard" ? `${activeLivery.dotBg} scale-100` : "bg-transparent scale-0"}`}></div>
                <Home className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Home</span>
              </button>

              <button
                onClick={() => setActiveTab("anggota")}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === "anggota" ? `${activeLivery.textAccent} scale-105` : "text-zinc-600 hover:text-zinc-400"
                } cursor-pointer`}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "anggota" ? `${activeLivery.dotBg} scale-100` : "bg-transparent scale-0"}`}></div>
                <Users className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Roster</span>
              </button>

              <button
                onClick={() => setActiveTab("kocok")}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === "kocok" ? `${activeLivery.textAccent} scale-105` : "text-zinc-600 hover:text-zinc-400"
                } cursor-pointer relative`}
              >
                <div className={`absolute -top-3.5 p-1.5 bg-gradient-to-tr ${activeLivery.btnGrad} text-white rounded-full ${activeLivery.shadowAccent} border-2 border-[#0a0a0c]`}>
                  <Gauge className="w-[18px] h-[18px] fill-current animate-pulse" />
                </div>
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase mt-[22px]">Kocokan</span>
              </button>

              <button
                onClick={() => setActiveTab("riwayat")}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === "riwayat" ? `${activeLivery.textAccent} scale-105` : "text-zinc-600 hover:text-zinc-400"
                } cursor-pointer`}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "riwayat" ? `${activeLivery.dotBg} scale-100` : "bg-transparent scale-0"}`}></div>
                <Trophy className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Silsilah</span>
              </button>

              <button
                onClick={() => setActiveTab("setelan")}
                className={`flex flex-col items-center gap-1 transition ${
                  activeTab === "setelan" ? `${activeLivery.textAccent} scale-105` : "text-zinc-600 hover:text-zinc-400"
                } cursor-pointer`}
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "setelan" ? `${activeLivery.dotBg} scale-100` : "bg-transparent scale-0"}`}></div>
                <SlidersHorizontal className="w-[18px] h-[18px]" />
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Setelan</span>
              </button>
            </div>

            {/* Physical Home Indicator bar mockup */}
            <div className="w-full bg-[#0a0a0c] pb-2 pt-1 flex justify-center shrink-0 border-t border-white/5">
              <div className="w-24 h-1 bg-zinc-800 rounded-full"></div>
            </div>

          </div>
        </div>

        {/* RIGHT DOCK SIDEBAR (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex flex-col gap-5 w-64 shrink-0 transition-all duration-300">
          
          {/* Dynamic Feed Activity Panel */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <p className="text-[10px] uppercase tracking-widest text-[#a8a29e] font-bold mb-3.5 font-mono">
              Activity Feed
            </p>
            <div className="space-y-3.5">
              {dynamicLogs.length > 0 ? (
                dynamicLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${log.type === "win" ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-blue-400"}`}></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-200 leading-tight">
                        {log.text}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">{log.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-zinc-500 font-mono italic">
                  No activities registered yet.
                </div>
              )}
            </div>
          </div>

          {/* Secure Engine Diagnosis logs */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-zinc-950 via-[#0d0e15] to-[#040508] border border-white/10 shadow-lg">
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-2 font-mono">
              System Diagnostics
            </p>
            <p className="text-[9.5px] font-mono text-blue-300/80 leading-relaxed space-y-1">
              <span>&gt; Securing gateway... OK</span><br />
              <span>&gt; Pool checksum OK</span><br />
              <span>&gt; Randomizer ready</span><br />
              <span>&gt; {members.length} drivers synchronized</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
