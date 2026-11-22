"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, RefreshCw, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/db";
import { formatCompactRupiah, formatRupiah } from "@/lib/format";

interface LeaderboardViewProps {
  currentUsername: string;
}

const AUTO_REFRESH_MS = 5000;

export function LeaderboardView({ currentUsername }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal memuat leaderboard.");
    const data = await res.json();
    return Array.isArray(data?.leaderboard)
      ? (data.leaderboard as LeaderboardEntry[])
      : [];
  }, []);

  useEffect(() => {
    let active = true;

    const sync = (showSpinner: boolean) => {
      if (showSpinner) setRefreshing(true);
      fetchLeaderboard()
        .then((list) => {
          if (active) {
            setEntries(list);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            setRefreshing(false);
          }
        });
    };

    sync(false);
    const intervalId = setInterval(() => sync(false), AUTO_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [fetchLeaderboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await fetchLeaderboard();
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setRefreshing(false);
    }
  };

  const topThree = entries.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Header banner */}
      <div className="rounded-[24px] border border-[#181A18]/10 bg-white p-4 shadow-[0_8px_24px_rgba(24,26,24,0.05)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2E3] px-2.5 py-1 text-[11px] font-bold text-[#A66109]">
                <Trophy className="h-3.5 w-3.5" />
                PERINGKAT SISA UANG
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F4F0] px-2.5 py-1 text-[10px] font-bold text-[#0D7A5F]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0D7A5F]" />
                Auto 5 dtk
              </span>
            </div>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#181A18]">
              Siapa yang Paling Tebal Dompetnya?
            </h2>
            <p className="mt-0.5 text-xs text-[#666A65]">
              Diurutkan dari sisa uang paling banyak setelah dikurangi total
              jajan.
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F5F0] text-[#181A18] transition-colors hover:bg-[#ECE8DF]"
            title="Refresh peringkat"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </motion.button>
        </div>

        {/* Top 3 Podium */}
        {!loading && topThree.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 pt-2">
            {[
              { item: topThree[1], rank: 2, height: "pt-5", tone: "bg-[#F3F4F6] border-[#D1D5DB]" },
              { item: topThree[0], rank: 1, height: "pt-1", tone: "bg-[#FEF6E6] border-[#EAB308]/45" },
              { item: topThree[2], rank: 3, height: "pt-7", tone: "bg-[#FAF0E8] border-[#D97706]/30" },
            ].map(({ item, rank, height, tone }) => {
              if (!item) return <div key={rank} />;
              const isMe = item.username === currentUsername;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rank * 0.06 }}
                  className={`flex flex-col items-center ${height}`}
                >
                  <div
                    className={`relative flex w-full flex-col items-center rounded-2xl border p-2.5 text-center ${tone}`}
                  >
                    {rank === 1 && (
                      <Crown className="mb-1 h-4 w-4 text-[#C97A16]" />
                    )}
                    <div
                      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-extrabold text-white ${
                        rank === 1
                          ? "bg-[#C97A16]"
                          : rank === 2
                            ? "bg-[#6B7280]"
                            : "bg-[#A16207]"
                      }`}
                    >
                      {item.avatar_data ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.avatar_data}
                          alt={item.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        item.display_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <p className="mt-1.5 max-w-full truncate text-xs font-extrabold text-[#181A18]">
                      {item.display_name}
                      {isMe ? " ★" : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] font-bold text-[#0D7A5F] tabular-nums">
                      {formatCompactRupiah(item.sisa_uang)}
                    </p>
                    <span className="mt-1 rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#666A65]">
                      #{rank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Ranked List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-[20px] bg-white/80"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-[#C83A3A]/10 p-4 text-center text-xs font-semibold text-[#C83A3A]">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-[22px] bg-white p-6 text-center text-xs text-[#666A65]">
          Belum ada akun terdaftar.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.username === currentUsername;
            const isNeg = entry.sisa_uang < 0;

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.035, 0.2) }}
                className={`flex items-center gap-3 rounded-[20px] border p-3.5 shadow-[0_3px_12px_rgba(24,26,24,0.03)] ${
                  isMe
                    ? "border-[#0D7A5F]/45 bg-[#EFF8F5]"
                    : "border-[#181A18]/8 bg-white"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-extrabold ${
                    rank === 1
                      ? "bg-[#FEF3C7] text-[#B45309]"
                      : rank === 2
                        ? "bg-[#F3F4F6] text-[#4B5563]"
                        : rank === 3
                          ? "bg-[#FFEDD5] text-[#9A3412]"
                          : "bg-[#F7F5F0] text-[#666A65]"
                  }`}
                >
                  {rank <= 3 ? <Medal className="h-4 w-4" /> : `#${rank}`}
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0D7A5F]/12 text-[11px] font-extrabold text-[#0D7A5F]">
                  {entry.avatar_data ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={entry.avatar_data}
                      alt={entry.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    entry.display_name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-extrabold text-[#181A18]">
                      {entry.display_name}
                    </p>
                    {isMe && (
                      <span className="rounded-full bg-[#0D7A5F] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Kamu
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#666A65]">
                    Jajan {formatRupiah(entry.total_pengeluaran)} •{" "}
                    {entry.jumlah_transaksi}x
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#666A65]">
                    Sisa Uang
                  </p>
                  <p
                    className={`font-mono text-sm font-extrabold tabular-nums ${
                      isNeg ? "text-[#C83A3A]" : "text-[#0D7A5F]"
                    }`}
                  >
                    {formatRupiah(entry.sisa_uang)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
