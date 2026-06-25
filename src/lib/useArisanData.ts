import { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  getDocs,
  limit
} from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "./firebase";
import { Member, ArisanConfig, PaymentStatus, ArisanHistory } from "../types";
import { INITIAL_MEMBERS, INITIAL_CONFIG, INITIAL_PAYMENTS, INITIAL_HISTORY } from "../data";

export function useArisanData() {
  const [members, setMembers] = useState<Member[]>([]);
  const [config, setConfig] = useState<ArisanConfig | null>(null);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [history, setHistory] = useState<ArisanHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialized = false;

    // 1. Listen for Config (and Seed if missing)
    const unsubscribeConfig = onSnapshot(doc(db, "config", "main"), async (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ArisanConfig);
      } else {
        // Initial Seed
        console.log("Initializing database with defaults...");
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, "config", "main"), INITIAL_CONFIG);
          
          INITIAL_MEMBERS.forEach((m) => {
            batch.set(doc(db, "members", m.id), m);
          });
          
          INITIAL_PAYMENTS.forEach((p) => {
            batch.set(doc(db, "payments", `${p.memberId}-${p.round}`), p);
          });
          
          INITIAL_HISTORY.forEach((h) => {
            batch.set(doc(db, "history", h.id), h);
          });
          
          await batch.commit();
        } catch (err) {
          console.error("Seeding failed:", err);
        }
      }
    });

    // 2. Listen for Members (Ordered by name)
    const qMembers = query(collection(db, "members"), orderBy("name", "asc"));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as Member);
      setMembers(data);
    });

    // 3. Listen for Payments
    const unsubscribePayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as PaymentStatus);
      setPayments(data);
    });

    // 4. Listen for History (Ordered by round descending)
    const qHistory = query(collection(db, "history"), orderBy("round", "desc"));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as ArisanHistory);
      setHistory(data);
    });

    // Simple delay to ensure snapshots start resolving
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      unsubscribeConfig();
      unsubscribeMembers();
      unsubscribePayments();
      unsubscribeHistory();
    };
  }, []);

  const addMember = async (m: Omit<Member, "id" | "joinDate" | "wonRound">) => {
    try {
      if (!config) return;
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

      const batch = writeBatch(db);
      batch.set(doc(db, "members", newId), newMember);

      // Prepopulate current round payment setup
      const newPayment: PaymentStatus = {
        memberId: newId,
        round: config.currentRound,
        isPaid: false,
      };
      batch.set(doc(db, "payments", `${newId}-${config.currentRound}`), newPayment);
      
      await batch.commit();
      toast.success("Anggota berhasil ditambahkan!");
    } catch (err) {
      toast.error("Gagal menambahkan anggota");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "members", id));
      
      // We need to delete associated payments too
      // Since we don't have a list of rounds for this member easily without querying,
      // but we have the local payments state.
      payments.forEach((p) => {
        if (p.memberId === id) {
          batch.delete(doc(db, "payments", `${id}-${p.round}`));
        }
      });
      
      await batch.commit();
      toast.success("Anggota berhasil dihapus!");
    } catch (err) {
      toast.error("Gagal menghapus anggota");
    }
  };

  const editMember = async (id: string, memberData: Partial<Member>) => {
    try {
      await updateDoc(doc(db, "members", id), memberData);
      toast.success("Data anggota berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal memperbarui data anggota");
    }
  };

  const editHistoryEntry = async (id: string, historyData: Partial<ArisanHistory>) => {
    try {
      await updateDoc(doc(db, "history", id), historyData);
      toast.success("Riwayat berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal memperbarui riwayat");
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, "history", id));
      toast.success("Riwayat berhasil dihapus!");
    } catch (err) {
      toast.error("Gagal menghapus riwayat");
    }
  };

  const updateConfig = async (newConfig: Partial<ArisanConfig>) => {
    try {
      await updateDoc(doc(db, "config", "main"), newConfig);
      toast.success("Pengaturan berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan pengaturan");
    }
  };

  const togglePayment = async (memberId: string) => {
    try {
      const member = members.find((m) => m.id === memberId);
      const memberName = member ? member.name : "Anggota";

      const round = config.currentRound;
      const existingIndex = payments.findIndex((p) => p.memberId === memberId && p.round === round);
      if (existingIndex > -1) {
        const p = payments[existingIndex];
        const newPaidStatus = !p.isPaid;
        await updateDoc(doc(db, "payments", `${memberId}-${round}`), {
          isPaid: newPaidStatus,
          paidAt: newPaidStatus ? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : null
        });
        toast.success(
          newPaidStatus ? `Pembayaran ${memberName} berhasil dilunasi!` : `Pembayaran ${memberName} dibatalkan`, 
          {
            icon: newPaidStatus ? '✅' : '❌',
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#0c0c10',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          }
        );
      } else {
        await setDoc(doc(db, "payments", `${memberId}-${round}`), {
          memberId,
          round,
          isPaid: true,
          paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        });
        toast.success(`Pembayaran ${memberName} berhasil dilunasi!`, {
          icon: '✅',
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#0c0c10',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        });
      }
    } catch (err) {
      toast.error("Gagal memperbarui status pembayaran");
    }
  };

  const instantPayAll = async () => {
    try {
      if (!config) return;
      const round = config.currentRound;
      const batch = writeBatch(db);
      
      members.forEach((m) => {
        const isPaid = payments.find((p) => p.memberId === m.id && p.round === round)?.isPaid;
        if (!isPaid) {
          batch.set(doc(db, "payments", `${m.id}-${round}`), {
            memberId: m.id,
            round,
            isPaid: true,
            paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
          }, { merge: true });
        }
      });
      
      await batch.commit();
      toast.success("Semua anggota telah dilunaskan!");
    } catch (err) {
      toast.error("Gagal melunasi semua pembayaran");
    }
  };

  const confirmWinner = async (winnerId: string, prizeAmount: number) => {
    try {
      if (!config) return;
      const winnerMember = members.find((m) => m.id === winnerId);
      if (!winnerMember) return;

      const batch = writeBatch(db);

      // mark winner
      batch.update(doc(db, "members", winnerId), { wonRound: config.currentRound });

      // history log
      const histId = `hist-${Date.now()}`;
      batch.set(doc(db, "history", histId), {
        id: histId,
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
      });

      // increment round
      const nextRound = config.currentRound + 1;
      batch.update(doc(db, "config", "main"), { currentRound: nextRound });

      // prepopulate payments for next round
      members.forEach((m) => {
        batch.set(doc(db, "payments", `${m.id}-${nextRound}`), {
          memberId: m.id,
          round: nextRound,
          isPaid: false,
        });
      });
      
      await batch.commit();
      toast.success(`Pemenang Putaran ${config.currentRound} berhasil disimpan!`);
    } catch (err) {
      toast.error("Gagal menyimpan pemenang");
    }
  };

  const resetData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Delete everything
      members.forEach(m => batch.delete(doc(db, "members", m.id)));
      payments.forEach(p => batch.delete(doc(db, "payments", `${p.memberId}-${p.round}`)));
      history.forEach(h => batch.delete(doc(db, "history", h.id)));
      
      // Re-seed with initial data
      batch.set(doc(db, "config", "main"), INITIAL_CONFIG);
      INITIAL_MEMBERS.forEach(m => batch.set(doc(db, "members", m.id), m));
      INITIAL_HISTORY.forEach(h => batch.set(doc(db, "history", h.id), h));
      INITIAL_PAYMENTS.forEach(p => batch.set(doc(db, "payments", `${p.memberId}-${p.round}`), p));
      
      await batch.commit();
      toast.success("Semua data berhasil direset ke pengaturan awal!");
    } catch (err) {
      toast.error("Gagal mereset data");
    }
  };

  const deleteAllMembers = async () => {
    try {
      // Delete all member docs
      const memberDeletes = members.map((m) => deleteDoc(doc(db, "members", m.id)));
      await Promise.all(memberDeletes);

      // Delete all payment docs
      const paymentDeletes = payments.map((p) => deleteDoc(doc(db, "payments", `${p.memberId}-${p.round}`)));
      await Promise.all(paymentDeletes);

      toast.success("Semua data anggota & pembayaran berhasil dihapus!");
    } catch (err) {
      toast.error("Gagal menghapus seluruh data anggota");
    }
  };

  const deleteMultipleMembers = async (memberIds: string[]) => {
    try {
      // Delete selected member docs
      const memberDeletes = memberIds.map((id) => deleteDoc(doc(db, "members", id)));
      await Promise.all(memberDeletes);

      // Delete payment docs for selected member docs
      const paymentsToDelete = payments.filter((p) => memberIds.includes(p.memberId));
      const paymentDeletes = paymentsToDelete.map((p) => deleteDoc(doc(db, "payments", `${p.memberId}-${p.round}`)));
      await Promise.all(paymentDeletes);

      toast.success(`${memberIds.length} anggota berhasil dihapus!`);
    } catch (err) {
      toast.error("Gagal menghapus anggota terpilih");
    }
  };

  const importMembers = async (newMembersList: Omit<Member, "id" | "joinDate" | "wonRound">[]) => {
    try {
      if (!config) return;
      const batch = writeBatch(db);
      const round = config.currentRound;

      newMembersList.forEach((m) => {
        const newId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
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
        batch.set(doc(db, "members", newId), newMember);

        // Prepopulate current round payment setup
        const newPayment: PaymentStatus = {
          memberId: newId,
          round: round,
          isPaid: false,
        };
        batch.set(doc(db, "payments", `${newId}-${round}`), newPayment);
      });

      await batch.commit();
      toast.success(`${newMembersList.length} anggota berhasil di-import massal!`);
    } catch (err) {
      toast.error("Gagal melakukan import data anggota");
    }
  };

  return {
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
  };
}
