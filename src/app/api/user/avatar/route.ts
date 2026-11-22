import { NextResponse } from "next/server";
import { db, normalizeUsername } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const username = normalizeUsername(
      typeof body?.username === "string" ? body.username : "",
    );

    if (!username) {
      return NextResponse.json(
        { error: "Nama akun wajib diisi." },
        { status: 400 },
      );
    }

    let avatarData: string | null = null;
    if (typeof body?.avatar_data === "string" && body.avatar_data.trim()) {
      const trimmed = body.avatar_data.trim();
      if (!trimmed.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Format foto profil harus berupa gambar." },
          { status: 400 },
        );
      }
      if (trimmed.length > 500_000) {
        return NextResponse.json(
          { error: "Ukuran foto profil terlalu besar." },
          { status: 400 },
        );
      }
      avatarData = trimmed;
    }

    const updated = await db.query<{
      id: number;
      username: string;
      display_name: string;
      limit_pengeluaran: string;
      avatar_data: string | null;
    }>(
      `UPDATE users
       SET avatar_data = $1, updated_at = NOW()
       WHERE username = $2
       RETURNING id, username, display_name, limit_pengeluaran, avatar_data`,
      [avatarData, username],
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
        avatar_data: user.avatar_data,
      },
    });
  } catch (err) {
    console.error("Update avatar error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui foto profil" },
      { status: 500 },
    );
  }
}
