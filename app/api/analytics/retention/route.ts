import { NextResponse } from "next/server";
import { d1Query } from "../../../../lib/d1";

export const runtime = "nodejs";

export async function GET() {
  try {
    await d1Query("DELETE FROM analytics_events WHERE datetime(created_at) < datetime('now', '-180 days')");

    return NextResponse.json({
      ok: true,
      retentionDays: 180,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Retention cleanup temporarily unavailable.",
      },
      { status: 503 }
    );
  }
}
