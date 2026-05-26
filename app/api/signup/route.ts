import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const SIGNUPS_FILE = path.join(DATA_DIR, "signups.json");

type SignupBody = {
  email?: unknown;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SignupBody | null;
  const email = String(body?.email || "").trim().toLowerCase();

  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email." },
      { status: 400 }
    );
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  let existing: string[] = [];

  try {
    existing = JSON.parse(await fs.readFile(SIGNUPS_FILE, "utf8")) as string[];
  } catch {
    existing = [];
  }

  const deduped = Array.from(new Set([...existing, email])).sort();

  await fs.writeFile(SIGNUPS_FILE, JSON.stringify(deduped, null, 2));

  return NextResponse.json({
    ok: true,
    message: "Thanks. We'll be in contact soon.",
  });
}
