"use client";

import { motion } from "framer-motion";
import { Banknote, Pencil, QrCode, Wallet } from "lucide-react";
import type { ExpenseSummary } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";

interface SummaryHeroProps {
  summary: ExpenseSummary;
  onEditLimit: () => void;
}

export function SummaryHero({ summary, onEditLimit }: SummaryHeroProps) {
  const {
    total_pengeluaran,
    limit_pengeluaran,
    sisa_uang,
    qris_total,
    cash_total,
    count,
  } = summary;

  const ratio =
    limit_pengeluaran > 0
      ? Math.min(100, Math.round((total_pengeluaran / limit_pengeluaran) * 100))
      : total_pengeluaran > 0
        ? 100
        : 0;

  const isOver = sisa_uang < 0;
  const isWarning = !isOver && limit_pengeluaran > 0 && ratio >= 75;

  const statusColor = isOver
    ? "text-[#C83A3A]"
    : isWarning
      ? "text-[#C97A16]"
      : "text-[#0D7A5F]";

  const barColor = isOver
    ? "bg-[#C83A3A]"
    : isWarning
      ? "bg-[#C97A16]"
      : "bg-[#0D7A5F]";

  const badgeText = isOver
    ? "Melebihi limit!"
    : isWarning
      ? "Limit hampir habis"
      : "Masih aman";

  const badgeBg = isOver
    ? "bg-[#C83A3A]/10 text-[#C83A3A]"
    : isWarning
      ? "bg-[#C97A16]/12 text-[#A66109]"
      : "bg-[#0D7A5F]/10 text-[#0D7A5F]";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] border border-[#181A18]/10 bg-white p-4.5 shadow-[0_8px_24px_rgba(24,26,24,0.05)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#666A65]">
            <Wallet className="h-3.5 w-3.5 text-[#0D7A5F]" />
            Sisa Uang Jajan
          </div>
          <div className={`mt-1 text-[28px] font-extrabold tracking-tight tabular-nums ${statusColor}`}>
            <AnimatedNumber value={sisa_uang} />
          </div>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeBg}`}>
          {badgeText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#666A65]">
          <span>Terpakai {ratio}% dari limit</span>
          <span className="font-mono">{count} transaksi</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EFECE5]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>

      {/* Total Pengeluaran & Edit Limit */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-[#F7F5F0] p-3">
          <p className="text-[11px] font-semibold text-[#666A65]">
            Total Pengeluaran
          </p>
          <p className="mt-1 font-mono text-[15px] font-bold text-[#181A18] tabular-nums">
            <AnimatedNumber value={total_pengeluaran} />
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onEditLimit}
          className="group rounded-2xl border border-[#181A18]/8 bg-[#F7F5F0] p-3 text-left transition-colors hover:border-[#0D7A5F]/40 hover:bg-[#EFF7F4]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#666A65]">
              Limit Jajan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#0D7A5F] shadow-2xs">
              <Pencil className="h-2.5 w-2.5" />
              Edit
            </span>
          </div>
          <p className="mt-1 font-mono text-[15px] font-bold text-[#181A18] tabular-nums">
            <AnimatedNumber value={limit_pengeluaran} />
          </p>
        </motion.button>
      </div>

      {/* Breakdown QRIS vs Cash */}
      <div className="mt-3 flex items-center gap-2 border-t border-[#181A18]/8 pt-3 text-xs">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#E7F4F0]/70 px-2.5 py-2">
          <QrCode className="h-3.5 w-3.5 shrink-0 text-[#0D7A5F]" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0D7A5F]">
              QRIS
            </p>
            <p className="truncate font-mono text-xs font-bold text-[#181A18] tabular-nums">
              {formatRupiah(qris_total)}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#FDF2E3]/85 px-2.5 py-2">
          <Banknote className="h-3.5 w-3.5 shrink-0 text-[#C97A16]" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A66109]">
              Cash
            </p>
            <p className="truncate font-mono text-xs font-bold text-[#181A18] tabular-nums">
              {formatRupiah(cash_total)}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
