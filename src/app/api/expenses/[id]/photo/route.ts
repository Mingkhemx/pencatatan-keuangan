import { NextResponse } from "next/server";
import { db, normalizeUsername } from "@/lib/db";

interface PhotoRow {
  id: number;
  nomor: number;
  tgl_beli: string;
  keterangan: string;
  harga: string;
  metode: "QRIS" | "CASH";
  foto_data: string | null;
  foto_name: string | null;
  display_name: string;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const expenseId = Number(id);
    if (!Number.isInteger(expenseId) || expenseId < 1) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const username = normalizeUsername(searchParams.get("username") || "");

    if (!username) {
      return NextResponse.json(
        { error: "Parameter username wajib diisi." },
        { status: 400 },
      );
    }

    const res = await db.query<PhotoRow>(
      `SELECT
         e.id,
         e.nomor,
         TO_CHAR(e.tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
         e.keterangan,
         e.harga,
         e.metode,
         e.foto_data,
         e.foto_name,
         u.display_name
       FROM expenses e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1 AND u.username = $2
       LIMIT 1`,
      [expenseId, username],
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: "Data tidak ditemukan." },
        { status: 404 },
      );
    }

    const row = res.rows[0];
    return NextResponse.json({
      photo: {
        id: row.id,
        nomor: Number(row.nomor),
        tgl_beli: row.tgl_beli,
        keterangan: row.keterangan,
        harga: Number(row.harga),
        metode: row.metode,
        foto_data: row.foto_data,
        foto_name: row.foto_name,
        display_name: row.display_name,
      },
    });
  } catch (err) {
    console.error("GET expense photo error:", err);
    return NextResponse.json(
      { error: "Gagal memuat foto bukti" },
      { status: 500 },
    );
  }
}
