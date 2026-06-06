import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Member, PaymentStatus, ArisanConfig } from "../types";
import { compressImage } from "../lib/imageUtils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Car, 
  Phone, 
  Calendar, 
  X, 
  Check, 
  Trophy,
  Crown,
  Pencil,
  Camera,
  Upload,
  CheckSquare,
  Square
} from "lucide-react";

interface MembersViewProps {
  members: Member[];
  onAddMember: (memberData: Omit<Member, "id" | "joinDate" | "wonRound">) => void;
  onDeleteMember: (id: string) => void;
  onEditMember?: (id: string, memberData: Omit<Member, "id" | "joinDate" | "wonRound">) => void;
  onDeleteAllMembers?: () => void;
  onDeleteMultipleMembers?: (ids: string[]) => void;
  onImportMembers?: (newMembersList: Omit<Member, "id" | "joinDate" | "wonRound">[]) => void;
  activeLivery: any;
  payments?: PaymentStatus[];
  config?: ArisanConfig;
  isAdmin?: boolean;
}

const PAINT_COLORS = [
  { class: "bg-red-500", label: "Redline Red" },
  { class: "bg-blue-500", label: "Midnight Blue" },
  { class: "bg-amber-500", label: "Performance Amber" },
  { class: "bg-emerald-500", label: "Nitro Emerald" },
  { class: "bg-pink-500", label: "Lotus Pink" },
  { class: "bg-purple-500", label: "Track Purple" },
  { class: "bg-yellow-500", label: "Yellow Speed" },
  { class: "bg-zinc-600", label: "Carbon Steel" },
];

