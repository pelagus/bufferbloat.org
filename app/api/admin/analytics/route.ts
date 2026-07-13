import { NextResponse } from "next/server";
import { adminRequestIsAuthenticated } from "../../../../lib/admin-auth";
import { d1Query } from "../../../../lib/d1";

export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

type SummaryRow = {
  total_events: number;
  user_sessions: number;
  started_tests: number;
  completed_tests: number;
  failed_tests: number;
  unique_sessions: number;
  average_duration_seconds: number | null;
  average_download_mbps: number | null;
  average_upload_mbps: number | null;
  average_idle_ms: number | null;
  average_download_stress_ms: number | null;
  average_upload_stress_ms: number | null;
};

type BreakdownRow = {
  label: string | null;
  count: number;
};

type PeriodAnalyticsRow = {
  period: "today" | "yesterday" | "last7";
  started_tests: number;
  completed_tests: number;
  failed_tests: number;
};

type PeriodSignupRow = {
  period: "today" | "yesterday" | "last7";
  signups: number;
};

type RecentEventRow = {
  created_at: string;
  session_id: string;
  run_id: string;
  event_type: string;
  success: number | null;
  grade: string | null;
  error_message: string | null;
  duration_seconds: number | null;
  test_count: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  os_name: string | null;
  browser_name: string | null;
  viewport_bucket: string | null;
  idle_ms: number | null;
  download_latency_ms: number | null;
  upload_latency_ms: number | null;
  download_stress_ms: number | null;
  upload_stress_ms: number | null;
  download_mbps: number | null;
  upload_mbps: number | null;
  quiet_samples: number | null;
  download_samples: number | null;
  upload_samples: number | null;
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
    upload_samples INTEGER
  )
