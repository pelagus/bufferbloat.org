import Link from "next/link";
import { notFound } from "next/navigation";
import { d1Query, ensureD1Columns } from "../../../lib/d1";
import PrintResultButton from "../../test/components/PrintResultButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

type SharedResultRow = {
  created_at: string;
  grade: Grade | null;
  duration_seconds: number | null;
  idle_ms: number | null;
  download_latency_ms: number | null;
  upload_latency_ms: number | null;
  download_stress_ms: number | null;
  upload_stress_ms: number | null;
  download_mbps: number | null;
  upload_mbps: number | null;
  result_json: string | null;
  samples_json: string | null;
  application_scores_json: string | null;
};

type LatencySamples = {
  idle: number[];
  download: number[];
  upload: number[];
};

type ApplicationScore = {
  symbol: string;
  name: string;
  label: string;
  tone: "excellent" | "good" | "fair" | "poor";
  score: number;
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

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatLatency(value: number | null) {
  return value === null ? "—" : String(Math.round(value));
}

function formatSpeed(value: number | null) {
  if (value === null) return "—";
  if (value < 1) return "<1";
  return String(Math.round(value));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function sharedFindingFor(
  grade: Grade,
  idle: number | null,
  downloadStress: number | null,
  uploadStress: number | null
) {
  const typical = idle === null ? null : `${formatLatency(idle)} ms`;
  const meaningfulDownload = (downloadStress ?? 0) > 10;
  const meaningfulUpload = (uploadStress ?? 0) > 10;
  const worstMovement = Math.max(0, downloadStress ?? 0, uploadStress ?? 0);
  const uploadDominates =
    meaningfulUpload && (uploadStress ?? 0) > Math.max(10, (downloadStress ?? 0) * 1.35);
  const downloadDominates =
    meaningfulDownload && (downloadStress ?? 0) > Math.max(10, (uploadStress ?? 0) * 1.35);
  const source = uploadDominates
    ? "The problem showed up mostly while the connection was uploading."
    : downloadDominates
      ? "The problem showed up mostly while the connection was downloading."
      : meaningfulDownload || meaningfulUpload
        ? "Both download and upload load made the connection less responsive."
        : "The loaded phases did not add much delay.";
  const repeatNote =
    "Repeat the test before drawing a hard conclusion: networks vary during the day, and a single browser run can occasionally catch a transient problem.";

  if (grade === "F" || grade === "D" || grade === "C") {
    if (grade === "F" || worstMovement >= 80) {
      return `This connection became hard to trust once it was busy. ${source} Calls, games, and interactive work may stall even if a normal speed test looks fine. ${repeatNote}`;
    }

    return `This connection stayed usable, but the test found bufferbloat when the line was busy. ${source} You may notice lag during calls, games, or uploads. ${repeatNote}`;
  }

  if (grade === "B") {
    return `This is a solid result with some added delay under load. ${source} Most everyday use should be fine, but latency-sensitive work may feel less crisp when the connection is busy.`;
  }

  if (grade === "A+") {
    return "Exceptional result. The connection stayed calm while the test filled the line, so latency-sensitive apps should have plenty of room even when other traffic is active.";
  }

  if (typical && idle && idle > 120) {
    return `Good bufferbloat result, with an important footnote: the connection stayed stable under load, but the normal latency / ping is already high at about ${typical}.`;
  }

  return "Excellent bufferbloat result. The test pushed download and upload traffic, and latency / ping stayed close to its normal level.";
}

function sampleMedian(samples: number[]) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function chartAxisMax(value: number) {
  if (!Number.isFinite(value) || value <= 100) return 100;
  if (value <= 200) return Math.ceil(value / 25) * 25;
  if (value <= 500) return Math.ceil(value / 50) * 50;

  return Math.ceil(value / 100) * 100;
}

function pointsFor(samples: number[], startX: number, endX: number, yFor: (sample: number) => number) {
  if (!samples.length) return "";
  if (samples.length === 1) {
    const y = yFor(samples[0]);
    return `${startX.toFixed(1)},${y.toFixed(1)} ${(startX + 8).toFixed(1)},${y.toFixed(1)}`;
  }

  return samples
    .map((sample, index) => {
      const x = startX + (index / (samples.length - 1)) * (endX - startX);
      return `${x.toFixed(1)},${yFor(sample).toFixed(1)}`;
    })
    .join(" ");
}

function severityClass(grade: Grade | null) {
  if (grade === "A+" || grade === "A") return "good";
  if (grade === "B") return "ok";
  if (grade === "C") return "warn";
  return "bad";
}

function SharedLatencyChart({ samples }: { samples: LatencySamples }) {
  const chart = { left: 58, top: 28, width: 628, height: 248, bottom: 276 };
  const phaseWidth = chart.width / 3;
  const ranges = {
    idle: [chart.left, chart.left + phaseWidth - 10],
    download: [chart.left + phaseWidth + 10, chart.left + phaseWidth * 2 - 10],
    upload: [chart.left + phaseWidth * 2 + 10, chart.left + phaseWidth * 3],
  } as const;
  const values = [...samples.idle, ...samples.download, ...samples.upload].filter(Number.isFinite);
  const axisMax = chartAxisMax(values.length ? Math.max(...values) : 100);
  const axisMid = axisMax / 2;
  const yFor = (sample: number) => {
    const bounded = Math.min(axisMax, Math.max(0, sample));
    return chart.top + chart.height - (bounded / axisMax) * chart.height;
  };
  const medians = [
    { key: "idle", value: sampleMedian(samples.idle), range: ranges.idle },
    { key: "download", value: sampleMedian(samples.download), range: ranges.download },
    { key: "upload", value: sampleMedian(samples.upload), range: ranges.upload },
  ] as const;
  const sampleMarkers = [
    {
      key: "idle",
      label: "Quiet",
      className: "sample-idle",
      range: ranges.idle,
      values: samples.idle,
      median: sampleMedian(samples.idle),
    },
    {
      key: "download",
      label: "Download stress",
      className: "sample-download",
      range: ranges.download,
      values: samples.download,
      median: sampleMedian(samples.download),
    },
    {
      key: "upload",
      label: "Upload stress",
      className: "sample-upload",
      range: ranges.upload,
      values: samples.upload,
      median: sampleMedian(samples.upload),
    },
  ].flatMap((phase) =>
    phase.values.map((sample, index) => {
      const x =
        phase.values.length === 1
          ? phase.range[0]
          : phase.range[0] + (index / (phase.values.length - 1)) * (phase.range[1] - phase.range[0]);
      const y = yFor(sample);
      const labelAboveMedian = phase.median === null || sample >= phase.median;
      const preferredLabelY = labelAboveMedian ? y - 18 : y + 26;
      const labelY =
        preferredLabelY < chart.top + 12
          ? y + 26
          : preferredLabelY > chart.bottom - 8
            ? y - 18
            : preferredLabelY;

      return {
        key: `${phase.key}-${index}`,
        className: phase.className,
        label: `${phase.label} sample ${index + 1}: ${formatLatency(sample)} ms`,
        value: `${formatLatency(sample)} ms`,
        x,
        y,
        labelY,
      };
    })
  );

  return (
    <section className="latency-phase-chart result" aria-label="Shared latency / ping chart">
      <div className="latency-phase-chart-header">
        <strong>Latency / Ping in milliseconds</strong>
        <div className="latency-phase-legend" aria-hidden="true">
          <span className="idle">quiet line</span>
          <span className="download">download stress</span>
          <span className="upload">upload stress</span>
          <span className="reference">median dots</span>
        </div>
      </div>
      <svg viewBox="0 0 720 330" role="img" aria-label="Latency samples by phase">
        <rect className="phase-zone phase-zone-idle" x={chart.left} y={chart.top} width={phaseWidth} height={chart.height} />
        <rect className="phase-zone phase-zone-download" x={chart.left + phaseWidth} y={chart.top} width={phaseWidth} height={chart.height} />
        <rect className="phase-zone phase-zone-upload" x={chart.left + phaseWidth * 2} y={chart.top} width={phaseWidth} height={chart.height} />

        <line className="chart-axis" x1={chart.left} y1={chart.bottom} x2={chart.left + chart.width} y2={chart.bottom} />
        <line className="chart-axis" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
        {[axisMax, axisMid, 0].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="chart-grid" x1={chart.left} y1={y} x2={chart.left + chart.width} y2={y} />
              <text className="chart-axis-label" x={12} y={y + 4}>{Math.round(tick)}</text>
            </g>
          );
        })}
        <text className="chart-axis-label" x={11} y={18}>ms</text>
        <line className="phase-break" x1={chart.left + phaseWidth} y1={chart.top} x2={chart.left + phaseWidth} y2={chart.bottom} />
        <line className="phase-break" x1={chart.left + phaseWidth * 2} y1={chart.top} x2={chart.left + phaseWidth * 2} y2={chart.bottom} />

        <polyline className="latency-line line-idle" points={pointsFor(samples.idle, ranges.idle[0], ranges.idle[1], yFor)} />
        <polyline className="latency-line line-download" points={pointsFor(samples.download, ranges.download[0], ranges.download[1], yFor)} />
        <polyline className="latency-line line-upload" points={pointsFor(samples.upload, ranges.upload[0], ranges.upload[1], yFor)} />

        {medians.map((median) => {
          if (median.value === null) {
            return null;
          }

          const y = yFor(median.value);
          const x = median.range[0] + (median.range[1] - median.range[0]) / 2;
          const labelY = y < chart.top + 34 ? y + 26 : y - 18;

          return (
            <g className="latency-median-marker" key={median.key}>
              <line
                className="latency-median-line"
                x1={median.range[0]}
                x2={median.range[1]}
                y1={y}
                y2={y}
              />
              <circle cx={x} cy={y} r={7} />
              <text x={x} y={labelY}>
                {formatLatency(median.value)} ms
              </text>
            </g>
          );
        })}

        {sampleMarkers.map((point) => (
          <g
            aria-label={point.label}
            className={`latency-sample-marker ${point.className}`}
            key={point.key}
          >
            <title>{point.label}</title>
            <circle className="sample-hit" cx={point.x} cy={point.y} r={9} />
            <circle className="sample-dot" cx={point.x} cy={point.y} r={2.6} />
            <text className="sample-label" x={point.x} y={point.labelY}>{point.value}</text>
          </g>
        ))}

        <text className="chart-phase-label" x={chart.left + 10} y={310}>quiet</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth + 10} y={310}>download</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth * 2 + 10} y={310}>upload</text>
      </svg>
    </section>
  );
}

