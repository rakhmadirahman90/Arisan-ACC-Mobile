import { useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
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
        // initialize
        setDoc(doc(db, "config", "main"), INITIAL_CONFIG);
      }
    });

    const unsubscribeMembers = onSnapshot(collection(db, "members"), (snapshot) => {
      if (snapshot.empty && members.length === INITIAL_MEMBERS.length) {
        // Seed initial data if empty
        INITIAL_MEMBERS.forEach((m) => {
          setDoc(doc(db, "members", m.id), m);
        });
      } else {
        const data = snapshot.docs.map((d) => d.data() as Member);
        setMembers(data);
      }
    });

    const unsubscribePayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      if (snapshot.empty && payments.length === INITIAL_PAYMENTS.length) {
        INITIAL_PAYMENTS.forEach((p) => {
          setDoc(doc(db, "payments", `${p.memberId}-${p.round}`), p);
        });
      } else {
        const data = snapshot.docs.map((d) => d.data() as PaymentStatus);
        setPayments(data);
      }
    });

    const unsubscribeHistory = onSnapshot(collection(db, "history"), (snapshot) => {
      if (snapshot.empty && history.length === INITIAL_HISTORY.length) {
        INITIAL_HISTORY.forEach((h) => {
          setDoc(doc(db, "history", h.id), h);
        });
      } else {
        const data = snapshot.docs.map((d) => d.data() as ArisanHistory);
        setHistory(data);
      }
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
  };

  const deleteMember = async (id: string) => {
    await deleteDoc(doc(db, "members", id));
    // Ideally we should query payments for this member and delete them, but for brevity we keep it simple or run parallel deletes
    payments.forEach(async (p) => {
      if (p.memberId === id) {
        await deleteDoc(doc(db, "payments", `${id}-${p.round}`));
      }
    });
  };

  const editMember = async (id: string, memberData: Partial<Member>) => {
    await updateDoc(doc(db, "members", id), memberData);
  };

  const updateConfig = async (newConfig: Partial<ArisanConfig>) => {
    await updateDoc(doc(db, "config", "main"), newConfig);
  };

  const togglePayment = async (memberId: string) => {
    const round = config.currentRound;
    const existingIndex = payments.findIndex((p) => p.memberId === memberId && p.round === round);
    if (existingIndex > -1) {
      const p = payments[existingIndex];
      const newPaidStatus = !p.isPaid;
      await updateDoc(doc(db, "payments", `${memberId}-${round}`), {
        isPaid: newPaidStatus,
        paidAt: newPaidStatus ? new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : null
      });
    } else {
      await setDoc(doc(db, "payments", `${memberId}-${round}`), {
        memberId,
        round,
        isPaid: true,
        paidAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      });
    }
  };

  const instantPayAll = async () => {
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
  };

  const confirmWinner = async (winnerId: string, prizeAmount: number) => {
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
  };

  const resetData = async () => {
    // For simplicity, just wipe local state and re-seed doc defaults where feasible or simply overwrite db
    // Since resetting implies deleting all docs, we'd have to list and delete.
    // For this prototype, we'll overwrite config and leave subdocs as they'll get overwritten or ignored.
    // But realistically we should delete all members, payments, history.
    members.forEach(m => deleteDoc(doc(db, "members", m.id)));
    payments.forEach(p => deleteDoc(doc(db, "payments", `${p.memberId}-${p.round}`)));
    history.forEach(h => deleteDoc(doc(db, "history", h.id)));
    
    await setDoc(doc(db, "config", "main"), INITIAL_CONFIG);
    INITIAL_MEMBERS.forEach(m => setDoc(doc(db, "members", m.id), m));
    INITIAL_HISTORY.forEach(h => setDoc(doc(db, "history", h.id), h));
    INITIAL_PAYMENTS.forEach(p => setDoc(doc(db, "payments", `${p.memberId}-${p.round}`), p));
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
    resetData
  };
}
