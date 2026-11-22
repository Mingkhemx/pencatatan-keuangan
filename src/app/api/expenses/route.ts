import { NextResponse } from "next/server";
import { db, normalizeUsername } from "@/lib/db";

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  limit_pengeluaran: string;
  avatar_data: string | null;
}

interface ExpenseListRow {
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

interface SummaryRow {
  total_pengeluaran: string;
  qris_total: string;
  cash_total: string;
  count: number;
}

function isValidIsoDate(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function validateFotoData(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("data:image/")) {
    throw new Error("Format foto harus berupa gambar (PNG/JPG/WebP).");
  }
  if (trimmed.length > 2_500_000) {
    throw new Error("Ukuran foto terlalu besar (maksimal ~1.8 MB).");
  }
  return trimmed;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = normalizeUsername(searchParams.get("username") || "");

    if (!username) {
      return NextResponse.json(
        { error: "Parameter username wajib diisi." },
        { status: 400 },
      );
    }

    const userRes = await db.query<UserRow>(
      `SELECT id, username, display_name, limit_pengeluaran, avatar_data
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [username],
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    const userRow = userRes.rows[0];
    const limitPengeluaran = Number(userRow.limit_pengeluaran);

    const [expensesRes, summaryRes] = await Promise.all([
      db.query<ExpenseListRow>(
        `SELECT
           id,
           user_id,
           nomor,
           TO_CHAR(tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
           keterangan,
           harga,
           metode,
           (foto_data IS NOT NULL AND foto_data <> '') AS has_foto,
           foto_name,
           created_at
         FROM expenses
         WHERE user_id = $1
         ORDER BY tgl_beli DESC, nomor DESC, id DESC`,
        [userRow.id],
      ),
      db.query<SummaryRow>(
        `SELECT
           COALESCE(SUM(harga), 0)::BIGINT AS total_pengeluaran,
           COALESCE(SUM(CASE WHEN metode = 'QRIS' THEN harga ELSE 0 END), 0)::BIGINT AS qris_total,
           COALESCE(SUM(CASE WHEN metode = 'CASH' THEN harga ELSE 0 END), 0)::BIGINT AS cash_total,
           COUNT(*)::INT AS count
         FROM expenses
         WHERE user_id = $1`,
        [userRow.id],
      ),
    ]);

    const s = summaryRes.rows[0];
    const totalPengeluaran = Number(s?.total_pengeluaran ?? 0);

    return NextResponse.json({
      user: {
        id: userRow.id,
        username: userRow.username,
        display_name: userRow.display_name,
        limit_pengeluaran: limitPengeluaran,
        avatar_data: userRow.avatar_data,
      },
      summary: {
        total_pengeluaran: totalPengeluaran,
        limit_pengeluaran: limitPengeluaran,
        sisa_uang: limitPengeluaran - totalPengeluaran,
        count: Number(s?.count ?? 0),
        qris_total: Number(s?.qris_total ?? 0),
        cash_total: Number(s?.cash_total ?? 0),
      },
      expenses: expensesRes.rows.map((row) => ({
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
      })),
    });
  } catch (err) {
    console.error("GET expenses error:", err);
    return NextResponse.json(
      { error: "Gagal memuat data pengeluaran" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = normalizeUsername(
      typeof body?.username === "string" ? body.username : "",
    );
    const tglBeli = typeof body?.tgl_beli === "string" ? body.tgl_beli.trim() : "";
    const keterangan =
      typeof body?.keterangan === "string" ? body.keterangan.trim() : "";
    const harga = Number(body?.harga);
    const metodeRaw =
      typeof body?.metode === "string" ? body.metode.trim().toUpperCase() : "";
    const requestedNomor =
      body?.nomor !== undefined && body?.nomor !== null && body?.nomor !== ""
        ? Number(body.nomor)
        : null;

    if (!username) {
      return NextResponse.json(
        { error: "Nama akun wajib diisi." },
        { status: 400 },
      );
    }
    if (!isValidIsoDate(tglBeli)) {
      return NextResponse.json(
        { error: "Tanggal beli tidak valid (YYYY-MM-DD)." },
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
        { error: "Harga harus berupa angka >= 0." },
        { status: 400 },
      );
    }
    if (metodeRaw !== "QRIS" && metodeRaw !== "CASH") {
      return NextResponse.json(
        { error: "Metode pembayaran harus QRIS atau CASH." },
        { status: 400 },
      );
    }
    if (
      requestedNomor !== null &&
      (!Number.isInteger(requestedNomor) || requestedNomor < 1)
    ) {
      return NextResponse.json(
        { error: "Nomor transaksi harus bilangan bulat >= 1." },
        { status: 400 },
      );
    }

    let fotoData: string | null = null;
    try {
      fotoData = validateFotoData(body?.foto_data);
    } catch (fotoErr) {
      return NextResponse.json(
        { error: fotoErr instanceof Error ? fotoErr.message : "Foto tidak valid" },
        { status: 400 },
      );
    }

    const fotoName =
      typeof body?.foto_name === "string" && body.foto_name.trim()
        ? body.foto_name.trim().slice(0, 120)
        : null;

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      const userRes = await client.query<{ id: number }>(
        `SELECT id FROM users WHERE username = $1 LIMIT 1`,
        [username],
      );

      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Akun tidak ditemukan." },
          { status: 404 },
        );
      }

      const userId = userRes.rows[0].id;

      let finalNomor = requestedNomor;
      if (finalNomor === null) {
        const maxRes = await client.query<{ next_nomor: number }>(
          `SELECT COALESCE(MAX(nomor), 0) + 1 AS next_nomor
           FROM expenses
           WHERE user_id = $1`,
          [userId],
        );
        finalNomor = Number(maxRes.rows[0]?.next_nomor ?? 1);
      }

      const insertRes = await client.query<ExpenseListRow>(
        `INSERT INTO expenses (
           user_id, nomor, tgl_beli, keterangan, harga, metode, foto_data, foto_name
         )
         VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8)
         RETURNING
           id,
           user_id,
           nomor,
           TO_CHAR(tgl_beli, 'YYYY-MM-DD') AS tgl_beli,
           keterangan,
           harga,
           metode,
           (foto_data IS NOT NULL AND foto_data <> '') AS has_foto,
           foto_name,
           created_at`,
        [
          userId,
          finalNomor,
          tglBeli,
          keterangan,
          Math.round(harga),
          metodeRaw,
          fotoData,
          fotoName,
        ],
      );

      await client.query("COMMIT");

      const row = insertRes.rows[0];
      return NextResponse.json(
        {
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
        },
        { status: 201 },
      );
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST expense error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pengeluaran" },
      { status: 500 },
    );
  }
}