async function fetchSharedResult(shareId: string) {
  await d1Query(analyticsSchema);
  await ensureD1Columns("analytics_events", [
    "share_id TEXT",
    "result_json TEXT",
    "samples_json TEXT",
    "application_scores_json TEXT",
  ]);
  await d1Query("DELETE FROM analytics_events WHERE datetime(created_at) < datetime('now', '-180 days')");

  const data = await d1Query<SharedResultRow>(
    `
      SELECT
        created_at,
        grade,
        duration_seconds,
        idle_ms,
        download_latency_ms,
        upload_latency_ms,
        download_stress_ms,
        upload_stress_ms,
        download_mbps,
        upload_mbps,
        result_json,
        samples_json,
        application_scores_json
      FROM analytics_events
      WHERE share_id = ? AND event_type = 'completed' AND success = 1
      LIMIT 1
    `,
    [shareId]
  );

  return data.result?.[0]?.results?.[0] || null;
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  if (!/^[a-f0-9]{18}$/i.test(shareId)) {
    notFound();
  }

  const row = await fetchSharedResult(shareId);

  if (!row) {
    notFound();
  }

  const saved = safeJson<Partial<SharedResultRow & {
    grade: Grade;
    durationSeconds: number;
    idleMs: number;
    downloadLatencyMs: number;
    uploadLatencyMs: number;
    downloadStressMs: number;
    uploadStressMs: number;
    downloadMbps: number;
    uploadMbps: number;
  }>>(row.result_json, {});
  const samples = safeJson<LatencySamples>(row.samples_json, { idle: [], download: [], upload: [] });
  const applications = safeJson<ApplicationScore[]>(row.application_scores_json, []);
  const grade = (saved.grade || row.grade || "F") as Grade;
  const idleMs = saved.idleMs ?? row.idle_ms;
  const downloadStressMs = saved.downloadStressMs ?? row.download_stress_ms;
  const uploadStressMs = saved.uploadStressMs ?? row.upload_stress_ms;
  const measuredAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(row.created_at));

  return (
    <main className="test-shell">
      <div className="result-screen shared-result-screen">
        <section className="result-card result-scorecard terminal-card">
          <div className="result-compact-header">
            <div className="result-brand-lockup" aria-label="Bufferbloat.org">
              <strong>Bufferbloat.org</strong>
              <span>shared bufferbloat test result · Measured {measuredAt}</span>
            </div>
          </div>

          <div className="result-scorecard-grid">
            <div className="result-grade">
              <p>grade</p>
              <strong className={`${severityClass(grade)} ${grade === "A+" ? "grade-plus" : ""}`}>{grade}</strong>
              <span>Shared result</span>
            </div>

            <div className="result-scorecard-body">
              <p className="result-finding">
                {sharedFindingFor(grade, idleMs, downloadStressMs, uploadStressMs)}
              </p>

              <div className="result-metric-grid">
                <article><span>Download speed</span><strong>{formatSpeed(saved.downloadMbps ?? row.download_mbps)} Mbps</strong></article>
                <article><span>Upload speed</span><strong>{formatSpeed(saved.uploadMbps ?? row.upload_mbps)} Mbps</strong></article>
                <article><span>Test duration</span><strong>{formatDuration(saved.durationSeconds ?? row.duration_seconds)}</strong></article>
              </div>
            </div>
          </div>

          <div className="result-evidence-row">
            <div className="result-chart-cell">
              <SharedLatencyChart samples={samples} />
            </div>

            <div className="result-applications">
              <div className="result-section-heading">
                <span>Application performance</span>
              </div>

              <ol className="application-ranking-list">
                {applications.map((item) => (
                  <li className={item.tone} key={item.name}>
                    <span className="reliability-symbol" aria-hidden="true">{item.symbol}</span>
                    <span className="application-copy">
                      <strong>{item.name}</strong>
                      <em>{item.label}</em>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <Link className="methodology-row" href="/docs">
            Public measurement methodology
            <span aria-hidden="true">›</span>
          </Link>
        </section>

        <div className="result-share-actions">
          <div className="result-action-buttons">
            <Link className="result-rerun-button" href="/test?start=1">
              Run your own test
            </Link>
            <PrintResultButton />
          </div>
        </div>
      </div>
    </main>
  );
}
