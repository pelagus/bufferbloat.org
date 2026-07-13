"use client";

import { useEffect, useState } from "react";

type Summary = {
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

type Breakdown = {
  label: string | null;
  count: number;
};

type PeriodMetrics = {
  period: "today" | "yesterday" | "last7";
  started_tests: number;
  completed_tests: number;
  failed_tests: number;
  signups: number;
};

type RecentEvent = {
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

type AnalyticsPayload = {
  summary: Summary | null;
  grades: Breakdown[];
  devices: Breakdown[];
  browsers: Breakdown[];
  operatingSystems: Breakdown[];
  locations: Breakdown[];
  periods: PeriodMetrics[];
  recentEvents: RecentEvent[];
};

type AnalyticsResponse = {
  ok?: boolean;
  message?: string;
  analytics?: AnalyticsPayload;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function numberText(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return `${Math.round(value)}${suffix}`;
}

function decimalText(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return `${value.toFixed(1).replace(/\.0$/, "")}${suffix}`;
}

function locationText(event: RecentEvent) {
  return [event.city, event.region, event.country].filter(Boolean).join(", ") || "unknown";
}

function shortId(value: string) {
  return value.slice(0, 8);
}

const periodLabels: Record<PeriodMetrics["period"], string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
};

const defaultPeriods: PeriodMetrics[] = [
  {
    period: "today",
    started_tests: 0,
    completed_tests: 0,
    failed_tests: 0,
    signups: 0,
  },
  {
    period: "yesterday",
    started_tests: 0,
    completed_tests: 0,
    failed_tests: 0,
    signups: 0,
  },
  {
    period: "last7",
    started_tests: 0,
    completed_tests: 0,
    failed_tests: 0,
    signups: 0,
  },
];

function successRateText(period: PeriodMetrics) {
  if (period.started_tests <= 0) return "—";

  return `${Math.round((period.completed_tests / period.started_tests) * 100)}%`;
}

function BreakdownList({ title, rows }: { title: string; rows: Breakdown[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="analytics-breakdown">
      <h2>{title}</h2>

      {rows.length === 0 ? (
        <p className="muted">No data yet.</p>
      ) : (
        <ol>
          {rows.map((row) => {
            const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;

            return (
              <li key={`${title}-${row.label || "unknown"}`}>
                <span>{row.label || "unknown"}</span>
                <strong>{row.count}</strong>
                <em>{percent}%</em>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default function AnalyticsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/analytics", {
        method: "POST",
      });

      const data = (await response.json()) as AnalyticsResponse;

      setLoading(false);

      if (!response.ok || !data.ok) {
        setAnalytics(null);
        setMessage(data.message || "Unable to load analytics.");
        return;
      }

      setAnalytics(data.analytics || null);
      setMessage("");
    }

    void loadAnalytics();
  }, []);

  const summary = analytics?.summary;
  const successRate =
    summary && summary.started_tests > 0
      ? Math.round((summary.completed_tests / summary.started_tests) * 100)
      : null;

  return (
    <main className="page-shell admin-shell">
      <p className="eyebrow">private</p>

      <h1 className="page-title compact">Test analytics</h1>

      <p className="page-copy">
        First-party test events stored in Cloudflare D1. Sessions are per-tab,
        locations are coarse, and full user-agent fingerprints are not stored.
      </p>

      <section className="terminal-card admin-panel">
        {loading && (
          <p className="admin-message">Loading analytics...</p>
        )}

        {message && (
          <p className="admin-message bad">{message}</p>
        )}

        {analytics && (
          <div className="admin-results analytics-results">
            <div className="analytics-period-strip" aria-label="Recent topline analytics">
              {defaultPeriods.map((fallbackPeriod) => {
                const period = analytics.periods.find(
                  (row) => row.period === fallbackPeriod.period
                ) || fallbackPeriod;

                return (
                  <section className="analytics-period-card" key={period.period}>
                    <h2>{periodLabels[period.period]}</h2>

                    <div className="analytics-period-metrics">
                      <div>
                        <span>Started</span>
                        <strong>{period.started_tests}</strong>
                      </div>

                      <div>
                        <span>Completed</span>
                        <strong>{period.completed_tests}</strong>
                      </div>

                      <div>
                        <span>Success</span>
                        <strong>{successRateText(period)}</strong>
                      </div>

                      <div>
                        <span>Signups</span>
                        <strong>{period.signups}</strong>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="analytics-summary-grid">
              <div>
                <span>Sessions seen</span>
                <strong>{summary?.user_sessions ?? 0}</strong>
              </div>

              <div>
                <span>Started</span>
                <strong>{summary?.started_tests ?? 0}</strong>
              </div>

              <div>
                <span>Completed</span>
                <strong>{summary?.completed_tests ?? 0}</strong>
              </div>

              <div>
                <span>Failed</span>
                <strong>{summary?.failed_tests ?? 0}</strong>
              </div>

              <div>
                <span>Success rate</span>
                <strong>{successRate === null ? "—" : `${successRate}%`}</strong>
              </div>

              <div>
                <span>Sessions</span>
                <strong>{summary?.unique_sessions ?? 0}</strong>
              </div>

              <div>
                <span>Avg duration</span>
                <strong>{numberText(summary?.average_duration_seconds, " sec")}</strong>
              </div>

              <div>
                <span>Avg latency</span>
                <strong>{decimalText(summary?.average_idle_ms, " ms")}</strong>
              </div>

              <div>
                <span>Avg stress</span>
                <strong>
                  {decimalText(summary?.average_download_stress_ms, " / ")}
                  {decimalText(summary?.average_upload_stress_ms, " ms")}
                </strong>
              </div>

              <div>
                <span>Avg throughput</span>
                <strong>
                  {decimalText(summary?.average_download_mbps, " / ")}
                  {decimalText(summary?.average_upload_mbps, " Mbps")}
                </strong>
              </div>
            </div>

            <div className="analytics-breakdown-grid">
              <BreakdownList title="Grades" rows={analytics.grades} />
              <BreakdownList title="Device type" rows={analytics.devices} />
              <BreakdownList title="Browser" rows={analytics.browsers} />
              <BreakdownList title="Operating system" rows={analytics.operatingSystems} />
              <BreakdownList title="Location" rows={analytics.locations} />
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table analytics-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Grade</th>
                    <th>Session</th>
                    <th>Device</th>
                    <th>Viewport</th>
                    <th>Location</th>
                    <th>Latency</th>
                    <th>Stress</th>
                    <th>Speed</th>
                    <th>Samples</th>
                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.recentEvents.map((event) => (
                    <tr key={`${event.run_id}-${event.event_type}-${event.created_at}`}>
                      <td>{formatDate(event.created_at)}</td>
                      <td>{event.event_type}</td>
                      <td>{event.grade || "—"}</td>
                      <td>
                        {shortId(event.session_id)} / {shortId(event.run_id)}
                        <br />
                        <span>{numberText(event.test_count)} tests</span>
                      </td>
                      <td>
                        {event.device_type || "unknown"}
                        <br />
                        <span>{event.os_name || "unknown"} · {event.browser_name || "unknown"}</span>
                      </td>
                      <td>{event.viewport_bucket || "unknown"}</td>
                      <td>{locationText(event)}</td>
                      <td>
                        {decimalText(event.idle_ms, " ms")}
                        <br />
                        <span>
                          {decimalText(event.download_latency_ms)} / {decimalText(event.upload_latency_ms)}
                        </span>
                      </td>
                      <td>
                        {decimalText(event.download_stress_ms, " ms")}
                        <br />
                        <span>{decimalText(event.upload_stress_ms, " ms")}</span>
                      </td>
                      <td>
                        {decimalText(event.download_mbps, " Mbps")}
                        <br />
                        <span>{decimalText(event.upload_mbps, " Mbps")}</span>
                      </td>
                      <td>
                        {numberText(event.quiet_samples)}
                        <br />
                        <span>
                          {numberText(event.download_samples)} / {numberText(event.upload_samples)}
                        </span>
                      </td>
                      <td>{event.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
