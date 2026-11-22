"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ReceiptText, Sparkles, UserCheck } from "lucide-react";

interface ExistingAccount {
  username: string;
  display_name: string;
  avatar_data?: string | null;
}

interface LoginScreenProps {
  onLogin: (name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginScreen({ onLogin, loading, error }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [accounts, setAccounts] = useState<ExistingAccount[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/login")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
          transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 24 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#181A18]/10 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#0D7A5F] shadow-xs"
        >
          <ReceiptText className="h-3.5 w-3.5" />
          JAJANNOTE • BUKU SAKU
        </motion.div>

        <h1 className="mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-[#181A18]">
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

        {accounts.length > 0 && (
          <div className="mt-5 border-t border-[#181A18]/8 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
              <UserCheck className="h-3.5 w-3.5 text-[#0D7A5F]" />
              Akun Terdaftar
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {accounts.map((acc) => (
                <motion.button
                  key={acc.username}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  onClick={() => onLogin(acc.display_name)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#181A18]/10 bg-[#F7F5F0] px-3 py-1.5 text-xs font-semibold text-[#181A18] transition-colors hover:border-[#0D7A5F]/40 hover:bg-[#E7F4F0]"
                >
                  <span className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-[#0D7A5F] text-[9px] font-bold text-white">
                    {acc.avatar_data ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={acc.avatar_data}
                        alt={acc.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      acc.display_name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  {acc.display_name}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.form>

      <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-[#7D817B]">
        <Sparkles className="h-3.5 w-3.5 text-[#C97A16]" />
        <span>Data tersimpan real-time di Postgres Neon</span>
      </div>
    </motion.div>
  );
}
