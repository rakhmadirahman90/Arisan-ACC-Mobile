import React, { useState } from "react";
import { motion } from "motion/react";
import { ArisanConfig } from "../types";
import { formatRupiah, LIVERY_THEMES } from "../data";
import toast from "react-hot-toast";
import { compressImage } from "../lib/imageUtils";
import { 
  Settings, 
  DollarSign, 
  RotateCcw, 
  HelpCircle, 
  HardDriveDownload, 
  HardDriveUpload,
  Save, 
  Check,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Lock,
  Unlock,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Square
} from "lucide-react";

interface SettingsViewProps {
  config: ArisanConfig;
  onUpdateConfig: (newConfig: Partial<ArisanConfig>) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => boolean;
  activeLivery: any;
  isAdmin: boolean;
  onSetAdmin: (val: boolean) => void;
  onReplayIntro: () => void;
  localLivery?: string | null;
  onPreviewLivery?: (liveryId: string | null) => void;
}

export default function SettingsView({
  config,
  onUpdateConfig,
  onResetData,
  onExportData,
  onImportData,
  activeLivery,
  isAdmin,
  onSetAdmin,
  onReplayIntro,
  localLivery = null,
  onPreviewLivery,
}: SettingsViewProps) {
  const [contributionInput, setContributionInput] = useState(
    config.contributionAmount.toString()
  );
  const [totalRoundsInput, setTotalRoundsInput] = useState(
    config.totalRounds.toString()
  );
  const [nextDrawDateInput, setNextDrawDateInput] = useState(config.nextDrawDate);
  const [raffleActiveTimeInput, setRaffleActiveTimeInput] = useState(
    config.raffleActiveTime || ""
  );
  const [meetupLocationNameInput, setMeetupLocationNameInput] = useState(
    config.meetupLocationName || ""
  );
  const [meetupAddressInput, setMeetupAddressInput] = useState(
    config.meetupAddress || ""
  );
  const [meetupMapQueryInput, setMeetupMapQueryInput] = useState(
    config.meetupMapQuery || ""
  );
  const [meetupTimeInput, setMeetupTimeInput] = useState(
    config.meetupTime || ""
  );
  const [meetupImageInput, setMeetupImageInput] = useState(
    config.meetupImage || ""
  );
  const [compressing, setCompressing] = useState(false);
  const [compressionMetrics, setCompressionMetrics] = useState<{
    originalSize: string;
    compressedSize: string;
    ratio: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setCompressing(true);
    try {
      const origSizeKb = (file.size / 1024).toFixed(1);
      
      // Compress with width 500 max, height 350 max, quality 0.7
      const compressedDataUrl = await compressImage(file, 500, 350, 0.7);
      
      const compressedSizeKb = ((compressedDataUrl.length * 0.75) / 1024).toFixed(1);
      const ratio = ((1 - (parseFloat(compressedSizeKb) / parseFloat(origSizeKb))) * 100).toFixed(1);

      setMeetupImageInput(compressedDataUrl);
      setCompressionMetrics({
        originalSize: `${origSizeKb} KB`,
        compressedSize: `${compressedSizeKb} KB`,
        ratio: `${ratio}% lebih ramping`
      });
    } catch (err) {
      console.error("Compression error:", err);
      toast.error("Gagal mengompres gambar.");
    } finally {
      setCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Format berkas harus berupa gambar!");
        return;
      }
      await handleFile(file);
    }
  };

  const handleRestoreDefault = () => {
    setMeetupImageInput("https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop");
    setCompressionMetrics(null);
  };

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [isAutoCycling, setIsAutoCycling] = useState(false);

  React.useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      const themeKeys = Object.keys(LIVERY_THEMES) as Array<keyof typeof LIVERY_THEMES>;
      const currentActiveId = localLivery || config.livery || "blue";
      const currentIndex = themeKeys.indexOf(currentActiveId as any);
      const nextIndex = (currentIndex + 1) % themeKeys.length;
      if (onPreviewLivery) {
        onPreviewLivery(themeKeys[nextIndex]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoCycling, localLivery, config.livery, onPreviewLivery]);

  const handleManualCycle = (direction: "prev" | "next") => {
    const themeKeys = Object.keys(LIVERY_THEMES) as Array<keyof typeof LIVERY_THEMES>;
    const currentActiveId = localLivery || config.livery || "blue";
    const currentIndex = themeKeys.indexOf(currentActiveId as any);
    let targetIndex = 0;
    if (direction === "next") {
      targetIndex = (currentIndex + 1) % themeKeys.length;
    } else {
      targetIndex = (currentIndex - 1 + themeKeys.length) % themeKeys.length;
    }
    
    if (onPreviewLivery) {
      onPreviewLivery(themeKeys[targetIndex]);
    }
  };

  const handleSaveConfig = () => {
    const parsedContrib = parseInt(contributionInput.replace(/[^0-9]/g, ""), 10);
    const parsedRounds = parseInt(totalRoundsInput.replace(/[^0-9]/g, ""), 10);

    if (isNaN(parsedContrib) || parsedContrib <= 0) {
      toast.error("Masukkan nominal kontribusi yang valid!");
      return;
    }
    if (isNaN(parsedRounds) || parsedRounds <= 0) {
      toast.error("Masukkan jumlah putaran target yang valid!");
      return;
    }

    onUpdateConfig({
      contributionAmount: parsedContrib,
      totalRounds: parsedRounds,
      nextDrawDate: nextDrawDateInput,
      raffleActiveTime: raffleActiveTimeInput || undefined,
      meetupLocationName: meetupLocationNameInput,
      meetupAddress: meetupAddressInput,
      meetupMapQuery: meetupMapQueryInput,
      meetupTime: meetupTimeInput,
      meetupImage: meetupImageInput || undefined,
      livery: (localLivery || config.livery || "blue") as any,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Hanya Admin yang dapat mengunggah berkas cadangan.");
      return;
    }
    if (!importText.trim()) return;

    const ok = onImportData(importText.trim());
    if (ok) {
      setImportStatus("success");
      setImportText("");
      setTimeout(() => setImportStatus("idle"), 2500);
    } else {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 2500);
    }
  };

  return (
    <motion.div
      className="h-full w-full overflow-y-auto p-5 pb-6 scrollbar-none flex flex-col gap-4 text-left md:grid md:grid-cols-2 md:items-start"
    >
      {/* Admin Mobile Authentication Access */}
      <div className={`bg-gradient-to-r from-zinc-950 via-[#0d0f19] to-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 font-sans md:col-span-1 hover-glow-${config.livery || "blue"}`}>
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="text-[10px] font-black uppercase font-mono text-zinc-100 flex items-center gap-1.5">
            {isAdmin ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
            Akses Admin
          </h3>
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${isAdmin ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
            {isAdmin ? "ADMIN ON" : "LOCKED"}
          </span>
        </div>

        {isAdmin ? (
          <div className="space-y-2">
            <div className="text-[10px] text-zinc-300 leading-normal">
              Anda berselancar sebagai <strong className={`${activeLivery.textAccent}`}>Admin Utama</strong>. Tombol simpan amandemen, pengaturan jadwal piala, & reset data arisan terbuka secara penuh.
            </div>
            <button
              onClick={() => onSetAdmin(false)}
              className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 font-bold font-mono text-[9px] py-2 px-3 rounded-xl transition cursor-pointer"
            >
              LOGOUT DARI SEKTOR ADMIN 🔒
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-404 leading-normal">
              Masukkan sandi rahasia Admin untuk merubah nominal arisan, tema aplikasi, atau pengaturan admin lainnya.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Masukkan Sandi Admin"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (adminPasswordInput === "admin123") {
                      onSetAdmin(true);
                      setAdminPasswordInput("");
                      toast.success("Login Admin berhasil!");
                    } else {
                      toast.error("Sandi Salah!");
                    }
                  }
                }}
                className={`flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:${activeLivery.borderFocus}`}
              />
              <button
                onClick={() => {
                  if (adminPasswordInput === "admin123") {
                    onSetAdmin(true);
                    setAdminPasswordInput("");
                    toast.success("Login Admin berhasil!");
                  } else {
                    toast.error("Sandi Salah!");
                  }
                }}
                className={`bg-gradient-to-r ${activeLivery.btnGrad} text-white font-black font-mono text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer`}
              >
                MASUK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-4 font-sans md:col-span-1 hover-glow-${config.livery || "blue"}`}>
        <div className="flex justify-between items-center pb-1 border-b border-white/5">
          <h3 className="text-[11px] font-black uppercase font-mono text-zinc-100 flex items-center gap-2">
            <Settings className={`w-4 h-4 ${activeLivery.textAccent}`} />
            Konfigurasi Balapan Arisan
          </h3>
          {!isAdmin && <Lock className="w-3.5 h-3.5 text-red-400" />}
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/15 text-red-400 rounded-xl text-[9px] font-mono">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>AKSES DIKUNCI. Silakan login admin di atas untuk melakukan pengubahan amandemen.</span>
          </div>
        )}

        {/* Input Contribution Rate */}
        <div className="space-y-1">
          <label className={`block text-[9px] uppercase font-mono font-bold ${activeLivery.textAccent}`}>
            Nominal Setoran Anggota Per Putaran
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-mono font-bold text-zinc-500">Rp</span>
            <input
              type="text"
              value={contributionInput}
              onChange={(e) => setContributionInput(e.target.value)}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none ${activeLivery.borderFocus} font-mono disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
          <p className="text-[9px] text-zinc-500 font-mono italic">
            * Pembagian otomatis: Rp 50.000 untuk Arisan & Rp 10.000 untuk Uang Konsumsi.
          </p>
        </div>

        {/* Total Target Rounds */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">
              Total Putaran Target
            </label>
            <input
              type="number"
              value={totalRoundsInput}
              onChange={(e) => setTotalRoundsInput(e.target.value)}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none ${activeLivery.borderFocus} font-mono disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">
              Jadwal Kocok Berikutnya
            </label>
            <input
              type="date"
              value={nextDrawDateInput}
              onChange={(e) => setNextDrawDateInput(e.target.value)}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none ${activeLivery.borderFocus} font-mono disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
        </div>

        {/* New Waktu Kocokan Aktif Time Picker */}
        <div className="space-y-1 border-t border-white/5 pt-3">
          <label className={`block text-[9px] uppercase font-mono font-bold ${activeLivery.textAccent}`}>
            ⏱️ Waktu Mulai Kocokan Aktif (Sabar Menanti)
          </label>
          <input
            type="datetime-local"
            value={raffleActiveTimeInput}
            onChange={(e) => setRaffleActiveTimeInput(e.target.value)}
            disabled={!isAdmin}
            className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none ${activeLivery.borderFocus} font-mono disabled:opacity-40 disabled:cursor-not-allowed`}
          />
          <p className="text-[9px] text-zinc-500 font-mono italic">
            * Kocokan hanya aktif dan bisa diputar setelah tanggal dan jam ini dicapai. Admin bebas mem-bypass gembok ini kapan saja.
          </p>
        </div>

        {/* ARISAN GATHERING SETTINGS */}
        <div className="space-y-3.5 border-t border-white/5 pt-3">
          <h4 className={`text-[9px] uppercase font-mono font-bold tracking-wider ${activeLivery.textAccent}`}>
            📍 Jadwal & Lokasi Kumpul Arisan
          </h4>

          <div className="space-y-1.5">
            <label className="block text-[9px] text-zinc-400 font-mono uppercase">Nama Lokasi Kumpul</label>
            <input
              type="text"
              placeholder="Contoh: Tempat Nongkrong Arisan"
              value={meetupLocationNameInput}
              onChange={(e) => setMeetupLocationNameInput(e.target.value)}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#f4f4f5] focus:outline-none ${activeLivery.borderFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] text-zinc-400 font-mono uppercase">Alamat Lengkap (Teks Tampilan)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Jl. Sirkuit Sentul No.88, Sentul, Kec. Babakan Madang, Bogor"
              value={meetupAddressInput}
              onChange={(e) => setMeetupAddressInput(e.target.value)}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-[#f4f4f5] focus:outline-none ${activeLivery.borderFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[9px] text-zinc-400 font-mono uppercase">Metode Deteksi Google Maps (Koordinat / Embed Map Code)</label>
              {meetupMapQueryInput && (
                <button
                  type="button"
                  onClick={() => setMeetupMapQueryInput("")}
                  className="text-[8px] font-mono text-red-400 hover:text-red-300 transition"
                >
                  BERSIHKAN
                </button>
              )}
            </div>
            <textarea
              rows={3}
              placeholder="Paste kode 'Sematkan peta / Embed a map' <iframe> dari Google Maps, koordinat GPS (contoh: -6.534289, 106.879432), atau link peta lengkap"
              value={meetupMapQueryInput}
              onChange={(e) => {
                const rawVal = e.target.value;
                let parsed = rawVal.trim();
                
                // 1. Try to extract src URL from Google Maps Embed iframe code
                if (rawVal.includes("<iframe") && rawVal.includes("src=")) {
                  const srcMatch = rawVal.match(/src="([^"]+)"/);
                  if (srcMatch && srcMatch[1]) {
                    parsed = srcMatch[1];
                  }
                } else {
                  // 2. Try to extract @lat,lng
                  const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                  const atMatch = rawVal.match(atPattern);
                  if (atMatch) {
                    parsed = `${atMatch[1]},${atMatch[2]}`;
                  } else {
                    // 3. Try to find query/q/ll parameter in URL
                    const qPattern = /[?&](query|q|ll)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
                    const qMatch = rawVal.match(qPattern);
                    if (qMatch) {
                      parsed = `${qMatch[2]},${qMatch[3]}`;
                    } else {
                      // 4. Try to find simple lat,lng pattern inside text
                      const rawCoordsPattern = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
                      const rawMatch = rawVal.match(rawCoordsPattern);
                      if (rawMatch) {
                        parsed = `${rawMatch[1]},${rawMatch[2]}`;
                      }
                    }
                  }
                }
                setMeetupMapQueryInput(parsed);
              }}
              disabled={!isAdmin}
              className={`w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-[#f4f4f5] focus:outline-none ${activeLivery.borderFocus} disabled:opacity-40 disabled:cursor-not-allowed font-mono`}
            />

            {/* Smart detection assistance feedbacks */}
            {meetupMapQueryInput && (
              <div className="space-y-1">
                {(() => {
                  const isEmbedUrl = meetupMapQueryInput.includes("google.com/maps/embed");
                  const isShortLink = meetupMapQueryInput.includes("maps.app.goo.gl") || meetupMapQueryInput.includes("goo.gl/maps");
                  const isCoord = /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(meetupMapQueryInput.trim());
                  
                  if (isEmbedUrl) {
                    return (
                      <p className="text-[9px] text-[#22c55e] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded leading-relaxed font-sans flex items-center gap-1.5 font-bold">
                        <span>🚀</span> MAPS EMBED AKURAT AKTIF: Peta lokasi kumpul presisi 100% menggunakan kode sematkan resmi Google Maps!
                      </p>
                    );
                  }

                  if (isShortLink) {
                    return (
                      <p className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded leading-relaxed font-sans">
                        ⚠️ <strong>Link Singkat Terdeteksi:</strong> Tautan pendek (maps.app) tidak mendukung embed peta akurat secara langsung. 
                        <strong> Tips terbaik:</strong> Buka link tersebut di PC/Browser Anda, cari menu <strong>Bagikan / Share</strong> -&gt; Pilih tab <strong>Sematkan Peta / Embed a map</strong> -&gt; Klik <strong>Salin HTML / Copy HTML</strong> lalu paste-kan kodenya ke kotak input di atas!
                      </p>
                    );
                  }
                  
                  if (isCoord) {
                    return (
                      <p className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1 font-mono">
                        <span>✅</span> Koordinat GPS Terdeteksi Presisi: {meetupMapQueryInput}
                      </p>
                    );
                  }

                  return (
                    <p className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded font-sans">
                      ℹ️ Menggunakan penelusuran lokasi alamat teks biasa. Sangat disarankan menyalin kode <strong>Sematkan peta / Embed a map HTML</strong> dari Google Maps untuk akurasi letak titik yang paling pas.
                    </p>
                  );
                })()}

                {/* Real-time Map Preview inside Settings Panel for validation! */}
                <div className="p-2 bg-black/60 border border-white/5 rounded-lg space-y-1.5 shadow-inner">
                  <span className="text-[8.5px] text-zinc-500 font-mono block uppercase tracking-wider">LIVE PREVIEW TITIK PETA (TITIL MAPS):</span>
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-white/10 relative bg-zinc-950">
                    <iframe
                      title="Settings Live Map Preview"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={meetupMapQueryInput.includes("google.com/maps/embed") ? meetupMapQueryInput : `https://maps.google.com/maps?q=${encodeURIComponent(meetupMapQueryInput)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[9px] text-zinc-400 font-mono uppercase">Waktu Kumpul</label>
              <input
                type="text"
                placeholder="Contoh: Sabtu, 20 Juni 19:30 WIB"
                value={meetupTimeInput}
                onChange={(e) => setMeetupTimeInput(e.target.value)}
                disabled={!isAdmin}
                className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#f4f4f5] focus:outline-none ${activeLivery.borderFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
              />
            </div>

            {/* DRAG AND DROP FILE UPLOAD WITH CLIENT SIDE COMPRESSION */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] text-zinc-400 font-mono uppercase">
                  Gambar Lokasi Arisan (Auto-Compressed Upload)
                </label>
                {meetupImageInput && (
                  <button
                    type="button"
                    onClick={handleRestoreDefault}
                    disabled={!isAdmin}
                    className="text-[8px] font-mono font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
                    title="Kembalikan ke gambar cafe default"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Reset Default Cafe
                  </button>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="meetup-image-upload"
                onChange={handleFileChange}
                disabled={!isAdmin}
              />

              <div
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 relative ${
                  isDragging
                    ? `${activeLivery.borderAccent} bg-[#0d1222]`
                    : "border-white/10 hover:border-white/20 bg-black/25"
                } ${!isAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (isAdmin) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (!isAdmin) return;
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (!file.type.startsWith("image/")) {
                      toast.error("Format berkas harus berupa gambar!");
                      return;
                    }
                    await handleFile(file);
                  }
                }}
                onClick={() => {
                  if (isAdmin) {
                    document.getElementById("meetup-image-upload")?.click();
                  }
                }}
              >
                {compressing ? (
                  <div className="text-center py-4 space-y-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-[10px] font-mono text-zinc-400">Mengompres & Mengoptimasi Gambar (Max 500px)...</p>
                  </div>
                ) : meetupImageInput ? (
                  <div className="w-full flex flex-col md:flex-row gap-3.5 items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                        <img
                          src={meetupImageInput}
                          alt="Meetup Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[10px] font-bold text-white flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Gambar Siap Disimpan
                        </div>
                        {compressionMetrics ? (
                          <div className="text-[8px] font-mono text-zinc-400 mt-0.5 space-y-0.5">
                            <div>Ukuran Asli: <span className="text-zinc-500 line-through">{compressionMetrics.originalSize}</span></div>
                            <div>Ukuran Ramping: <span className="text-emerald-400 font-bold">{compressionMetrics.compressedSize}</span></div>
                            <div className="text-emerald-500 font-bold bg-emerald-500/10 px-1 py-0.5 rounded inline-block text-[7.5px] scale-95 origin-left leading-none mt-1">
                              🚀 {compressionMetrics.ratio}
                            </div>
                          </div>
                        ) : meetupImageInput.startsWith("data:") ? (
                          <p className="text-[8px] font-mono text-zinc-400">Gambar Terkompresi Luring</p>
                        ) : (
                          <div className="text-[8px] font-mono text-zinc-500 truncate max-w-[200px]">
                            URL: {meetupImageInput}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => {
                          if (isAdmin) {
                            document.getElementById("meetup-image-upload")?.click();
                          }
                        }}
                        className={`text-[9px] font-mono font-bold bg-white/5 border border-white/10 hover:border-white/20 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Ganti Gambar
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => {
                          setMeetupImageInput("");
                          setCompressionMetrics(null);
                        }}
                        className="text-[9px] font-mono font-bold bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 space-y-2">
                    <Upload className="w-6 h-6 text-zinc-500 mx-auto" />
                    <div>
                      <p className="text-[10px] text-zinc-300 font-bold">Seret & taruh gambar di sini, atau <span className={`${activeLivery.textAccent}`}>pilih berkas</span></p>
                      <p className="text-[8.5px] text-zinc-500 font-mono mt-0.5">JPG, PNG, atau WEBP. Berkas akan otomatis dikompres sebelum disimpan.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Racing Liveries Selector */}
        <div className="space-y-3.5 border-t border-white/5 pt-3.5 font-sans">
          <div className="flex justify-between items-center">
            <label className={`block text-[9.5px] uppercase font-mono font-bold tracking-wider ${activeLivery.textAccent}`}>
              🏁 Livery Sirkuit & Live Theme Preview
            </label>
            {localLivery && localLivery !== config.livery && (
              <button
                type="button"
                onClick={() => {
                  if (onPreviewLivery) {
                    onPreviewLivery(null);
                  }
                  setIsAutoCycling(false);
                  toast.success("Kembali ke tema default server.");
                }}
                className={`text-[8px] font-mono font-bold hover:underline transition flex items-center gap-1 ${activeLivery.textAccent}`}
              >
                <RotateCcw className="w-2.5 h-2.5" /> RESET KE DEFAULT
              </button>
            )}
          </div>

          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
            Klik livery tim di bawah untuk menjajal preview seketika (Live Preview) lintas halaman aplikasi tanpa batasan login Admin!
          </p>

          <div className="grid grid-cols-2 gap-2">
            {Object.values(LIVERY_THEMES).map((theme) => {
              const currentActiveId = localLivery || config.livery || "blue";
              const isSelected = currentActiveId === theme.id;
              const isServerDefault = config.livery === theme.id || (!config.livery && theme.id === "blue");
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    if (onPreviewLivery) {
                      onPreviewLivery(theme.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left border transition cursor-pointer font-sans bg-black/40 ${
                    isSelected 
                      ? `${theme.borderAccent} bg-white/5 ring-1 ring-white/10` 
                      : "border-white/5 hover:border-white/10 text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${theme.dotBg}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-[10px] font-black tracking-tight ${isSelected ? "text-white animate-pulse" : "text-zinc-300"}`}>
                      {theme.name.split(" (")[0]}
                    </div>
                    <div className="text-[7.5px] font-mono text-zinc-500 uppercase flex items-center justify-between">
                      <span>{theme.id} style</span>
                      {isServerDefault && <span className="text-[6.5px] font-sans px-1 py-0.2 bg-white/5 border border-white/10 text-zinc-400 rounded-sm">DEFAULT</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sequential Theme Cycler Control HUD */}
          <div className="p-3 bg-black/60 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
            <div className="text-left">
              <span className={`text-[8px] uppercase tracking-wider font-mono font-bold block ${activeLivery.textAccent}`}>
                🔧 Racing Team HUD Cycler
              </span>
              <span className="text-[10px] text-zinc-300 font-medium">
                Sistem livery aktif: <strong className="text-white capitalize">{localLivery || config.livery || "blue"} Default</strong>
              </span>
              {isAutoCycling && (
                <span className="flex items-center gap-1.5 text-[8.5px] text-emerald-400 font-mono mt-0.5 font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  AUTO-CYCLED DEMO JALAN (2s)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleManualCycle("prev")}
                  className="p-2 border-r border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Livery Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleManualCycle("next")}
                  className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Livery Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAutoCycling(!isAutoCycling);
                  toast.success(
                    isAutoCycling ? "Auto-cycling diberhentikan." : "Auto-cycling dimulai! Menjelajahi sirkuit livery...",
                    { id: "autocycle-toast" }
                  );
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl border transition font-mono font-bold text-[9.5px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  isAutoCycling
                    ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-400 active:scale-95 animate-pulse"
                    : `${activeLivery.bgPill} border-white/5 hover:border-white/10 text-white active:scale-95`
                }`}
              >
                {isAutoCycling ? (
                  <>
                    <Square className="w-3 h-3 text-emerald-400 fill-emerald-400" /> STOP AUTO
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-white fill-white" /> RUN AUTO
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleSaveConfig}
            className={`w-full bg-gradient-to-r ${activeLivery.btnGrad} text-white font-bold font-mono text-xs py-2 px-4 rounded-lg transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer border ${activeLivery.borderAccent}`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 font-bold text-emerald-400" /> KONFIGURASI TERSIMPAN ✔
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> SIMPAN AMANDEMEN 💾
              </>
            )}
          </button>
        )}
      </div>

      {/* Backup and Sync Utility */}
      <div className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3 font-sans md:col-span-1 hover-glow-${config.livery || "blue"}`}>
        <h3 className="text-[11px] font-black uppercase font-mono text-zinc-100 flex items-center gap-2 pb-1 border-b border-white/5">
          <HardDriveDownload className={`w-4 h-4 ${activeLivery.textAccent}`} />
          Backup & Sinkronisasi Eksternal
        </h3>

        <p className="text-[10px] text-zinc-404 font-medium leading-relaxed">
          Amankan basis data aplikasi arisan Anda dengan mengunduh salinan cadangan instan untuk diunggah di handphone/perangkat lain.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onExportData}
            type="button"
            className={`flex-1 bg-white/5 border border-white/10 hover:bg-white/10 ${activeLivery.textAccent} rounded-lg text-[10px] py-1.5 font-mono font-bold text-center flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer`}
          >
            <HardDriveDownload className="w-3.5 h-3.5" /> EKSPOR CADANGAN
          </button>

          <button
            onClick={onReplayIntro}
            type="button"
            className="flex-1 bg-gradient-to-r from-blue-600/10 to-red-600/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white rounded-lg text-[10px] py-1.5 font-mono font-bold text-center flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> RE-PLAY INTRO MASUK
          </button>
        </div>

        {/* Import Box */}
        <form onSubmit={handleImport} className="space-y-1.5 pt-2">
          <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">
            Unggah Berkas Cadangan (Paste JSON)
          </label>
          <textarea
            rows={1}
            placeholder='Paste teks cadangan JSON di sini...'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className={`w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-zinc-350 placeholder-zinc-700 focus:outline-none ${activeLivery.borderFocus}`}
          />
          <button
            type="submit"
            disabled={!isAdmin}
            className={`w-full font-bold font-mono text-[9.5px] py-1 rounded-md transition cursor-pointer ${isAdmin ? "bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 active:scale-95" : "bg-black/20 border border-white/5 text-zinc-600 cursor-not-allowed"}`}
          >
            PROSES UNGGAH CADANGAN
          </button>

          {importStatus === "success" && (
            <div className="text-[9.5px] text-green-400 font-mono text-center pt-1 animate-pulse">
              ✔ Basis Data berhasil sinkron dan di-pulihkan!
            </div>
          )}
          {importStatus === "error" && (
            <div className="text-[9.5px] text-rose-450 font-mono text-center pt-1 font-bold animate-shake">
              ✖ Format JSON tidak valid atau berkas rusak!
            </div>
          )}
        </form>
      </div>

      {/* Wipe/Reset Block */}
      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-3.5 text-center font-sans md:col-span-1 hover-glow-red">
        <h3 className="text-xs font-black uppercase font-mono text-rose-500 flex items-center justify-center gap-1.5">
          <RotateCcw className="w-4 h-4 text-red-500" /> WIPE OUT PADDOCK DANGER ZONE
        </h3>
        
        <p className="text-[10.5px] text-zinc-405 leading-relaxed">
          Mengosongkan sejarah pemenang, mereset setoran putaran ini, dan memulai ulang siklus arisan dari musim pertama/baru.
        </p>

        <button
          onClick={() => {
            if (!isAdmin) {
              toast.error("Hanya Admin yang dapat melakukan Reset Ulang Semua Data. Silakan login dari menu Akses Admin di bawah.");
              return;
            }
            onResetData();
          }}
          className={`py-2 px-4 rounded-xl text-xs font-bold font-mono transition inline-flex items-center gap-1.5 ${
            isAdmin ? "bg-red-500/10 hover:bg-red-500/20 text-[#f87171] hover:text-red-300 border border-red-500/20 active:scale-95 cursor-pointer" : "bg-red-500/5 text-red-400/30 border border-red-500/10 cursor-not-allowed"
          }`}
        >
          RESET ULANG SEMUA DATA ⚠️
        </button>
      </div>

      {/* Rules Board Info */}
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 font-sans text-xs text-zinc-400 space-y-3 md:col-span-2 hover-glow-${config.livery || "blue"}`}>
        <h4 className={`font-extrabold text-zinc-205 uppercase flex items-center gap-1 font-mono text-[10px] ${activeLivery.textAccent}`}>
          <Info className={`w-4 h-4 ${activeLivery.textAccent}`} /> ATURAN BALAP AUTO CLASER CLUB
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
          <li>Arisan ditarik berkala per-bulan ssuai jadwal arisan wajib claser.</li>
          <li>Setoran wajib lunas diselesaikan sebelum starter bendera hijau dikocok.</li>
          <li>Setiap pemenang hanya berhak memenangkan undian <span className={`font-bold ${activeLivery.textAccent}`}>1x kali</span> per-musim.</li>
          <li>Pemenang wajib melunasi tunggakan iuran putaran berikutnya hingga sisa musim balap selesai.</li>
        </ul>
      </div>
    </motion.div>
  );
}
