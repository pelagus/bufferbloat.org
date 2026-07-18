import { notFound, redirect } from "next/navigation";
import { d1Query, ensureD1Columns } from "../../../lib/d1";
import ApplicationIcon from "../../test/components/ApplicationIcon";
import LocalMeasuredTime from "../../test/components/LocalMeasuredTime";
import ResultPrintController from "../../test/components/ResultPrintController";
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

type ResultContextItem = {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "ok" | "warn" | "bad";
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
    if (item.name === "Voice calls" || item.name === "Audio streaming") {
      return {
        ...item,
        name: "Audio calls",
      };
    }

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

  const median = sampleMedian(samples);
  const p95 = samplePercentile(samples, 0.95);

  if (median === null || p95 === null) {
    return null;
  }

  return Math.max(0, p95 - median);
}

function phaseAppTailVariation(samples: number[]) {
  if (samples.length < 2) return null;

  const median = sampleMedian(samples);

  if (median === null) return null;

  const p75 = samplePercentile(samples, 0.75);
  const p90 = samplePercentile(samples, 0.9);
  const p95 = samplePercentile(samples, 0.95);

  if (p75 === null || p90 === null || p95 === null) return null;

  const p75Spread = Math.max(0, p75 - median);
  const p90Spread = Math.max(0, p90 - median);
  const p95Spread = Math.max(0, p95 - median);

  if (samples.length < 30) {
    return p75Spread;
  }

  if (samples.length < 50) {
    return p75Spread * 0.55 + p90Spread * 0.45;
  }

  if (samples.length < 100) {
    return p90Spread * 0.7 + p95Spread * 0.3;
  }

  return p95Spread;
}

function phaseSpikeRisk(samples: number[]) {
  if (samples.length < 2) return null;

  const median = sampleMedian(samples);

  if (median === null) return null;

  const sorted = [...samples].sort((a, b) => b - a);
  const highest = sorted[0];
  const secondHighest = sorted[1] ?? highest;
  const spikeThreshold = median + Math.max(150, median * 1.5);
  const spikeCount = samples.filter((sample) => sample >= spikeThreshold).length;

  return {
    highest,
    secondHighest,
    spikeCount,
    isolated:
      spikeCount > 0 &&
      spikeCount <= 2 &&
      highest - secondHighest > Math.max(150, median),
  };
}

function loadedLatency(downloadLatency: number | null, uploadLatency: number | null) {
  if (downloadLatency === null && uploadLatency === null) return null;
  return Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
}

