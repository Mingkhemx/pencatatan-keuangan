"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLogin: (name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginScreen({ onLogin, loading, error }: LoginScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    await onLogin(name.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[100dvh] flex-col justify-between px-5 py-8"
    >
      <div className="pt-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.05,
            type: "spring",
            stiffness: 320,
            damping: 24,
          }}
          className="flex items-center gap-3"
        >
          <div className="h-12 w-12 overflow-hidden rounded-2xl shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Logo JajanNote"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="inline-block rounded-full bg-[#E7F4F0] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0D7A5F]">
              BUKU SAKU DIGITAL
            </span>
            <p className="mt-0.5 text-base font-extrabold tracking-tight text-[#181A18]">
              JajanNote
            </p>
          </div>
        </motion.div>

        <h1 className="mt-6 text-[30px] font-extrabold leading-[1.15] tracking-tight text-[#181A18]">
          Catat jajanmu,
          <br />
          <span className="text-[#0D7A5F]">jaga sisa uangnya.</span>
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#666A65]">
          Cukup masukkan nama panggilanmu. Semua catatan QRIS, Cash, limit
          jajan, dan peringkat hemat tersimpan otomatis.
        </p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        className="my-6 rounded-[24px] border border-[#181A18]/10 bg-white p-5 shadow-[0_10px_30px_rgba(24,26,24,0.06)]"
      >
        <label
          htmlFor="nama-akun"
          className="block text-xs font-bold uppercase tracking-wider text-[#666A65]"
        >
          Nama Akun Kamu
        </label>
        <div className="mt-2.5 relative">
          <input
            id="nama-akun"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Miki"
            autoComplete="off"
            maxLength={40}
            className="w-full rounded-2xl border border-[#181A18]/15 bg-[#F7F5F0] px-4 py-3.5 text-base font-semibold text-[#181A18] placeholder:text-[#9CA09A] focus:border-[#0D7A5F] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0D7A5F]/15 transition-all"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2.5 rounded-xl bg-[#C83A3A]/10 px-3 py-2 text-xs font-semibold text-[#C83A3A]"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!name.trim() || loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#181A18] px-5 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#2B2E2B] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? (
            <span>Menghubungkan ke database...</span>
          ) : (
            <>
              <span>Masuk dengan Nama Ini</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </motion.form>

      <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-[#7D817B]">
        <Sparkles className="h-3.5 w-3.5 text-[#C97A16]" />
        <span>Data tersimpan real-time di Postgres Neon</span>
      </div>
    </motion.div>
  );
}
