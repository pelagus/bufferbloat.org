import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { d1Query, ensureD1Columns } from "../../../../lib/d1";
import { locationFromHeaders } from "../../../../lib/request-context";

export const runtime = "nodejs";

type AnalyticsEventBody = {
  sessionId?: unknown;
  runId?: unknown;
  eventType?: unknown;
  path?: unknown;
  referrerHost?: unknown;
  testCount?: unknown;
  device?: {
    type?: unknown;
    os?: unknown;
    browser?: unknown;
    viewport?: unknown;
  };
  result?: {
    success?: unknown;
    grade?: unknown;
    error?: unknown;
    durationSeconds?: unknown;
    idleMs?: unknown;
    downloadLatencyMs?: unknown;
    uploadLatencyMs?: unknown;
    downloadStressMs?: unknown;
    uploadStressMs?: unknown;
    downloadMbps?: unknown;
    uploadMbps?: unknown;
    quietVariationMs?: unknown;
    downloadVariationMs?: unknown;
    uploadVariationMs?: unknown;
    quietJitterMs?: unknown;
    downloadJitterMs?: unknown;
    uploadJitterMs?: unknown;
    quietSamples?: unknown;
    downloadSamples?: unknown;
    uploadSamples?: unknown;
    samples?: unknown;
    applications?: unknown;
  };
};

const analyticsSchema = `
  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    session_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    success INTEGER,
    grade TEXT,
    error_message TEXT,
    duration_seconds INTEGER,
    test_count INTEGER,
    path TEXT,
    referrer_host TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    viewport_bucket TEXT,
    idle_ms REAL,
    download_latency_ms REAL,
    upload_latency_ms REAL,
    download_stress_ms REAL,
    upload_stress_ms REAL,
    download_mbps REAL,
    upload_mbps REAL,
    quiet_samples INTEGER,
    download_samples INTEGER,
    upload_samples INTEGER,
    share_id TEXT,
    result_json TEXT,
    samples_json TEXT,
    application_scores_json TEXT
  )
`;

async function ensureAnalyticsStorage() {
  await d1Query(analyticsSchema);
  await ensureD1Columns("analytics_events", [
    "share_id TEXT",
    "result_json TEXT",
    "samples_json TEXT",
    "application_scores_json TEXT",
  ]);
  await d1Query("DELETE FROM analytics_events WHERE datetime(created_at) < datetime('now', '-180 days')");
}

function text(value: unknown, maxLength = 120) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, maxLength);
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const number = typeof value === "number"
    ? value
    : Number.parseFloat(String(value));

  if (!Number.isFinite(number)) return null;

  return number;
}

function integerValue(value: unknown, max = 100000) {
  const number = numberValue(value);
  if (number === null) return null;

  return Math.max(0, Math.min(max, Math.round(number)));
}

function eventType(value: unknown) {
  const normalized = text(value, 24);

  if (
    normalized === "session" ||
    normalized === "started" ||
    normalized === "completed" ||
    normalized === "failed"
  ) {
    return normalized;
  }

  return null;
}

function gradeValue(value: unknown) {
  const normalized = text(value, 2);

  if (
    normalized === "A+" ||
    normalized === "A" ||
    normalized === "B" ||
    normalized === "C" ||
    normalized === "D" ||
    normalized === "F"
  ) {
    return normalized;
  }

  return null;
}

function compactJson(value: unknown, maxLength = 24000) {
  if (value === null || value === undefined) return null;

  try {
    const json = JSON.stringify(value);
    return json.length <= maxLength ? json : null;
  } catch {
    return null;
  }
}

function publicShareId(type: string) {
  if (type !== "completed") return null;

  return randomUUID().replace(/-/g, "").slice(0, 18);
}

