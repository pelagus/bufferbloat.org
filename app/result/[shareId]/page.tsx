import { notFound, redirect } from "next/navigation";
import { d1Query, ensureD1Columns } from "../../../lib/d1";
import ApplicationIcon from "../../test/components/ApplicationIcon";
import SharedResultActions, { SharedResultHeaderActions } from "../../test/components/SharedResultActions";

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

type TechnicalRow = {
  metric: string;
  value: string;
  unit?: string;
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

function normalizeApplicationScore(item: ApplicationScore): ApplicationScore {
  if (item.name !== "Online gaming") {
    return item;
  }

  return {
    ...item,
    name: "Low-latency games",
    label: item.label === "Unstable" ? "Usable" : item.label,
  };
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

function formatDelta(value: number | null) {
  if (value === null) return "—";
  const rounded = Math.round(value);

  return `${rounded > 0 ? "+" : ""}${rounded} ms`;
}

function formatSampleList(samples: number[]) {
  return samples.length ? samples.map((sample) => Math.round(sample)).join(", ") : "—";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function variableName(row: TechnicalRow) {
  const baseName = row.metric
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (row.unit === "ms" && !baseName.endsWith("_ms")) return `${baseName}_ms`;
  if (row.unit === "Mbps" && !baseName.endsWith("_mbps")) return `${baseName}_mbps`;
  if (row.unit === "sec" && !baseName.endsWith("_sec")) return `${baseName}_sec`;

  return baseName;
}

function pickFindingVariant(seed: number, variants: string[]) {
  return variants[Math.abs(Math.round(seed)) % variants.length];
}

function practicalImpactFor(
  grade: Grade,
  idle: number | null,
  movement: number,
  downloadMbps: number | null,
  uploadMbps: number | null
) {
  const baseline = idle ?? 0;
  const down = downloadMbps ?? 0;
  const up = uploadMbps ?? 0;
  const throughputLimited = down > 0 && up > 0 && (down < 8 || up < 2);
  const highBaseline = baseline >= 100;
  const moderateBaseline = baseline >= 75;

  if (throughputLimited) {
    return "The line stayed responsive, so calls and ordinary streaming should be reliable; the limitation is speed, which may make 4K or 8K video, large downloads, and cloud backup slower or harder to sustain.";
  }

  if (grade === "A+" || grade === "A") {
    if (highBaseline) {
      return "Video calls, voice calls, browsing, and streaming should hold up well under load; low-latency games may still feel less immediate because the quiet-line ping is already high.";
    }

    if (moderateBaseline) {
      return "Video calls, voice calls, browsing, and streaming should feel steady; low-latency games should be usable, though not as crisp as on a very low-ping line.";
    }

    return "Video calls, voice calls, browsing, streaming, cloud backup, and low-latency games should all have plenty of room on this run.";
  }

  if (grade === "B") {
    return movement > 25
      ? "Browsing and streaming should be fine, but calls and low-latency games may feel less consistent when someone is uploading or downloading."
      : "Everyday apps should be fine, with only mild risk of rough edges for calls or low-latency games while the line is busy.";
  }

  if (grade === "C") {
    return "Browsing and video streaming may still work, but calls, meetings, and low-latency games can become uneven when the connection is busy.";
  }

  return "Bulk downloads may still show good Mbps, but calls, meetings, low-latency games, and interactive browsing are likely to suffer whenever the line is busy.";
}

function sharedFindingFor(
  grade: Grade,
  idle: number | null,
  downloadStress: number | null,
  uploadStress: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null
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
  const seed =
    (idle ?? 0) +
    (downloadStress ?? 0) * 3 +
    (uploadStress ?? 0) * 5 +
    (downloadMbps ?? 0) * 7 +
    (uploadMbps ?? 0) * 11;
  const impact = practicalImpactFor(grade, idle, worstMovement, downloadMbps, uploadMbps);
  const repeatNote =
    "Repeat the test before drawing a hard conclusion: networks vary during the day, and a single browser run can occasionally catch a transient problem.";

  if (grade === "F" || grade === "D" || grade === "C") {
    if (grade === "F" || worstMovement >= 80) {
      return pickFindingVariant(seed, [
        `This connection became hard to trust once it was busy. ${source} ${impact} ${repeatNote}`,
        `The line looked much worse under real traffic than a quiet speed reading would suggest. ${source} ${impact} ${repeatNote}`,
        `This is the kind of result that makes a connection feel fast one moment and frozen the next. ${source} ${impact} ${repeatNote}`,
      ]);
    }

    return pickFindingVariant(seed, [
      `This connection stayed usable, but the test found bufferbloat when the line was busy. ${source} ${impact} ${repeatNote}`,
      `The line is not broken, but it becomes less predictable under load. ${source} ${impact} ${repeatNote}`,
      `This result points to a connection that can work well when quiet, then feel uneven once other traffic competes for it. ${source} ${impact} ${repeatNote}`,
    ]);
  }

  if (grade === "B") {
    return pickFindingVariant(seed, [
      `This is a solid result with some added delay under load. ${source} ${impact}`,
      `The connection mostly kept its composure, but the busy-line test did add some delay. ${source} ${impact}`,
      `This line should be dependable for most use, with a small caveat under load. ${source} ${impact}`,
    ]);
  }

  if (grade === "A+") {
    return pickFindingVariant(seed, [
      `Exceptional result. The connection stayed calm while the test filled the line. ${impact}`,
      `This is exactly what a reliable line looks like under pressure: traffic increased, but latency / ping barely moved. ${impact}`,
      `The test could not make this connection meaningfully laggier. ${impact}`,
    ]);
  }

  if (typical && idle && idle > 120) {
    return pickFindingVariant(seed, [
      `Good bufferbloat result, with an important footnote: the connection stayed stable under load, but the normal latency / ping is already high at about ${typical}. ${impact}`,
      `The busy-line behavior is good, but the base ping is the main limitation here at about ${typical}. ${impact}`,
      `This looks like a stable line with a distance or routing limitation: load did not hurt much, but normal ping is already about ${typical}. ${impact}`,
    ]);
  }

  if (typical && idle && idle >= 75) {
    return pickFindingVariant(seed, [
      `Excellent bufferbloat result. Your quiet-line ping is about ${typical}, and the test did not make it much worse under load. ${impact}`,
      `The line starts from a moderate ping of about ${typical}, but the bufferbloat behavior is strong: load did not add much delay. ${impact}`,
      `This run shows a stable connection under pressure, even though the quiet-line ping is not extremely low at about ${typical}. ${impact}`,
    ]);
  }

  return pickFindingVariant(seed, [
    `Excellent bufferbloat result. Download and upload traffic were active, but latency / ping stayed close to normal. ${impact}`,
    `This connection behaved well in the situation that usually exposes bufferbloat: a busy line. ${impact}`,
    `The important result is stability: the line stayed responsive while data was moving in both directions. ${impact}`,
  ]);
}

function sampleMedian(samples: number[]) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function phaseLatencyVariation(samples: number[]) {
  if (samples.length < 2) return null;

  const totalMovement = samples
    .slice(1)
    .reduce((total, sample, index) => total + Math.abs(sample - samples[index]), 0);

  return totalMovement / (samples.length - 1);
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

function SharedLatencyChart({
  samples,
  downloadMbps,
  uploadMbps,
}: {
  samples: LatencySamples;
  downloadMbps: number | null;
  uploadMbps: number | null;
}) {
  const chart = { left: 58, top: 24, width: 628, height: 314, bottom: 338 };
  const phaseWidth = chart.width / 3;
  const ranges = {
    idle: [chart.left, chart.left + phaseWidth - 10],
    download: [chart.left + phaseWidth + 10, chart.left + phaseWidth * 2 - 10],
    upload: [chart.left + phaseWidth * 2 + 10, chart.left + phaseWidth * 3],
  } as const;
  const values = [...samples.idle, ...samples.download, ...samples.upload].filter(Number.isFinite);
  const variationBands = [
    {
      key: "idle",
      className: "variation-idle",
      range: ranges.idle,
      median: sampleMedian(samples.idle),
      variation: phaseLatencyVariation(samples.idle),
    },
    {
      key: "download",
      className: "variation-download",
      range: ranges.download,
      median: sampleMedian(samples.download),
      variation: phaseLatencyVariation(samples.download),
    },
    {
      key: "upload",
      className: "variation-upload",
      range: ranges.upload,
      median: sampleMedian(samples.upload),
      variation: phaseLatencyVariation(samples.upload),
    },
  ] as const;
  const variationBounds = variationBands.flatMap((item) =>
    item.median === null || item.variation === null
      ? []
      : [Math.max(0, item.median - item.variation), item.median + item.variation]
  );
  const variationLabels = variationBands
    .map((band) => {
      if (band.variation === null) {
        return null;
      }

      return {
        key: band.key,
        className: band.className,
        x: band.range[0] + (band.range[1] - band.range[0]) / 2,
        y: chart.top + 18,
        text: `variation ${formatLatency(band.variation)} ms`,
      };
    })
    .filter((label): label is {
      key: "idle" | "download" | "upload";
      className: "variation-idle" | "variation-download" | "variation-upload";
      x: number;
      y: number;
      text: string;
    } => label !== null);
  const medianValues = variationBands
    .map((item) => item.median)
    .filter((value): value is number => value !== null);
  const valuesForScale = [...values, ...variationBounds, ...medianValues];
  const axisMax = chartAxisMax(valuesForScale.length ? Math.max(...valuesForScale) : 100);
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
          <span className="variation">variation band</span>
          <span className="reference">median ping</span>
        </div>
      </div>
      <svg viewBox="0 0 720 360" role="img" aria-label="Latency samples by phase">
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

        {variationBands.map((band) => {
          if (band.median === null || band.variation === null) {
            return null;
          }

          const upperY = yFor(band.median + band.variation);
          const lowerY = yFor(Math.max(0, band.median - band.variation));
          const height = Math.max(2, lowerY - upperY);

          return (
            <rect
              aria-label={`${band.key} variation band: ${formatLatency(band.variation)} ms`}
              className={`latency-variation-band ${band.className}`}
              key={band.key}
              x={band.range[0]}
              y={upperY}
              width={band.range[1] - band.range[0]}
              height={height}
            />
          );
        })}

        {variationLabels.map((label) => (
          <g className={`latency-variation-label ${label.className}`} key={label.key}>
            <text x={label.x} y={label.y}>{label.text}</text>
          </g>
        ))}

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

        <text className="chart-phase-label" x={chart.left + 10} y={354}>quiet</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth + 10} y={354}>download</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth * 2 + 10} y={354}>upload</text>
      </svg>
      <div className="chart-throughput" aria-label="Average throughput during load phases">
        <span className="download">download {formatSpeed(downloadMbps)} Mb/s</span>
        <span className="upload">upload {formatSpeed(uploadMbps)} Mb/s</span>
      </div>
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

export async function SharedResultContent({ shareId }: { shareId: string }) {
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
    quietVariationMs: number;
    downloadVariationMs: number;
    uploadVariationMs: number;
    quietJitterMs: number;
    downloadJitterMs: number;
    uploadJitterMs: number;
  }>>(row.result_json, {});
  const samples = safeJson<LatencySamples>(row.samples_json, { idle: [], download: [], upload: [] });
  const applications = safeJson<ApplicationScore[]>(row.application_scores_json, []).map(normalizeApplicationScore);
  const grade = (saved.grade || row.grade || "F") as Grade;
  const idleMs = saved.idleMs ?? row.idle_ms;
  const downloadLatencyMs = saved.downloadLatencyMs ?? row.download_latency_ms;
  const uploadLatencyMs = saved.uploadLatencyMs ?? row.upload_latency_ms;
  const downloadStressMs = saved.downloadStressMs ?? row.download_stress_ms;
  const uploadStressMs = saved.uploadStressMs ?? row.upload_stress_ms;
  const downloadMbps = saved.downloadMbps ?? row.download_mbps;
  const uploadMbps = saved.uploadMbps ?? row.upload_mbps;
  const durationSeconds = saved.durationSeconds ?? row.duration_seconds;
  const quietVariation = saved.quietVariationMs ?? saved.quietJitterMs ?? null;
  const downloadVariation = saved.downloadVariationMs ?? saved.downloadJitterMs ?? null;
  const uploadVariation = saved.uploadVariationMs ?? saved.uploadJitterMs ?? null;
  const variationValues = [
    quietVariation,
    downloadVariation,
    uploadVariation,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const medianVariation = variationValues.length > 0 ? sampleMedian(variationValues) : null;
  const technicalRows: TechnicalRow[] = [
    { metric: "Grade", value: grade },
    { metric: "Quiet line ping", value: `${formatLatency(idleMs)} ms`, unit: "ms" },
    { metric: "Download latency / ping", value: `${formatLatency(downloadLatencyMs)} ms`, unit: "ms" },
    { metric: "Upload latency / ping", value: `${formatLatency(uploadLatencyMs)} ms`, unit: "ms" },
    { metric: "Download stress", value: formatDelta(downloadStressMs), unit: "ms" },
    { metric: "Upload stress", value: formatDelta(uploadStressMs), unit: "ms" },
    { metric: "Quiet latency variation", value: `${formatLatency(quietVariation)} ms`, unit: "ms" },
    { metric: "Download latency variation", value: `${formatLatency(downloadVariation)} ms`, unit: "ms" },
    { metric: "Upload latency variation", value: `${formatLatency(uploadVariation)} ms`, unit: "ms" },
    { metric: "Median latency variation", value: `${formatLatency(medianVariation)} ms`, unit: "ms" },
    { metric: "Download speed", value: `${formatSpeed(downloadMbps)} Mbps`, unit: "Mbps" },
    { metric: "Upload speed", value: `${formatSpeed(uploadMbps)} Mbps`, unit: "Mbps" },
    { metric: "Test duration", value: formatDuration(durationSeconds), unit: "sec" },
    { metric: "Quiet warm-up period", value: "3 sec", unit: "sec" },
    { metric: "Quiet samples", value: String(samples.idle.length) },
    { metric: "Download samples", value: String(samples.download.length) },
    { metric: "Upload samples", value: String(samples.upload.length) },
    { metric: "Quiet ping samples", value: formatSampleList(samples.idle), unit: "ms" },
    { metric: "Download ping samples", value: formatSampleList(samples.download), unit: "ms" },
    { metric: "Upload ping samples", value: formatSampleList(samples.upload), unit: "ms" },
  ];
  const technicalCsv = `${[
    ["Variable", "Value"],
    ...technicalRows.map((item) => [variableName(item), item.value]),
  ].map((csvRow) => csvRow.map(csvCell).join(",")).join("\n")}\n`;
  const technicalCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(technicalCsv)}`;
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
              <span>bufferbloat test result · Measured {measuredAt}</span>
            </div>
            <SharedResultHeaderActions sharePath={`/test?result=${shareId}`} />
          </div>

          <div className="result-scorecard-grid">
            <div className="result-grade">
              <p>grade</p>
              <strong className={`${severityClass(grade)} ${grade === "A+" ? "grade-plus" : ""}`}>{grade}</strong>
              <span>Test result</span>
            </div>

            <div className="result-scorecard-body">
              <p className="result-finding">
                {sharedFindingFor(grade, idleMs, downloadStressMs, uploadStressMs, downloadMbps, uploadMbps)}
              </p>
            </div>
          </div>

          <div className="result-evidence-row">
            <div className="result-applications">
              <div className="result-section-heading">
                <span>Application performance</span>
              </div>

              <ol className="application-ranking-list">
                {applications.map((item) => (
                  <li className={item.tone} key={item.name}>
                    <ApplicationIcon name={item.name} />
                    <span className="application-copy">
                      <strong>{item.name}</strong>
                      <em>{item.label}</em>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="result-chart-cell">
              <SharedLatencyChart samples={samples} downloadMbps={downloadMbps} uploadMbps={uploadMbps} />
            </div>
          </div>

          <details className="technical-details">
            <summary>
              <span className="technical-summary-label">
                <strong>Inspect measurement data</strong>
                <small>Open table · Export CSV</small>
              </span>
            </summary>

            <div className="technical-table-header">
              <a
                className="technical-methodology-link"
                href="/docs#technical-detail-export-fields"
                rel="noopener noreferrer"
                target="_blank"
              >
                Public methodology for these variables
              </a>
              <a
                aria-label="Export technical details as CSV"
                className="technical-export-button"
                download={`bufferbloat-test-details-${shareId}.csv`}
                href={technicalCsvHref}
                title="Export technical details as CSV"
              >
                <span aria-hidden="true">⇩</span>
                Export CSV
              </a>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {technicalRows.map((item) => (
                  <tr key={item.metric}>
                    <th scope="row">
                      {item.unit ? `${item.metric} (${item.unit})` : item.metric}
                    </th>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <SharedResultActions />
      </div>
    </main>
  );
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

  redirect(`/test?result=${shareId}`);
}
