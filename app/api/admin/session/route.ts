import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminApiCookieOptions,
  adminPasswordMatches,
  createAdminSessionCookie,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type AdminSessionBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AdminSessionBody | null;
  const password = String(body?.password || "").trim();

  if (!adminPasswordMatches(password)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: noStoreHeaders }
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: noStoreHeaders }
  );

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionCookie(),
    adminApiCookieOptions()
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { ok: true },
    { headers: noStoreHeaders }
  );

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminApiCookieOptions(),
    maxAge: 0,
  });

  return response;
}
