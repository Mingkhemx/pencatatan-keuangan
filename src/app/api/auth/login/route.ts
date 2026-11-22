import { NextResponse } from "next/server";
import { db, formatDisplayName, normalizeUsername } from "@/lib/db";

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  limit_pengeluaran: string | number;
  avatar_data: string | null;
}

export async function GET() {
  try {
    const res = await db.query<{
      username: string;
      display_name: string;
      avatar_data: string | null;
    }>(
      `SELECT username, display_name, avatar_data
       FROM users
       ORDER BY updated_at DESC
       LIMIT 12`,
    );
    return NextResponse.json({ accounts: res.rows });
  } catch (err) {
    console.error("List accounts error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil daftar akun" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawName = typeof body?.name === "string" ? body.name : "";
    const displayName = formatDisplayName(rawName);
    const username = normalizeUsername(rawName);

    if (username.length < 1 || username.length > 40) {
      return NextResponse.json(
        { error: "Nama harus diisi (maksimal 40 karakter)." },
        { status: 400 },
      );
    }

    const requestedLimit =
      typeof body?.limit_pengeluaran === "number" &&
      Number.isFinite(body.limit_pengeluaran) &&
      body.limit_pengeluaran >= 0
        ? Math.round(body.limit_pengeluaran)
        : 500000;

    const existing = await db.query<UserRow>(
      `SELECT id, username, display_name, limit_pengeluaran, avatar_data
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [username],
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          limit_pengeluaran: Number(user.limit_pengeluaran),
          avatar_data: user.avatar_data,
        },
        isNew: false,
      });
    }

    const inserted = await db.query<UserRow>(
      `INSERT INTO users (username, display_name, limit_pengeluaran)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id, username, display_name, limit_pengeluaran, avatar_data`,
      [username, displayName, requestedLimit],
    );

    const user = inserted.rows[0];
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        limit_pengeluaran: Number(user.limit_pengeluaran),
        avatar_data: user.avatar_data,
      },
      isNew: true,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Gagal memproses login ke database" },
      { status: 500 },
    );
  }
}
