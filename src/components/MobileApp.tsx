"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  LogOut,
  Plus,
  ReceiptText,
  RefreshCw,
  Trophy,
  Wallet,
} from "lucide-react";
import type { ExpenseItem, ExpenseSummary, UserAccount } from "@/lib/db";
import { generateReceiptImageDataUrl, triggerDownload } from "@/lib/format";
import { ExpenseList } from "./ExpenseList";
import { ExpenseFormPayload, ExpenseSheet } from "./ExpenseSheet";
import { LeaderboardView } from "./LeaderboardView";
import { LimitSheet } from "./LimitSheet";
import { LoginScreen } from "./LoginScreen";
import { PhotoPreviewSheet } from "./PhotoPreviewSheet";
import { ProfilePhotoSheet } from "./ProfilePhotoSheet";
import { SummaryHero } from "./SummaryHero";

const STORAGE_KEY = "jajannote_active_name";

export function MobileApp() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary>({
    total_pengeluaran: 0,
    limit_pengeluaran: 500000,
    sisa_uang: 500000,
    count: 0,
    qris_total: 0,
    cash_total: 0,
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<"notes" | "leaderboard">("notes");
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [limitSheetOpen, setLimitSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ExpenseItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  const fetchAccountData = useCallback(async (username: string) => {
    const res = await fetch(
      `/api/expenses?username=${encodeURIComponent(username)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      throw new Error("Gagal memuat data pengeluaran.");
    }
    const data = await res.json();
    setUser(data.user);
    setSummary(data.summary);
    setExpenses(data.expenses);
  }, []);

  const handleLogin = useCallback(
    async (rawName: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Gagal masuk dengan nama ini.");
        }
        localStorage.setItem(STORAGE_KEY, data.user.display_name);
        await fetchAccountData(data.user.username);
        setActiveTab("notes");
        showToast(
          data.isNew
            ? `Akun ${data.user.display_name} dibuat!`
            : `Selamat datang kembali, ${data.user.display_name}!`,
        );
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Gagal login.");
      } finally {
        setAuthLoading(false);
      }
    },
    [fetchAccountData, showToast],
  );

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => localStorage.getItem(STORAGE_KEY))
      .then((saved) => {
        if (!active || !saved) return;
        return handleLogin(saved);
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, [handleLogin]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setExpenses([]);
    setAuthError(null);
  };

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      await fetchAccountData(user.username);
      showToast("Data disegarkan");
    } catch {
      showToast("Gagal menyegarkan data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveExpense = async (payload: ExpenseFormPayload) => {
    if (!user) return;
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `/api/expenses/${payload.id}` : "/api/expenses";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        nomor: payload.nomor,
        tgl_beli: payload.tgl_beli,
        keterangan: payload.keterangan,
        harga: payload.harga,
        metode: payload.metode,
        foto_data: payload.foto_data,
        foto_name: payload.foto_name,
        remove_foto: payload.remove_foto,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Gagal menyimpan pengeluaran.");
    }

    await fetchAccountData(user.username);
    showToast(isEdit ? "Catatan diperbarui!" : "Pengeluaran tercatat!");
  };

  const handleDeleteExpense = async (id: number) => {
    if (!user) return;
    const res = await fetch(
      `/api/expenses/${id}?username=${encodeURIComponent(user.username)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      showToast("Gagal menghapus catatan");
      return;
    }
    await fetchAccountData(user.username);
    showToast("Catatan dihapus");
  };

  const handleSaveLimit = async (newLimit: number) => {
    if (!user) return;
    const res = await fetch("/api/user/limit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        limit_pengeluaran: newLimit,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Gagal mengubah limit.");
    }
    await fetchAccountData(user.username);
    showToast("Limit pengeluaran diperbarui!");
  };

  const handleSaveAvatar = async (avatarData: string | null) => {
    if (!user) return;
    const res = await fetch("/api/user/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        avatar_data: avatarData,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Gagal menyimpan foto profil.");
    }
    setUser(data.user);
    showToast(
      avatarData ? "Foto profil diperbarui!" : "Foto profil dihapus!",
    );
  };

  const handleQuickDownload = async (item: ExpenseItem) => {
    if (!user) return;
    if (item.has_foto) {
      try {
        const res = await fetch(
          `/api/expenses/${item.id}/photo?username=${encodeURIComponent(user.username)}`,
        );
        const data = await res.json();
        if (data?.photo?.foto_data) {
          triggerDownload(
            data.photo.foto_data,
            data.photo.foto_name ||
              `foto-${item.metode.toLowerCase()}-${item.nomor}.jpg`,
          );
          showToast(`Foto ${item.metode} diunduh!`);
          return;
        }
      } catch {
        showToast("Gagal mengunduh foto");
        return;
      }
    }

    const receiptUrl = generateReceiptImageDataUrl({
      nomor: item.nomor,
      tgl_beli: item.tgl_beli,
      keterangan: item.keterangan,
      harga: item.harga,
      metode: item.metode,
      displayName: user.display_name,
    });
    triggerDownload(
      receiptUrl,
      `bukti-${item.metode.toLowerCase()}-${item.nomor}.png`,
    );
    showToast(`Bukti ${item.metode} diunduh!`);
  };

  const nextNomor = useMemo(() => {
    if (expenses.length === 0) return 1;
    return Math.max(...expenses.map((e) => e.nomor)) + 1;
  }, [expenses]);

  return (
    <div className="paper-grid min-h-[100dvh] w-full flex justify-center">
      {/* Mobile-ONLY App Frame: full width on phone, centered 430px shell on wider viewports */}
      <div className="relative flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[#F7F5F0] shadow-[0_0_50px_rgba(24,26,24,0.10)]">
        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              className="pointer-events-none fixed top-[68px] z-50 w-full max-w-[400px] px-4"
            >
              <div className="mx-auto w-fit rounded-full bg-[#181A18] px-4 py-2 text-xs font-bold text-white shadow-lg">
                {toast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {booting ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0D7A5F] text-white"
            >
              <ReceiptText className="h-5 w-5" />
            </motion.div>
            <p className="text-xs font-bold text-[#666A65]">
              Membuka catatan jajan...
            </p>
          </div>
        ) : !user ? (
          <LoginScreen
            onLogin={handleLogin}
            loading={authLoading}
            error={authError}
          />
        ) : (
          <>
            {/* Sticky Mobile Top Bar */}
            <header className="sticky top-0 z-30 border-b border-[#181A18]/8 bg-[#F7F5F0]/90 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setProfileSheetOpen(true)}
                    title="Ganti foto profil"
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0D7A5F] text-xs font-extrabold text-white shadow-2xs ring-2 ring-white"
                  >
                    <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                      {user.avatar_data ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatar_data}
                          alt={user.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.display_name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#181A18] text-white">
                      <Camera className="h-2.5 w-2.5" />
                    </span>
                  </motion.button>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#666A65]">
                      Catatan Aktif
                    </p>
                    <h1 className="truncate text-sm font-extrabold text-[#181A18]">
                      {user.display_name}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Muat ulang data"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#444743] shadow-2xs"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#181A18] shadow-2xs transition-colors hover:bg-[#EFECE5]"
                  >
                    <LogOut className="h-3.5 w-3.5 text-[#C83A3A]" />
                    Ganti Akun
                  </motion.button>
                </div>
              </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 px-4 pb-28 pt-4">
              <AnimatePresence mode="wait">
                {activeTab === "notes" ? (
                  <motion.div
                    key="notes-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <SummaryHero
                      summary={summary}
                      onEditLimit={() => setLimitSheetOpen(true)}
                    />
                    <ExpenseList
                      expenses={expenses}
                      onEdit={(item) => {
                        setEditingItem(item);
                        setExpenseSheetOpen(true);
                      }}
                      onDelete={handleDeleteExpense}
                      onPreviewPhoto={(item) => setPreviewItem(item)}
                      onQuickDownload={handleQuickDownload}
                      onAddNew={() => {
                        setEditingItem(null);
                        setExpenseSheetOpen(true);
                      }}
                    />
                  </motion.div>
                ) : (
                  <LeaderboardView
                    key="leaderboard-tab"
                    currentUsername={user.username}
                  />
                )}
              </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation + Center Add Button */}
            <nav className="fixed bottom-0 z-30 w-full max-w-[430px] border-t border-[#181A18]/8 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5"
                >
                  {activeTab === "notes" && (
                    <motion.span
                      layoutId="bottomNavPill"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-[#E7F4F0]"
                    />
                  )}
                  <Wallet
                    className={`relative z-10 h-4 w-4 ${
                      activeTab === "notes"
                        ? "text-[#0D7A5F]"
                        : "text-[#7D817B]"
                    }`}
                  />
                  <span
                    className={`relative z-10 text-[11px] font-bold ${
                      activeTab === "notes"
                        ? "text-[#0D7A5F]"
                        : "text-[#7D817B]"
                    }`}
                  >
                    Catatanku
                  </span>
                </button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setEditingItem(null);
                    setExpenseSheetOpen(true);
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#181A18] px-5 py-3 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(24,26,24,0.24)]"
                >
                  <Plus className="h-4 w-4" />
                  Catat Jajan
                </motion.button>

                <button
                  type="button"
                  onClick={() => setActiveTab("leaderboard")}
                  className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5"
                >
                  {activeTab === "leaderboard" && (
                    <motion.span
                      layoutId="bottomNavPill"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-[#FDF2E3]"
                    />
                  )}
                  <Trophy
                    className={`relative z-10 h-4 w-4 ${
                      activeTab === "leaderboard"
                        ? "text-[#C97A16]"
                        : "text-[#7D817B]"
                    }`}
                  />
                  <span
                    className={`relative z-10 text-[11px] font-bold ${
                      activeTab === "leaderboard"
                        ? "text-[#A66109]"
                        : "text-[#7D817B]"
                    }`}
                  >
                    Peringkat
                  </span>
                </button>
              </div>
            </nav>

            {/* Bottom Sheets */}
            <ExpenseSheet
              key={
                editingItem
                  ? `edit-${editingItem.id}`
                  : `new-${expenseSheetOpen ? nextNomor : "closed"}`
              }
              open={expenseSheetOpen}
              username={user.username}
              editingItem={editingItem}
              nextNomor={nextNomor}
              onClose={() => {
                setExpenseSheetOpen(false);
                setEditingItem(null);
              }}
              onSave={handleSaveExpense}
            />

            <LimitSheet
              key={`limit-${limitSheetOpen}-${summary.limit_pengeluaran}`}
              open={limitSheetOpen}
              currentLimit={summary.limit_pengeluaran}
              onClose={() => setLimitSheetOpen(false)}
              onSave={handleSaveLimit}
            />

            <PhotoPreviewSheet
              key={previewItem ? `photo-${previewItem.id}` : "photo-closed"}
              item={previewItem}
              username={user.username}
              displayName={user.display_name}
              onClose={() => setPreviewItem(null)}
              onDownloaded={() => showToast("Foto berhasil diunduh!")}
            />

            <ProfilePhotoSheet
              key={`avatar-${profileSheetOpen}-${Boolean(user.avatar_data)}`}
              open={profileSheetOpen}
              displayName={user.display_name}
              currentAvatar={user.avatar_data}
              onClose={() => setProfileSheetOpen(false)}
              onSave={handleSaveAvatar}
            />
          </>
        )}
      </div>
    </div>
  );
}
