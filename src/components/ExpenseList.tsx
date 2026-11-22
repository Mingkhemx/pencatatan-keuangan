"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Camera,
  Check,
  Download,
  Pencil,
  QrCode,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import type { ExpenseItem } from "@/lib/db";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: number) => Promise<void>;
  onPreviewPhoto: (item: ExpenseItem) => void;
  onQuickDownload: (item: ExpenseItem) => void;
  onAddNew: () => void;
}

export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  onPreviewPhoto,
  onQuickDownload,
  onAddNew,
}: ExpenseListProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"ALL" | "QRIS" | "CASH">(
    "ALL",
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = expenses.filter((item) => {
    if (methodFilter !== "ALL" && item.metode !== methodFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.keterangan.toLowerCase().includes(q) ||
      String(item.nomor).includes(q) ||
      item.tgl_beli.includes(q)
    );
  });

  const handleConfirmDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <section className="space-y-3">
      {/* Search + Filter bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C908A]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari keterangan atau nomor..."
            className="w-full rounded-2xl border border-[#181A18]/10 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#181A18] placeholder:text-[#9CA09A] focus:border-[#0D7A5F] focus:outline-none focus:ring-2 focus:ring-[#0D7A5F]/15"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-[#ECE8DF] p-1">
          {(
            [
              { key: "ALL", label: "Semua" },
              { key: "QRIS", label: "QRIS" },
              { key: "CASH", label: "Cash" },
            ] as const
          ).map((tab) => {
            const active = methodFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMethodFilter(tab.key)}
                className="relative flex-1 rounded-xl py-1.5 text-xs font-bold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="methodFilterPill"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-white shadow-2xs"
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? "text-[#181A18]" : "text-[#666A65]"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[24px] border border-dashed border-[#181A18]/15 bg-white/70 px-5 py-10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFECE5] text-[#666A65]">
            <Receipt className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold text-[#181A18]">
            {expenses.length === 0
              ? "Belum ada catatan jajan"
              : "Tidak ada yang cocok"}
          </p>
          <p className="mt-1 text-xs text-[#666A65]">
            {expenses.length === 0
              ? "Tap tombol + Catat Jajan di bawah untuk mulai mencatat."
              : "Coba ubah kata kunci pencarian atau filter metode bayar."}
          </p>
          {expenses.length === 0 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0D7A5F] px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              + Tambah Jajan Pertama
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {filtered.map((item, idx) => {
              const isQris = item.metode === "QRIS";
              const isConfirming = confirmDeleteId === item.id;
              const isDeleting = deletingId === item.id;

              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(idx * 0.03, 0.18),
                  }}
                  className="rounded-[20px] border border-[#181A18]/9 bg-white p-3.5 shadow-[0_4px_14px_rgba(24,26,24,0.04)]"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-lg bg-[#F4F1EA] px-2 py-0.5 font-mono text-[11px] font-bold text-[#181A18]">
                          #{String(item.nomor).padStart(3, "0")}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${
                            isQris
                              ? "bg-[#E7F4F0] text-[#0D7A5F]"
                              : "bg-[#FDF2E3] text-[#A66109]"
                          }`}
                        >
                          {isQris ? (
                            <QrCode className="h-2.5 w-2.5" />
                          ) : (
                            <Banknote className="h-2.5 w-2.5" />
                          )}
                          {item.metode}
                        </span>
                        <span className="text-[11px] font-medium text-[#7D817B]">
                          {formatTanggal(item.tgl_beli)}
                        </span>
                      </div>

                      <h3 className="mt-1.5 truncate text-[15px] font-bold text-[#181A18]">
                        {item.keterangan}
                      </h3>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[15px] font-extrabold text-[#181A18] tabular-nums">
                        {formatRupiah(item.harga)}
                      </p>
                      {item.has_foto && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#0D7A5F]">
                          <Camera className="h-3 w-3" />
                          Ada foto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#181A18]/7 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPreviewPhoto(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F7F5F0] px-2.5 py-1.5 text-[11px] font-bold text-[#181A18] transition-colors hover:bg-[#ECE8DF]"
                      >
                        <Camera className="h-3.5 w-3.5 text-[#0D7A5F]" />
                        {item.has_foto ? "Lihat Foto" : "Bukti"}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onQuickDownload(item)}
                        title={`Download foto ${item.metode}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#E7F4F0] px-2.5 py-1.5 text-[11px] font-bold text-[#0D7A5F] transition-colors hover:bg-[#D5ECE4]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#F7F5F0] px-2.5 py-1.5 text-[11px] font-bold text-[#444743] transition-colors hover:bg-[#ECE8DF]"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </motion.button>

                      {isConfirming ? (
                        <motion.button
                          type="button"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          whileTap={{ scale: 0.94 }}
                          disabled={isDeleting}
                          onClick={() => handleConfirmDelete(item.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#C83A3A] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs"
                        >
                          <Check className="h-3 w-3" />
                          {isDeleting ? "..." : "Yakin?"}
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => {
                            setConfirmDeleteId(item.id);
                            setTimeout(() => {
                              setConfirmDeleteId((curr) =>
                                curr === item.id ? null : curr,
                              );
                            }, 3200);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#FDF0F0] px-2.5 py-1.5 text-[11px] font-bold text-[#C83A3A] transition-colors hover:bg-[#FADDDD]"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
