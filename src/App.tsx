import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import MembersView from "./components/MembersView";
import RaffleView from "./components/RaffleView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import OpeningIntro from "./components/OpeningIntro";
import { Member, ArisanConfig, PaymentStatus, ArisanHistory } from "./types";
import { formatRupiah, LIVERY_THEMES } from "./data";
import { useArisanData } from "./lib/useArisanData";
import { Toaster } from "react-hot-toast";
import { 
  Home, 
  Users, 
  Gauge, 
  Trophy, 
  SlidersHorizontal
} from "lucide-react";

import toast from "react-hot-toast";

export default function App() {
  const {
    members,
    config,
    payments,
    history,
    loading,
    addMember,
    deleteMember,
    editMember,
    updateConfig,
    togglePayment,
    instantPayAll,
    confirmWinner,
    resetData,
    deleteAllMembers,
    deleteMultipleMembers,
    importMembers,
    editHistoryEntry,
    deleteHistoryEntry
  } = useArisanData();

  const [activeTab, setActiveTabRaw] = useState<"dashboard" | "anggota" | "kocok" | "riwayat" | "setelan">("dashboard");
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [localLivery, setLocalLivery] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("claser_live_livery") || null;
    }
    return null;
  });

  const TABS = ["dashboard", "anggota", "kocok", "riwayat", "setelan"] as const;
  const setActiveTab = (newTab: "dashboard" | "anggota" | "kocok" | "riwayat" | "setelan") => {
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    if (currentIndex !== newIndex) {
      setSlideDirection(newIndex > currentIndex ? 1 : -1);
    }
    setActiveTabRaw(newTab);
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem("claser_is_admin");
    return saved === "true";
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "YA, HAPUS",
    onConfirm: () => {},
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

  // ACTIONS wrapped
  const handleAddMember = (m: Omit<Member, "id" | "joinDate" | "wonRound">) => {
    if (!isAdmin) return;
    addMember(m);
  };

  const handleDeleteMember = (id: string) => {
    if (!isAdmin) return;
    const m = members.find((member) => member.id === id);
    setConfirmModal({
      isOpen: true,
      title: "HAPUS ANGGOTA",
      message: `Apakah Anda yakin ingin mengeluarkan "${m?.name || 'anggota ini'}" (${m?.vehicle || 'kendaraan'}) dari keanggotaan arisan? Semua riwayat kontribusi & status pembayaran terkait juga akan dihapus permanen.`,
      confirmText: "YA, KELUARKAN ❌",
      onConfirm: () => {
        deleteMember(id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditMember = (id: string, memberData: Partial<Member>) => {
    if (!isAdmin) return;
    editMember(id, memberData);
  };

  const handleTogglePayment = (memberId: string) => {
    if (!isAdmin) return;
    togglePayment(memberId);
  };

  const handleInstantPayAll = () => {
    if (!isAdmin) return;
    instantPayAll();
  };

  const handleConfirmWinner = (winnerId: string, prizeAmount: number) => {
    confirmWinner(winnerId, prizeAmount);
    setActiveTab("riwayat");
  };

  const handleUpdateConfig = (newConfig: Partial<ArisanConfig>) => {
    if (newConfig.livery) {
      setLocalLivery(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("claser_live_livery");
      }
    }
    updateConfig(newConfig);
  };

  const handlePreviewLivery = (liveryId: string | null) => {
    setLocalLivery(liveryId);
    if (typeof window !== "undefined") {
      if (liveryId) {
        localStorage.setItem("claser_live_livery", liveryId);
      } else {
        localStorage.removeItem("claser_live_livery");
      }
    }
  };

  const handleResetData = () => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "RESET ULANG DATA",
      message: "⚠️ PERINGATAN BENTENG: Apakah Anda yakin ingin mengosongkan riwayat, reset status pembayaran, dan memulai ulang musim arisan dari putaran awal? Tindakan ini bersifat absolut!",
      confirmText: "YA, RESET TOTAL ⚠️",
      onConfirm: () => {
        resetData();
        setActiveTab("dashboard");
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteAllMembers = () => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "HAPUS SELURUH ANGGOTA",
      message: "🔥 PERINGATAN UTAMA: Apakah Anda yakin ingin menghapus SELURUH data anggota dan seluruh data pembayaran yang ada dari database? Tindakan ini tidak bisa dibatalkan!",
      confirmText: "YA, HAPUS SEMUA 🔥",
      onConfirm: () => {
        deleteAllMembers();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteMultipleMembers = (ids: string[]) => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "HAPUS DATA PILIHAN",
      message: `Apakah Anda yakin ingin menghapus ${ids.length} anggota terpilih beserta seluruh data kontribusi & status pembayaran terkait dari database? Tindakan ini tidak bisa dibatalkan!`,
      confirmText: `HAPUS ${ids.length} ANGGOTA ❌`,
      onConfirm: () => {
        deleteMultipleMembers(ids);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleImportMembers = (newMembersList: Omit<Member, "id" | "joinDate" | "wonRound">[]) => {
    if (!isAdmin) return;
    importMembers(newMembersList);
  };

  const handleEditHistory = (id: string, data: Partial<ArisanHistory>) => {
    if (!isAdmin) return;
    editHistoryEntry(id, data);
  };

  const handleDeleteHistory = (id: string) => {
    if (!isAdmin) return;
    setConfirmModal({
      isOpen: true,
      title: "HAPUS RIWAYAT",
      message: "Apakah Anda yakin ingin menghapus catatan riwayat kemenangan ini? Tindakan ini tidak bisa dibatalkan.",
      confirmText: "YA, HAPUS RIWAYAT ❌",
      onConfirm: () => {
        deleteHistoryEntry(id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };


  // Backup file exporter
  const handleExportData = () => {
    const dataObj = { members, config, payments, history };
    const jsonString = JSON.stringify(dataObj, null, 2);
    
    // Create direct copyable clipboard or down-folder text popup
    navigator.clipboard.writeText(jsonString);
    toast.success("Berhasil ekspor! Data disalin ke clipboard.");
  };

  // Backup file importer (Just simple local implementation override for this scenario, though ideally pushes to FB)
  const handleImportData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.members && parsed.config && parsed.payments && parsed.history) {
        toast.error("Import dinonaktifkan di versi Cloud. Data otomatis disinkron.");
        return true;
      }
      return false;
    } catch (e) {
      toast.error("Format data tidak valid.");
      return false;
    }
  };

  // Automatic payment reminder on app initialization
  useEffect(() => {
    if (loading || !config || !config.nextDrawDate || !members.length || !payments.length) return;

    // Check if we already showed it in this session to prevent repeated prompts
    const sessionKey = "payment_reminder_has_shown";
    if (sessionStorage.getItem(sessionKey) === "true") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(config.nextDrawDate);
    dueDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Find unpaid members for the current round
    const totalMembersCount = members.length;
    const paidCount = payments.filter((p) => p.round === config.currentRound && p.isPaid).length;
    const unpaidCount = totalMembersCount - paidCount;

    // Show reminder if the meeting date is within 14 days and there are unpaid members
    if (diffDays <= 14 && unpaidCount > 0) {
      const nextDateStr = dueDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const daySummaryText = diffDays === 0 
        ? "Hari ini!" 
        : diffDays < 0 
          ? "Sudah lewat!" 
          : `${diffDays} hari lagi`;

      toast((t) => (
        <div className="flex flex-col gap-2 text-zinc-100 p-1 w-full max-w-[340px]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <strong className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
              ⚠️ PENGINGAT PEMBAYARAN JATUH TEMPO
            </strong>
          </div>
          <p className="text-[10px] font-sans text-zinc-300 leading-relaxed">
            Kopdar & Kocokan Arisan <span className="font-extrabold text-white">Putaran {config.currentRound}</span> dijadwalkan pada <span className="font-semibold text-amber-300">{nextDateStr}</span> ({daySummaryText}).
          </p>
          <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1 gap-4">
            <span className="text-[9px] font-mono text-zinc-400 shrink-0">
               Belum Bayar: <strong className="text-red-400 font-extrabold">{unpaidCount} Pembalap</strong>
            </span>
            <button 
              onClick={() => {
                setActiveTab("riwayat");
                toast.dismiss(t.id);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[9px] hover:bg-amber-300 active:scale-95 transition font-mono font-black truncate cursor-pointer shrink-0"
            >
              LIHAT REKAP
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        id: "payment-due-reminder",
        style: {
          background: "linear-gradient(135deg, #0e1726 0%, #030712 100%)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(245, 158, 11, 0.15)",
          padding: "12px",
          borderRadius: "16px",
          maxWidth: "360px"
        }
      });

      sessionStorage.setItem(sessionKey, "true");
    }
  }, [loading, config, members, payments]);


  const activeLivery = LIVERY_THEMES[(localLivery || config?.livery || "blue") as keyof typeof LIVERY_THEMES] || LIVERY_THEMES.blue;

  if (loading || !config) {
    return (
      <div 
        className="min-h-screen w-full bg-[#020203] text-slate-200 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "radial-gradient(circle at 50% 50%, #0a111a 0%, #020203 100%)" }}
      >
        <div className={`absolute top-10 left-10 w-96 h-96 ${activeLivery.ambientFlare1} rounded-full blur-3xl pointer-events-none opacity-20`}></div>
        <div className={`absolute bottom-10 right-10 w-96 h-96 ${activeLivery.ambientFlare2} rounded-full blur-3xl pointer-events-none opacity-20`}></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 z-10"
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl border-2 border-dashed ${activeLivery.borderAccent} animate-spin`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gauge className={`w-10 h-10 ${activeLivery.textAccent} animate-pulse`} />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase font-mono">
              PORTAL ARISAN <span className={activeLivery.textAccent}>ACC</span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
              Sinkronisasi Database Real-time...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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

  return (
    <div 
      className="min-h-screen w-full bg-[#020203] text-slate-200 font-sans flex items-center justify-center p-0 sm:p-4 lg:p-8 select-none relative overflow-x-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, #0a111a 0%, #020203 100%)" }}
    >
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { background: '#18181b', color: '#fff', border: '1px solid #27272a', fontSize: '12px' }
        }} 
      />
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
      <div className="flex flex-row items-center justify-center gap-6 lg:gap-8 w-full max-w-7xl transition-all duration-500">
        
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
                <p className="text-[10px] text-zinc-500 font-mono">Panel Aplikasi Arisan</p>
              </div>
            </div>
          </div>

          {/* Dynamic Pool Cash Amount */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3 font-sans">
            <div>
              <p className={`text-[10px] uppercase tracking-widest ${activeLivery.textAccent} font-bold mb-1 font-mono`}>
                Total Kas Arisan
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
                Uang Konsumsi
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
            <p className="text-xs font-black text-white">Jadwal Pertemuan Mendatang</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
              {nextEventDate} • 14:00 WIB
            </p>
          </div>

          {/* Admin Control Sidebar Card */}
          <div className="p-4.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[#a8a29e] font-bold mb-1 font-mono flex items-center justify-between">
              <span>Admin Control</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" : "bg-zinc-600"}`}></span>
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
                          toast.success("Login Admin berhasil!");
                        } else {
                          toast.error("Sandi Admin Salah!");
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
                          toast.success("Login Admin berhasil!");
                        } else {
                          toast.error("Sandi Admin Salah!");
                        }
                      }
                    }}
                    className={`px-2.5 py-1 bg-gradient-to-r ${activeLivery.btnGrad} text-white font-bold text-[10px] rounded font-mono transition cursor-pointer`}
                  >
                    GO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER MOBILE SIMULATOR */}
        <div 
          className="h-screen sm:h-[760px] w-full sm:w-[380px] max-h-[100dvh] sm:max-h-[92vh] bg-[#0a0a0c] rounded-none sm:rounded-[48px] border-0 sm:border-[10px] border-[#1a1a1e] shadow-none sm:shadow-[0_10px_70px_rgba(0,0,0,0.85)] overflow-hidden relative flex flex-col justify-between select-none shrink-0 hover:border-[#1a1a1e] sm:hover:border-[#222228] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          
          {/* Device camera lens cover decoration */}
          <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-5 w-3 h-3 bg-zinc-900 border border-zinc-800 rounded-full z-50"></div>
          
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
            
            {/* Header Bar Area */}
            <Header />

            {/* Active Router Frame */}
            <div className="flex-1 overflow-hidden relative bg-[#0a0a0c]">
              <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-neutral-950/40"></div>
              
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: slideDirection * 20, y: 4 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 20, y: -4 }}
                  transition={{ 
                    opacity: { duration: 0.2 },
                    x: { type: "spring", stiffness: 400, damping: 35 },
                    y: { type: "spring", stiffness: 400, damping: 35 }
                  }}
                  className="absolute inset-0 flex flex-col overflow-hidden"
                >
                  {activeTab === "dashboard" && (
                    <DashboardView
                      members={members}
                      config={config}
                      payments={payments}
                      history={history}
                      onNavigateToKocokan={() => setActiveTab("kocok")}
                      onTogglePayment={handleTogglePayment}
                      onInstantPayAll={handleInstantPayAll}
                      activeLivery={activeLivery}
                      isAdmin={isAdmin}
                    />
                  )}

                  {activeTab === "anggota" && (
                    <MembersView
                      members={members}
                      onAddMember={handleAddMember}
                      onDeleteMember={handleDeleteMember}
                      onEditMember={handleEditMember}
                      onDeleteAllMembers={handleDeleteAllMembers}
                      onDeleteMultipleMembers={handleDeleteMultipleMembers}
                      onImportMembers={handleImportMembers}
                      activeLivery={activeLivery}
                      payments={payments}
                      config={config}
                      isAdmin={isAdmin}
                      history={history}
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
                      onEditHistory={handleEditHistory}
                      onDeleteHistory={handleDeleteHistory}
                      isAdmin={isAdmin}
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
                      localLivery={localLivery}
                      onPreviewLivery={handlePreviewLivery}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
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
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Anggota</span>
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
                <span className="text-[9px] font-mono font-bold tracking-tight uppercase">Data Arisan</span>
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
            <div className="hidden sm:flex w-full bg-[#0a0a0c] pb-2 pt-1 justify-center shrink-0 border-t border-white/5">
              <div className="w-24 h-1 bg-zinc-800 rounded-full"></div>
            </div>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
              {confirmModal.isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 15 }}
                    className="bg-[#0f121d] border border-white/10 rounded-2xl p-5 w-full max-w-[310px] space-y-4 shadow-2xl relative"
                  >
                    <div className="border-b border-white/5 pb-2 text-center">
                      <h3 className="text-xs font-black uppercase text-red-400 font-mono tracking-wider">
                        ⚠️ {confirmModal.title}
                      </h3>
                    </div>
                    
                    <p className="text-[11px] text-zinc-300 leading-relaxed text-center font-sans">
                      {confirmModal.message}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px] font-bold">
                      <button
                        onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl transition cursor-pointer"
                      >
                        BATAL ✖
                      </button>
                      <button
                        onClick={confirmModal.onConfirm}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer shadow-lg shadow-red-900/40 animate-pulse"
                      >
                        {confirmModal.confirmText}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">
                        {log.time && typeof log.time === 'string' && !isNaN(Date.parse(log.time))
                          ? new Date(log.time).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                          : log.time}
                      </p>
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
