import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ArisanHistory, Member, ArisanConfig, PaymentStatus } from "../types";
import { formatRupiah } from "../data";

interface ExportData {
  history: ArisanHistory[];
  members: Member[];
  config: ArisanConfig;
  payments: PaymentStatus[];
}

export const exportToExcel = (data: ExportData) => {
  const { history, members, config, payments } = data;

  // 1. Calculate stats matching the UI formulas
  const totalPaidOut = history.reduce((sum, h) => sum + h.prizeAmount, 0);
  const completedRounds = history.length;
  const remainingRounds = Math.max(0, config.totalRounds - completedRounds);

  const arisanShare = Math.round((config.contributionAmount * 5) / 6);
  const consumptionShare = config.contributionAmount - arisanShare;

  const totalPastArisanCollected = totalPaidOut;
  const totalPastConsumptionCollected = history.reduce(
    (sum, h) => sum + h.participantsCount * consumptionShare,
    0
  );
  const totalPastGrandTotal = totalPastArisanCollected + totalPastConsumptionCollected;

  const currentRoundPayments = payments.filter(
    (p) => p.round === config.currentRound && p.isPaid
  );
  const paidCountCurrent = currentRoundPayments.length;

  const currentPaidArisan = paidCountCurrent * arisanShare;
  const currentPaidConsumption = paidCountCurrent * consumptionShare;
  const currentPaidTotal = paidCountCurrent * config.contributionAmount;

  const grandTotalDanaTerkumpul = totalPastGrandTotal + currentPaidTotal;
  const grandTotalArisan = totalPastArisanCollected + currentPaidArisan;
  const grandTotalConsumption = totalPastConsumptionCollected + currentPaidConsumption;

  const unpaidCountCurrent = Math.max(0, members.length - paidCountCurrent);
  const currentUnpaidTotal = unpaidCountCurrent * config.contributionAmount;

  // --- SHEET 1: RINGKASAN ---
  const ringkasanData = [
    { Kategori: "NAMA ARISAN", Nilai: "ARISAN KOPDAR CLASER" },
    { Kategori: "Tanggal Cetak Laporan", Nilai: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
    { Kategori: "", Nilai: "" },
    { Kategori: "PARAMATER ARISAN", Nilai: "" },
    { Kategori: "Nominal Kontribusi Anggota", Nilai: formatRupiah(config.contributionAmount) },
    { Kategori: "Alokasi Kas Arisan (5/6)", Nilai: formatRupiah(arisanShare) },
    { Kategori: "Alokasi Kas Konsumsi (1/6)", Nilai: formatRupiah(consumptionShare) },
    { Kategori: "Total Putaran Target", Nilai: `${config.totalRounds} Putaran` },
    { Kategori: "Putaran Berjalan Saat Ini", Nilai: `Putaran ${config.currentRound}` },
    { Kategori: "Putaran Selesai Dicairkan", Nilai: `${completedRounds} Putaran` },
    { Kategori: "Putaran Tersisa", Nilai: `${remainingRounds} Putaran` },
    { Kategori: "", Nilai: "" },
    { Kategori: "DANA KUMULATIF TERKUMPUL (SIKLUS LUNAS + AKTIF)", Nilai: "" },
    { Kategori: "TOTAL DANA MASUK", Nilai: formatRupiah(grandTotalDanaTerkumpul) },
    { Kategori: "Total Porsi Arisan", Nilai: formatRupiah(grandTotalArisan) },
    { Kategori: "Total Porsi Konsumsi", Nilai: formatRupiah(grandTotalConsumption) },
    { Kategori: "Total Jackpot Hadiah Terbayar", Nilai: formatRupiah(totalPaidOut) },
    { Kategori: "", Nilai: "" },
    { Kategori: "STATUS PUTARAN BERJALAN (R" + config.currentRound + ")", Nilai: "" },
    { Kategori: "Jumlah Lunas Bayar", Nilai: `${paidCountCurrent} Anggota` },
    { Kategori: "Jumlah Belum Bayar", Nilai: `${unpaidCountCurrent} Anggota` },
    { Kategori: "Sisa Tagihan / Piutang Berjalan", Nilai: formatRupiah(currentUnpaidTotal) },
  ];

  // --- SHEET 2: DAFTAR ANGGOTA ---
  const daftarAnggotaData = members.map((m, idx) => {
    const isPaidThisRound = currentRoundPayments.some((p) => p.memberId === m.id);
    return {
      No: idx + 1,
      ID: m.id,
      "Nama Pembalap": m.name,
      Kendaraan: m.vehicle,
      "No. Telepon": m.phone,
      "Tanggal Bergabung": m.joinDate,
      "Pemenang Putaran": m.wonRound ? `Putaran ${m.wonRound}` : "Belum Menang",
      [`Pembayaran R${config.currentRound}`]: isPaidThisRound ? "LUNAS" : "BELUM BAYAR",
    };
  });

  // --- SHEET 3: RIWAYAT KOCKAN ---
  const riwayatKocokanData = [...history]
    .sort((a, b) => a.round - b.round)
    .map((h, idx) => ({
      No: idx + 1,
      Putaran: `Putaran ${h.round}`,
      "Nama Pemenang": h.winnerName,
      Kendaraan: h.winnerVehicle,
      "Jumlah Hadiah Terbayar": formatRupiah(h.prizeAmount),
      "Tanggal Pencairan": h.drawnAt,
      "Jumlah Peserta": `${h.participantsCount} kuota`,
    }));

  // Create Excel Book
  const wb = XLSX.utils.book_new();

  const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanData);
  const wsAnggota = XLSX.utils.json_to_sheet(daftarAnggotaData);
  const wsRiwayat = XLSX.utils.json_to_sheet(riwayatKocokanData);

  // Apply some simple styling constraints via widths if needed
  wsRingkasan["!cols"] = [{ wch: 45 }, { wch: 35 }];
  wsAnggota["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
  ];
  wsRiwayat["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan Finansial");
  XLSX.utils.book_append_sheet(wb, wsAnggota, "Daftar Anggota");
  XLSX.utils.book_append_sheet(wb, wsRiwayat, "Riwayat Arisan Selesai");

  XLSX.writeFile(wb, `Laporan_Arisan_Claser_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportToPDF = (data: ExportData) => {
  const { history, members, config, payments } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Calculate stats matching the UI formulas
  const totalPaidOut = history.reduce((sum, h) => sum + h.prizeAmount, 0);
  const completedRounds = history.length;
  const remainingRounds = Math.max(0, config.totalRounds - completedRounds);

  const arisanShare = Math.round((config.contributionAmount * 5) / 6);
  const consumptionShare = config.contributionAmount - arisanShare;

  const totalPastArisanCollected = totalPaidOut;
  const totalPastConsumptionCollected = history.reduce(
    (sum, h) => sum + h.participantsCount * consumptionShare,
    0
  );
  const totalPastGrandTotal = totalPastArisanCollected + totalPastConsumptionCollected;

  const currentRoundPayments = payments.filter(
    (p) => p.round === config.currentRound && p.isPaid
  );
  const paidCountCurrent = currentRoundPayments.length;

  const currentPaidArisan = paidCountCurrent * arisanShare;
  const currentPaidConsumption = paidCountCurrent * consumptionShare;
  const currentPaidTotal = paidCountCurrent * config.contributionAmount;

  const grandTotalDanaTerkumpul = totalPastGrandTotal + currentPaidTotal;
  const grandTotalArisan = totalPastArisanCollected + currentPaidArisan;
  const grandTotalConsumption = totalPastConsumptionCollected + currentPaidConsumption;

  const unpaidCountCurrent = Math.max(0, members.length - paidCountCurrent);
  const currentUnpaidTotal = unpaidCountCurrent * config.contributionAmount;

  // --- PDF HEADER DESIGN ---
  // Background decorative elements
  doc.setFillColor(10, 17, 26); // Dark primary theme
  doc.rect(0, 0, 210, 38, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ARISAN KOPDAR CLASER", 14, 16);

  // Subtitle
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Laporan Rekapitulasi Data Keuangan, Anggota, dan Kocokan Pemenang Resmi", 14, 23);

  // Meta metadata
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`TANGGAL CETAK: ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 30);

  // Line Separator
  doc.setDrawColor(24, 24, 27);
  doc.line(14, 38, 196, 38);

  // --- SECTION 1: FINANCIAL SUMMARY ---
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("I. RINGKASAN KEUANGAN KUMULATIF", 14, 48);

  // Financial Summary Cards constructed via AutoTable for perfect grid format
  const ringkasanKeuanganRows = [
    ["Parameter Arisan", ""],
    ["Nominal Kontribusi Anggota", formatRupiah(config.contributionAmount)],
    ["Porsi Kas Arisan (5/6)", formatRupiah(arisanShare)],
    ["Porsi Kas Konsumsi (1/6)", formatRupiah(consumptionShare)],
    ["Keuangan Masuk (Kumulatif)", ""],
    ["TOTAL DANA MASUK TERKUMPUL", formatRupiah(grandTotalDanaTerkumpul)],
    ["- Porsi Arisan", formatRupiah(grandTotalArisan)],
    ["- Porsi Konsumsi", formatRupiah(grandTotalConsumption)],
    ["Pencairan & Sisa Target", ""],
    ["Dana Hadiah Arisan Cair (Jackpot)", formatRupiah(totalPaidOut)],
    ["Putaran Berjalan Aktif", `Putaran R${config.currentRound} (Sisa ${remainingRounds} Putaran)`],
    ["Sisa Tagihan / Piutang R" + config.currentRound, formatRupiah(currentUnpaidTotal)],
  ];

  autoTable(doc, {
    startY: 52,
    head: [["Sirkulasi Data", "Keterangan / Nilai Rupiah"]],
    body: ringkasanKeuanganRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [39, 39, 42] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 82, fontStyle: "bold" },
    },
    didParseCell: (tableData: any) => {
      // Bold section header rows
      if (
        tableData.cell.raw === "" || 
        tableData.row.index === 0 || 
        tableData.row.index === 4 || 
        tableData.row.index === 8
      ) {
        tableData.cell.styles.fontStyle = "bold";
        tableData.cell.styles.fillColor = [241, 245, 249];
        tableData.cell.styles.textColor = [15, 23, 42];
      }
    },
  });

  // --- SECTION 2: MEMBERS ROSTER ---
  // Add section title below previous autoTable
  const nextSectionY = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need to add a page break before Section II
  const currentHeight = nextSectionY;
  const isCloseToBottom = currentHeight > 180;
  
  let section2StartY = nextSectionY;
  if (isCloseToBottom) {
    doc.addPage();
    section2StartY = 20;
  }

  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("II. TRANSPARANSI DATA ANGGOTA KOPDAR", 14, section2StartY);

  const memberHeaders = [["No", "Nama Pembalap", "Unit Kendaraan", "No. Telepon", "Won Round", "Status R" + config.currentRound]];
  const memberRows = members.map((m, idx) => {
    const isPaid = currentRoundPayments.some((p) => p.memberId === m.id);
    return [
      idx + 1,
      m.name,
      m.vehicle,
      m.phone,
      m.wonRound ? `Putaran ${m.wonRound}` : "Belum Menang",
      isPaid ? "LUNAS" : "BELUM BAYAR",
    ];
  });

  autoTable(doc, {
    startY: section2StartY + 4,
    head: memberHeaders,
    body: memberRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [39, 39, 42] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
      5: { cellWidth: 26, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (tableData: any) => {
      if (tableData.column.index === 5) {
        if (tableData.cell.raw === "LUNAS") {
          tableData.cell.styles.textColor = [16, 185, 129]; // emerald-500
        } else if (tableData.cell.raw === "BELUM BAYAR") {
          tableData.cell.styles.textColor = [239, 68, 68]; // red-500
        }
      }
    },
  });

  // --- SECTION 3: WINNERS TIMELINE ---
  const section3Y = (doc as any).lastAutoTable.finalY + 12;
  let section3StartY = section3Y;
  
  if (section3StartY > 190) {
    doc.addPage();
    section3StartY = 20;
  }

  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("III. RIWAYAT MENANG PENARIKAN ARISAN", 14, section3StartY);

  const historyHeaders = [["Putaran", "Penerima Kas Jackpot", "Pembalap Kendaraan", "Nominal Cair", "Tanggal Penarikan", "Peserta Kuota"]];
  const historyRows = [...history]
    .sort((a, b) => b.round - a.round)
    .map((h) => [
      `Round ${h.round}`,
      h.winnerName,
      h.winnerVehicle,
      formatRupiah(h.prizeAmount),
      h.drawnAt,
      `${h.participantsCount} Kuota`,
    ]);

  autoTable(doc, {
    startY: section3StartY + 4,
    head: historyHeaders,
    body: historyRows,
    theme: "striped",
    headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [39, 39, 42] },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, fontStyle: "bold" },
      4: { cellWidth: 26, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
    },
  });

  // Footer page counts and validation stamp
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    
    // Page count
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, 287, { align: "right" });
    // Copyright and validation notice
    doc.text("Dokumen resmi dicetak secara mandiri oleh Sistem Arisan Kopdar Claser.", 14, 287);
  }

  doc.save(`Laporan_Rekap_Arisan_Claser_${new Date().toISOString().slice(0, 10)}.pdf`);
};
