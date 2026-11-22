import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const res = await db.query<{ ok: number }>("SELECT 1 AS ok");
    return NextResponse.json({
      ok: res.rows[0]?.ok === 1,
      branch: process.env.NEON_BRANCH || "production",
    });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      { ok: false, error: "Database connection failed" },
      { status: 500 },
    );
  }
}
