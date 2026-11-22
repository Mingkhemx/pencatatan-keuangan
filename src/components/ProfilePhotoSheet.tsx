"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Trash2, Upload, X } from "lucide-react";
import { compressImageToDataUrl } from "@/lib/format";

interface ProfilePhotoSheetProps {
  open: boolean;
  displayName: string;
  currentAvatar: string | null | undefined;
  onClose: () => void;
  onSave: (avatarData: string | null) => Promise<void>;
}

export function ProfilePhotoSheet({
  open,
  displayName,
  currentAvatar,
  onClose,
  onSave,
}: ProfilePhotoSheetProps) {
  const [preview, setPreview] = useState<string | null>(
    currentAvatar ?? null,
  );
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file, 320, 0.8);
      setPreview(compressed.dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses foto profil.",
      );
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleSave = async (nextAvatar: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(nextAvatar);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan foto profil.",
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
                <Camera className="h-4 w-4 text-[#0D7A5F]" />
                <h2 className="text-lg font-extrabold text-[#181A18]">
                  Foto Profil
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

            <div className="mt-5 flex flex-col items-center">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#0D7A5F] text-2xl font-extrabold text-white shadow-md">
                {preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <p className="mt-2.5 text-sm font-extrabold text-[#181A18]">
                {displayName}
              </p>
              <p className="text-xs text-[#666A65]">
                Foto profil tampil di beranda &amp; leaderboard
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#181A18]/12 bg-white py-3 text-sm font-bold text-[#181A18] shadow-2xs transition-colors hover:border-[#0D7A5F]">
                {compressing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#0D7A5F]" />
                    Memproses foto...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-[#0D7A5F]" />
                    Pilih / Ganti Foto
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {preview && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={saving || compressing}
                  onClick={() => handleSave(preview)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#181A18] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan foto...
                    </>
                  ) : (
                    "Simpan Foto Profil"
                  )}
                </motion.button>
              )}

              {(preview || currentAvatar) && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={saving || compressing}
                  onClick={() => handleSave(null)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#FDF0F0] py-3 text-xs font-bold text-[#C83A3A] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Foto &amp; Pakai Inisial
                </motion.button>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-[#C83A3A]/10 px-3 py-2 text-xs font-semibold text-[#C83A3A]">
                {error}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
