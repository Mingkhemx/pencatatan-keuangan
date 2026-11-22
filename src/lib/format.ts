export function formatRupiah(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat("id-ID").format(abs);
  return `${isNeg ? "-" : ""}Rp ${formatted}`;
}

export function formatCompactRupiah(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1);
    return `${isNeg ? "-" : ""}Rp ${val.replace(".", ",")} jt`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `${isNeg ? "-" : ""}Rp ${val} rb`;
  }
  return formatRupiah(amount);
}

export function formatTanggal(isoDate: string): string {
  if (!isoDate) return "-";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const date = new Date(year, month, day);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 960,
  quality = 0.82,
): Promise<{ dataUrl: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak tersedia."));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const baseName = file.name.replace(/\.[^/.]+$/, "") || "bukti";
        resolve({
          dataUrl,
          filename: `${baseName}.jpg`,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function generateReceiptImageDataUrl(params: {
  nomor: number;
  tgl_beli: string;
  keterangan: string;
  harga: number;
  metode: "QRIS" | "CASH";
  displayName: string;
}): string {
  const canvas = document.createElement("canvas");
  canvas.width = 760;
  canvas.height = 920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const isQris = params.metode === "QRIS";
  const accent = isQris ? "#0D7A5F" : "#C97A16";
  const softBg = isQris ? "#E7F4F0" : "#FDF2E3";

  // Outer warm paper background
  ctx.fillStyle = "#F7F5F0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ticket card
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(48, 48, 664, 824, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(24,26,24,0.10)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top color band
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(48, 48, 664, 150, [32, 32, 0, 0]);
  ctx.fill();

  // Header text
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "600 22px sans-serif";
  ctx.fillText("BUKTI CATATAN JAJAN", 88, 106);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 38px sans-serif";
  ctx.fillText(`PEMBAYARAN ${params.metode}`, 88, 158);

  // Method badge pill
  ctx.fillStyle = softBg;
  ctx.beginPath();
  ctx.roundRect(88, 232, 220, 52, 26);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = "700 24px monospace";
  ctx.fillText(`NO. #${String(params.nomor).padStart(3, "0")}`, 114, 266);

  // Date on right
  ctx.fillStyle = "#666A65";
  ctx.font = "600 24px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(formatTanggal(params.tgl_beli), 672, 266);
  ctx.textAlign = "left";

  // Dashed divider
  ctx.strokeStyle = "rgba(24,26,24,0.14)";
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(88, 320);
  ctx.lineTo(672, 320);
  ctx.stroke();
  ctx.setLineDash([]);

  // Account
  ctx.fillStyle = "#666A65";
  ctx.font = "600 22px sans-serif";
  ctx.fillText("NAMA AKUN", 88, 376);
  ctx.fillStyle = "#181A18";
  ctx.font = "700 32px sans-serif";
  ctx.fillText(params.displayName, 88, 420);

  // Item description
  ctx.fillStyle = "#666A65";
  ctx.font = "600 22px sans-serif";
  ctx.fillText("KETERANGAN BELI", 88, 492);
  ctx.fillStyle = "#181A18";
  ctx.font = "700 32px sans-serif";
  const words = params.keterangan.split(" ");
  let line = "";
  let y = 538;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 580) {
      ctx.fillText(line, 88, y);
      line = w;
      y += 42;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 88, y);

  // Total box
  ctx.fillStyle = softBg;
  ctx.beginPath();
  ctx.roundRect(88, 650, 584, 134, 24);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.font = "700 22px sans-serif";
  ctx.fillText(`TOTAL BAYAR (${params.metode})`, 118, 696);

  ctx.fillStyle = "#181A18";
  ctx.font = "800 46px monospace";
  ctx.fillText(formatRupiah(params.harga), 118, 754);

  // Footer
  ctx.fillStyle = "#8C908A";
  ctx.font = "500 20px sans-serif";
  ctx.fillText("Tersimpan otomatis di JajanNote • Neon Postgres", 88, 834);

  return canvas.toDataURL("image/png");
}

export function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
