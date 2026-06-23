import { NextResponse } from "next/server";
import { getPrivateConfig } from "../../../lib/private-config";

export const runtime = "nodejs";

type SignupBody = {
  email?: unknown;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function storeSignup(email: string, userAgent: string) {
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
          INSERT INTO signups (email, created_at, user_agent)
          VALUES (?, ?, ?)
          ON CONFLICT(email) DO NOTHING
        `,
        params: [
          email,
          new Date().toISOString(),
          userAgent,
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("D1 write failed");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;
  const email = String(body?.email || "").trim().toLowerCase();

  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Invalid email address." },
      { status: 400 }
    );
  }

  try {
    await storeSignup(
      email,
      request.headers.get("user-agent") || "unknown"
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
