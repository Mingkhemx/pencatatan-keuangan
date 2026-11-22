"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import type { ExpenseItem } from "@/lib/db";
import {
  formatRupiah,
  formatTanggal,
  generateReceiptImageDataUrl,
  triggerDownload,
} from "@/lib/format";

interface PhotoPreviewSheetProps {
  item: ExpenseItem | null;
  username: string;
  displayName: string;
  onClose: () => void;
  onDownloaded: () => void;
}

export function PhotoPreviewSheet({
  item,
  username,
  displayName,
  onClose,
  onDownloaded,
}: PhotoPreviewSheetProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (!item || item.has_foto) return null;
    return generateReceiptImageDataUrl({
      nomor: item.nomor,
      tgl_beli: item.tgl_beli,
      keterangan: item.keterangan,
      harga: item.harga,
      metode: item.metode,
      displayName,
    });
  });
  const [filename, setFilename] = useState<string>(() =>
    item
      ? `bukti-${item.metode.toLowerCase()}-${item.nomor}.png`
      : "bukti.png",
  );
  const [isCustomPhoto, setIsCustomPhoto] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(item?.has_foto));

  useEffect(() => {
    if (!item?.has_foto) return;
    let active = true;
    fetch(
      `/api/expenses/${item.id}/photo?username=${encodeURIComponent(username)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.photo?.foto_data) {
          setImageUrl(data.photo.foto_data);
          setFilename(
            data.photo.foto_name ||
              `foto-${item.metode.toLowerCase()}-${item.nomor}.jpg`,
          );
          setIsCustomPhoto(true);
        } else {
          setImageUrl(
            generateReceiptImageDataUrl({
              nomor: item.nomor,
              tgl_beli: item.tgl_beli,
              keterangan: item.keterangan,
              harga: item.harga,
              metode: item.metode,
              displayName,
            }),
          );
          setFilename(`bukti-${item.metode.toLowerCase()}-${item.nomor}.png`);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [item, username, displayName]);

  const handleDownload = () => {
    if (!imageUrl) return;
    triggerDownload(imageUrl, filename);
    onDownloaded();
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#181A18]/55 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative z-10 w-full max-w-[430px] rounded-t-[28px] bg-[#F7F5F0] px-5 pb-7 pt-3 shadow-2xl sm:rounded-[28px]"
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#181A18]/15" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#0D7A5F]">
                  #{String(item.nomor).padStart(3, "0")} • {item.metode} •{" "}
                  {formatTanggal(item.tgl_beli)}
                </span>
                <h2 className="mt-0.5 text-base font-extrabold text-[#181A18]">
                  {item.keterangan}
                </h2>
                <p className="font-mono text-sm font-bold text-[#666A65]">
                  {formatRupiah(item.harga)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#666A65] shadow-2xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#181A18]/10 bg-white p-2">
              {loading ? (
                <div className="flex h-64 items-center justify-center gap-2 text-xs font-semibold text-[#666A65]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat gambar...
                </div>
              ) : imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt={`Bukti ${item.metode}`}
                  className="max-h-[52dvh] w-full rounded-xl object-contain"
                />
              ) : null}
            </div>

            <p className="mt-2 text-center text-[11px] text-[#7D817B]">
              {isCustomPhoto
                ? `Foto ${item.metode} yang kamu upload`
                : `Kartu bukti ${item.metode} otomatis (bisa upload foto asli lewat Edit)`}
            </p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={!imageUrl || loading}
              onClick={handleDownload}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0D7A5F] py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Foto {item.metode}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
