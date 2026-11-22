import { NextResponse } from "next/server";
import { db, normalizeUsername } from "@/lib/db";

interface ExpenseRow {
  id: number;
  user_id: number;
  nomor: number;
  tgl_beli: string;
  keterangan: string;
  harga: string;
  metode: "QRIS" | "CASH";
  has_foto: boolean;
  foto_name: string | null;
  created_at: string;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const expenseId = Number(id);
    if (!Number.isInteger(expenseId) || expenseId < 1) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const body = await req.json();
    const username = normalizeUsername(
      typeof body?.username === "string" ? body.username : "",
    );
    const nomor = Number(body?.nomor);
    const tglBeli = typeof body?.tgl_beli === "string" ? body.tgl_beli.trim() : "";
    const keterangan =
      typeof body?.keterangan === "string" ? body.keterangan.trim() : "";
    const harga = Number(body?.harga);
    const metodeRaw =
      typeof body?.metode === "string" ? body.metode.trim().toUpperCase() : "";

    if (!username) {
      return NextResponse.json(
        { error: "Nama akun wajib diisi." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(nomor) || nomor < 1) {
      return NextResponse.json(
        { error: "Nomor transaksi harus bilangan bulat >= 1." },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tglBeli)) {
      return NextResponse.json(
        { error: "Tanggal beli tidak valid." },
        { status: 400 },
      );
    }
    if (!keterangan || keterangan.length > 160) {
      return NextResponse.json(
        { error: "Keterangan wajib diisi (maksimal 160 karakter)." },
        { status: 400 },
      );
    }
    if (!Number.isFinite(harga) || harga < 0 || harga > 1_000_000_000_000) {
      return NextResponse.json(
        { error: "Harga tidak valid." },
        { status: 400 },
      );
    }
    if (metodeRaw !== "QRIS" && metodeRaw !== "CASH") {
      return NextResponse.json(
        { error: "Metode harus QRIS atau CASH." },
        { status: 400 },
      );
    }

    const removeFoto = Boolean(body?.remove_foto);
    const hasNewFoto =
      typeof body?.foto_data === "string" && body.foto_data.trim().length > 0;

    if (hasNewFoto) {
      const trimmed = body.foto_data.trim();
      if (!trimmed.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Format foto tidak valid." },
          { status: 400 },
        );
      }
      if (trimmed.length > 2_500_000) {
        return NextResponse.json(
          { error: "Ukuran foto terlalu besar (maksimal ~1.8 MB)." },
          { status: 400 },
        );
      }
    }

    const fotoName =
      typeof body?.foto_name === "string" && body.foto_name.trim()
        ? body.foto_name.trim().slice(0, 120)
        : null;

    let query: string;
    let params: unknown[];

    if (removeFoto) {
      query = `
        UPDATE expenses e
        SET
          nomor = $1,
          tgl_beli = $2::date,
          keterangan = $3,
          harga = $4,
          metode = $5,
          foto_data = NULL,
          foto_name = NULL,
          updated_at = NOW()
        FROM users u
        WHERE e.id = $6 AND e.user_id = u.id AND u.username = $7
        RETURNING
          e.id, e.user_id, e.nomor,
          TO_CHAR(e.tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
          e.keterangan, e.harga, e.metode,
          (e.foto_data IS NOT NULL AND e.foto_data <> '') AS has_foto,
          e.foto_name, e.created_at
      `;
      params = [
        nomor,
        tglBeli,
        keterangan,
        Math.round(harga),
        metodeRaw,
        expenseId,
        username,
      ];
    } else if (hasNewFoto) {
      query = `
        UPDATE expenses e
        SET
          nomor = $1,
          tgl_beli = $2::date,
          keterangan = $3,
          harga = $4,
          metode = $5,
          foto_data = $6,
          foto_name = $7,
          updated_at = NOW()
        FROM users u
        WHERE e.id = $8 AND e.user_id = u.id AND u.username = $9
        RETURNING
          e.id, e.user_id, e.nomor,
          TO_CHAR(e.tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
          e.keterangan, e.harga, e.metode,
          (e.foto_data IS NOT NULL AND e.foto_data <> '') AS has_foto,
          e.foto_name, e.created_at
      `;
      params = [
        nomor,
        tglBeli,
        keterangan,
        Math.round(harga),
        metodeRaw,
        body.foto_data.trim(),
        fotoName,
        expenseId,
        username,
      ];
    } else {
      query = `
        UPDATE expenses e
        SET
          nomor = $1,
          tgl_beli = $2::date,
          keterangan = $3,
          harga = $4,
          metode = $5,
          updated_at = NOW()
        FROM users u
        WHERE e.id = $6 AND e.user_id = u.id AND u.username = $7
        RETURNING
          e.id, e.user_id, e.nomor,
          TO_CHAR(e.tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
          e.keterangan, e.harga, e.metode,
          (e.foto_data IS NOT NULL AND e.foto_data <> '') AS has_foto,
          e.foto_name, e.created_at
      `;
      params = [
        nomor,
        tglBeli,
        keterangan,
        Math.round(harga),
        metodeRaw,
        expenseId,
        username,
      ];
    }

    const updated = await db.query<ExpenseRow>(query, params);
    if (updated.rows.length === 0) {
      return NextResponse.json(
        { error: "Data pengeluaran tidak ditemukan." },
        { status: 404 },
      );
    }

    const row = updated.rows[0];
    return NextResponse.json({
      expense: {
        id: row.id,
        user_id: row.user_id,
        nomor: Number(row.nomor),
        tgl_beli: row.tgl_beli,
        keterangan: row.keterangan,
        harga: Number(row.harga),
        metode: row.metode,
        has_foto: Boolean(row.has_foto),
        foto_name: row.foto_name,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    console.error("PATCH expense error:", err);
    return NextResponse.json(
      { error: "Gagal mengubah data pengeluaran" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const deleted = await db.query<{ id: number }>(
      `DELETE FROM expenses e
       USING users u
       WHERE e.id = $1 AND e.user_id = u.id AND u.username = $2
       RETURNING e.id`,
      [expenseId, username],
    );

    if (deleted.rows.length === 0) {
      return NextResponse.json(
        { error: "Data pengeluaran tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ deletedId: deleted.rows[0].id });
  } catch (err) {
    console.error("DELETE expense error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus data pengeluaran" },
      { status: 500 },
    );
  }
}
