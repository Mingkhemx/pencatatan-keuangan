"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Camera,
  Loader2,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import type { ExpenseItem } from "@/lib/db";
import {
  compressImageToDataUrl,
  formatRupiah,
  todayIsoDate,
} from "@/lib/format";

export interface ExpenseFormPayload {
  id?: number;
  nomor: number;
  tgl_beli: string;
  keterangan: string;
  harga: number;
  metode: "QRIS" | "CASH";
  foto_data?: string | null;
  foto_name?: string | null;
  remove_foto?: boolean;
}

interface ExpenseSheetProps {
  open: boolean;
  username: string;
  editingItem: ExpenseItem | null;
  nextNomor: number;
  onClose: () => void;
  onSave: (payload: ExpenseFormPayload) => Promise<void>;
}

const QUICK_ITEMS = ["Es Kopi", "Makan Siang", "Camilan", "Minuman", "Parkir"];
const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export function ExpenseSheet({
  open,
  username,
  editingItem,
  nextNomor,
  onClose,
  onSave,
}: ExpenseSheetProps) {
  const [nomor, setNomor] = useState(() =>
    String(editingItem ? editingItem.nomor : nextNomor),
  );
  const [tglBeli, setTglBeli] = useState(() =>
    editingItem ? editingItem.tgl_beli : todayIsoDate(),
  );
  const [keterangan, setKeterangan] = useState(() =>
    editingItem ? editingItem.keterangan : "",
  );
  const [harga, setHarga] = useState(() =>
    editingItem ? String(editingItem.harga) : "",
  );
  const [metode, setMetode] = useState<"QRIS" | "CASH">(() =>
    editingItem ? editingItem.metode : "QRIS",
  );
  const [fotoData, setFotoData] = useState<string | null>(null);
  const [fotoName, setFotoName] = useState<string | null>(
    editingItem?.foto_name ?? null,
  );
  const [removeFoto, setRemoveFoto] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(() =>
    Boolean(open && editingItem?.has_foto),
  );
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editingItem?.has_foto) return;
    let active = true;
    fetch(
      `/api/expenses/${editingItem.id}/photo?username=${encodeURIComponent(username)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.photo?.foto_data) {
          setFotoData(data.photo.foto_data);
          setFotoName(data.photo.foto_name);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingPhoto(false);
      });
    return () => {
      active = false;
    };
  }, [open, editingItem, username]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setFotoData(compressed.dataUrl);
      setFotoName(compressed.filename);
      setRemoveFoto(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses foto yang dipilih.",
      );
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleAddAmount = (delta: number) => {
    const curr = Number(harga.replace(/\D/g, "")) || 0;
    setHarga(String(curr + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNomor = Number(nomor);
    const parsedHarga = Number(harga.replace(/\D/g, ""));

    if (!Number.isInteger(parsedNomor) || parsedNomor < 1) {
      setError("Nomor transaksi harus >= 1.");
      return;
    }
    if (!tglBeli) {
      setError("Tanggal beli wajib diisi.");
      return;
    }
    if (!keterangan.trim()) {
      setError("Keterangan beli apa wajib diisi.");
      return;
    }
    if (!Number.isFinite(parsedHarga) || parsedHarga <= 0) {
      setError("Harga harus lebih dari Rp 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: editingItem?.id,
        nomor: parsedNomor,
        tgl_beli: tglBeli,
        keterangan: keterangan.trim(),
        harga: parsedHarga,
        metode,
        foto_data: removeFoto ? null : fotoData,
        foto_name: removeFoto ? null : fotoName,
        remove_foto: removeFoto,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data pengeluaran.",
      );
    } finally {
      setSaving(false);
    }
  };

  const parsedHargaPreview = Number(harga.replace(/\D/g, "")) || 0;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#181A18]/45 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative z-10 max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#F7F5F0] px-5 pb-7 pt-3 shadow-2xl sm:rounded-[28px]"
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#181A18]/15" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#181A18]">
                {editingItem ? "Edit Pengeluaran" : "Catat Jajan Baru"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#666A65] shadow-2xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* Nomor & Tanggal */}
              <div className="grid grid-cols-5 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                    Nomor
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={nomor}
                    onChange={(e) => setNomor(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[#181A18]/10 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-[#181A18] focus:border-[#0D7A5F] focus:outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                    Tgl Beli
                  </label>
                  <input
                    type="date"
                    value={tglBeli}
                    onChange={(e) => setTglBeli(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[#181A18]/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#181A18] focus:border-[#0D7A5F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                  Keterangan Beli Apa
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Es Kopi Susu + Roti"
                  className="mt-1.5 w-full rounded-2xl border border-[#181A18]/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#181A18] placeholder:text-[#9CA09A] focus:border-[#0D7A5F] focus:outline-none"
                />
                {!editingItem && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {QUICK_ITEMS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setKeterangan(item)}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#666A65] shadow-2xs transition-colors hover:text-[#181A18]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Harga */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                    Harga
                  </label>
                  {parsedHargaPreview > 0 && (
                    <span className="font-mono text-xs font-bold text-[#0D7A5F]">
                      {formatRupiah(parsedHargaPreview)}
                    </span>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[#666A65]">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={harga}
                    onChange={(e) => setHarga(e.target.value)}
                    placeholder="25000"
                    className="w-full rounded-2xl border border-[#181A18]/10 bg-white py-2.5 pl-10 pr-4 font-mono text-base font-bold text-[#181A18] placeholder:text-[#9CA09A] focus:border-[#0D7A5F] focus:outline-none"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddAmount(amt)}
                      className="rounded-full border border-[#181A18]/8 bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-[#181A18] hover:border-[#0D7A5F]/40"
                    >
                      +{amt / 1000}rb
                    </button>
                  ))}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                  Pembelian Menggunakan
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        key: "QRIS",
                        label: "QRIS",
                        sub: "Scan / E-Wallet",
                        Icon: QrCode,
                        activeClass:
                          "border-[#0D7A5F] bg-[#E7F4F0] text-[#0D7A5F]",
                      },
                      {
                        key: "CASH",
                        label: "Cash",
                        sub: "Uang Tunai",
                        Icon: Banknote,
                        activeClass:
                          "border-[#C97A16] bg-[#FDF2E3] text-[#A66109]",
                      },
                    ] as const
                  ).map(({ key, label, sub, Icon, activeClass }) => {
                    const active = metode === key;
                    return (
                      <motion.button
                        key={key}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMetode(key)}
                        className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-2.5 text-left transition-all ${
                          active
                            ? activeClass
                            : "border-transparent bg-white text-[#666A65]"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold">{label}</p>
                          <p className="text-[10px] opacity-80">{sub}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Foto QRIS / Cash */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                  Foto Bukti {metode} (Opsional)
                </label>

                {loadingPhoto ? (
                  <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white p-3 text-xs text-[#666A65]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat foto tersimpan...
                  </div>
                ) : fotoData && !removeFoto ? (
                  <div className="mt-1.5 overflow-hidden rounded-2xl border border-[#181A18]/10 bg-white p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fotoData}
                      alt="Preview bukti"
                      className="max-h-44 w-full rounded-xl object-cover"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-medium text-[#666A65]">
                        {fotoName || `bukti-${metode.toLowerCase()}.jpg`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <label className="cursor-pointer rounded-xl bg-[#F7F5F0] px-2.5 py-1 text-[11px] font-bold text-[#181A18]">
                          Ganti
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setFotoData(null);
                            setFotoName(null);
                            setRemoveFoto(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#FDF0F0] px-2.5 py-1 text-[11px] font-bold text-[#C83A3A]"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#181A18]/20 bg-white px-4 py-3.5 text-xs font-bold text-[#444743] transition-colors hover:border-[#0D7A5F] hover:text-[#0D7A5F]">
                    {compressing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses foto...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Upload Foto Struk / {metode}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-[#C83A3A]/10 px-3 py-2 text-xs font-semibold text-[#C83A3A]">
                  {error}
                </p>
              )}

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={saving || compressing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#181A18] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan ke Neon...
                  </>
                ) : editingItem ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Pengeluaran"
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
