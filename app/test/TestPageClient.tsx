"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  runBufferbloatTest,
  type LatencySamplesByPhase,
  type TestPhase,
} from "../../lib/bufferbloat-test";
import { type Grade } from "../../lib/test-copy";
import ResultCard from "./components/ResultCard";
import SignupBox from "./components/SignupBox";
import PrintResultButton from "./components/PrintResultButton";
import ResultSharePanel from "./components/ResultSharePanel";
import { formatLatency, formatSpeed } from "./components/format";
import { diagnosisFor, stageIndex } from "./components/diagnosis";

const DOWNLOAD_TEST_SIZE = "100 MB file, repeated across 4 streams";
const UPLOAD_TEST_SIZE = "1 MB chunks, repeated across 3 streams";
const DOWNLOAD_STREAM_LABEL = "4 download streams";
const UPLOAD_STREAM_LABEL = "3 upload streams";
const DOWNLOAD_STREAM_COUNT = 4;
const UPLOAD_STREAM_COUNT = 3;
const DOWNLOAD_PAYLOAD_MB = 100;
const UPLOAD_CHUNK_MB = 1;
const QUIET_WARMUP_SECONDS = 3;
const LOAD_SETTLING_SECONDS = 6;
const FOREGROUND_ERROR =
  "The test paused because this tab was no longer visible.";
const PREPARATION_HOLD_REASON = "preparation-hold";
const TEST_COUNT_STORAGE_KEY = "bufferbloat_test_count";
const ANALYTICS_SESSION_STORAGE_KEY = "bufferbloat_analytics_session";
const PREPARATION_STATUS_LABELS = [
  "Starting quiet pings...",
  "Checking browser timing...",
  "Preparing download pressure...",
  "Preparing upload pressure...",
  "Keeping early samples out of the score...",
  "Starting measurement...",
];
const ANALYSIS_STATUS_LABELS = [
  "Calculating median ping by phase...",
  "Calculating p95 latency spread...",
  "Comparing latency under load...",
  "Scoring application-level performance...",
  "Writing the network assessment...",
];
const PREPARATION_VISIBLE_SECONDS = 7;
const LINK_GAUGE_STABILIZED_SAMPLES = 5;

function emptyLatencySamples(): LatencySamplesByPhase {
  return {
    idle: [],
    download: [],
    upload: [],
  };
}