`;

async function fetchAnalytics() {
  await d1Query(analyticsSchema);

  const [
    summaryData,
    gradeData,
    deviceData,
    browserData,
    osData,
    locationData,
    periodData,
    periodSignupData,
    recentData,
  ] = await Promise.all([
    d1Query<SummaryRow>(`
      SELECT
        COUNT(*) AS total_events,
        SUM(CASE WHEN event_type = 'session' THEN 1 ELSE 0 END) AS user_sessions,
        SUM(CASE WHEN event_type = 'started' THEN 1 ELSE 0 END) AS started_tests,
        SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END) AS completed_tests,
        SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed_tests,
        COUNT(DISTINCT session_id) AS unique_sessions,
        AVG(CASE WHEN event_type = 'completed' THEN duration_seconds END) AS average_duration_seconds,
        AVG(CASE WHEN event_type = 'completed' THEN download_mbps END) AS average_download_mbps,
        AVG(CASE WHEN event_type = 'completed' THEN upload_mbps END) AS average_upload_mbps,
        AVG(CASE WHEN event_type = 'completed' THEN idle_ms END) AS average_idle_ms,
        AVG(CASE WHEN event_type = 'completed' THEN download_stress_ms END) AS average_download_stress_ms,
        AVG(CASE WHEN event_type = 'completed' THEN upload_stress_ms END) AS average_upload_stress_ms
      FROM analytics_events
    `),
    d1Query<BreakdownRow>(`
      SELECT COALESCE(grade, 'ungraded') AS label, COUNT(*) AS count
      FROM analytics_events
      WHERE event_type = 'completed'
      GROUP BY COALESCE(grade, 'ungraded')
      ORDER BY count DESC
    `),
    d1Query<BreakdownRow>(`
      SELECT COALESCE(device_type, 'unknown') AS label, COUNT(*) AS count
      FROM analytics_events
      GROUP BY COALESCE(device_type, 'unknown')
      ORDER BY count DESC
      LIMIT 10
    `),
    d1Query<BreakdownRow>(`
      SELECT COALESCE(browser_name, 'unknown') AS label, COUNT(*) AS count
      FROM analytics_events
      GROUP BY COALESCE(browser_name, 'unknown')
      ORDER BY count DESC
      LIMIT 10
    `),
    d1Query<BreakdownRow>(`
      SELECT COALESCE(os_name, 'unknown') AS label, COUNT(*) AS count
      FROM analytics_events
      GROUP BY COALESCE(os_name, 'unknown')
      ORDER BY count DESC
      LIMIT 10
    `),
    d1Query<BreakdownRow>(`
      SELECT
        COALESCE(NULLIF(city, ''), NULLIF(region, ''), NULLIF(country, ''), 'unknown') AS label,
        COUNT(*) AS count
      FROM analytics_events
      GROUP BY COALESCE(NULLIF(city, ''), NULLIF(region, ''), NULLIF(country, ''), 'unknown')
      ORDER BY count DESC
      LIMIT 12
    `),
    d1Query<PeriodAnalyticsRow>(`
      SELECT
        'today' AS period,
        SUM(CASE WHEN event_type = 'started' THEN 1 ELSE 0 END) AS started_tests,
        SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END) AS completed_tests,
        SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed_tests
      FROM analytics_events
      WHERE date(created_at) = date('now')

      UNION ALL

      SELECT
        'yesterday' AS period,
        SUM(CASE WHEN event_type = 'started' THEN 1 ELSE 0 END) AS started_tests,
        SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END) AS completed_tests,
        SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed_tests
      FROM analytics_events
      WHERE date(created_at) = date('now', '-1 day')

      UNION ALL

      SELECT
        'last7' AS period,
        SUM(CASE WHEN event_type = 'started' THEN 1 ELSE 0 END) AS started_tests,
        SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END) AS completed_tests,
        SUM(CASE WHEN event_type = 'failed' THEN 1 ELSE 0 END) AS failed_tests
      FROM analytics_events
      WHERE date(created_at) >= date('now', '-6 day')
    `),
    d1Query<PeriodSignupRow>(`
      SELECT 'today' AS period, COUNT(*) AS signups
      FROM signups
      WHERE date(created_at) = date('now')

      UNION ALL

      SELECT 'yesterday' AS period, COUNT(*) AS signups
      FROM signups
      WHERE date(created_at) = date('now', '-1 day')

      UNION ALL

      SELECT 'last7' AS period, COUNT(*) AS signups
      FROM signups
      WHERE date(created_at) >= date('now', '-6 day')
    `),
    d1Query<RecentEventRow>(`
      SELECT
        created_at,
        session_id,
        run_id,
        event_type,
        success,
        grade,
        error_message,
        duration_seconds,
        test_count,
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
        upload_samples
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 500
    `),
  ]);

  const periodSignupCounts = new Map(
    (periodSignupData.result?.[0]?.results || []).map((row) => [
      row.period,
      row.signups || 0,
    ])
  );

  const periods = (periodData.result?.[0]?.results || []).map((row) => ({
    period: row.period,
    started_tests: row.started_tests || 0,
    completed_tests: row.completed_tests || 0,
    failed_tests: row.failed_tests || 0,
    signups: periodSignupCounts.get(row.period) || 0,
  }));

  return {
    summary: summaryData.result?.[0]?.results?.[0] || null,
    grades: gradeData.result?.[0]?.results || [],
    devices: deviceData.result?.[0]?.results || [],
    browsers: browserData.result?.[0]?.results || [],
    operatingSystems: osData.result?.[0]?.results || [],
    locations: locationData.result?.[0]?.results || [],
    periods,
    recentEvents: recentData.result?.[0]?.results || [],
  };
}

export async function POST(request: Request) {
  if (!adminRequestIsAuthenticated(request)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: noStoreHeaders }
    );
  }

  try {
    const analytics = await fetchAnalytics();

    return NextResponse.json({
      ok: true,
      analytics,
    }, {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error
          ? `Cloudflare D1 read failed: ${error.message}`
          : "Analytics storage temporarily unavailable.",
      },
      { status: 503, headers: noStoreHeaders }
    );
  }
}
