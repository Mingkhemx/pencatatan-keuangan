import { NextResponse } from "next/server";
import { db, normalizeUsername } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const username = normalizeUsername(
      typeof body?.username === "string" ? body.username : "",
    );
    const limit = Number(body?.limit_pengeluaran);

    if (!username) {
      return NextResponse.json(
        { error: "Nama akun wajib diisi." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(limit) || limit < 0 || limit > 1_000_000_000_000) {
      return NextResponse.json(
        { error: "Limit pengeluaran tidak valid." },
        { status: 400 },
      );
    }

    const cleanLimit = Math.round(limit);

    const updated = await db.query<{
      id: number;
      username: string;
      display_name: string;
      limit_pengeluaran: string;
    }>(
      `UPDATE users
       SET limit_pengeluaran = $1, updated_at = NOW()
       WHERE username = $2
       RETURNING id, username, display_name, limit_pengeluaran`,
      [cleanLimit, username],
    );

    if (updated.rows.length === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    const user = updated.rows[0];
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        limit_pengeluaran: Number(user.limit_pengeluaran),
      },
    });
  } catch (err) {
    console.error("Update limit error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui limit pengeluaran" },
      { status: 500 },
    );
  }
}
