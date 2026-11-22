import { Pool, type QueryResultRow } from "pg";

declare global {
  var __pgPool: Pool | undefined;
  var __schemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  if (!globalThis.__pgPool) {
    globalThis.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return globalThis.__pgPool;
}

export async function ensureSchema(): Promise<void> {
  if (!globalThis.__schemaReady) {
    globalThis.__schemaReady = (async () => {
      const migrationUrl =
        process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
      if (!migrationUrl) {
        throw new Error("Database connection string is missing.");
      }

      const migrationPool = new Pool({
        connectionString: migrationUrl,
        max: 1,
        connectionTimeoutMillis: 15000,
      });

      try {
        await migrationPool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            limit_pengeluaran BIGINT NOT NULL DEFAULT 500000,
            avatar_data TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;

          CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            nomor INTEGER NOT NULL,
            tgl_beli DATE NOT NULL,
            keterangan TEXT NOT NULL,
            harga BIGINT NOT NULL CHECK (harga >= 0),
            metode TEXT NOT NULL CHECK (metode IN ('QRIS', 'CASH')),
            foto_data TEXT,
            foto_name TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_expenses_user_sort
            ON expenses (user_id, tgl_beli DESC, nomor DESC, id DESC);
        `);
      } finally {
        await migrationPool.end();
      }
    })().catch((err) => {
      globalThis.__schemaReady = undefined;
      throw err;
    });
  }

  return globalThis.__schemaReady;
}

export const db = {
  async query<T extends QueryResultRow>(
    text: string,
    params?: unknown[],
  ) {
    await ensureSchema();
    return getPool().query<T>(text, params);
  },
  async getClient() {
    await ensureSchema();
    return getPool().connect();
  },
};

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function formatDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export interface UserAccount {
  id: number;
  username: string;
  display_name: string;
  limit_pengeluaran: number;
  avatar_data?: string | null;
}

export interface ExpenseItem {
  id: number;
  user_id: number;
  nomor: number;
  tgl_beli: string;
  keterangan: string;
  harga: number;
  metode: "QRIS" | "CASH";
  has_foto: boolean;
  foto_name: string | null;
  created_at: string;
}

export interface ExpenseSummary {
  total_pengeluaran: number;
  limit_pengeluaran: number;
  sisa_uang: number;
  count: number;
  qris_total: number;
  cash_total: number;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  display_name: string;
  avatar_data?: string | null;
  limit_pengeluaran: number;
  total_pengeluaran: number;
  sisa_uang: number;
  jumlah_transaksi: number;
}
