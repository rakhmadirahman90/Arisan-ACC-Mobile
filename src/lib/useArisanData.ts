import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "./firebase";
import { Member, ArisanConfig, PaymentStatus, ArisanHistory } from "../types";
import { INITIAL_MEMBERS, INITIAL_CONFIG, INITIAL_PAYMENTS, INITIAL_HISTORY } from "../data";

export function useArisanData() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [config, setConfig] = useState<ArisanConfig>(INITIAL_CONFIG);
  const [payments, setPayments] = useState<PaymentStatus[]>(INITIAL_PAYMENTS);
  const [history, setHistory] = useState<ArisanHistory[]>(INITIAL_HISTORY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We assume the config is at document 'config/main'
    const unsubscribeConfig = onSnapshot(doc(db, "config", "main"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ArisanConfig);
      } else {
        // Database is fresh or uninitialized. Seed everything once!
        setDoc(doc(db, "config", "main"), INITIAL_CONFIG);
        INITIAL_MEMBERS.forEach((m) => {
          setDoc(doc(db, "members", m.id), m);
        });
        INITIAL_PAYMENTS.forEach((p) => {
          setDoc(doc(db, "payments", `${p.memberId}-${p.round}`), p);
        });
        INITIAL_HISTORY.forEach((h) => {
          setDoc(doc(db, "history", h.id), h);
        });
      }
    });

    const unsubscribeMembers = onSnapshot(collection(db, "members"), (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as Member);
      setMembers(data);
    });

    const unsubscribePayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as PaymentStatus);
      setPayments(data);
    });

    const unsubscribeHistory = onSnapshot(collection(db, "history"), (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as ArisanHistory);
      setHistory(data);
    });

    setLoading(false);

    return () => {
      unsubscribeConfig();
      unsubscribeMembers();
      unsubscribePayments();
      unsubscribeHistory();
    };
  }, []);

  const addMember = async (m: Omit<Member, "id" | "joinDate" | "wonRound">) => {
    try {
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
      await setDoc(doc(db, "members", newId), newMember);

      const newPayment: PaymentStatus = {
        memberId: newId,
        round: config.currentRound,
        isPaid: false,
      };
      await setDoc(doc(db, "payments", `${newId}-${config.currentRound}`), newPayment);
      toast.success("Anggota berhasil ditambahkan!");
    } catch (err) {
      toast.error("Gagal menambahkan anggota");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, "members", id));
      payments.forEach(async (p) => {
        if (p.memberId === id) {
          await deleteDoc(doc(db, "payments", `${id}-${p.round}`));
        }
      });
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
      const round = config.currentRound;
      const existingIndex = payments.findIndex((p) => p.memberId === memberId && p.round === round);
      if (existingIndex > -1) {
        const p = payments[existingIndex];
        const newPaidStatus = !p.isPaid;
        await updateDoc(doc(db, "payments", `${memberId}-${round}`), {
          isPaid: newPaidStatus,
          paidAt: newPaidStatus ? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : null
        });
        toast.success(newPaidStatus ? "Pembayaran berhasil dilunasi!" : "Pembayaran dibatalkan");
      } else {
        await setDoc(doc(db, "payments", `${memberId}-${round}`), {
          memberId,
          round,
          isPaid: true,
          paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        });
        toast.success("Pembayaran berhasil dilunasi!");
      }
    } catch (err) {
      toast.error("Gagal memperbarui status pembayaran");
    }
  };

  const instantPayAll = async () => {
    try {
      const round = config.currentRound;
      members.forEach(async (m) => {
        const isPaid = payments.find((p) => p.memberId === m.id && p.round === round)?.isPaid;
        if (!isPaid) {
          await setDoc(doc(db, "payments", `${m.id}-${round}`), {
            memberId: m.id,
            round,
            isPaid: true,
            paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
          }, { merge: true });
        }
      });
      toast.success("Semua anggota telah dilunaskan!");
    } catch (err) {
      toast.error("Gagal melunasi semua pembayaran");
    }
  };

  const confirmWinner = async (winnerId: string, prizeAmount: number) => {
    try {
      const winnerMember = members.find((m) => m.id === winnerId);
      if (!winnerMember) return;

      // mark winner
      await updateDoc(doc(db, "members", winnerId), { wonRound: config.currentRound });

      // history log
      const histId = `hist-${Date.now()}`;
      await setDoc(doc(db, "history", histId), {
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
      await updateDoc(doc(db, "config", "main"), { currentRound: nextRound });

      // prepopulate payments for next round
      members.forEach(async (m) => {
        await setDoc(doc(db, "payments", `${m.id}-${nextRound}`), {
          memberId: m.id,
          round: nextRound,
          isPaid: false,
        });
      });
      toast.success(`Pemenang Putaran ${config.currentRound} berhasil disimpan!`);
    } catch (err) {
      toast.error("Gagal menyimpan pemenang");
    }
  };

  const resetData = async () => {
    try {
      members.forEach(m => deleteDoc(doc(db, "members", m.id)));
      payments.forEach(p => deleteDoc(doc(db, "payments", `${p.memberId}-${p.round}`)));
      history.forEach(h => deleteDoc(doc(db, "history", h.id)));
      
      await setDoc(doc(db, "config", "main"), INITIAL_CONFIG);
      INITIAL_MEMBERS.forEach(m => setDoc(doc(db, "members", m.id), m));
      INITIAL_HISTORY.forEach(h => setDoc(doc(db, "history", h.id), h));
      INITIAL_PAYMENTS.forEach(p => setDoc(doc(db, "payments", `${p.memberId}-${p.round}`), p));
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
      const promises = newMembersList.map(async (m) => {
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
        await setDoc(doc(db, "members", newId), newMember);

        // Prepopulate current round payment setup
        const newPayment: PaymentStatus = {
          memberId: newId,
          round: config.currentRound,
          isPaid: false,
        };
        await setDoc(doc(db, "payments", `${newId}-${config.currentRound}`), newPayment);
      });

      await Promise.all(promises);
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
    importMembers
  };
}
