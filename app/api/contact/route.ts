import { NextResponse } from "next/server";
import { d1Query, ensureD1Columns } from "../../../lib/d1";
import { getPrivateConfig } from "../../../lib/private-config";
import { locationFromHeaders } from "../../../lib/request-context";

export const runtime = "nodejs";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";

  return value.trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ensureContactColumns() {
  await d1Query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      category TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      page_path TEXT,
      user_agent TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      screenshot_name TEXT,
      screenshot_type TEXT,
      screenshot_size INTEGER,
      email_forwarded INTEGER DEFAULT 0
    )
  `);

  await ensureD1Columns("contact_messages", [
    "page_path TEXT",
    "country TEXT",
    "region TEXT",
    "city TEXT",
    "screenshot_name TEXT",
    "screenshot_type TEXT",
    "screenshot_size INTEGER",
    "email_forwarded INTEGER DEFAULT 0",
  ]);
}

async function storeContactMessage({
  id,
  createdAt,
  category,
  email,
  message,
  pagePath,
  userAgent,
  location,
  screenshot,
  emailForwarded,
}: {
  id: string;
  createdAt: string;
  category: string;
  email: string | null;
  message: string;
  pagePath: string | null;
  userAgent: string;
  location: ReturnType<typeof locationFromHeaders>;
  screenshot: { name: string; type: string; size: number } | null;
  emailForwarded: boolean;
}) {
  await ensureContactColumns();
  await d1Query(
    `
      INSERT INTO contact_messages (
        id,
        created_at,
        category,
        email,
        message,
        page_path,
        user_agent,
        country,
        region,
        city,
        screenshot_name,
        screenshot_type,
        screenshot_size,
        email_forwarded
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      createdAt,
      category,
      email,
      message,
      pagePath,
      userAgent,
      location.country,
      location.region,
      location.city,
      screenshot?.name ?? null,
      screenshot?.type ?? null,
      screenshot?.size ?? null,
      emailForwarded ? 1 : 0,
    ]
  );
}

async function markContactMessageForwarded(id: string) {
  await d1Query(
    `
      UPDATE contact_messages
      SET email_forwarded = 1
      WHERE id = ?
    `,
    [id]
  );
}

async function fileToAttachment(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    filename: file.name || "bufferbloat-feedback-screenshot",
    content: buffer.toString("base64"),
    type: file.type,
    disposition: "attachment",
  };
}

async function forwardContactEmail({
  id,
  createdAt,
  category,
  email,
  message,
  pagePath,
  userAgent,
  screenshotFile,
}: {
  id: string;
  createdAt: string;
  category: string;
  email: string | null;
  message: string;
  pagePath: string | null;
  userAgent: string;
  screenshotFile: File | null;
}) {
  const accountId = getPrivateConfig("CLOUDFLARE_ACCOUNT_ID");
  const apiToken = getPrivateConfig("CLOUDFLARE_EMAIL_SENDING_TOKEN");
  const from = getPrivateConfig("CONTACT_EMAIL_FROM");
  const to = getPrivateConfig("CONTACT_EMAIL_TO");

  if (!accountId || !apiToken || !from || !to) {
    return false;
  }

  const subject = `[Bufferbloat.org] ${category} feedback`;
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const replyTo = email || undefined;
  const attachments = screenshotFile ? [await fileToAttachment(screenshotFile)] : undefined;
  const body: Record<string, unknown> = {
    from,
    to,
    subject,
    html: `
        <h1>Bufferbloat.org contact</h1>
        <p><strong>Category:</strong> ${escapeHtml(category)}</p>
        <p><strong>From:</strong> ${escapeHtml(email || "not provided")}</p>
        <p><strong>Page:</strong> ${escapeHtml(pagePath || "not provided")}</p>
        <p><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
        <p><strong>Submission ID:</strong> ${escapeHtml(id)}</p>
        <p><strong>User agent:</strong> ${escapeHtml(userAgent)}</p>
        <hr />
        <p>${safeMessage}</p>
      `,
    text: [
      "Bufferbloat.org contact",
      `Category: ${category}`,
      `From: ${email || "not provided"}`,
      `Page: ${pagePath || "not provided"}`,
      `Created: ${createdAt}`,
      `Submission ID: ${id}`,
      `User agent: ${userAgent}`,
      "",
      message,
    ].join("\n"),
  };

  if (replyTo) {
    body.reply_to = replyTo;
  }

  if (attachments) {
    body.attachments = attachments;
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json().catch(() => null)) as
    | { success?: boolean; errors?: Array<{ message?: string }> }
    | null;

  if (!response.ok || data?.success === false) {
    const detail = data?.errors?.[0]?.message || "Email forwarding failed";
    throw new Error(detail);
  }

  return true;
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);

  if (!form) {
    return NextResponse.json(
      { ok: false, message: "Invalid form submission." },
      { status: 400 }
    );
  }

  const category = cleanText(form.get("category"), 80) || "feedback";
  const emailValue = cleanText(form.get("email"), 320).toLowerCase();
  const message = cleanText(form.get("message"), 6000);
  const pagePath = cleanText(form.get("pagePath"), 300) || null;
  const website = cleanText(form.get("website"), 200);
  const screenshotValue = form.get("screenshot");
  const screenshotFile = screenshotValue instanceof File && screenshotValue.size > 0
    ? screenshotValue
    : null;

  if (website) {
    return NextResponse.json({ ok: true, message: "Thanks." });
  }

  if (!message) {
    return NextResponse.json(
      { ok: false, message: "Add a message before sending." },
      { status: 400 }
    );
  }

  if (!emailValue) {
    return NextResponse.json(
      { ok: false, message: "Add your email address before sending." },
      { status: 400 }
    );
  }

  if (!isEmail(emailValue)) {
    return NextResponse.json(
      { ok: false, message: "Use a valid email address." },
      { status: 400 }
    );
  }

  if (screenshotFile) {
    if (screenshotFile.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        { ok: false, message: "Screenshot must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    if (!SCREENSHOT_TYPES.has(screenshotFile.type)) {
      return NextResponse.json(
        { ok: false, message: "Screenshot must be PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") || "unknown";
  const location = locationFromHeaders(request.headers);
  const screenshot = screenshotFile
    ? {
        name: screenshotFile.name || "screenshot",
        type: screenshotFile.type,
        size: screenshotFile.size,
      }
    : null;

  try {
    await storeContactMessage({
      id,
      createdAt,
      category,
      email: emailValue || null,
      message,
      pagePath,
      userAgent,
      location,
      screenshot,
      emailForwarded: false,
    });

    let emailForwarded = false;
    let emailForwardingFailed = false;

    try {
      emailForwarded = await forwardContactEmail({
        id,
        createdAt,
        category,
        email: emailValue || null,
        message,
        pagePath,
        userAgent,
        screenshotFile,
      });

      if (emailForwarded) {
        await markContactMessageForwarded(id);
      }
    } catch {
      emailForwardingFailed = true;
    }

    return NextResponse.json({
      ok: true,
      message: emailForwarded
        ? "Thanks. Your message was sent."
        : emailForwardingFailed
          ? "Thanks. Your message was saved, but email forwarding is temporarily unavailable."
          : "Thanks. Your message was saved, but email forwarding is not configured yet.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Contact storage is temporarily unavailable.",
      },
      { status: 503 }
    );
  }
}
