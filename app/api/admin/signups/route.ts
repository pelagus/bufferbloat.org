import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getPrivateConfig } from "../../../../lib/private-config";

export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type AdminSignupsBody = {
  password?: unknown;
};

type SignupRow = {
  email: string;
  created_at: string;
  user_agent: string | null;
};

type D1QueryResponse = {
  errors?: Array<{
    code?: number;
    message?: string;
  }>;
  result?: Array<{
    results?: SignupRow[];
  }>;
  success?: boolean;
};

function passwordMatches(value: string) {
  const expected = getPrivateConfig("SIGNUPS_ADMIN_PASSWORD");

  if (!expected) return false;

  const suppliedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}

async function fetchSignups() {
  const accountId = getPrivateConfig("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getPrivateConfig("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getPrivateConfig("CLOUDFLARE_D1_API_TOKEN");

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Missing D1 configuration");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: `
          SELECT email, created_at, user_agent
          FROM signups
          ORDER BY created_at DESC
          LIMIT 500
        `,
      }),
    }
  );

  const data = (await response.json()) as D1QueryResponse;

  if (!response.ok || data.success === false) {
    const detail = data.errors?.[0]?.message || "D1 read failed";
    throw new Error(detail);
  }

  return data.result?.[0]?.results || [];
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AdminSignupsBody | null;
  const password = String(body?.password || "").trim();

  if (!passwordMatches(password)) {
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
