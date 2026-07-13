import { timingSafeEqual } from "crypto";
import { getPrivateConfig } from "./private-config";

export const ADMIN_SESSION_COOKIE = "bufferbloat_admin";

const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function adminPasswordMatches(value: string) {
  const expected = getPrivateConfig("SIGNUPS_ADMIN_PASSWORD");

  if (!expected) return false;

  const suppliedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function sessionSignature(issuedAt: string) {
  const expected = getPrivateConfig("SIGNUPS_ADMIN_PASSWORD");

  if (!expected) return "";

  return Buffer.from(`${issuedAt}:${expected}`).toString("base64url");
}

export function createAdminSessionCookie() {
  const issuedAt = String(Math.floor(Date.now() / 1000));
  const signature = sessionSignature(issuedAt);

  return `${issuedAt}.${signature}`;
}

export function adminSessionIsValid(value: string | undefined) {
  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  const issuedAtNumber = Number.parseInt(issuedAt || "", 10);

  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) {
    return false;
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - issuedAtNumber;

  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  const expectedSignature = sessionSignature(issuedAt);

  if (!expectedSignature) return false;

  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function adminApiCookieOptions() {
  return {
    ...adminCookieOptions(),
    path: "/",
  };
}

export function adminRequestIsAuthenticated(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!cookie) return false;

  return adminSessionIsValid(
    decodeURIComponent(cookie.slice(ADMIN_SESSION_COOKIE.length + 1))
  );
}
