import { NextResponse } from "next/server";
import { adminRequestIsAuthenticated } from "../../../../lib/admin-auth";
import { d1Query } from "../../../../lib/d1";

export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type SignupRow = {
  email: string;
  created_at: string;
  user_agent: string | null;
  test_count: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

const signupMetadataColumns = [
  "ALTER TABLE signups ADD COLUMN test_count INTEGER DEFAULT 0",
  "ALTER TABLE signups ADD COLUMN country TEXT",
  "ALTER TABLE signups ADD COLUMN region TEXT",
  "ALTER TABLE signups ADD COLUMN city TEXT",
];

async function ensureSignupMetadataColumns() {
  for (const sql of signupMetadataColumns) {
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

async function fetchSignups() {
  await ensureSignupMetadataColumns();

  const data = await d1Query<SignupRow>(`
    SELECT email, created_at, user_agent, test_count, country, region, city
    FROM signups
    ORDER BY created_at DESC
    LIMIT 500
  `);

  return data.result?.[0]?.results || [];
}

export async function POST(request: Request) {
  if (!adminRequestIsAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: noStoreHeaders }
    );
  }

  try {
    const signups = await fetchSignups();

    return NextResponse.json({
      ok: true,
      signups,
    }, {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error
          ? `Cloudflare D1 read failed: ${error.message}`
          : "Signup storage temporarily unavailable.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
