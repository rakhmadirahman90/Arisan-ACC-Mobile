import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("System: GoogleGenAI successfully initialized.");
  } catch (err) {
    console.error("System: Error initializing GoogleGenAI client:", err);
  }
} else {
  console.warn("System: GEMINI_API_KEY is not defined. Falling back to structured templates.");
}

// Default Advisor tips for fallback
const FALLBACK_TIPS = [
  "💡 **Investasikan untuk Perawatan Kendaraan**: Gunakan Rp 500.000,- untuk melakukan penggantian oli mesin berkualitas tinggi (seperti Shell Helix Ultra atau Motul) agar performa mobil/motor Anda tetap handal saat agenda kopdar berikutnya.",
  "📈 **Alokasi Tabungan Sehat (50/30/20)**: Sisihkan Rp 650.000,- (50%) langsung masuk ke rekening tabungan darurat atau reksa dana pasar uang untuk investasi jangka pendek yang stabil.",
  "☕ **Treatment Traktir Kopi Kopdar**: Sisihkan Rp 150.000,- untuk mentraktir camilan atau kopi bagi rekan-rekan Auto Claser Club saat nongkrong di Paddock Kopi Sentul. Ini mempererat persaudaraan antar-anggota!",
  "🛠️ **Aksesoris Utilitas Esensial**: Beli aksesoris fungsional seperti charger mobil nirkabel, dashcam berkualitas medium, atau car wash kit premium agar kendaraan Anda selalu berkilau.",
  "🛡️ **Sisa Dana**: Simpan sisanya sebesar Rp 100.000,- untuk kas cadangan bensin luar kota atau e-Toll untuk turing Claser berikutnya."
];

// POST API route for AI Financial Advisor
app.post("/api/gemini/advisor", async (req, res) => {
  const { winnerName, vehicle, prizeAmount, category, customPrompt } = req.body;

  const resolvedPrize = prizeAmount || 1300000;
  const resolvedWinnerName = winnerName || "Rekan Claser";
  const resolvedVehicle = vehicle || "Kendaraan Club";

  // If Gemini API is available, call it
  if (ai) {
    try {
      const promptText = `
Anda adalah "Claser AI Financial Advisor", asisten AI keuangan pribadi cerdas dan asisten hobi otomotif untuk komunitas mobil/motor "Auto Claser Club" di Indonesia.
Saat ini, pemenang kocokan arisan adalah:
- Nama Pemenang: ${resolvedWinnerName}
- Kendaraan: ${resolvedVehicle}
- Total Uang Arisan Cair: Rp ${resolvedPrize.toLocaleString("id-ID")}
- Kategori Konsultasi: ${category || "Umum"}
${customPrompt ? `- Pertanyaan khusus user: "${customPrompt}"` : ""}

Berikan panduan pengelolaan keuangan arisan yang bijak, profesional, santai, dan penuh semangat otomotif dalam Bahasa Indonesia.
Ketentuan Output:
1. Sapa pemenang dengan ramah, ucapkan selamat berpesta kocokan.
2. Buatkan rincian alokasi dana rupiah yang spesifik dari total Rp ${resolvedPrize.toLocaleString("id-ID")} (misalnya untuk tabungan, perawatan otomotif / variasi rincian oli/aksesoris sesuai dengan tipe kendaraannya jika memungkinkan, serta traktiran kas/kopi untuk kopdar club).
3. Berikan saran hobi/modifikasi yang sehat (visual, utilitas, atau fungsional seperti coating, dashcam berkualitas, pembersih interior) dan ingatkan agar tidak menghabiskan seluruh uang arisan hanya untuk hobi sekali pakai.
4. Jawab dalam format Markdown yang indah, ringkas, dan scannable (gunakan bullet points, bold text). Hindari penjelasan bertele-tele. Maksimal 270 kata agar pas dengan layar mobile.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          temperature: 0.7,
        }
      });

      const responseText = response.text || "";
      return res.json({
        success: true,
        source: "Gemini AI",
        text: responseText
      });

    } catch (apiError: any) {
      console.error("Gemini API invocation error:", apiError);
      // Fallback to template if API calls fail
    }
  }

  // Fallback engine if Gemini API is offline or has error
  let fallbackResponse = `### 🏁 Halo ${resolvedWinnerName}! Selamat atas kemenangan putaran ini!
  
Berikut adalah rancangan anggaran bijak **Claser Offline Template Advisor** untuk mengelola dana arisan sebesar **Rp ${resolvedPrize.toLocaleString("id-ID")}** Anda:

1. **🛡️ Fondasi Tabungan (50% - Rp ${(resolvedPrize * 0.5).toLocaleString("id-ID")})**
   Sisihkan setengah dana untuk dimasukkan ke tabungan utama atau investasi instan seperti emas/reksa dana. Jangan langsung dihabiskan!
   
2. **🚗 Perawatan Spesifik (${resolvedVehicle}) (35% - Rp ${(resolvedPrize * 0.35).toLocaleString("id-ID")})**
   Gunakan dana ini untuk perawatan berkala kendaraan Anda. Contoh: Tune-up, ganti oli mesin sport premium, poles detailing interior, atau upgrade lampu LED utama demi keselamatan berkendara malam hari saat turing.
   
3. **☕ Solidaritas Kopdar Claser Club (15% - Rp ${(resolvedPrize * 0.15).toLocaleString("id-ID")})**
   Sisihkan dana kecil untuk keseruan bersama. Traktir beberapa porsi aneka gorengan atau es kopi susu untuk teman-teman Auto Claser Club saat nongkrong malam minggu nanti!

*Ingat, anggota club yang bijak selalu menjaga keseimbangan antara dompet sehat dan knalpot sehat! Gaspol dengan aman!*`;

  if (category === "modern") {
    fallbackResponse = `### ⚡ Strategi Modifikasi Sehat Modern untuk ${resolvedWinnerName} (${resolvedVehicle})
    
Bermodal dana arisan cair **Rp ${resolvedPrize.toLocaleString("id-ID")}**, berikut adalah panduan efisiensi teknologi & variasi kendaraan yang direkomendasikan:

1. **📸 Pasang Dashcam Depan-Belakang (Est. Rp 750.000,-)**
   Sangat penting untuk merekam kejadian tak terduga di jalan raya Indonesia. Pilih resolusi minimal 1080p dengan sensor malam handal.
   
2. **✨ Wiper Premium & Pembersih Kaca (Est. Rp 250.000,-)**
   Investasi wajib untuk musim hujan. Pandangan jernih menjamin rombongan konvoi turing tetap rukun dan aman.
   
3. **🔋 Alat Portabel Jumper & Pompa Ban Elektrik (Est. Rp 300.000,-)**
   Alat penyelamat darurat di bagasi ${resolvedVehicle} Anda. Siap membantu sesama anggota Claser yang mogok di jalan.`;
  }

  return res.json({
    success: true,
    source: "Offline Template (API Key belum terpasang / limit)",
    text: fallbackResponse
  });
});

// Configure Vite or Static Assets based on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Claser Server] Full-stack App running on Port ${PORT}`);
  });
}

startServer();
