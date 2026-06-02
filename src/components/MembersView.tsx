import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Member, PaymentStatus, ArisanConfig } from "../types";
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
  Crown
} from "lucide-react";

interface MembersViewProps {
  members: Member[];
  onAddMember: (memberData: Omit<Member, "id" | "joinDate" | "wonRound">) => void;
  onDeleteMember: (id: string) => void;
  activeLivery: any;
  payments?: PaymentStatus[];
  config?: ArisanConfig;
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
  activeLivery,
  payments = [],
  config,
}: MembersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // New member form states
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedColor, setSelectedColor] = useState(PAINT_COLORS[0].class);
  const [errorMsg, setErrorMsg] = useState("");

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

    onAddMember({
      name: name.trim(),
      vehicle: vehicle.trim(),
      phone: sanitizedPhone,
      avatarColor: selectedColor,
    });

    // Reset Form
    setName("");
    setVehicle("");
    setPhone("");
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
      className="p-5 space-y-4 overflow-y-auto max-h-[70vh] pb-24 scrollbar-none"
    >
      {/* Search Bar + Register Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari pembalap / mobil claser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:${activeLivery.borderFocus}`}
          />
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className={`bg-white/5 hover:bg-white/10 border border-white/10 ${activeLivery.textAccent} p-2 rounded-xl transition flex items-center justify-center cursor-pointer`}
          title="Tambah Paddock Member"
        >
          <UserPlus className="w-4.5 h-4.5" />
        </button>
      </div>

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
                <Crown className={`w-4 h-4 ${activeLivery.textAccent}`} /> Register New Claser
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

              {/* Vehicle Stamp Paint Selector */}
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1.5">
                  Warna Livery (Paint Job)
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
                MASUKKAN KE PADDOCK 🚗💨
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Cards Pipeline */}
      <div className="space-y-2.5">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-2 px-1">
          <Users className="w-4 h-4 text-zinc-500" />
          Daftar Anggota Auto Claser ({filteredMembers.length})
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
                  className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-sm relative overflow-hidden"
                >
                  {/* Visual glow on winner check */}
                  {member.wonRound !== null && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    {/* Decorative Avatar with dynamic vehicle theme */}
                    <div className={`w-10 h-10 rounded-xl text-xs font-black tracking-tighter text-zinc-100 font-mono flex flex-col items-center justify-center shrink-0 shadow-inner select-none ${member.avatarColor}`}>
                      <span className="leading-none text-[14px]">
                        {member.name.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="text-[8px] opacity-75 font-normal mt-0.5 font-sans leading-none">
                        {member.name.includes("Bro") ? "MALE" : member.name.includes("Sist") ? "FEM" : "DRV"}
                      </span>
                    </div>

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

                  <div className="flex items-center">
                    <button
                      onClick={() => onDeleteMember(member.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-lg transition active:scale-90 cursor-pointer"
                      title="Keluarkan dari paddock"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
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