function applicationRankingsFor(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadStress: number | null,
  uploadStress: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null,
  latencySamples: LatencySamples
): ApplicationScore[] {
  const baseline = idle ?? 0;
  const worstLoadedLatency = Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
  const movement = Math.max(0, downloadStress ?? 0, uploadStress ?? 0);
  const downloadVariation = phaseAppTailVariation(latencySamples.download);
  const uploadVariation = phaseAppTailVariation(latencySamples.upload);
  const worstVariation = Math.max(
    phaseAppTailVariation(latencySamples.idle) ?? 0,
    downloadVariation ?? 0,
    uploadVariation ?? 0
  );
  const loadedVariation = Math.max(downloadVariation ?? 0, uploadVariation ?? 0);
  const down = downloadMbps ?? 0;
  const up = uploadMbps ?? 0;
  const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
  const speedScore = (value: number, good: number, usable: number) => {
    if (value >= good) return 100;
    if (value >= usable) return 72 + ((value - usable) / (good - usable)) * 20;
    return Math.max(22, (value / usable) * 62);
  };
  const labelFor = (score: number) => {
    if (score >= 80) return { label: "Very reliable", tone: "excellent" as const };
    if (score >= 60) return { label: "Reliable", tone: "good" as const };
    if (score >= 35) return { label: "Usable", tone: "fair" as const };
    return { label: "Poor", tone: "poor" as const };
  };
  const tailPenalty = (value: number | null, cap: number, weight: number) =>
    Math.min(value ?? 0, cap) * weight;

  return [
    {
      symbol: "⌁",
      name: "Web browsing",
      score: clampScore(96 - movement * 0.2 - tailPenalty(loadedVariation, 90, 0.04) - Math.max(0, worstLoadedLatency - 180) * 0.18),
    },
    {
      symbol: "▶",
      name: "Video streaming",
      score: clampScore(speedScore(down, 25, 8) - movement * 0.04 - tailPenalty(loadedVariation, 100, 0.02)),
    },
    {
      symbol: "☎",
      name: "Audio calls",
      score: clampScore(
        96 - Math.max(0, baseline - 90) * 0.16 - movement * 0.32 - tailPenalty(worstVariation, 100, 0.16) - Math.max(0, 1 - up) * 18
      ),
    },
    {
      symbol: "◉",
      name: "Video calls",
      score: clampScore(
        94 -
          Math.max(0, baseline - 80) * 0.22 -
          movement * 0.36 -
          tailPenalty(worstVariation, 110, 0.16) -
          Math.max(0, 10 - down) * 2 -
          Math.max(0, 3 - up) * 10
      ),
    },
    {
      symbol: "◆",
      name: "Low-latency games",
      score: clampScore(96 - Math.max(0, baseline - 80) * 0.28 - movement * 0.4 - tailPenalty(worstVariation, 120, 0.18)),
    },
    {
      symbol: "⇧",
      name: "Cloud backup",
      score: clampScore(speedScore(up, 10, 2) - movement * 0.18 - tailPenalty(uploadVariation, 140, 0.03)),
    },
  ]
    .map((item) => ({ ...item, ...labelFor(item.score) }))
    .sort((a, b) => b.score - a.score);
}

function contextItemsForSharedResult({
  grade,
  idle,
  downloadLatency,
  uploadLatency,
  downloadStress,
  uploadStress,
  downloadMbps,
  uploadMbps,
  samples,
  applications,
}: {
  grade: Grade;
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;
  downloadStress: number | null;
  uploadStress: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  samples: LatencySamples;
  applications: ApplicationScore[];
}): ResultContextItem[] {
  const movement = Math.max(0, downloadStress ?? 0, uploadStress ?? 0);
  const baseline = idle ?? 0;
  const down = downloadMbps ?? 0;
  const up = uploadMbps ?? 0;
  const loaded = loadedLatency(downloadLatency, uploadLatency);
  const weakestApp = [...applications].sort((a, b) => a.score - b.score)[0];
  const strongestSpike = [
    { label: "quiet line", risk: phaseSpikeRisk(samples.idle) },
    { label: "download load", risk: phaseSpikeRisk(samples.download) },
    { label: "upload load", risk: phaseSpikeRisk(samples.upload) },
  ]
    .filter((item) => item.risk !== null)
    .sort((a, b) => (b.risk?.highest ?? 0) - (a.risk?.highest ?? 0))[0];
  const spikeValue = strongestSpike?.risk?.highest ?? 0;
  const uploadDominates = (uploadStress ?? 0) > Math.max(25, (downloadStress ?? 0) * 1.35);
  const downloadDominates = (downloadStress ?? 0) > Math.max(25, (uploadStress ?? 0) * 1.35);
  const pressureTone =
    movement <= 30 ? "good" : movement <= 80 ? "warn" : movement <= 180 ? "warn" : "bad";
  const capacityLimited = down > 0 && up > 0 && (down < 8 || up < 2);
  const baselineLimited = baseline >= 100;
  const gradeTone =
    grade === "A+" || grade === "A" || grade === "B"
      ? "good"
      : grade === "C"
        ? "warn"
        : "bad";
  const stressSource = uploadDominates
    ? "maxing out the upload link"
    : downloadDominates
      ? "maxing out the download link"
      : "maxing out the connection";
  const stressEffect =
    movement <= 12
      ? "did not meaningfully change network stability"
      : "disrupted network stability";
  const verification =
    movement <= 12
      ? "this is a strong result"
      : "repeat the test at different times to verify this persists";
  const spikePhrase =
    spikeValue >= 300
      ? ` A ${formatLatency(spikeValue)} ms spike was also seen during ${strongestSpike?.label}.`
      : "";
  const practicalImpact =
    uploadDominates && (weakestApp?.tone === "poor" || weakestApp?.tone === "fair")
      ? "In practical terms, video calls or games with live streaming could stutter when your camera is on, especially above 720p."
      : weakestApp?.tone === "poor" || weakestApp?.tone === "fair"
        ? `In practical terms, this could show up as ${weakestApp.name.toLowerCase()} becoming unstable while the line is busy.`
        : loaded !== null
          ? `In practical terms, everyday apps should remain steady, with loaded ping around ${formatLatency(loaded)} ms.`
          : "In practical terms, everyday apps should remain steady.";
  const assessment = capacityLimited
    ? `The link speed looked limited at ${formatSpeed(downloadMbps)} down / ${formatSpeed(uploadMbps)} up.\n\n${practicalImpact}`
    : baselineLimited
      ? `The quiet-line ping was already high at ${formatLatency(idle)} ms.\n\n${practicalImpact}`
      : `${stressSource} ${stressEffect} in this run; ${verification}.${spikePhrase}\n\n${practicalImpact}`;

  return [
    {
      label: "Network assessment",
      value: assessment,
      detail: "",
      tone: gradeTone,
    },
  ];
}