function cloneLatencySamples(samples: LatencySamplesByPhase): LatencySamplesByPhase {
  return {
    idle: [...samples.idle],
    download: [...samples.download],
    upload: [...samples.upload],
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function latencyDelta(base: number | null, loaded: number | null) {
  if (base === null || loaded === null) return null;
  return loaded - base;
}

function formatDelta(delta: number | null) {
  if (delta === null) return "—";
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? "+" : ""}${rounded} ms`;
}

function adjustedLinkGaugeScale(
  currentScale: number | null,
  currentSpeed: number | null,
  stabilized: boolean
) {
  if (currentSpeed === null) return currentScale;

  const nextScale = Math.max(1, currentSpeed * 1.12);

  if (currentScale === null || currentScale <= 0) {
    return nextScale;
  }

  if (currentSpeed >= currentScale * 0.88) {
    return Math.max(currentScale, nextScale);
  }

  if (!stabilized) {
    return currentScale;
  }

  return Math.max(nextScale, currentScale * 0.65 + nextScale * 0.35);
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatLatencyRange(samples: number[]) {
  if (samples.length === 0) return "—";
  return `${formatLatency(Math.min(...samples))}–${formatLatency(Math.max(...samples))}`;
}

function formatLatencySampleList(samples: number[]) {
  if (samples.length === 0) return "—";
  return samples.map((sample) => formatLatency(sample)).join(", ");
}

function readStoredTestCount() {
  if (typeof window === "undefined") return 0;

  const value = Number.parseInt(window.localStorage.getItem(TEST_COUNT_STORAGE_KEY) || "0", 10);

  return Number.isFinite(value) && value > 0 ? value : 0;
}

function randomClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function analyticsSessionId() {
  if (typeof window === "undefined") return randomClientId();

  const stored = window.sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY);
  if (stored) return stored;

  const id = randomClientId();
  window.sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, id);

  return id;
}

function bucketViewport() {
  if (typeof window === "undefined") return "unknown";

  const bucket = (value: number) => Math.max(0, Math.round(value / 100) * 100);

  return `${bucket(window.innerWidth)}x${bucket(window.innerHeight)}`;
}

function browserName(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/OPR\//.test(userAgent)) return "Opera";
  if (/CriOS\//.test(userAgent)) return "Chrome iOS";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent)) return "Safari";

  return "Other";
}

function osName(userAgent: string) {
  if (/Android/.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
  if (/Mac OS X|Macintosh/.test(userAgent)) return "macOS";
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Linux/.test(userAgent)) return "Linux";

  return "Other";
}

function deviceType(userAgent: string) {
  if (/Mobi|Android|iPhone|iPod/.test(userAgent)) return "phone";
  if (/iPad|Tablet/.test(userAgent)) return "tablet";

  return "desktop";
}

function referrerHost() {
  if (typeof document === "undefined" || !document.referrer) return null;

  try {
    return new URL(document.referrer).host;
  } catch {
    return null;
  }
}

type AnalyticsEventPayload = {
  sessionId: string;
  runId: string;
  eventType: "session" | "started" | "completed" | "failed";
  path: string;
  referrerHost: string | null;
  testCount: number;
  device: {
    type: string;
    os: string;
    browser: string;
    viewport: string;
  };
  result?: {
    success?: boolean;
    grade?: Grade;
    error?: string;
    durationSeconds?: number | null;
    idleMs?: number | null;
    downloadLatencyMs?: number | null;
    uploadLatencyMs?: number | null;
    downloadStressMs?: number | null;
    uploadStressMs?: number | null;
    downloadMbps?: number | null;
    uploadMbps?: number | null;
    quietVariationMs?: number | null;
    downloadVariationMs?: number | null;
    uploadVariationMs?: number | null;
    quietJitterMs?: number | null;
    downloadJitterMs?: number | null;
    uploadJitterMs?: number | null;
    quietSamples?: number | null;
    downloadSamples?: number | null;
    uploadSamples?: number | null;
    samples?: LatencySamplesByPhase;
    applications?: ApplicationRanking[];
  };
};

type ApplicationRanking = {
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

function analyticsPayload(
  runId: string,
  eventType: AnalyticsEventPayload["eventType"],
  testCount: number,
  result?: AnalyticsEventPayload["result"]
): AnalyticsEventPayload {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;

  return {
    sessionId: analyticsSessionId(),
    runId,
    eventType,
    path: typeof window === "undefined" ? "/test" : window.location.pathname,
    referrerHost: referrerHost(),
    testCount,
    device: {
      type: deviceType(userAgent),
      os: osName(userAgent),
      browser: browserName(userAgent),
      viewport: bucketViewport(),
    },
    result,
  };
}

function sendAnalyticsEvent(payload: AnalyticsEventPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const sent = navigator.sendBeacon(
      "/api/analytics/test-event",
      new Blob([body], { type: "application/json" })
    );

    if (sent) return;
  }

  void fetch("/api/analytics/test-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt or invalidate a measurement.
  });
}

async function storeCompletedAnalyticsEvent(payload: AnalyticsEventPayload) {
  try {
    const response = await fetch("/api/analytics/test-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as {
      ok?: boolean;
      shareId?: string | null;
    } | null;

    return data?.ok && data.shareId ? data.shareId : null;
  } catch {
    return null;
  }
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

function rollingMedianTrendPoints(
  values: number[],
  xForIndex: (index: number) => number,
  yForValue: (value: number) => number,
  windowSize = 5,
  maxTrendPoints = 5
) {
  if (values.length === 0) return [];

  const wholePhaseMedian = sampleMedian(values);

  if (values.length <= windowSize || wholePhaseMedian === null) {
    const y = yForValue(wholePhaseMedian ?? values[0]);

    return [
      { x: xForIndex(0), y },
      { x: xForIndex(Math.max(0, values.length - 1)), y },
    ];
  }

  const bucketSize = Math.max(windowSize, Math.ceil(values.length / maxTrendPoints));
  const points: Array<{ x: number; y: number }> = [];

  for (let start = 0; start < values.length; start += bucketSize) {
    const end = Math.min(values.length, start + bucketSize);
    const bucket = values.slice(start, end);
    const bucketMedian = sampleMedian(bucket);

    if (bucketMedian === null) continue;

    const centerIndex = start + (bucket.length - 1) / 2;

    points.push({
      x: xForIndex(centerIndex),
      y: yForValue(bucketMedian),
    });
  }

  if (points.length === 1) {
    const point = points[0];

    return [
      { x: xForIndex(0), y: point.y },
      { x: xForIndex(values.length - 1), y: point.y },
    ];
  }

  return points;
}

function rollingMedianTrendValues(values: number[], windowSize = 5, maxTrendPoints = 5) {
  if (values.length === 0) return [];

  const wholePhaseMedian = sampleMedian(values);

  if (values.length <= windowSize || wholePhaseMedian === null) {
    return wholePhaseMedian === null ? [] : [wholePhaseMedian];
  }

  const bucketSize = Math.max(windowSize, Math.ceil(values.length / maxTrendPoints));
  const medians: number[] = [];

  for (let start = 0; start < values.length; start += bucketSize) {
    const end = Math.min(values.length, start + bucketSize);
    const bucketMedian = sampleMedian(values.slice(start, end));

    if (bucketMedian !== null) {
      medians.push(bucketMedian);
    }
  }

  return medians;
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

function contextItemsForResult({
  grade,
  idle,
  downloadLatency,
  uploadLatency,
  downloadDelta,
  uploadDelta,
  downloadMbps,
  uploadMbps,
  samples,
  applications,
}: {
  grade: Grade;
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;
  downloadDelta: number | null;
  uploadDelta: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  samples: LatencySamplesByPhase;
  applications: ApplicationRanking[];
}): ResultContextItem[] {
  const movement = stressMovement(downloadDelta, uploadDelta);
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
  const uploadDominates = (uploadDelta ?? 0) > Math.max(25, (downloadDelta ?? 0) * 1.35);
  const downloadDominates = (downloadDelta ?? 0) > Math.max(25, (uploadDelta ?? 0) * 1.35);
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

function sampleMedian(samples: number[]) {
  if (samples.length === 0) {
    return null;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }

  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function samplePercentile(samples: number[], percentile: number) {
  if (samples.length === 0) {
    return null;
  }

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

function formatChartTick(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value < 100) return value.toFixed(1).replace(/\.0$/, "");
  return Math.round(value).toString();
}

function formatChartSpeed(value: number | null) {
  return value === null ? "not measured" : `${formatSpeed(value)} Mb/s`;
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

function stressMovement(downloadDelta: number | null, uploadDelta: number | null) {
  return Math.max(0, downloadDelta ?? 0, uploadDelta ?? 0);
}

function loadedLatency(downloadLatency: number | null, uploadLatency: number | null) {
  if (downloadLatency === null && uploadLatency === null) return null;
  return Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
}

function applicationRankingsFor(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadDelta: number | null,
  uploadDelta: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null,
  latencySamples: LatencySamplesByPhase
): ApplicationRanking[] {
  const baseline = idle ?? 0;
  const worstLoadedLatency = Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
  const movement = stressMovement(downloadDelta, uploadDelta);
  const quietVariation = phaseAppTailVariation(latencySamples.idle);
  const downloadVariation = phaseAppTailVariation(latencySamples.download);
  const uploadVariation = phaseAppTailVariation(latencySamples.upload);
  const worstVariation = Math.max(quietVariation ?? 0, downloadVariation ?? 0, uploadVariation ?? 0);
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

export default function Page({ autoStart = false }: { autoStart?: boolean }) {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState(false);

  const [idle, setIdle] = useState<number | null>(null);
  const [downloadLatency, setDownloadLatency] = useState<number | null>(null);
  const [uploadLatency, setUploadLatency] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [downloadPeakMbps, setDownloadPeakMbps] = useState<number | null>(null);
  const [uploadPeakMbps, setUploadPeakMbps] = useState<number | null>(null);
  const [phase, setPhase] = useState<TestPhase | "ready">("ready");
  const [status, setStatus] = useState("ready");
  const [latencySamples, setLatencySamples] = useState<LatencySamplesByPhase>(
    () => emptyLatencySamples()
  );
  const [excludedLatencySamples, setExcludedLatencySamples] =
    useState<LatencySamplesByPhase>(() => emptyLatencySamples());
  const [latencySampleCount, setLatencySampleCount] = useState(0);
  const [sampleCounts, setSampleCounts] = useState({
    idle: 0,
    download: 0,
    upload: 0,
  });
  const [grade, setGrade] = useState<Grade>("—");
  const [error, setError] = useState<string | null>(null);
  const [resultMeasuredAt, setResultMeasuredAt] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [resultDurationSeconds, setResultDurationSeconds] = useState<number | null>(null);
  const [completedTestCount, setCompletedTestCount] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [preparationStatusIndex, setPreparationStatusIndex] = useState(0);
  const [preparationElapsedSeconds, setPreparationElapsedSeconds] = useState(0);
  const [preparationHeld, setPreparationHeld] = useState(false);
  const [analysisStatusIndex, setAnalysisStatusIndex] = useState(0);

  const diagnosisRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const testStartedAtRef = useRef<number | null>(null);
  const testRunIdRef = useRef<string | null>(null);
  const fullscreenRunRef = useRef(false);

  useEffect(() => {
    sendAnalyticsEvent(
      analyticsPayload(analyticsSessionId(), "session", readStoredTestCount())
    );
  }, []);

  useEffect(() => {
    if (!running) return;

    function stopForVisibility() {
      if (document.visibilityState === "hidden") {
        abortControllerRef.current?.abort(FOREGROUND_ERROR);
      }
    }

    function stopForPageHide() {
      abortControllerRef.current?.abort(FOREGROUND_ERROR);
    }

    function stopForBlur() {
      abortControllerRef.current?.abort(FOREGROUND_ERROR);
    }

    document.addEventListener("visibilitychange", stopForVisibility);
    window.addEventListener("pagehide", stopForPageHide);
    window.addEventListener("blur", stopForBlur);

    return () => {
      document.removeEventListener("visibilitychange", stopForVisibility);
      window.removeEventListener("pagehide", stopForPageHide);
      window.removeEventListener("blur", stopForBlur);
    };
  }, [running]);

  useEffect(() => {
    if (finished && diagnosisRef.current) {
      diagnosisRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [finished]);

  const requestTestFullscreen = useCallback(async () => {
    const element = document.documentElement;

    if (document.fullscreenElement) {
      fullscreenRunRef.current = false;
      return;
    }

    if (!element.requestFullscreen) {
      fullscreenRunRef.current = false;
      return;
    }

    try {
      await element.requestFullscreen({ navigationUI: "hide" });
      fullscreenRunRef.current = true;
    } catch {
      fullscreenRunRef.current = false;
    }
  }, []);

  const exitTestFullscreen = useCallback((force = false) => {
    if (!force && !fullscreenRunRef.current) return;

    fullscreenRunRef.current = false;

    if (!document.fullscreenElement || !document.exitFullscreen) return;

    void document.exitFullscreen().catch(() => {});
  }, []);

  const runTest = useCallback(async function runTest() {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    const runId = randomClientId();
    const startingTestCount = readStoredTestCount();
    const latestMetrics = {
      idle: null as number | null,
      downloadLatency: null as number | null,
      uploadLatency: null as number | null,
      downloadMbps: null as number | null,
      uploadMbps: null as number | null,
      sampleCounts: {
        idle: 0,
        download: 0,
        upload: 0,
      },
    };
    abortControllerRef.current = abortController;
    testRunIdRef.current = runId;

    try {
      await requestTestFullscreen();
      setError(null);
      setPreparationHeld(false);
      setRunning(true);
      setAnalyzing(false);
      setFinished(false);
      setIdle(null);
      setDownloadLatency(null);
      setUploadLatency(null);
      setDownloadMbps(null);
      setUploadMbps(null);
      setDownloadPeakMbps(null);
      setUploadPeakMbps(null);
      setPhase("ready");
      setStatus("ready");
      setLatencySampleCount(0);
      setSampleCounts({ idle: 0, download: 0, upload: 0 });
      setGrade("—");
      setResultMeasuredAt(null);
      setTestProgress(0);
      setResultDurationSeconds(null);
      setShareUrl(null);
      setShareMessage("");
      setSharePanelOpen(false);
      testStartedAtRef.current = Date.now();
      setLatencySamples(emptyLatencySamples());
      setExcludedLatencySamples(emptyLatencySamples());
      sendAnalyticsEvent(
        analyticsPayload(runId, "started", startingTestCount)
      );

      const result = await runBufferbloatTest(
        (update) => {
          setPhase(update.phase);
          setStatus(update.status);
          setTestProgress(update.progress);
          setIdle(update.idle);
          setDownloadLatency(update.downloadLatency);
          setUploadLatency(update.uploadLatency);
          setDownloadMbps(update.downloadMbps);
          setUploadMbps(update.uploadMbps);
          setDownloadPeakMbps((current) =>
            adjustedLinkGaugeScale(
              current,
              update.downloadMbps,
              update.phase === "download" &&
                update.latencySampleCount >= LINK_GAUGE_STABILIZED_SAMPLES
            )
          );
          setUploadPeakMbps((current) =>
            adjustedLinkGaugeScale(
              current,
              update.uploadMbps,
              update.phase === "upload" &&
                update.latencySampleCount >= LINK_GAUGE_STABILIZED_SAMPLES
            )
          );
          setLatencySamples(cloneLatencySamples(update.latencySamples));
          setExcludedLatencySamples(cloneLatencySamples(update.excludedLatencySamples));
          setLatencySampleCount(update.latencySampleCount);
          latestMetrics.idle = update.idle;
          latestMetrics.downloadLatency = update.downloadLatency;
          latestMetrics.uploadLatency = update.uploadLatency;
          latestMetrics.downloadMbps = update.downloadMbps;
          latestMetrics.uploadMbps = update.uploadMbps;
          if (
            update.phase === "idle" ||
            update.phase === "download" ||
            update.phase === "upload"
          ) {
            latestMetrics.sampleCounts[update.phase] = update.latencySampleCount;
            setSampleCounts((current) => ({
              ...current,
              [update.phase]: update.latencySampleCount,
            }));
          }
        },
        { signal: abortController.signal }
      );

      setIdle(result.idle);
      setDownloadLatency(result.downloadLatency);
      setUploadLatency(result.uploadLatency);
      setDownloadMbps(result.downloadMbps);
      setUploadMbps(result.uploadMbps);
      setDownloadPeakMbps((current) =>
        adjustedLinkGaugeScale(current, result.downloadMbps, true)
      );
      setUploadPeakMbps((current) =>
        adjustedLinkGaugeScale(current, result.uploadMbps, true)
      );
      setLatencySamples(cloneLatencySamples(result.latencySamples));
      setExcludedLatencySamples(emptyLatencySamples());
      setGrade(result.grade);
      setResultMeasuredAt(new Date().toISOString());

      setRunning(false);
      setAnalyzing(true);
      setPhase("analysis");
      setStatus("diagnosis");
      setTestProgress(96);

      await wait(6200);

      let finalDuration: number | null = null;

      if (testStartedAtRef.current !== null) {
        finalDuration = Math.max(
          0,
          Math.round((Date.now() - testStartedAtRef.current) / 1000)
        );
        setResultDurationSeconds(finalDuration);
      }

      setTestProgress(100);
      const nextCount = readStoredTestCount() + 1;
      const completedQuietVariation = phaseLatencyVariation(result.latencySamples.idle);
      const completedDownloadVariation = phaseLatencyVariation(result.latencySamples.download);
      const completedUploadVariation = phaseLatencyVariation(result.latencySamples.upload);
      const completedApplications = applicationRankingsFor(
        result.idle,
        result.downloadLatency,
        result.uploadLatency,
        latencyDelta(result.idle, result.downloadLatency),
        latencyDelta(result.idle, result.uploadLatency),
        result.downloadMbps,
        result.uploadMbps,
        result.latencySamples
      );
      const storedShareId = await storeCompletedAnalyticsEvent(
        analyticsPayload(runId, "completed", nextCount, {
          success: true,
          grade: result.grade,
          durationSeconds: finalDuration,
          idleMs: result.idle,
          downloadLatencyMs: result.downloadLatency,
          uploadLatencyMs: result.uploadLatency,
          downloadStressMs: latencyDelta(result.idle, result.downloadLatency),
          uploadStressMs: latencyDelta(result.idle, result.uploadLatency),
          downloadMbps: result.downloadMbps,
          uploadMbps: result.uploadMbps,
          quietVariationMs: completedQuietVariation,
          downloadVariationMs: completedDownloadVariation,
          uploadVariationMs: completedUploadVariation,
          quietJitterMs: completedQuietVariation,
          downloadJitterMs: completedDownloadVariation,
          uploadJitterMs: completedUploadVariation,
          quietSamples: result.latencySamples.idle.length,
          downloadSamples: result.latencySamples.download.length,
          uploadSamples: result.latencySamples.upload.length,
          samples: result.latencySamples,
          applications: completedApplications,
        })
      );

      window.localStorage.setItem(TEST_COUNT_STORAGE_KEY, String(nextCount));
      setCompletedTestCount(nextCount);
      setAnalyzing(false);
      setFinished(true);
      setShareUrl(
        storedShareId && typeof window !== "undefined"
          ? `${window.location.origin}/test?result=${storedShareId}`
          : null
      );
    } catch (err) {
      if (
        abortController.signal.aborted &&
        abortController.signal.reason === PREPARATION_HOLD_REASON
      ) {
        setRunning(false);
        setAnalyzing(false);
        setPhase("ready");
        setStatus("paused");
        setTestProgress(0);
        testStartedAtRef.current = null;
        exitTestFullscreen();
        return;
      }

      const stoppedForForeground =
        abortController.signal.aborted &&
        abortController.signal.reason === FOREGROUND_ERROR;

      const errorMessage = stoppedForForeground
        ? FOREGROUND_ERROR
        : err instanceof Error
          ? err.message
          : "Unknown test error";

      setError(errorMessage);
      sendAnalyticsEvent(
        analyticsPayload(runId, "failed", startingTestCount, {
          success: false,
          error: errorMessage,
          durationSeconds: testStartedAtRef.current === null
            ? null
            : Math.max(0, Math.round((Date.now() - testStartedAtRef.current) / 1000)),
          idleMs: latestMetrics.idle,
          downloadLatencyMs: latestMetrics.downloadLatency,
          uploadLatencyMs: latestMetrics.uploadLatency,
          downloadStressMs: latencyDelta(latestMetrics.idle, latestMetrics.downloadLatency),
          uploadStressMs: latencyDelta(latestMetrics.idle, latestMetrics.uploadLatency),
          downloadMbps: latestMetrics.downloadMbps,
          uploadMbps: latestMetrics.uploadMbps,
          quietSamples: latestMetrics.sampleCounts.idle,
          downloadSamples: latestMetrics.sampleCounts.download,
          uploadSamples: latestMetrics.sampleCounts.upload,
        })
      );
      setRunning(false);
      setAnalyzing(false);
      setPhase("ready");
      setStatus("stopped");
      setTestProgress(0);
      testStartedAtRef.current = null;
      exitTestFullscreen();
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      if (testRunIdRef.current === runId) {
        testRunIdRef.current = null;
      }
    }
  }, [exitTestFullscreen, requestTestFullscreen]);

  const holdPreparation = useCallback(() => {
    setPreparationHeld(true);
    abortControllerRef.current?.abort(PREPARATION_HOLD_REASON);
  }, []);

  useEffect(() => {
    if (running || analyzing || finished || error || preparationHeld) return;

    const params = new URLSearchParams(window.location.search);

    if (!autoStart && params.get("start") !== "1") return;

    const timer = window.setTimeout(() => {
      void runTest();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [analyzing, autoStart, error, finished, preparationHeld, runTest, running]);

  const phaseStage =
    phase === "warmup" || phase === "idle"
      ? 1
      : phase === "download"
        ? 2
        : phase === "upload"
          ? 3
          : 0;
  const automaticStage =
    running && !analyzing
      ? phaseStage || stageIndex(status)
      : 0;
  const phaseDetail = getPhaseDetail(phase, status);
  const downloadDelta = latencyDelta(idle, downloadLatency);
  const uploadDelta = latencyDelta(idle, uploadLatency);
  const quietVariation = phaseLatencyVariation(latencySamples.idle);
  const downloadVariation = phaseLatencyVariation(latencySamples.download);
  const uploadVariation = phaseLatencyVariation(latencySamples.upload);
  const quietApplicationTail = phaseAppTailVariation(latencySamples.idle);
  const downloadApplicationTail = phaseAppTailVariation(latencySamples.download);
  const uploadApplicationTail = phaseAppTailVariation(latencySamples.upload);
  const liveStages = [
    {
      stage: 1,
      title: "Quiet line",
      theme: "baseline",
      icon: "⌁",
      ping: idle,
      sampleCount: sampleCounts.idle,
      done: idle !== null,
      speed: null,
      speedLabel: null,
      variation: quietVariation,
    },
    {
      stage: 2,
      title: "Download on",
      theme: "download",
      icon: "↓",
      ping: downloadLatency,
      sampleCount: sampleCounts.download,
      done: downloadLatency !== null,
      speed: downloadMbps,
      speedLabel: "Download throughput",
      variation: downloadVariation,
    },
    {
      stage: 3,
      title: "Upload on",
      theme: "upload",
      icon: "↑",
      ping: uploadLatency,
      sampleCount: sampleCounts.upload,
      done: uploadLatency !== null,
      speed: uploadMbps,
      speedLabel: "Upload throughput",
      variation: uploadVariation,
    },
  ] as const;
  const activeLiveStage = liveStages.find((item) => item.stage === automaticStage) ?? null;
  const completedLiveStages = liveStages.filter(
    (item) => item.done && item.stage !== automaticStage
  );

  const diagnosis = diagnosisFor(
    grade,
    downloadMbps,
    uploadMbps,
    idle,
    downloadLatency,
    uploadLatency
  );
  const underLoadLatency = loadedLatency(downloadLatency, uploadLatency);
  const applicationRankingsResult = applicationRankingsFor(
    idle,
    downloadLatency,
    uploadLatency,
    downloadDelta,
    uploadDelta,
    downloadMbps,
    uploadMbps,
    latencySamples
  );
  const resultContextItems = contextItemsForResult({
    grade,
    idle,
    downloadLatency,
    uploadLatency,
    downloadDelta,
    uploadDelta,
    downloadMbps,
    uploadMbps,
    samples: latencySamples,
    applications: applicationRankingsResult,
  });
  const totalScoredSamples = sampleCounts.idle + sampleCounts.download + sampleCounts.upload;
  const shareText =
    "I ran a Bufferbloat.org test to check how my internet connection performs under real load.";
  const shareTarget = shareUrl ?? (typeof window === "undefined" ? "" : window.location.href);
  const encodedShareText = encodeURIComponent(`${shareText} ${shareTarget}`.trim());
  const encodedShareUrl = encodeURIComponent(shareTarget);
  const encodedEmailSubject = encodeURIComponent("My Bufferbloat.org internet reliability result");
  const encodedEmailBody = encodeURIComponent(`${shareText}\n\n${shareTarget}`);
  const shareLinks = {
    email: `mailto:?subject=${encodedEmailSubject}&body=${encodedEmailBody}`,
    whatsapp: `https://wa.me/?text=${encodedShareText}`,
    telegram: `https://t.me/share/url?url=${encodedShareUrl}&text=${encodeURIComponent(shareText)}`,
  };

  async function copyShareText() {
    if (!shareUrl) {
      setShareMessage("Link unavailable.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Link copied.");
    } catch {
      setShareMessage(shareUrl);
    }
  }
  const technicalRows = [
    {
      section: "Report",
      metric: "Grade",
      value: grade,
      note: diagnosis.label,
    },
    {
      section: "Report",
      metric: "Measured at",
      value: resultMeasuredAt ?? new Date().toISOString(),
      note: "Local browser measurement time recorded when the run completed.",
    },
    {
      section: "Report",
      metric: "Test duration",
      value: formatDuration(resultDurationSeconds),
      note: "Elapsed time from measurement start through result computation.",
    },
    {
      section: "Latency samples",
      metric: "Quiet latency samples",
      value: formatLatencySampleList(latencySamples.idle),
      unit: "ms",
      note: "Comma-separated scored latency / ping samples used to compute the quiet median.",
    },
    {
      section: "Latency samples",
      metric: "Download latency samples",
      value: formatLatencySampleList(latencySamples.download),
      unit: "ms",
      note: "Comma-separated scored latency / ping samples collected during download load.",
    },
    {
      section: "Latency samples",
      metric: "Upload latency samples",
      value: formatLatencySampleList(latencySamples.upload),
      unit: "ms",
      note: "Comma-separated scored latency / ping samples collected during upload load.",
    },
    {
      section: "Latency medians",
      metric: "Quiet median latency",
      value: formatLatency(idle),
      unit: "ms",
      note: "Baseline response time before download or upload load.",
    },
    {
      section: "Latency medians",
      metric: "Download-loaded latency",
      value: formatLatency(downloadLatency),
      unit: "ms",
      note: `Median response time while ${DOWNLOAD_STREAM_LABEL} were active.`,
    },
    {
      section: "Latency medians",
      metric: "Upload-loaded latency",
      value: formatLatency(uploadLatency),
      unit: "ms",
      note: `Median response time while ${UPLOAD_STREAM_LABEL} were active.`,
    },
    {
      section: "Latency changes",
      metric: "Download stress",
      value: formatDelta(downloadDelta).replace(" ms", ""),
      unit: "ms",
      note: "Download-loaded median minus quiet median.",
    },
    {
      section: "Latency changes",
      metric: "Upload stress",
      value: formatDelta(uploadDelta).replace(" ms", ""),
      unit: "ms",
      note: "Upload-loaded median minus quiet median.",
    },
    {
      section: "Latency changes",
      metric: "Worst loaded latency",
      value: formatLatency(underLoadLatency),
      unit: "ms",
      note: "Higher of the download-loaded and upload-loaded medians.",
    },
    {
      section: "Latency spread",
      metric: "Quiet latency spread",
      value: formatLatency(quietVariation),
      unit: "ms",
      note: "95th percentile scored quiet latency / ping minus the quiet median.",
    },
    {
      section: "Latency spread",
      metric: "Download latency spread",
      value: formatLatency(downloadVariation),
      unit: "ms",
      note: "95th percentile scored latency / ping during download load minus the download-loaded median.",
    },
    {
      section: "Latency spread",
      metric: "Upload latency spread",
      value: formatLatency(uploadVariation),
      unit: "ms",
      note: "95th percentile scored latency / ping during upload load minus the upload-loaded median.",
    },
    {
      section: "Application fit",
      metric: "Quiet application tail",
      value: formatLatency(quietApplicationTail),
      unit: "ms",
      note: "Robust upper-tail estimate used for application ratings; uses p90-style spread for small sample counts while p95 remains visible as a diagnostic metric.",
    },
    {
      section: "Application fit",
      metric: "Download application tail",
      value: formatLatency(downloadApplicationTail),
      unit: "ms",
      note: "Robust upper-tail estimate used for application ratings during download load.",
    },
    {
      section: "Application fit",
      metric: "Upload application tail",
      value: formatLatency(uploadApplicationTail),
      unit: "ms",
      note: "Robust upper-tail estimate used for application ratings during upload load.",
    },
    {
      section: "Throughput",
      metric: "Download throughput",
      value: formatSpeed(downloadMbps),
      unit: "Mbps",
      note: DOWNLOAD_TEST_SIZE,
    },
    {
      section: "Throughput",
      metric: "Upload throughput",
      value: formatSpeed(uploadMbps),
      unit: "Mbps",
      note: UPLOAD_TEST_SIZE,
    },
    {
      section: "Samples",
      metric: "Quiet scored samples",
      value: String(sampleCounts.idle),
      note: `Recorded range: ${formatLatencyRange(latencySamples.idle)} ms.`,
    },
    {
      section: "Samples",
      metric: "Download scored samples",
      value: String(sampleCounts.download),
      note: `Recorded range: ${formatLatencyRange(latencySamples.download)} ms.`,
    },
    {
      section: "Samples",
      metric: "Upload scored samples",
      value: String(sampleCounts.upload),
      note: `Recorded range: ${formatLatencyRange(latencySamples.upload)} ms.`,
    },
    {
      section: "Samples",
      metric: "Total scored latency samples",
      value: String(totalScoredSamples || latencySampleCount),
      note: "Samples used for the displayed medians and bufferbloat grade.",
    },
    {
      section: "Method",
      metric: "Latency probe",
      value: "Cloudflare Speed 1-byte endpoint",
      note: "Separate from the download file origin.",
    },
    {
      section: "Method",
      metric: "Download stream count",
      value: String(DOWNLOAD_STREAM_COUNT),
      unit: "streams",
      note: "Parallel download requests used to create downstream load.",
    },
    {
      section: "Method",
      metric: "Download payload size",
      value: String(DOWNLOAD_PAYLOAD_MB),
      unit: "MB",
      note: "Payload file size requested by each download stream.",
    },
    {
      section: "Method",
      metric: "Upload stream count",
      value: String(UPLOAD_STREAM_COUNT),
      unit: "streams",
      note: "Parallel upload requests used to create upstream load.",
    },
    {
      section: "Method",
      metric: "Upload chunk size",
      value: String(UPLOAD_CHUNK_MB),
      unit: "MB",
      note: "Payload chunk size sent repeatedly by each upload stream.",
    },
    {
      section: "Method",
      metric: "Warm-up",
      value: "Excluded from medians",
      note: "Short pre-measurement requests prepare the browser session before scoring begins.",
    },
    {
      section: "Method",
      metric: "Quiet warm-up period",
      value: String(QUIET_WARMUP_SECONDS),
      unit: "sec",
      note: "Unscored quiet-line ping probes excluded before baseline samples are recorded.",
    },
    {
      section: "Method",
      metric: "Settling period",
      value: String(LOAD_SETTLING_SECONDS),
      unit: "sec",
      note: "Initial loaded interval where ping probes continue but are excluded before loaded medians are scored.",
    },
    ...applicationRankingsResult.map((item, index) => ({
      section: "Application fit",
      metric: `${index + 1}. ${item.name}`,
      value: String(item.score),
      unit: "/100",
      note: `${item.label}. Ranked using measured latency under load, latency movement, robust tail latency, and relevant throughput.`,
    })),
    {
      section: "Privacy",
      metric: "Export contents",
      value: "Measurement data only",
      note: "The CSV export excludes IP address, location, browser fingerprint, and device identity.",
    },
  ];

  const preparingMeasurement = running && phase === "warmup";
  const preparationActive = preparingMeasurement || preparationHeld;
  const preparationOverlayVisible =
    preparationHeld ||
    (preparingMeasurement && preparationElapsedSeconds < PREPARATION_VISIBLE_SECONDS);
  const interstitialActive = Boolean(error) || analyzing;

  useEffect(() => {
    if (!preparingMeasurement) {
      setPreparationStatusIndex(0);
      setPreparationElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.min(
        PREPARATION_VISIBLE_SECONDS,
        Math.floor((Date.now() - startedAt) / 1000)
      );
      setPreparationElapsedSeconds(elapsed);
      setPreparationStatusIndex(
        Math.min(
          PREPARATION_STATUS_LABELS.length - 1,
          Math.floor(
            elapsed / (PREPARATION_VISIBLE_SECONDS / PREPARATION_STATUS_LABELS.length)
          )
        )
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [preparingMeasurement]);

  useEffect(() => {
    if (!analyzing) {
      setAnalysisStatusIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setAnalysisStatusIndex((current) =>
        Math.min(ANALYSIS_STATUS_LABELS.length - 1, current + 1)
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, [analyzing]);

  const preparationSecondsLeft = Math.max(
    0,
    PREPARATION_VISIBLE_SECONDS - preparationElapsedSeconds
  );

  return (
    <main className={`test-shell ${interstitialActive ? "interstitial-active" : ""}`}>
      {!error && !running && !analyzing && !finished && !preparationHeld && (
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker">
                Open-source internet quality test
              </div>

              <h1>Test your connection under real load</h1>

              <p className="hero-subtitle">
                Ordinary speed tests do not tell you whether the connection
                stays usable when it is busy.
              </p>

              <p className="hero-description">
                This bufferbloat test creates download and upload load, then
                checks whether delay stays under control. The result shows how
                the connection behaves in the moments that make calls, games,
                browsing, and streaming feel smooth or frustrating.
              </p>

              <button
                className="hero-start-button"
                onClick={runTest}
                disabled={running || analyzing}
              >
                Run bufferbloat test
              </button>
              <p className="hero-fullscreen-note">Opens in fullscreen while the test runs.</p>

              <div className="test-landing-proof" aria-label="What this test reports">
                <div>
                  <span>Measures</span>
                  <strong>Latency under load</strong>
                </div>
                <div>
                  <span>Usually takes</span>
                  <strong>About 1 minute</strong>
                </div>
                <div>
                  <span>Outputs</span>
                  <strong>Inspectable scorecard</strong>
                </div>
              </div>

              <div className="test-trust-links" aria-label="Project trust links">
                <a href="/docs">Methodology</a>
                <a
                  href="https://github.com/pelagus/bufferbloat.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source code
                </a>
                <a href="/mission">Mission</a>
              </div>
            </div>

            <aside className="test-landing-preview" aria-label="Example bufferbloat scorecard">
              <div className="test-preview-header">
                <span>example scorecard</span>
                <strong>B</strong>
              </div>
              <div className="test-preview-diagnosis">
                Ordinary speed tests can look fine while upload load adds delay.
                Calls and games may feel less stable when the line is busy.
              </div>
              <div className="test-preview-metrics">
                <div>
                  <span>quiet ping</span>
                  <strong>32 ms</strong>
                </div>
                <div>
                  <span>download load</span>
                  <strong>+18 ms</strong>
                </div>
                <div>
                  <span>upload load</span>
                  <strong>+96 ms</strong>
                </div>
              </div>
              <div className="test-preview-chart" aria-hidden="true">
                <svg viewBox="0 0 520 190" role="img">
                  <rect x="0" y="0" width="520" height="190" />
                  <line x1="44" y1="150" x2="486" y2="150" />
                  <line x1="44" y1="36" x2="44" y2="150" />
                  <path className="preview-line preview-line-quiet" d="M 52 132 L 76 130 L 99 133 L 123 128 L 147 131 L 171 129" />
                  <path className="preview-line preview-line-download" d="M 196 126 L 220 118 L 244 122 L 268 111 L 292 116 L 316 107" />
                  <path className="preview-line preview-line-upload" d="M 341 110 L 365 76 L 389 92 L 413 56 L 437 72 L 461 44 L 486 60" />
                  <line className="preview-median" x1="52" y1="131" x2="486" y2="131" />
                </svg>
                <div className="test-preview-legend">
                  <span>quiet</span>
                  <span>download load</span>
                  <span>upload load</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {preparationActive && (
        <section className="test-stop-stage preflight-stage measurement-prep-stage">
          <div className={`stopped-test-underlay preflight-underlay ${preparationOverlayVisible ? "" : "ready"}`}>
            <section className="instrument-panel">
              <ForegroundRunNotice
                progress={testProgress}
                phase={phase}
                phaseDetail={{
                  eyebrow: "Preparing",
                  title: "Warming up your connection",
                  detail: "Starting timing checks and unscored pings so the browser, DNS path, and first network hops settle before measurement.",
                }}
              />

              <TestProcedurePanel
                phase={phase}
                downloadMbps={downloadMbps}
                uploadMbps={uploadMbps}
                downloadPeakMbps={downloadPeakMbps}
                uploadPeakMbps={uploadPeakMbps}
              />

              <div className="live-chart-layout">
                <LatencyPhaseChart
                  samples={latencySamples}
                  mode="live"
                  grade={grade}
                  activePhase={phase}
                  excludedSamples={excludedLatencySamples}
                />

                {activeLiveStage && (
                  <ActiveMeasurementCard
                    title={activeLiveStage.title}
                    icon={activeLiveStage.icon}
                    theme={activeLiveStage.theme}
                    ping={activeLiveStage.ping}
                    quietBaseline={idle}
                    sampleCount={activeLiveStage.sampleCount}
                    phaseState="settling"
                  />
                )}
              </div>
            </section>
          </div>

          <section
            className={`test-stop-overlay preflight-overlay ${preparationOverlayVisible ? "" : "fading-out"}`}
            aria-hidden={!preparationOverlayVisible}
            aria-live="polite"
          >
            <div className="terminal-card preflight-card test-stop-card test-stop-screen measurement-prep-card">
              <span>Before measurement</span>
              <strong>
                {preparationHeld
                  ? "Paused while you prepare"
                  : "Test preparation"}
              </strong>
              <div className="measurement-prep-instructions">
                {!preparationHeld ? (
                  <p>Keep this tab visible and in focus while the test runs.</p>
                ) : null}
                {!preparationHeld ? (
                  <p className="measurement-prep-fullscreen-note">The test opens in fullscreen.</p>
                ) : null}
                <p>For a more accurate result stop VPNs, proxies or background online applications.</p>
                {preparationHeld ? (
                  <p>Resume when ready. Preparation will restart from the beginning.</p>
                ) : null}
              </div>
              <div className="preflight-actions measurement-prep-actions">
                {preparationHeld ? (
                  <button onClick={runTest} disabled={running || analyzing}>
                    Resume
                  </button>
                ) : (
                  <>
                    <p className="measurement-prep-countdown">
                      Test starts in <b>{preparationSecondsLeft}</b> seconds
                    </p>
                    <button
                      className="secondary-button recorder-pause-button"
                      onClick={holdPreparation}
                      disabled={!preparingMeasurement}
                    >
                      Pause
                    </button>
                  </>
                )}
              </div>
              <div className="measurement-prep-activity">
                <div className="measurement-prep-probes" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                {!preparationHeld && (
                  <p className="measurement-prep-background" aria-live="polite">
                    {PREPARATION_STATUS_LABELS[preparationStatusIndex]}
                  </p>
                )}
                {preparationHeld && (
                  <p className="measurement-prep-background held" aria-live="polite">
                    Warmup paused
                  </p>
                )}
              </div>
            </div>
          </section>
        </section>
      )}

      {error && (
        <section className="test-stop-stage">
          <div className="stopped-test-underlay" aria-hidden="true">
            <section className="instrument-panel">
              <ForegroundRunNotice
                progress={testProgress}
                phase="stopped"
                phaseDetail={{
                  eyebrow: "Stopped",
                  title: "Test stopped",
                  detail: "The measurement stopped because the tab lost focus.",
                }}
              />

                <TestProcedurePanel
                  phase={phase}
                  downloadMbps={downloadMbps}
                  uploadMbps={uploadMbps}
                  downloadPeakMbps={downloadPeakMbps}
                uploadPeakMbps={uploadPeakMbps}
              />

              {phase !== "warmup" && (
                <div className="live-chart-layout">
                  <LatencyPhaseChart samples={latencySamples} mode="live" grade={grade} activePhase={phase} />

                  {activeLiveStage && (
                    <ActiveMeasurementCard
                      title={activeLiveStage.title}
                      icon={activeLiveStage.icon}
                      theme={activeLiveStage.theme}
                      ping={activeLiveStage.ping}
                      quietBaseline={idle}
                      sampleCount={activeLiveStage.sampleCount}
                      phaseState="settling"
                    />
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="test-stop-overlay" aria-live="assertive">
            <div className="terminal-card error-card test-stop-card test-stop-screen">
              <span>Test stopped to protect accuracy</span>
              <strong>The tab lost focus</strong>
              <p>
                Browsers can throttle background tabs, so this run was stopped
                before it could produce a misleading result. Restart and keep
                this tab visible until the scorecard appears.
              </p>
              <button onClick={runTest} disabled={running || analyzing}>
                Restart test
              </button>
            </div>
          </section>
        </section>
      )}

      {analyzing && (
        <section className="test-stop-stage analysis-stage">
          <div className="stopped-test-underlay" aria-hidden="true" />

          <section className="test-stop-overlay analysis-overlay" aria-live="polite">
            <div className="terminal-card test-stop-card test-stop-screen analysis-interstitial">
              <div className="analysis-copy">
                <span>Preparing your scorecard</span>
                <strong>Turning the measurements into a result</strong>
                <p>
                  Comparing quiet ping with the busy-line phases, checking for
                  sustained delay, and separating rare stalls from the main
                  bufferbloat signal.
                </p>
              </div>

              <div className="analysis-progress-panel">
                <div className="analysis-status-activity">
                  <div className="analysis-progress-mark" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="analysis-status-message" aria-live="polite">
                    {ANALYSIS_STATUS_LABELS[analysisStatusIndex]}
                  </p>
                </div>

                <div className="analysis-progress-track" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, 38 + analysisStatusIndex * 15)}%` }} />
                </div>
              </div>

              <div className="analysis-summary-steps" aria-hidden="true">
                <div className="complete">
                  <span>Quiet line</span>
                  <strong>{formatLatency(idle)} ms</strong>
                </div>
                <div className="complete">
                  <span>Download load</span>
                  <strong>{formatLatency(downloadLatency)} ms</strong>
                </div>
                <div className="complete">
                  <span>Upload load</span>
                  <strong>{formatLatency(uploadLatency)} ms</strong>
                </div>
                <div className="active">
                  <span>Result</span>
                  <strong>Almost ready</strong>
                </div>
              </div>
            </div>
          </section>
        </section>
      )}

      {finished && (
        <>
      <div ref={diagnosisRef} className="result-screen">
        <ResultCard
          grade={grade}
          diagnosis={diagnosis}
          measuredAt={resultMeasuredAt ?? new Date().toISOString()}
          contextItems={resultContextItems}
          applicationRankings={applicationRankingsResult}
          chartSlot={
            <LatencyPhaseChart
              samples={latencySamples}
              mode="result"
              grade={grade}
              downloadMbps={downloadMbps}
              uploadMbps={uploadMbps}
            />
          }
          headerActions={
            <div className="result-header-actions">
              <div className="result-action-buttons">
                <button
                  className="result-icon-button result-fullscreen-button"
                  type="button"
                  onClick={() => {
                    exitTestFullscreen(true);
                  }}
                  aria-label="Exit fullscreen"
                  title="Exit fullscreen"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3v6H3" />
                    <path d="M15 3v6h6" />
                    <path d="M9 21v-6H3" />
                    <path d="M15 21v-6h6" />
                  </svg>
                </button>
                <PrintResultButton />
                <button
                  className="result-icon-button result-share-button"
                  type="button"
                  onClick={() => {
                    setSharePanelOpen((current) => !current);
                  }}
                  aria-expanded={sharePanelOpen}
                  aria-controls="result-share-panel"
                  aria-label="Share result"
                  title="Share result"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                    <path d="M12 16V4" />
                    <path d="M8 8l4-4 4 4" />
                  </svg>
                </button>
              </div>
              {sharePanelOpen && (
                <ResultSharePanel
                  copyMessage={shareMessage}
                  links={shareLinks}
                  onCopy={copyShareText}
                />
              )}
            </div>
          }
          technicalRows={technicalRows}
          signupSlot={<SignupBox testCount={completedTestCount} />}
        />
      </div>
    </>
  )}

      {running && !preparationActive && (
        <section className="instrument-panel">
          <ForegroundRunNotice progress={testProgress} phase={phase} phaseDetail={phaseDetail} />

            <TestProcedurePanel
              phase={phase}
              downloadMbps={downloadMbps}
              uploadMbps={uploadMbps}
              downloadPeakMbps={downloadPeakMbps}
            uploadPeakMbps={uploadPeakMbps}
          />

          <div className="live-chart-layout">
            <LatencyPhaseChart
              samples={latencySamples}
              mode="live"
              grade={grade}
              activePhase={phase}
              excludedSamples={excludedLatencySamples}
            />

            {activeLiveStage && (
              <ActiveMeasurementCard
                title={activeLiveStage.title}
                icon={activeLiveStage.icon}
                theme={activeLiveStage.theme}
                ping={activeLiveStage.ping}
                quietBaseline={idle}
                sampleCount={activeLiveStage.sampleCount}
                phaseState={
                  status.includes("settling") || status.includes("starting")
                    ? "settling"
                    : activeLiveStage.sampleCount === 0
                      ? "starting"
                      : "recording"
                }
              />
            )}
          </div>

          {completedLiveStages.length > 0 && (
            <div className="completed-stage-strip" aria-label="Completed measurements">
              {completedLiveStages.map((item) => (
                <CompletedStageSummary
                  key={item.stage}
                  title={item.title}
                  theme={item.theme}
                  icon={item.icon}
                  ping={item.ping}
                  sampleCount={item.sampleCount}
                  speed={item.speed}
                  speedLabel={item.speedLabel}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {finished && (
        <div className="result-share-actions">
          <div className="result-action-buttons">
            <a className="result-rerun-button" href="/test?start=1">
              Run bufferbloat test
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function LatencyPhaseChart({
  samples,
  grade,
  mode = "live",
  activePhase = "ready",
  downloadMbps = null,
  uploadMbps = null,
  excludedSamples = null,
}: {
  samples: LatencySamplesByPhase;
  grade?: Grade;
  mode?: "live" | "result";
  activePhase?: TestPhase | "ready";
  downloadMbps?: number | null;
  uploadMbps?: number | null;
  excludedSamples?: LatencySamplesByPhase | null;
}) {
  const displaySamples = samples;
  const allSamples = [...samples.idle, ...samples.download, ...samples.upload];
  const plottedSamples = [
    ...displaySamples.idle,
    ...displaySamples.download,
    ...displaySamples.upload,
  ];
  const excludedPhase =
    activePhase === "warmup"
      ? "idle"
      : activePhase === "idle" || activePhase === "download" || activePhase === "upload"
        ? activePhase
        : null;
  const activeExcludedSamples =
    mode === "live" && excludedSamples && excludedPhase
      ? excludedSamples[excludedPhase].slice(
          Math.min(samples[excludedPhase].length, excludedSamples[excludedPhase].length)
        )
      : [];
  const medianValues = [
    sampleMedian(samples.idle),
    sampleMedian(samples.download),
    sampleMedian(samples.upload),
  ].filter((value): value is number => value !== null);
  const variationBounds = [
    { median: sampleMedian(samples.idle), variation: phaseLatencyVariation(samples.idle) },
    { median: sampleMedian(samples.download), variation: phaseLatencyVariation(samples.download) },
    { median: sampleMedian(samples.upload), variation: phaseLatencyVariation(samples.upload) },
  ].flatMap((item) =>
    item.median === null || item.variation === null
      ? []
      : [item.median, item.median + item.variation]
  );
  const valuesPlottedForScale = [
    ...plottedSamples,
    ...activeExcludedSamples,
    ...medianValues,
    ...variationBounds,
  ];
  const resultTrendValues =
    mode === "result"
      ? [
          ...rollingMedianTrendValues(displaySamples.idle),
          ...rollingMedianTrendValues(displaySamples.download),
          ...rollingMedianTrendValues(displaySamples.upload),
          ...medianValues,
        ]
      : [];
  const resultAxisBounds = scorecardAxisBounds([
    ...resultTrendValues,
    ...variationBounds,
  ]);
  const axisMax =
    mode === "result"
      ? resultAxisBounds.max
      : robustChartAxisMax(
          [...plottedSamples, ...activeExcludedSamples],
          [...medianValues, ...variationBounds]
        );
  const axisMin = mode === "result" ? resultAxisBounds.min : 0;
  const maxPlottedSample = valuesPlottedForScale.length
    ? Math.max(...valuesPlottedForScale)
    : axisMax;
  const hasClippedSamples = maxPlottedSample > axisMax;
  const axisMid = axisMin + (axisMax - axisMin) / 2;
  const chart = {
    left: 58,
    top: 24,
    width: 628,
    height: 314,
    bottom: 338,
  };
  const phaseWidth = chart.width / 3;
  const phaseRanges = {
    idle: [chart.left, chart.left + phaseWidth - 10],
    download: [chart.left + phaseWidth + 10, chart.left + phaseWidth * 2 - 10],
    upload: [chart.left + phaseWidth * 2 + 10, chart.left + phaseWidth * 3],
  } as const;
  const yFor = (sample: number) => {
    const boundedSample = Math.min(axisMax, Math.max(axisMin, sample));

    return chart.top + chart.height - ((boundedSample - axisMin) / (axisMax - axisMin)) * chart.height;
  };
  const phaseSampleCount = (phaseKey: "idle" | "download" | "upload") =>
    samples[phaseKey].length + (phaseKey === excludedPhase ? activeExcludedSamples.length : 0);
  const xForPhaseIndex = (
    range: readonly [number, number],
    index: number,
    totalCount: number
  ) =>
    totalCount <= 1
      ? range[0]
      : range[0] + (index / (totalCount - 1)) * (range[1] - range[0]);
  const samplePathWithOffset = (
    values: number[],
    range: readonly [number, number],
    offset: number,
    totalCount: number
  ) => {
    if (values.length === 0) return "";

    if (values.length === 1) {
      const x = xForPhaseIndex(range, offset, totalCount);
      const y = yFor(values[0]);

      return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${(x + 8).toFixed(2)} ${y.toFixed(2)}`;
    }

    const trendPoints = rollingMedianTrendPoints(
      values,
      (index) => xForPhaseIndex(range, offset + index, totalCount),
      yFor
    );

    return smoothPath(trendPoints);
  };
  const trendPathWithOffset = (
    values: number[],
    range: readonly [number, number],
    offset: number,
    totalCount: number
  ) => {
    const trendPoints = rollingMedianTrendPoints(
      values,
      (index) => xForPhaseIndex(range, offset + index, totalCount),
      yFor
    );

    return smoothPath(trendPoints);
  };
  const pathForPhase = (
    phaseKey: "idle" | "download" | "upload",
    values: number[]
  ) => {
    const range = phaseRanges[phaseKey];
    const excludedOffset = phaseKey === excludedPhase ? activeExcludedSamples.length : 0;
    const totalCount = Math.max(2, phaseSampleCount(phaseKey));

    return samplePathWithOffset(values, range, excludedOffset, totalCount);
  };
  const resultTrendPathForPhase = (
    phaseKey: "idle" | "download" | "upload",
    values: number[]
  ) => {
    const range = phaseRanges[phaseKey];
    const excludedOffset = phaseKey === excludedPhase ? activeExcludedSamples.length : 0;
    const totalCount = Math.max(2, phaseSampleCount(phaseKey));

    return trendPathWithOffset(values, range, excludedOffset, totalCount);
  };
  const idlePath = pathForPhase("idle", displaySamples.idle);
  const downloadPath = pathForPhase("download", displaySamples.download);
  const uploadPath = pathForPhase("upload", displaySamples.upload);
  const resultTrendPaths =
    mode === "result"
      ? [
          {
            key: "idle",
            className: "line-idle",
            d: resultTrendPathForPhase("idle", displaySamples.idle),
          },
          {
            key: "download",
            className: "line-download",
            d: resultTrendPathForPhase("download", displaySamples.download),
          },
          {
            key: "upload",
            className: "line-upload",
            d: resultTrendPathForPhase("upload", displaySamples.upload),
          },
        ].filter((path) => path.d)
      : [];
  const variationBands = [
    {
      key: "idle",
      className: "variation-idle",
      range: phaseRanges.idle,
      median: sampleMedian(samples.idle),
      variation: phaseLatencyVariation(samples.idle),
    },
    {
      key: "download",
      className: "variation-download",
      range: phaseRanges.download,
      median: sampleMedian(samples.download),
      variation: phaseLatencyVariation(samples.download),
    },
    {
      key: "upload",
      className: "variation-upload",
      range: phaseRanges.upload,
      median: sampleMedian(samples.upload),
      variation: phaseLatencyVariation(samples.upload),
    },
  ] as const;
  const phaseMedians = [
    {
      key: "idle",
      className: "median-idle",
      range: phaseRanges.idle,
      value: sampleMedian(samples.idle),
      values: samples.idle,
    },
    {
      key: "download",
      className: "median-download",
      range: phaseRanges.download,
      value: sampleMedian(samples.download),
      values: samples.download,
    },
    {
      key: "upload",
      className: "median-upload",
      range: phaseRanges.upload,
      value: sampleMedian(samples.upload),
      values: samples.upload,
    },
  ] as const;
  const medianPointForPhase = (
    values: readonly number[],
    medianValue: number | null,
    range: readonly [number, number],
    offset: number,
    totalCount: number
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
      values.length === 1 && offset === 0
        ? range[0]
        : xForPhaseIndex(range, offset + bestIndex, totalCount);

    return {
      sample: values[bestIndex],
      x,
      y: yFor(values[bestIndex]),
    };
  };
  const phaseSampleMarkers = ([
    {
      key: "idle",
      label: "Quiet line",
      className: "sample-idle",
      range: phaseRanges.idle,
      values: samples.idle,
      median: sampleMedian(samples.idle),
    },
    {
      key: "download",
      label: "Download on",
      className: "sample-download",
      range: phaseRanges.download,
      values: samples.download,
      median: sampleMedian(samples.download),
    },
    {
      key: "upload",
      label: "Upload on",
      className: "sample-upload",
      range: phaseRanges.upload,
      values: samples.upload,
      median: sampleMedian(samples.upload),
    },
  ] as const).flatMap((phase) => {
    const measuredOffset = phase.key === excludedPhase ? activeExcludedSamples.length : 0;
    const totalCount = Math.max(2, phaseSampleCount(phase.key));

    return (
    phase.values.map((sample, index) => {
      const x =
        phase.values.length === 1 && measuredOffset === 0
          ? phase.range[0]
          : xForPhaseIndex(phase.range, measuredOffset + index, totalCount);
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
  });
  const excludedRange = excludedPhase ? phaseRanges[excludedPhase] : null;
  const excludedTotalCount = excludedPhase ? Math.max(2, phaseSampleCount(excludedPhase)) : 2;
  const excludedSampleMarkers =
    mode === "live" && excludedRange
      ? activeExcludedSamples.map((sample, index) => {
          return {
            key: `excluded-${excludedPhase}-${index}-${formatLatency(sample)}`,
            x: xForPhaseIndex(excludedRange, index, excludedTotalCount),
            y: yFor(sample),
          };
        })
      : [];
  const showExcludedSampleLabel =
    mode === "live" &&
    excludedPhase !== null &&
    activeExcludedSamples.length > 0 &&
    samples[excludedPhase].length === 0;
  const hasSamples = allSamples.length > 0;
  const revealDownload = mode === "result" || samples.download.length > 0;
  const revealUpload = mode === "result" || samples.upload.length > 0;
  const livePhaseIndex =
    activePhase === "idle"
      ? 0
      : activePhase === "download"
        ? 1
        : activePhase === "upload"
          ? 2
          : -1;
  const idleCompletedInLive =
    mode === "live" &&
    (activePhase === "download" ||
      activePhase === "upload" ||
      samples.download.length > 0 ||
      samples.upload.length > 0);
  const downloadCompletedInLive =
    mode === "live" &&
    (activePhase === "upload" || samples.upload.length > 0);
  const idleCoverKind =
    idleCompletedInLive
      ? "completed"
      : livePhaseIndex < 0
        ? "pending"
        : "";
  const downloadCoverKind =
    downloadCompletedInLive
      ? "completed"
      : livePhaseIndex < 1
        ? "pending"
        : "";
  const uploadCoverKind = livePhaseIndex < 2 ? "pending" : "";
  const livePhaseCovers = [
    {
      key: "idle",
      label:
        idleCoverKind === "completed"
          ? "quiet done"
          : idleCoverKind === "pending"
            ? "quiet line pending"
            : "",
      x: chart.left,
      kind: idleCoverKind,
    },
    {
      key: "download",
      label:
        downloadCoverKind === "completed"
          ? "download done"
          : downloadCoverKind === "pending"
            ? "download test pending"
            : "",
      x: chart.left + phaseWidth,
      kind: downloadCoverKind,
    },
    {
      key: "upload",
      label: uploadCoverKind === "pending" ? "upload test pending" : "",
      x: chart.left + phaseWidth * 2,
      kind: uploadCoverKind,
    },
  ].filter(
    (phase): phase is { key: string; label: string; x: number; kind: "completed" | "pending" } =>
      mode === "live" && (phase.kind === "completed" || phase.kind === "pending")
  );
  const gradeClass =
    mode === "result" && grade && grade !== "—"
      ? `grade-${grade === "A+" ? "a-plus" : grade.toLowerCase()}`
      : "";

  return (
    <section className={`latency-phase-chart ${mode} ${gradeClass}`} aria-label="Latency / ping samples by test phase">
      <div className="latency-phase-chart-header">
        <strong>Latency / Ping in milliseconds</strong>
        {mode === "live" && (
          <span className="latency-trend-note">dots are raw pings; line is rolling median trend</span>
        )}
        {mode === "result" && (
          <div className="latency-phase-legend" aria-hidden="true">
            <span className="idle">quiet line</span>
            <span className="download">download on</span>
            <span className="upload">upload on</span>
            <span className="reference">median ping</span>
            <span className="spread">p95 latency</span>
          </div>
        )}
      </div>

      <svg viewBox="0 0 720 360" role="img" aria-labelledby={`latency-phase-chart-${mode}`}>
        <title id={`latency-phase-chart-${mode}`}>
          Ping samples by test phase
        </title>

        <rect
          className={`phase-zone phase-zone-idle ${mode === "live" && activePhase === "idle" ? "active" : ""}`}
          x={chart.left}
          y={chart.top}
          width={phaseWidth}
          height={chart.height}
        />
        <rect
          className={`phase-zone phase-zone-download ${mode === "live" && activePhase === "download" ? "active" : ""}`}
          x={chart.left + phaseWidth}
          y={chart.top}
          width={phaseWidth}
          height={chart.height}
        />
        <rect
          className={`phase-zone phase-zone-upload ${mode === "live" && activePhase === "upload" ? "active" : ""}`}
          x={chart.left + phaseWidth * 2}
          y={chart.top}
          width={phaseWidth}
          height={chart.height}
        />

        <line className="chart-axis" x1={chart.left} y1={chart.bottom} x2={chart.left + chart.width} y2={chart.bottom} />
        <line className="chart-axis" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} />
        {[axisMax, axisMid, axisMin].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="chart-grid" x1={chart.left} y1={y} x2={chart.left + chart.width} y2={y} />
              <text className="chart-axis-label" x={12} y={y + 4}>{formatChartTick(tick)}</text>
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

        {mode === "result" &&
          variationBands.map((band) => {
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

        {mode === "result" && resultTrendPaths.length > 0 && (
          <g className="latency-median-trend" aria-label="Smoothed binned median latency trend">
            {resultTrendPaths.map((path) => (
              <path
                key={path.key}
                className={`latency-line latency-median-trend-line ${path.className}`}
                d={path.d}
              />
            ))}
          </g>
        )}
        {mode !== "result" && idlePath && (
          <path
            className={`latency-line line-idle ${idleCompletedInLive ? "completed" : ""}`}
            d={idlePath}
          />
        )}
        {mode !== "result" && revealDownload && downloadPath && (
          <path
            className={`latency-line line-download ${downloadCompletedInLive ? "completed" : ""}`}
            d={downloadPath}
          />
        )}
        {mode !== "result" && revealUpload && uploadPath && <path className="latency-line line-upload" d={uploadPath} />}

        {excludedSampleMarkers.length > 0 && (
          <g className="latency-excluded-samples" aria-label="Warmup pings excluded from the result">
            {showExcludedSampleLabel && (
              <text x={excludedRange ? excludedRange[0] + 8 : chart.left + 8} y={chart.top + 20}>
                warmup pings, not scored
              </text>
            )}
            {excludedSampleMarkers.map((point) => (
              <circle key={point.key} cx={point.x} cy={point.y} r={3.2} />
            ))}
          </g>
        )}

        {phaseSampleMarkers.map((point) => (
          <g
            aria-label={point.label}
            className={`latency-sample-marker ${point.className} ${
              (point.className === "sample-idle" && idleCompletedInLive) ||
              (point.className === "sample-download" && downloadCompletedInLive)
                ? "completed"
                : ""
            }`}
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

        {mode === "result" &&
          hasSamples &&
          phaseMedians.map((median) => {
            if (median.value === null) {
              return null;
            }

            const measuredOffset = median.key === excludedPhase ? activeExcludedSamples.length : 0;
            const totalCount = Math.max(2, phaseSampleCount(median.key));
            const point = medianPointForPhase(
              median.values,
              median.value,
              median.range,
              measuredOffset,
              totalCount
            );

            if (point === null) {
              return null;
            }

            const { x, y } = point;
            const labelY = y < chart.top + 38 ? y + 31 : y - 22;
            const labelText = `${formatLatency(median.value)} ms`;

            return (
              <g
                aria-label={`median ping ${formatLatency(median.value)} ms, nearest measured sample ${formatLatency(point.sample)} ms`}
                key={median.key}
                className={`latency-median-marker ${median.className}`}
              >
                <title>{`median ping ${formatLatency(median.value)} ms; nearest measured sample ${formatLatency(point.sample)} ms`}</title>
                <circle className="median-halo" cx={x} cy={y} r={11} />
                <circle className="median-ring" cx={x} cy={y} r={8} />
                <text x={x} y={labelY}>{labelText}</text>
                <text className="chart-hover-tooltip" x={x} y={labelY - 18}>
                  median ping
                </text>
              </g>
            );
          })}

        {livePhaseCovers.map((phase) => (
            <g key={phase.key} className={`chart-phase-obscured ${phase.kind}`}>
              <rect x={phase.x} y={chart.top} width={phaseWidth} height={chart.height} />
              <text x={phase.x + phaseWidth / 2} y={chart.top + chart.height / 2}>
                {phase.label}
              </text>
            </g>
          ))}

        <text className="chart-phase-label label-idle" x={chart.left + phaseWidth / 2} y={354}>quiet line</text>
        <text className="chart-phase-label label-download" x={chart.left + phaseWidth + phaseWidth / 2} y={354}>download on</text>
        <text className="chart-phase-label label-upload" x={chart.left + phaseWidth * 2 + phaseWidth / 2} y={354}>upload on</text>
      </svg>

      {mode === "result" ? (
        <div className="chart-throughput" aria-label="Average throughput during load phases">
          <span className="download" aria-label={`download ${formatChartSpeed(downloadMbps)}`}>
            <em>download link</em>
            <strong>{formatChartSpeed(downloadMbps)}</strong>
          </span>
          <span className="upload" aria-label={`upload ${formatChartSpeed(uploadMbps)}`}>
            <em>upload link</em>
            <strong>{formatChartSpeed(uploadMbps)}</strong>
          </span>
        </div>
      ) : null}
    </section>
  );
}

function getPhaseDetail(phase: TestPhase | "ready", status: string) {
  if (phase === "warmup") {
    return {
      eyebrow: "Preparing",
      title: "Warming up your connection",
      detail: "Early pings are excluded while the browser and network path settle.",
    };
  }

  if (phase === "idle") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 1 of 3",
      title: "Measuring quiet line",
      detail: settling
        ? "Early pings are excluded until the baseline is stable."
        : "Raw pings establish the no-load baseline; the line shows a rolling median trend.",
    };
  }

  if (phase === "download") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 2 of 3",
      title: "Measuring latency during download pressure",
      detail: settling
        ? "Download load is filling the link before loaded pings are scored."
        : "Raw pings are recorded under download pressure; the line shows a rolling median trend.",
    };
  }

  if (phase === "upload") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 3 of 3",
      title: "Measuring latency during upload pressure",
      detail: settling
        ? "Upload load is filling the link before loaded pings are scored."
        : "Raw pings are recorded under upload pressure; the line shows a rolling median trend.",
    };
  }

  if (phase === "analysis") {
    return {
      eyebrow: "Calculating",
      title: "Building your scorecard",
      detail: "Calculating latency spread, total score, application ratings, and network assessment.",
    };
  }

  return {
    eyebrow: "Ready",
    title: "Ready to test",
    detail: "Run the test to see whether ping stays stable when the connection is busy.",
  };
}

function ForegroundRunNotice({
  progress,
  phase,
  phaseDetail,
}: {
  progress: number;
  phase: TestPhase | "ready" | "analysis" | "stopped";
  phaseDetail: ReturnType<typeof getPhaseDetail>;
}) {
  const targetProgress = Math.max(0, Math.min(100, progress));
  const progressSegment = (target: number) => {
    const segments = [
      { at: 3, next: 8, duration: 10000 },
      { at: 8, next: 12, duration: 4000 },
      { at: 12, next: 34, duration: 8000 },
      { at: 24, next: 34, duration: 2200 },
      { at: 34, next: 44, duration: 2200 },
      { at: 44, next: 58, duration: 8000 },
      { at: 58, next: 68, duration: 14000 },
      { at: 68, next: 76, duration: 2200 },
      { at: 76, next: 88, duration: 8000 },
      { at: 88, next: 96, duration: 14000 },
      { at: 96, next: 100, duration: 6200 },
    ];
    const segment =
      segments.find((item) => Math.abs(item.at - target) < 0.5) ??
      segments.find((item) => item.at > target) ??
      null;

    if (!segment) {
      return { ceiling: target, duration: 900 };
    }

    return {
      ceiling: Math.max(target, segment.next - 0.4),
      duration: segment.duration,
    };
  };
  const displayProgressRef = useRef(targetProgress);
  const [displayProgress, setDisplayProgress] = useState(targetProgress);

  useEffect(() => {
    let from = displayProgressRef.current;
    const to = targetProgress;
    const { ceiling, duration } = progressSegment(to);

    if (to < from) {
      displayProgressRef.current = to;
      setDisplayProgress(to);
      return;
    }

    if (Math.abs(to - from) < 0.5) {
      from = to;
      displayProgressRef.current = to;
      setDisplayProgress(to);
    }

    let frame = 0;
    const startedAt = performance.now();
    const catchUpDuration = Math.min(900, Math.max(360, Math.abs(to - from) * 24));

    const tick = (now: number) => {
      const catchUpElapsed = Math.min(1, (now - startedAt) / catchUpDuration);
      const catchUpEased = 1 - Math.pow(1 - catchUpElapsed, 3);
      const caughtUp = from + (to - from) * catchUpEased;
      const creepElapsed = Math.max(0, now - startedAt - catchUpDuration);
      const creepProgress = Math.min(1, creepElapsed / duration);
      const creeping = to + (ceiling - to) * creepProgress;
      const next = catchUpElapsed < 1 ? caughtUp : creeping;

      displayProgressRef.current = next;
      setDisplayProgress(next);

      if (next < ceiling - 0.05) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [targetProgress, phase]);

  return (
    <div className={`foreground-run-notice ${phase}`} role="status" aria-live="polite">
      <div className="test-progress-current">
        <span className="live-status-step">{phaseDetail.eyebrow}</span>
        <strong>{phaseDetail.title}</strong>
      </div>
      <div className="test-progress-track" aria-hidden="true">
        <span style={{ width: `${displayProgress}%` }} />
      </div>
      <p className="test-progress-explanation">{phaseDetail.detail}</p>
    </div>
  );
}

function TestProcedurePanel({
  phase,
  downloadMbps,
  uploadMbps,
  downloadPeakMbps,
  uploadPeakMbps,
}: {
  phase: TestPhase | "ready";
  downloadMbps: number | null;
  uploadMbps: number | null;
  downloadPeakMbps: number | null;
  uploadPeakMbps: number | null;
}) {
  const visiblePhase =
    phase === "download" || phase === "upload"
      ? phase
      : phase === "analysis"
        ? "upload"
        : "download";
  const pressureStateFor = (
    targetPhase: "download" | "upload",
    speed: number | null,
    peakSpeed: number | null
  ) => {
    const active = phase === targetPhase;

    if (phase !== targetPhase) {
      return {
        statusLabel: "0 Mb/s",
        meterValue: 0,
        active,
      };
    }

    if (speed === null) {
      return {
        statusLabel: "starting",
        meterValue: 0,
        active,
      };
    }

    return {
      statusLabel: `${formatSpeed(speed)} Mb/s`,
      meterValue: !peakSpeed ? 0 : Math.max(8, Math.min(100, (speed / peakSpeed) * 100)),
      active,
    };
  };
  const downloadPressure = pressureStateFor("download", downloadMbps, downloadPeakMbps);
  const uploadPressure = pressureStateFor("upload", uploadMbps, uploadPeakMbps);
  const steps = [
    {
      phase: "download",
      metricLabel: "Download link",
      metricValue: downloadPressure.statusLabel,
      meterValue: downloadPressure.meterValue,
      meterActive: downloadPressure.active,
    },
    {
      phase: "upload",
      metricLabel: "Upload link",
      metricValue: uploadPressure.statusLabel,
      meterValue: uploadPressure.meterValue,
      meterActive: uploadPressure.active,
    },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.phase === visiblePhase);
  const auxiliaryState =
    phase === "analysis"
        ? {
            className: "analysis",
            title: "Creating result",
            detail: "Comparing baseline, download, and upload measurements.",
          }
        : null;

  return (
    <section className={`test-procedure-panel ${auxiliaryState ? `auxiliary-${auxiliaryState.className}` : ""}`} aria-live="polite">
      <ol className="procedure-stage-grid" aria-label="Test procedure">
        {steps.map((step, index) => {
          const active = step.phase === visiblePhase && phase !== "warmup" && phase !== "analysis";
          const complete = phase === "analysis" || currentIndex > index;
          const pending = !active && !complete;
          return (
            <li
              key={step.phase}
              className={`${active ? "active" : ""} ${
                complete ? "complete" : ""
              } ${pending ? "pending" : ""} ${step.phase}`}
            >
              <i aria-hidden="true" />
              <div
                className={`procedure-live-metric ${
                  step.meterValue <= 0 ? "empty" : ""
                } ${step.meterActive ? "running" : ""}`}
              >
                <div className="procedure-link-head">
                  <small>{step.metricLabel} ({step.metricValue})</small>
                </div>
                <div className="procedure-link-meter" aria-hidden="true">
                  <span style={{ width: `${step.meterValue}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {auxiliaryState && (
        <div className={`procedure-auxiliary ${auxiliaryState.className}`}>
          <div className="procedure-auxiliary-visual" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>{auxiliaryState.title}</strong>
            <p>{auxiliaryState.detail}</p>
          </div>
        </div>
      )}

    </section>
  );
}

function ActiveMeasurementCard({
  title,
  icon,
  theme,
  ping,
  quietBaseline,
  sampleCount,
  phaseState,
}: {
  title: string;
  icon: string;
  theme: "baseline" | "download" | "upload";
  ping: number | null;
  quietBaseline: number | null;
  sampleCount: number;
  phaseState: "settling" | "starting" | "recording";
}) {
  const readableState =
    phaseState === "recording"
      ? "scoring pings"
      : phaseState === "starting"
        ? "starting pings"
        : "not scoring yet";
  const scoredPings = phaseState === "recording" ? sampleCount : 0;

  return (
    <section className={`active-measurement-card live-measurement-strip ${theme}`} aria-live="polite">
      <div className="live-measurement-phase">
        <span aria-hidden="true">{icon}</span>
        <strong>{title}</strong>
      </div>
      <dl className="live-measurement-grid">
        <div>
          <dt>{theme === "baseline" ? "Phase" : "Quiet baseline"}</dt>
          <dd>{theme === "baseline" ? readableState : quietBaseline === null ? "measuring" : `${formatLatency(quietBaseline)} ms`}</dd>
        </div>

        <div>
          <dt>Pings scored</dt>
          <dd>{scoredPings}</dd>
        </div>

        <div>
          <dt>Median ping</dt>
          <dd>{ping === null ? "waiting" : `${formatLatency(ping)} ms`}</dd>
        </div>
      </dl>

    </section>
  );
}

function CompletedStageSummary({
  title,
  theme,
  icon,
  ping,
  sampleCount,
  speed,
  speedLabel,
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  sampleCount: number;
  speed?: number | null;
  speedLabel?: string | null;
}) {
  return (
    <article className={`completed-stage-summary ${theme}`}>
      <span>{icon}</span>

      <div>
        <strong>{title}</strong>
        <p>{formatLatency(ping)} ms median · {sampleCount} samples</p>
      </div>

      {speedLabel && (
        <em>{speed == null ? "—" : `${formatSpeed(speed)} Mb/s`}</em>
      )}
    </article>
  );
}