async function storeEvent(body: AnalyticsEventBody, headers: Headers) {
  const type = eventType(body.eventType);
  const sessionId = text(body.sessionId, 80);
  const runId = text(body.runId, 80);

  if (!type || !sessionId || !runId) {
    throw new Error("Invalid analytics event");
  }

  const result = body.result || {};
  const device = body.device || {};
  const location = locationFromHeaders(headers);
  const shareId = publicShareId(type);
  const resultJson = type === "completed"
    ? compactJson({
        grade: gradeValue(result.grade),
        durationSeconds: integerValue(result.durationSeconds, 3600),
        idleMs: numberValue(result.idleMs),
        downloadLatencyMs: numberValue(result.downloadLatencyMs),
        uploadLatencyMs: numberValue(result.uploadLatencyMs),
        downloadStressMs: numberValue(result.downloadStressMs),
        uploadStressMs: numberValue(result.uploadStressMs),
        downloadMbps: numberValue(result.downloadMbps),
        uploadMbps: numberValue(result.uploadMbps),
        quietVariationMs: numberValue(result.quietVariationMs ?? result.quietJitterMs),
        downloadVariationMs: numberValue(result.downloadVariationMs ?? result.downloadJitterMs),
        uploadVariationMs: numberValue(result.uploadVariationMs ?? result.uploadJitterMs),
        quietJitterMs: numberValue(result.quietVariationMs ?? result.quietJitterMs),
        downloadJitterMs: numberValue(result.downloadVariationMs ?? result.downloadJitterMs),
        uploadJitterMs: numberValue(result.uploadVariationMs ?? result.uploadJitterMs),
      })
    : null;

  await ensureAnalyticsStorage();
  await d1Query(
    `
      INSERT INTO analytics_events (
        id,
        created_at,
        session_id,
        run_id,
        event_type,
        success,
        grade,
        error_message,
        duration_seconds,
        test_count,
        path,
        referrer_host,
        country,
        region,
        city,
        device_type,
        os_name,
        browser_name,
        viewport_bucket,
        idle_ms,
        download_latency_ms,
        upload_latency_ms,
        download_stress_ms,
        upload_stress_ms,
        download_mbps,
        upload_mbps,
        quiet_samples,
        download_samples,
        upload_samples,
        share_id,
        result_json,
        samples_json,
        application_scores_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      randomUUID(),
      new Date().toISOString(),
      sessionId,
      runId,
      type,
      typeof result.success === "boolean" ? (result.success ? 1 : 0) : null,
      gradeValue(result.grade),
      text(result.error, 240),
      integerValue(result.durationSeconds, 3600),
      integerValue(body.testCount, 10000),
      text(body.path, 160),
      text(body.referrerHost, 120),
      location.country,
      location.region,
      location.city,
      text(device.type, 32),
      text(device.os, 48),
      text(device.browser, 48),
      text(device.viewport, 32),
      numberValue(result.idleMs),
      numberValue(result.downloadLatencyMs),
      numberValue(result.uploadLatencyMs),
      numberValue(result.downloadStressMs),
      numberValue(result.uploadStressMs),
      numberValue(result.downloadMbps),
      numberValue(result.uploadMbps),
      integerValue(result.quietSamples, 10000),
      integerValue(result.downloadSamples, 10000),
      integerValue(result.uploadSamples, 10000),
      shareId,
      resultJson,
      type === "completed" ? compactJson(result.samples) : null,
      type === "completed" ? compactJson(result.applications, 12000) : null,
    ]
  );

  return shareId;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AnalyticsEventBody | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, message: "Invalid analytics payload." },
      { status: 400 }
    );
  }

  try {
    const shareId = await storeEvent(body, request.headers);
    return NextResponse.json({ ok: true, shareId });
  } catch (error) {
    const invalid =
      error instanceof Error &&
      error.message === "Invalid analytics event";

    return NextResponse.json(
      {
        ok: false,
        message: invalid
          ? "Invalid analytics event."
          : "Analytics storage temporarily unavailable.",
      },
      { status: invalid ? 400 : 503 }
    );
  }
}
