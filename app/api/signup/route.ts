import { NextResponse } from "next/server";
import { d1Query } from "../../../lib/d1";
import { locationFromHeaders } from "../../../lib/request-context";

export const runtime = "nodejs";

type SignupBody = {
  email?: unknown;
  testCount?: unknown;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizedTestCount(value: unknown) {
  const count = typeof value === "number"
    ? value
    : Number.parseInt(String(value || "0"), 10);

  if (!Number.isFinite(count) || count < 0) return 0;

  return Math.min(Math.round(count), 10000);
}

async function ensureSignupMetadataColumns() {
  const columns = [
    "ALTER TABLE signups ADD COLUMN test_count INTEGER DEFAULT 0",
    "ALTER TABLE signups ADD COLUMN country TEXT",
    "ALTER TABLE signups ADD COLUMN region TEXT",
    "ALTER TABLE signups ADD COLUMN city TEXT",
  ];

  for (const sql of columns) {
    try {
      await d1Query(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (!message.toLowerCase().includes("duplicate column")) {
        throw error;
      }
    }
  }
}

async function storeSignup(
  email: string,
  userAgent: string,
  testCount: number,
  location: ReturnType<typeof locationFromHeaders>
) {
  await ensureSignupMetadataColumns();
  await d1Query(
    `
      INSERT INTO signups (
        email,
        created_at,
        user_agent,
        test_count,
        country,
        region,
        city
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        user_agent = excluded.user_agent,
        test_count = MAX(COALESCE(signups.test_count, 0), COALESCE(excluded.test_count, 0)),
        country = COALESCE(excluded.country, signups.country),
        region = COALESCE(excluded.region, signups.region),
        city = COALESCE(excluded.city, signups.city)
    `,
    [
      email,
      new Date().toISOString(),
      userAgent,
      testCount,
      location.country,
      location.region,
      location.city,
    ]
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;
  const email = String(body?.email || "").trim().toLowerCase();
  const testCount = normalizedTestCount(body?.testCount);

  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Invalid email address." },
      { status: 400 }
    );
  }

  try {
    await storeSignup(
      email,
      request.headers.get("user-agent") || "unknown",
      testCount,
      locationFromHeaders(request.headers)
    );

    return NextResponse.json({
      ok: true,
      message: "Thanks. You're on the list.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Signup storage temporarily unavailable.",
      },
      { status: 503 }
    );
  }
}
