"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface LimitSheetProps {
  open: boolean;
  currentLimit: number;
  onClose: () => void;
  onSave: (newLimit: number) => Promise<void>;
}

const PRESETS = [250000, 500000, 1000000, 2000000];

export function LimitSheet({
  open,
  currentLimit,
  onClose,
  onSave,
}: LimitSheetProps) {
  const [limitInput, setLimitInput] = useState(() => String(currentLimit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedLimit = Number(limitInput.replace(/\D/g, "")) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      setError("Masukkan angka limit yang valid.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsedLimit);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui limit.",
      );
    } finally {
      setSaving(false);
    }
  };

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
            className="relative z-10 w-full max-w-[430px] rounded-t-[28px] bg-[#F7F5F0] px-5 pb-7 pt-3 shadow-2xl sm:rounded-[28px]"
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#181A18]/15" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#0D7A5F]" />
                <h2 className="text-lg font-extrabold text-[#181A18]">
                  Edit Limit Pengeluaran
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#666A65] shadow-2xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
                    Nominal Limit Baru
                  </label>
                  <span className="font-mono text-xs font-bold text-[#0D7A5F]">
                    {formatRupiah(parsedLimit)}
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[#666A65]">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-full rounded-2xl border border-[#181A18]/10 bg-white py-3 pl-10 pr-4 font-mono text-lg font-bold text-[#181A18] focus:border-[#0D7A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <motion.button
                    key={preset}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setLimitInput(String(preset))}
                    className={`rounded-2xl border px-3 py-2 font-mono text-xs font-bold transition-colors ${
                      parsedLimit === preset
                        ? "border-[#0D7A5F] bg-[#E7F4F0] text-[#0D7A5F]"
                        : "border-[#181A18]/8 bg-white text-[#181A18]"
                    }`}
                  >
                    {formatRupiah(preset)}
                  </motion.button>
                ))}
              </div>

              {error && (
                <p className="rounded-xl bg-[#C83A3A]/10 px-3 py-2 text-xs font-semibold text-[#C83A3A]">
                  {error}
                </p>
              )}

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#181A18] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Limit Baru"
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
