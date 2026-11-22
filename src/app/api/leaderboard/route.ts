import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface LeaderboardRow {
  id: number;
  username: string;
  display_name: string;
  avatar_data: string | null;
  limit_pengeluaran: string;
  total_pengeluaran: string;
  sisa_uang: string;
  jumlah_transaksi: number;
}

export async function GET() {
  try {
    const res = await db.query<LeaderboardRow>(
      `SELECT
         u.id,
         u.username,
         u.display_name,
         u.avatar_data,
         u.limit_pengeluaran,
         COALESCE(SUM(e.harga), 0)::BIGINT AS total_pengeluaran,
         (u.limit_pengeluaran - COALESCE(SUM(e.harga), 0))::BIGINT AS sisa_uang,
         COUNT(e.id)::INT AS jumlah_transaksi
       FROM users u
       LEFT JOIN expenses e ON e.user_id = u.id
       GROUP BY u.id
       ORDER BY sisa_uang DESC, total_pengeluaran ASC, u.created_at ASC
       LIMIT 100`,
    );

    const leaderboard = res.rows.map((row) => ({
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      avatar_data: row.avatar_data,
      limit_pengeluaran: Number(row.limit_pengeluaran),
      total_pengeluaran: Number(row.total_pengeluaran),
      sisa_uang: Number(row.sisa_uang),
      jumlah_transaksi: Number(row.jumlah_transaksi),
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json(
      { error: "Gagal memuat leaderboard" },
      { status: 500 },
    );
  }
}