function samplePercentile(samples: number[], percentile: number) {
  if (!samples.length) return null;

  const sorted = [...samples].sort((a, b) => a - b);
  const clamped = Math.min(1, Math.max(0, percentile));
  const position = (sorted.length - 1) * clamped;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function chartAxisMax(value: number, minimum = 100) {
  if (!Number.isFinite(value) || value <= minimum) return minimum;
  if (value <= 200) return Math.ceil(value / 25) * 25;
  if (value <= 500) return Math.ceil(value / 50) * 50;

  return Math.ceil(value / 100) * 100;
}

function scorecardAxisBounds(values: number[]) {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return { min: 0, max: 100 };

  const minValue = Math.min(...finiteValues);
  const maxValue = Math.max(...finiteValues);
  const baseMin = Math.max(0, minValue * 0.9);
  const baseMax = Math.max(maxValue * 1.06, baseMin + 10);
  const padding = Math.max(4, (baseMax - baseMin) * 0.04);
  const min = Math.max(0, baseMin - padding);
  const max = baseMax + padding;

  return { min, max };
}

function robustChartAxisMax(samples: number[], anchors: number[], minimum = 100) {
  const finiteSamples = samples.filter(Number.isFinite);
  const finiteAnchors = anchors.filter(Number.isFinite);
  const p95 = samplePercentile(finiteSamples, 0.95);
  const anchorMax = finiteAnchors.length ? Math.max(...finiteAnchors) : 0;

  return chartAxisMax(Math.max(minimum, (p95 ?? 0) * 1.15, anchorMax * 1.08), minimum);
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  const commands = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    commands.push(
      `C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }

  return commands.join(" ");
}

function medianBucketTrendPoints(
  samples: number[],
  startX: number,
  endX: number,
  yFor: (sample: number) => number,
  windowSize = 5,
  maxTrendPoints = 5
) {
  if (!samples.length) return [];

  const wholePhaseMedian = sampleMedian(samples);
  const xForIndex = (index: number) =>
    samples.length <= 1
      ? startX
      : startX + (index / (samples.length - 1)) * (endX - startX);

  if (samples.length <= windowSize || wholePhaseMedian === null) {
    return [
      { x: startX, y: yFor(wholePhaseMedian ?? samples[0]) },
      { x: samples.length === 1 ? startX + 8 : endX, y: yFor(wholePhaseMedian ?? samples[0]) },
    ];
  }

  const bucketSize = Math.max(windowSize, Math.ceil(samples.length / maxTrendPoints));
  const points: Array<{ x: number; y: number }> = [];

  for (let start = 0; start < samples.length; start += bucketSize) {
    const end = Math.min(samples.length, start + bucketSize);
    const bucketMedian = sampleMedian(samples.slice(start, end));

    if (bucketMedian === null) continue;

    points.push({
      x: xForIndex(start + (end - start - 1) / 2),
      y: yFor(bucketMedian),
    });
  }

  if (points.length === 1) {
    return [
      { x: startX, y: points[0].y },
      { x: samples.length === 1 ? startX + 8 : endX, y: points[0].y },
    ];
  }

  return points;
}

function medianBucketTrendValues(samples: number[], windowSize = 5, maxTrendPoints = 5) {
  if (!samples.length) return [];

  const wholePhaseMedian = sampleMedian(samples);

  if (samples.length <= windowSize || wholePhaseMedian === null) {
    return wholePhaseMedian === null ? [] : [wholePhaseMedian];
  }

  const bucketSize = Math.max(windowSize, Math.ceil(samples.length / maxTrendPoints));
  const medians: number[] = [];

  for (let start = 0; start < samples.length; start += bucketSize) {
    const end = Math.min(samples.length, start + bucketSize);
    const bucketMedian = sampleMedian(samples.slice(start, end));

    if (bucketMedian !== null) {
      medians.push(bucketMedian);
    }
  }

  return medians;
}

function severityClass(grade: Grade | null) {
  if (grade === "A+" || grade === "A") return "good";
  if (grade === "B") return "ok";
  if (grade === "C") return "warn";
  return "bad";
}

function qualityLabelForGrade(grade: Grade | null) {
  if (grade === "A+") return "Very reliable";
  if (grade === "A" || grade === "B") return "Stable";
  if (grade === "C") return "Uneven";
  if (grade === "D") return "Poor";
  return "Severe";
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
      : [item.median, item.median + item.variation]
  );
  const medianValues = variationBands
    .map((item) => item.median)
    .filter((value): value is number => value !== null);
  const valuesForScale = [...values, ...variationBounds, ...medianValues];
  const medianTrendValues = [
    ...medianBucketTrendValues(samples.idle),
    ...medianBucketTrendValues(samples.download),
    ...medianBucketTrendValues(samples.upload),
    ...medianValues,
  ];
  const axisBounds = scorecardAxisBounds([
    ...medianTrendValues,
    ...variationBounds,
  ]);
  const axisMax = axisBounds.max;
  const maxPlottedSample = valuesForScale.length ? Math.max(...valuesForScale) : axisMax;
  const hasClippedSamples = maxPlottedSample > axisMax;
  const axisMin = axisBounds.min;
  const axisMid = axisMin + (axisMax - axisMin) / 2;
  const yFor = (sample: number) => {
    const bounded = Math.min(axisMax, Math.max(axisMin, sample));
    return chart.top + chart.height - ((bounded - axisMin) / (axisMax - axisMin)) * chart.height;
  };
  const medians = [
    { key: "idle", value: sampleMedian(samples.idle), range: ranges.idle, values: samples.idle },
    { key: "download", value: sampleMedian(samples.download), range: ranges.download, values: samples.download },
    { key: "upload", value: sampleMedian(samples.upload), range: ranges.upload, values: samples.upload },
  ] as const;
  const medianPointForPhase = (
    values: readonly number[],
    medianValue: number | null,
    range: readonly [number, number]
  ) => {
    if (medianValue === null || values.length === 0) {
      return null;
    }

    const centerIndex = (values.length - 1) / 2;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestCenterDistance = Number.POSITIVE_INFINITY;

    values.forEach((sample, index) => {
      const distance = Math.abs(sample - medianValue);
      const centerDistance = Math.abs(index - centerIndex);

      if (
        distance < bestDistance ||
        (distance === bestDistance && centerDistance < bestCenterDistance)
      ) {
        bestIndex = index;
        bestDistance = distance;
        bestCenterDistance = centerDistance;
      }
    });

    const x =
      values.length === 1
        ? range[0]
        : range[0] + (bestIndex / (values.length - 1)) * (range[1] - range[0]);

    return {
      sample: values[bestIndex],
      x,
      y: yFor(values[bestIndex]),
    };
  };
  const sampleMarkers = [
    {
      key: "idle",
      label: "Quiet line",
      className: "sample-idle",
      range: ranges.idle,
      values: samples.idle,
      median: sampleMedian(samples.idle),
    },
    {
      key: "download",
      label: "Download on",
      className: "sample-download",
      range: ranges.download,
      values: samples.download,
      median: sampleMedian(samples.download),
    },
    {
      key: "upload",
      label: "Upload on",
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
        className: `${phase.className}${sample > axisMax ? " clipped" : ""}`,
        label: `${phase.label} ping ${index + 1}: ${formatLatency(sample)} ms`,
        tooltip:
          sample > axisMax
            ? `ping ${formatLatency(sample)} ms, clipped at top of chart`
            : `ping ${formatLatency(sample)} ms`,
        value: `ping ${formatLatency(sample)} ms`,
        x,
        y,
        labelY,
        clipped: sample > axisMax,
      };
    })
  );
  const medianTrendPaths = [
    {
      key: "idle",
      className: "line-idle",
      d: smoothPath(medianBucketTrendPoints(samples.idle, ranges.idle[0], ranges.idle[1], yFor)),
    },
    {
      key: "download",
      className: "line-download",
      d: smoothPath(
        medianBucketTrendPoints(samples.download, ranges.download[0], ranges.download[1], yFor)
      ),
    },
    {
      key: "upload",
      className: "line-upload",
      d: smoothPath(medianBucketTrendPoints(samples.upload, ranges.upload[0], ranges.upload[1], yFor)),
    },
  ].filter((path) => path.d);

  return (
    <section className="latency-phase-chart result" aria-label="Shared latency / ping chart">
      <div className="latency-phase-chart-header">
        <strong>Latency / Ping in milliseconds</strong>
        <div className="latency-phase-legend" aria-hidden="true">
          <span className="idle">quiet line</span>
          <span className="download">download on</span>
          <span className="upload">upload on</span>
          <span className="reference">median ping</span>
          <span className="spread">p95 latency</span>
        </div>
      </div>
      <svg viewBox="0 0 720 360" role="img" aria-label="Latency samples by phase">
        <rect className="phase-zone phase-zone-idle" x={chart.left} y={chart.top} width={phaseWidth} height={chart.height} />
        <rect className="phase-zone phase-zone-download" x={chart.left + phaseWidth} y={chart.top} width={phaseWidth} height={chart.height} />
        <rect className="phase-zone phase-zone-upload" x={chart.left + phaseWidth * 2} y={chart.top} width={phaseWidth} height={chart.height} />

        <line className="chart-axis" x1={chart.left} y1={chart.bottom} x2={chart.left + chart.width} y2={chart.bottom} />
        <line className="chart-axis" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
        {[axisMax, axisMid, axisMin].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="chart-grid" x1={chart.left} y1={y} x2={chart.left + chart.width} y2={y} />
              <text className="chart-axis-label" x={12} y={y + 4}>{Math.round(tick)}</text>
            </g>
          );
        })}
        <text className="chart-axis-label" x={11} y={18}>ms</text>
        {hasClippedSamples && (
          <text className="chart-axis-label chart-clipped-note" x={chart.left + chart.width - 6} y={18}>
            high spikes clipped
          </text>
        )}
        <line className="phase-break" x1={chart.left + phaseWidth} y1={chart.top} x2={chart.left + phaseWidth} y2={chart.bottom} />
        <line className="phase-break" x1={chart.left + phaseWidth * 2} y1={chart.top} x2={chart.left + phaseWidth * 2} y2={chart.bottom} />

        {variationBands.map((band) => {
          if (band.median === null || band.variation === null) {
            return null;
          }

          const upperY = yFor(band.median + band.variation);
          const lowerY = yFor(band.median);
          const height = Math.max(2, lowerY - upperY);

          const labelHeight = 14;
          const labelX = band.range[1] - 10;
          const labelY = Math.max(
            chart.top + labelHeight,
            Math.min(chart.bottom - 8, upperY - 6)
          );

          return (
            <g
              aria-label={`${band.key} latency spread band: ${formatLatency(band.variation)} ms`}
              className={`latency-spread-label ${band.className}`}
              key={band.key}
            >
              <title>
                Latency spread: 95th percentile ping minus median ping during this phase.
              </title>
              <rect
                className="latency-spread-band"
                x={band.range[0]}
                y={upperY}
                width={band.range[1] - band.range[0]}
                height={height}
              />
              <text x={labelX} y={labelY}>{formatLatency(band.variation)} ms</text>
              <text className="chart-hover-tooltip" x={labelX} y={labelY - 16}>
                p95 latency
              </text>
            </g>
          );
        })}

        {medianTrendPaths.length > 0 && (
          <g className="latency-median-trend" aria-label="Smoothed binned median latency trend">
            {medianTrendPaths.map((path) => (
              <path
                key={path.key}
                className={`latency-line latency-median-trend-line ${path.className}`}
                d={path.d}
              />
            ))}
          </g>
        )}

        {sampleMarkers.map((point) => (
          <g
            aria-label={point.label}
            className={`latency-sample-marker ${point.className}`}
            key={point.key}
          >
            <title>{point.tooltip}</title>
            <circle className="sample-hit" cx={point.x} cy={point.y} r={12} />
            {point.clipped && (
              <path
                className="sample-clipped-marker"
                d={`M ${point.x.toFixed(2)} ${(point.y - 8).toFixed(2)} L ${(point.x - 4).toFixed(2)} ${(point.y - 2).toFixed(2)} L ${(point.x + 4).toFixed(2)} ${(point.y - 2).toFixed(2)} Z`}
              />
            )}
            <circle className="sample-dot" cx={point.x} cy={point.y} r={3.2} />
            <text className="sample-label" x={point.x} y={point.labelY}>{point.value}</text>
          </g>
        ))}

        {medians.map((median) => {
          if (median.value === null) {
            return null;
          }

          const point = medianPointForPhase(median.values, median.value, median.range);

          if (point === null) {
            return null;
          }

          const { x, y } = point;
          const labelY = y < chart.top + 34 ? y + 28 : y - 20;

          return (
            <g
              aria-label={`median ping ${formatLatency(median.value)} ms, nearest measured sample ${formatLatency(point.sample)} ms`}
              className="latency-median-marker"
              key={median.key}
            >
              <title>{`median ping ${formatLatency(median.value)} ms; nearest measured sample ${formatLatency(point.sample)} ms`}</title>
              <circle className="median-halo" cx={x} cy={y} r={11} />
              <circle className="median-ring" cx={x} cy={y} r={8} />
              <text x={x} y={labelY}>
                {formatLatency(median.value)} ms
              </text>
              <text className="chart-hover-tooltip" x={x} y={labelY - 18}>
                median ping
              </text>
            </g>
          );
        })}

        <text className="chart-phase-label label-idle" x={chart.left + phaseWidth / 2} y={354}>quiet line</text>
        <text className="chart-phase-label label-download" x={chart.left + phaseWidth + phaseWidth / 2} y={354}>download on</text>
        <text className="chart-phase-label label-upload" x={chart.left + phaseWidth * 2 + phaseWidth / 2} y={354}>upload on</text>
      </svg>
      <div className="chart-throughput" aria-label="Average throughput during load phases">
        <span className="download" aria-label={`download ${formatSpeed(downloadMbps)} Mb/s`}>
          <em>download link</em>
          <strong>{formatSpeed(downloadMbps)} Mb/s</strong>
        </span>
        <span className="upload" aria-label={`upload ${formatSpeed(uploadMbps)} Mb/s`}>
          <em>upload link</em>
          <strong>{formatSpeed(uploadMbps)} Mb/s</strong>
        </span>
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
  const savedApplications = safeJson<ApplicationScore[]>(row.application_scores_json, []).map(normalizeApplicationScore);
  const grade = (saved.grade || row.grade || "F") as Grade;
  const idleMs = saved.idleMs ?? row.idle_ms;
  const downloadLatencyMs = saved.downloadLatencyMs ?? row.download_latency_ms;
  const uploadLatencyMs = saved.uploadLatencyMs ?? row.upload_latency_ms;
  const downloadStressMs = saved.downloadStressMs ?? row.download_stress_ms;
  const uploadStressMs = saved.uploadStressMs ?? row.upload_stress_ms;
  const downloadMbps = saved.downloadMbps ?? row.download_mbps;
  const uploadMbps = saved.uploadMbps ?? row.upload_mbps;
  const durationSeconds = saved.durationSeconds ?? row.duration_seconds;
  const applications =
    samples.idle.length || samples.download.length || samples.upload.length
      ? applicationRankingsFor(
          idleMs,
          downloadLatencyMs,
          uploadLatencyMs,
          downloadStressMs,
          uploadStressMs,
          downloadMbps,
          uploadMbps,
          samples
        )
      : savedApplications;
  const quietVariation = phaseLatencyVariation(samples.idle) ?? saved.quietVariationMs ?? saved.quietJitterMs ?? null;
  const downloadVariation = phaseLatencyVariation(samples.download) ?? saved.downloadVariationMs ?? saved.downloadJitterMs ?? null;
  const uploadVariation = phaseLatencyVariation(samples.upload) ?? saved.uploadVariationMs ?? saved.uploadJitterMs ?? null;
  const quietApplicationTail = phaseAppTailVariation(samples.idle);
  const downloadApplicationTail = phaseAppTailVariation(samples.download);
  const uploadApplicationTail = phaseAppTailVariation(samples.upload);
  const contextItems = contextItemsForSharedResult({
    grade,
    idle: idleMs,
    downloadLatency: downloadLatencyMs,
    uploadLatency: uploadLatencyMs,
    downloadStress: downloadStressMs,
    uploadStress: uploadStressMs,
    downloadMbps,
    uploadMbps,
    samples,
    applications,
  });
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
    { metric: "Quiet latency spread", value: `${formatLatency(quietVariation)} ms`, unit: "ms" },
    { metric: "Download latency spread", value: `${formatLatency(downloadVariation)} ms`, unit: "ms" },
    { metric: "Upload latency spread", value: `${formatLatency(uploadVariation)} ms`, unit: "ms" },
    { metric: "Median latency spread", value: `${formatLatency(medianVariation)} ms`, unit: "ms" },
    { metric: "Quiet application tail", value: `${formatLatency(quietApplicationTail)} ms`, unit: "ms" },
    { metric: "Download application tail", value: `${formatLatency(downloadApplicationTail)} ms`, unit: "ms" },
    { metric: "Upload application tail", value: `${formatLatency(uploadApplicationTail)} ms`, unit: "ms" },
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
  return (
    <main className="test-shell">
      <div className="result-screen shared-result-screen">
        <section className="result-card result-scorecard terminal-card">
          <ResultPrintController />
          <div className="result-compact-header">
            <div className="result-brand-lockup" aria-label="Bufferbloat.org">
              <div className="result-brand-title">
                <img src="/brand-dot.svg" alt="" aria-hidden="true" />
                <strong>Bufferbloat.org</strong>
              </div>
              <span>
                bufferbloat test result · Measured <LocalMeasuredTime isoTime={row.created_at} />
              </span>
            </div>
            <SharedResultHeaderActions sharePath={`/test?result=${shareId}`} />
          </div>

          <div className="result-scorecard-grid">
            <div className="result-grade">
              <p>grade</p>
              <strong className={`${severityClass(grade)} ${grade === "A+" ? "grade-plus" : ""}`}>{grade}</strong>
              <span className={severityClass(grade)}>{qualityLabelForGrade(grade)}</span>
            </div>

            <div className="result-scorecard-body">
              <div className="result-diagnosis-blocks" aria-label="Result diagnosis">
                {contextItems.map((item) => (
                  <article className={item.tone} key={item.label}>
                    <p>{item.value}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="result-evidence-row">
            <div className="result-applications">
              <div className="result-section-heading">
                <span>Network application performance</span>
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
                href="/learn/technical-details-export"
                rel="noopener noreferrer"
                target="_blank"
              >
                How to inspect and export this data
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