export default function MembersView({
  members,
  onAddMember,
  onDeleteMember,
  onEditMember,
  onDeleteAllMembers,
  onDeleteMultipleMembers,
  onImportMembers,
  activeLivery,
  payments = [],
  config,
  isAdmin = false,
}: MembersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<Omit<Member, "id" | "joinDate" | "wonRound">[]>([]);
  
  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // New member form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedColor, setSelectedColor] = useState(PAINT_COLORS[0].class);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [compressing, setCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const parsePastedText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const parsed: Omit<Member, "id" | "joinDate" | "wonRound">[] = [];

    lines.forEach((line) => {
      if (!line.trim()) return;
      
      // Split by comma, tab, or semicolon
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else {
        parts = line.split(",");
      }

      // Clean up quotes and trim
      const cleanParts = parts.map((p) => p.replace(/^["']|["']$/g, "").trim());
      if (cleanParts.length >= 2) {
        const pName = cleanParts[0];
        const pVehicle = cleanParts[1];
        let pPhone = cleanParts[2] || "";

        // sanitize phone
        let sanitizedPhone = pPhone.replace(/[^0-9]/g, "");
        if (sanitizedPhone.startsWith("0")) {
          sanitizedPhone = "62" + sanitizedPhone.slice(1);
        } else if (!sanitizedPhone.startsWith("62") && sanitizedPhone.length > 5) {
          sanitizedPhone = "62" + sanitizedPhone;
        }
        if (!sanitizedPhone) {
          sanitizedPhone = "628" + Math.floor(100000000 + Math.random() * 900000000);
        }

        parsed.push({
          name: pName,
          vehicle: pVehicle,
          phone: sanitizedPhone,
          avatarColor: PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)].class,
          photo: undefined,
        });
      }
    });

    return parsed;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Parse rows as raw array of arrays
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (rows.length === 0) {
          toast.error("Berkas kosong!");
          return;
        }

        // Check if first row is headers
        let startIdx = 0;
        let nameCol = 0;
        let vehicleCol = 1;
        let phoneCol = 2;

        const firstRow = rows[0]?.map((cell: any) => String(cell || "").toLowerCase().trim()) || [];
        const hasHeaders = firstRow.some((cell: string) => 
          cell.includes("nama") || cell.includes("name") || 
          cell.includes("kendaraan") || cell.includes("vehicle") || cell.includes("mobil") ||
          cell.includes("telepon") || cell.includes("phone") || cell.includes("wa") || cell.includes("hp")
        );

        if (hasHeaders) {
          startIdx = 1;
          firstRow.forEach((cell: string, idx: number) => {
            if (cell.includes("nama") || cell.includes("name")) {
              nameCol = idx;
            } else if (cell.includes("kendaraan") || cell.includes("vehicle") || cell.includes("mobil") || cell.includes("motor")) {
              vehicleCol = idx;
            } else if (cell.includes("telepon") || cell.includes("phone") || cell.includes("wa") || cell.includes("hp")) {
              phoneCol = idx;
            }
          });
        }

        const parsed: Omit<Member, "id" | "joinDate" | "wonRound">[] = [];
        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const pName = String(row[nameCol] || "").trim();
          const pVehicle = String(row[vehicleCol] || "").trim();
          const pPhone = String(row[phoneCol] || "").trim();

          if (!pName || !pVehicle) continue;

          // sanitize phone
          let sanitizedPhone = pPhone.replace(/[^0-9]/g, "");
          if (sanitizedPhone.startsWith("0")) {
            sanitizedPhone = "62" + sanitizedPhone.slice(1);
          } else if (!sanitizedPhone.startsWith("62") && sanitizedPhone.length > 5) {
            sanitizedPhone = "62" + sanitizedPhone;
          }
          if (!sanitizedPhone) {
            sanitizedPhone = "628" + Math.floor(100000000 + Math.random() * 900000000);
          }

          parsed.push({
            name: pName,
            vehicle: pVehicle,
            phone: sanitizedPhone,
            avatarColor: PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)].class,
            photo: undefined,
          });
        }

        if (parsed.length === 0) {
          toast.error("Tidak ada data anggota valid yang dapat di-import!");
        } else {
          setImportPreview(parsed);
          toast.success(`Berhasil memuat ${parsed.length} data anggota! Silakan periksa tinjauan dan klik 'Selesaikan Import Massal'.`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca berkas. Pastikan format berkas valid (.xlsx, .xls, .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const toggleSelectMember = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = (currentFiltered: Member[]) => {
    if (selectedIds.length === currentFiltered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFiltered.map((m) => m.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Silakan pilih minimal 1 anggota terlebih dahulu!");
      return;
    }
    if (onDeleteMultipleMembers) {
      onDeleteMultipleMembers(selectedIds);
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setVehicle("");
    setPhone("");
    setSelectedColor(PAINT_COLORS[0].class);
    setPhoto(undefined);
    setCompressing(false);
    setErrorMsg("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingId(member.id);
    setName(member.name);
    setVehicle(member.vehicle);
    setPhone(member.phone);
    setSelectedColor(member.avatarColor || PAINT_COLORS[0].class);
    setPhoto(member.photo);
    setCompressing(false);
    setErrorMsg("");
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama anggota wajib diisi");
      return;
    }
    if (!vehicle.trim()) {
      setErrorMsg("Model mobil / motor wajib diisi");
      return;
    }

    // Sanitize phone number (replace space, minus, starts with 08 -> 628)
    let sanitizedPhone = phone.trim().replace(/[^0-9]/g, "");
    if (sanitizedPhone.startsWith("0")) {
      sanitizedPhone = "62" + sanitizedPhone.slice(1);
    } else if (!sanitizedPhone.startsWith("62") && sanitizedPhone.length > 5) {
      sanitizedPhone = "62" + sanitizedPhone;
    }

    if (!sanitizedPhone) {
      sanitizedPhone = "6281234567890"; // default mock
    }

    if (editingId && onEditMember) {
      onEditMember(editingId, {
        name: name.trim(),
        vehicle: vehicle.trim(),
        phone: sanitizedPhone,
        avatarColor: selectedColor,
        photo: photo,
      });
    } else {
      onAddMember({
        name: name.trim(),
        vehicle: vehicle.trim(),
        phone: sanitizedPhone,
        avatarColor: selectedColor,
        photo: photo,
      });
    }

    // Reset Form
    setName("");
    setVehicle("");
    setPhone("");
    setPhoto(undefined);
    setEditingId(null);
    setIsAddOpen(false);
  };

  const filteredMembers = members.filter((member) => {
    const term = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(term) ||
      member.vehicle.toLowerCase().includes(term)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-hidden p-5 flex flex-col md:grid md:grid-cols-12 md:gap-5 text-left"
    >
      <div className="md:col-span-5 flex flex-col space-y-3 mb-3 shrink-0 md:h-full max-h-[35vh] md:max-h-full overflow-y-auto scrollbar-none pb-2">
        {/* Search Bar + Admin Actions Toolbar */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari anggota arisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:${activeLivery.borderFocus}`}
            />
          </div>
          {isAdmin && (
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={toggleSelectionMode}
                className={`border p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                  isSelectionMode 
                    ? "bg-[#3b82f6]/20 border-[#3b82f6]/40 text-[#60a5fa]" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 " + activeLivery.textAccent
                }`}
                title={isSelectionMode ? "Batal Pilih Massal" : "Pilih & Hapus Massal Bersamaan"}
              >
                <CheckSquare className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => {
                  handleOpenAdd();
                  setIsImportOpen(false);
                }}
                className={`bg-white/5 hover:bg-white/10 border border-white/10 ${activeLivery.textAccent} p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer`}
                title="Tambah Anggota Tunggal"
              >
                <UserPlus className="w-4.5 h-4.5" />
              </button>
              
              <button
                onClick={() => {
                  setIsImportOpen(!isImportOpen);
                  setIsAddOpen(false);
                  setImportPreview([]);
                  setImportText("");
                }}
                className={`bg-white/5 hover:bg-white/10 border border-white/10 ${activeLivery.textAccent} p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer`}
                title="Import Massal (Excel/CSV)"
              >
                <Upload className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={onDeleteAllMembers}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/50 text-red-400 p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer"
                title="Hapus Seluruh Data Anggota"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* Selection Mode Actions Bar */}
        <AnimatePresence>
          {isSelectionMode && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-2.5 mt-1 font-mono text-[9px] uppercase font-bold text-zinc-300 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSelectAll(filteredMembers)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-zinc-300 active:scale-95 transition cursor-pointer"
                >
                  {selectedIds.length === filteredMembers.length ? "Batal Semua" : "Pilih Semua"}
                </button>
                <span className="text-zinc-500 font-bold">
                  {selectedIds.length}/{filteredMembers.length} Terpilih
                </span>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                    selectedIds.length > 0 
                      ? "bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400 active:scale-95"
                      : "bg-[#0b0c10] text-zinc-500 border border-transparent cursor-not-allowed"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> HAPUS ({selectedIds.length})
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide down Import Massal Panel */}
      <AnimatePresence>
        {isImportOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0d0f17] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className={`text-xs font-black uppercase font-mono ${activeLivery.textAccent} flex items-center gap-1.5`}>
                <Upload className={`w-4 h-4 ${activeLivery.textAccent}`} /> Import Anggota Massal
              </h3>
              <button 
                onClick={() => setIsImportOpen(false)}
                className="text-zinc-500 hover:text-zinc-305 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Unggah file spreadsheet <b>(.xlsx, .xls, .csv, .txt)</b> atau tempel data teks. Data baru otomatis tergabung ke dalam daftar keanggotaan.
            </p>

            {/* Selection Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-lg text-center font-mono text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setImportPreview([]);
                  setImportText("");
                }}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  !importText ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-305"
                }`}
              >
                📁 UNGGAH BERKAS
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportPreview([]);
                  setImportText("\n"); // signal paste open
                }}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  importText ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-305"
                }`}
              >
                📝 SALIN & TEMPEL
              </button>
            </div>

            {/* TAB CONTENT A: FILE UPLOAD */}
            {!importText && (
              <div className="border border-dashed border-white/10 rounded-xl p-5 text-center hover:bg-white/[0.01] transition relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="space-y-2">
                  <Upload className="w-7 h-7 text-zinc-600 mx-auto group-hover:text-zinc-400 group-hover:scale-105 transition" />
                  <div className="text-[11px] text-zinc-300">
                    <span className="text-white font-bold">Pilih berkas</span> Excel / CSV
                  </div>
                  <p className="text-[9px] text-zinc-500 font-mono">
                    Pastikan kolom berisi: Nama, Model Kendaraan, No. HP (Optional)
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT B: TEXT PASTE */}
            {importText && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Tempel Baris Data (Satu Baris = Satu Anggota)
                </label>
                <textarea
                  placeholder="Format: Nama, Kendaraan, Telepon&#10;Contoh:&#10;Bro Aris, Civic Turbo, 08123456789&#10;Sist Amanda, Vespa Primavera, 08198765432"
                  value={importText === "\n" ? "" : importText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImportText(val);
                    const parsed = parsePastedText(val);
                    setImportPreview(parsed);
                  }}
                  rows={4}
                  className={`w-full bg-[#07080c] border border-white/10 rounded-xl p-3 text-[11px] text-white placeholder-zinc-500 font-mono focus:outline-none focus:${activeLivery.borderFocus}`}
                />
              </div>
            )}

            {/* Preview Section */}
            {importPreview.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono font-black text-zinc-400">
                  <span>Pratinjau Data ({importPreview.length})</span>
                  <button
                    type="button"
                    onClick={() => setImportPreview([])}
                    className="text-red-450 hover:text-red-400 font-bold"
                  >
                    Kosongkan
                  </button>
                </div>

                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 scrollbar-none">
                  {importPreview.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between text-[10px] font-mono px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-lg text-zinc-300"
                    >
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold mr-1">{idx + 1}.</span>
                        <span className="text-white font-bold">{item.name}</span>
                        <span className="text-zinc-600 mx-1">|</span>
                        <span className="text-zinc-400">{item.vehicle}</span>
                        <span className="text-zinc-600 mx-1">|</span>
                        <span className="text-zinc-400">{item.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...importPreview];
                          updated.splice(idx, 1);
                          setImportPreview(updated);
                        }}
                        className="text-red-400 hover:text-red-300 font-bold hover:scale-105 transition scale-95"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onImportMembers) {
                      onImportMembers(importPreview);
                      setIsImportOpen(false);
                      setImportPreview([]);
                      setImportText("");
                    }
                  }}
                  className={`w-full bg-gradient-to-r ${activeLivery.btnGrad} text-white font-bold font-mono text-xs py-2.5 px-4 rounded-xl mt-1 transition active:scale-98 cursor-pointer shadow-lg ${activeLivery.shadowAccent}`}
                >
                  SELESAIKAN IMPORT MASSAL 🚀
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide down Add Member Panel */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0d0f17] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className={`text-xs font-black uppercase font-mono ${activeLivery.textAccent} flex items-center gap-1.5`}>
                <Crown className={`w-4 h-4 ${activeLivery.textAccent}`} /> {editingId ? "Edit Anggota" : "Daftar Anggota Baru"}
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1">
                  Nama Lengkap Anggota
                </label>
                <input
                  type="text"
                  placeholder="Misal: Bro Aris / Sist Amanda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:${activeLivery.borderFocus}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1">
                    Model Mobil / Motor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Civic Turbo"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:${activeLivery.borderFocus}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1">
                    No. Handphone (WA)
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:${activeLivery.borderFocus}`}
                  />
                </div>
              </div>

              {/* Upload Foto Anggota */}
              <div className="space-y-1.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400">
                  Foto Anggota (Unggah & Kompres)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden group">
                    {photo ? (
                      <>
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setPhoto(undefined)}
                          className="absolute inset-0 bg-red-700/90 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                          title="Hapus Foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <Camera className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-[10px] px-2.5 py-1.5 rounded-lg transition">
                        <Camera className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{photo ? "Ganti Foto" : "Pilih Foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith("image/")) {
                              toast.error("Format berkas harus berupa gambar!");
                              return;
                            }
                            setCompressing(true);
                            try {
                              // Compress to maximum 120 width & height (ideal size ~5KB - 10KB)
                              const base64 = await compressImage(file, 120, 120, 0.75);
                              setPhoto(base64);
                              toast.success("Foto berhasil dikompres!");
                            } catch (err) {
                              console.error("Image compression error:", err);
                              toast.error("Gagal mengompres gambar.");
                            } finally {
                              setCompressing(false);
                            }
                          }}
                        />
                      </label>
                      {photo && (
                        <button
                          type="button"
                          onClick={() => setPhoto(undefined)}
                          className="text-[10px] font-mono text-red-400 hover:text-red-300 transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1 font-mono leading-tight">
                      {compressing ? (
                        <span className="text-amber-400 font-bold animate-pulse">Mengompres gambar...</span>
                      ) : (
                        "Foto otomatis dikompres sangat ringkas (<10KB) demi performa kilat & kuota database aman."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Stamp Paint Selector */}
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1.5">
                  Tema Profil
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PAINT_COLORS.map((color) => (
                    <button
                      key={color.class}
                      type="button"
                      onClick={() => setSelectedColor(color.class)}
                      className={`w-6 h-6 rounded-md hover:scale-105 transition relative flex items-center justify-center cursor-pointer ${color.class}`}
                      title={color.label}
                    >
                      {selectedColor === color.class && (
                        <Check className="w-3.5 h-3.5 text-zinc-100 font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/10 font-mono">
                  ⚠ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className={`w-full bg-gradient-to-r ${activeLivery.btnGrad} text-white font-bold font-mono text-xs py-2.5 px-4 rounded-xl mt-1 transition active:scale-98 cursor-pointer shadow-lg ${activeLivery.shadowAccent}`}
              >
                {editingId ? "SIMPAN PERUBAHAN 💾" : "TAMBAH ANGGOTA 👤"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Member Cards Pipeline - Right Side */}
      <div className="flex-1 md:col-span-7 overflow-y-auto scrollbar-none pb-20 space-y-2.5 max-h-[40vh] md:max-h-full">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-2 px-1 sticky top-0 bg-[#0a0a0c] py-1.5 z-10">
          <Users className="w-4 h-4 text-zinc-500" />
          Daftar Anggota Arisan ({filteredMembers.length})
        </h3>

        <div className="space-y-2">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => {
              const hasPaidCount = payments.filter((p) => p.memberId === member.id && p.isPaid).length;
              const totalRounds = config?.totalRounds || 10;
              const dashArray = 2 * Math.PI * 16;
              const dashOffset = dashArray * (1 - hasPaidCount / totalRounds);

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={isSelectionMode && isAdmin ? () => toggleSelectMember(member.id) : undefined}
                  className={`border rounded-xl p-3.5 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-200 ${
                    isSelectionMode && isAdmin
                      ? selectedIds.includes(member.id)
                        ? "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15 cursor-pointer active:scale-[0.99]"
                        : "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer active:scale-[0.99]"
                      : "bg-white/5 border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Visual glow on winner check */}
                  {member.wonRound !== null && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono font-black text-zinc-500 w-5.5 text-center shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Checkbox indicator in selection mode */}
                    {isSelectionMode && isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectMember(member.id);
                        }}
                        className="text-zinc-500 hover:text-white transition shrink-0 cursor-pointer p-0.5"
                      >
                        {selectedIds.includes(member.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-400 fill-blue-500/10" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-600" />
                        )}
                      </button>
                    )}

                    {/* Decorative Avatar with dynamic vehicle theme or uploaded photo */}
                    {member.photo ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl text-xs font-black tracking-tighter text-zinc-100 font-mono flex flex-col items-center justify-center shrink-0 shadow-inner select-none ${member.avatarColor}`}>
                        <span className="leading-none text-[14px]">
                          {member.name.substring(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[8px] opacity-75 font-normal mt-0.5 font-sans leading-none">
                          {member.name.includes("Bro") ? "MALE" : member.name.includes("Sist") ? "FEM" : "DRV"}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{member.name}</span>
                          {member.wonRound !== null && (
                            <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0 select-none animate-pulse" title="Winner" />
                          )}
                        </h4>

                        {/* Progress Indicator */}
                        <div 
                          className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full" 
                          title={`Kontribusi Season Ini: Putaran Lunas ${hasPaidCount} dari ${totalRounds}`}
                        >
                          <svg className="w-3 h-3 transform -rotate-90 shrink-0 animate-none" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <circle
                              className="text-zinc-800"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="transparent"
                              r="16"
                              cx="18"
                              cy="18"
                            />
                            {/* Foreground Progress */}
                            <circle
                              className={`${activeLivery.textAccent} transition-all duration-500`}
                              strokeWidth="4"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="16"
                              cx="18"
                              cy="18"
                            />
                          </svg>
                          <span className="text-[8px] font-mono font-bold text-zinc-300 leading-none">
                            {hasPaidCount}/{totalRounds} Rd
                          </span>
                        </div>

                        {member.wonRound !== null ? (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-xs text-[8px] font-mono font-black text-amber-400">
                            <Trophy className="w-2.5 h-2.5" /> WIN R-{member.wonRound}
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-white/5 text-zinc-400 border border-white/5 rounded-xs text-[8.5px] font-mono tracking-tight font-medium">
                            WAITING
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-semibold flex items-center gap-1">
                        <Car className="w-3 h-3 text-zinc-500" /> {member.vehicle}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5 text-zinc-600" /> {member.phone}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5 text-zinc-600" /> {member.joinDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && !isSelectionMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(member);
                        }}
                        className="p-2 text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/10 rounded-lg transition active:scale-90 cursor-pointer"
                        title="Edit data anggota"
                      >
                        <Pencil className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMember(member.id);
                        }}
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-lg transition active:scale-90 cursor-pointer"
                        title="Keluarkan dari daftar"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-8 text-zinc-500 text-xs font-mono">
              🚦 Tidak ada anggota ditemukan. Silakan tambahkan anggota baru untuk memulai jalur balap!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
