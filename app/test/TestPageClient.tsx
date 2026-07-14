"use client";

import Image from "next/image";
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
const LOAD_SETTLING_SECONDS = 4;
const PREFLIGHT_SECONDS = 7;
const FOREGROUND_ERROR =
  "The test paused because this tab was no longer visible.";
const TEST_COUNT_STORAGE_KEY = "bufferbloat_test_count";
const ANALYTICS_SESSION_STORAGE_KEY = "bufferbloat_analytics_session";

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
    applications?: ReturnType<typeof applicationRankingsFor>;
  };
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

function sampleStandardDeviation(samples: number[]) {
  if (samples.length < 2) return 0;

  const mean = samples.reduce((total, sample) => total + sample, 0) / samples.length;
  const variance =
    samples.reduce((total, sample) => total + (sample - mean) ** 2, 0) /
    samples.length;

  return Math.sqrt(variance);
}

function phaseLatencyVariation(samples: number[]) {
  if (samples.length < 2) return null;

  const totalMovement = samples
    .slice(1)
    .reduce((total, sample, index) => total + Math.abs(sample - samples[index]), 0);

  return totalMovement / (samples.length - 1);
}

function smoothDisplaySamples(samples: number[]) {
  if (samples.length < 4) return samples;

  const median = sampleMedian(samples) ?? samples[0];
  const deviation = sampleStandardDeviation(samples);
  const upperBound = median + deviation * 1.25;
  const clipped = samples.map((sample) => Math.min(sample, upperBound));

  return clipped.map((sample, index) => {
    const previous = clipped[Math.max(0, index - 1)];
    const next = clipped[Math.min(clipped.length - 1, index + 1)];

    return previous * 0.22 + sample * 0.56 + next * 0.22;
  });
}

function samplePath(
  samples: number[],
  startX: number,
  endX: number,
  yFor: (sample: number) => number
) {
  if (samples.length === 0) return "";

  if (samples.length === 1) {
    const y = yFor(samples[0]);
    return `M ${startX.toFixed(2)} ${y.toFixed(2)} L ${(startX + 8).toFixed(2)} ${y.toFixed(2)}`;
  }

  const points = samples.map((sample, index) => ({
    x: startX + (index / (samples.length - 1)) * (endX - startX),
    y: yFor(sample),
  }));

  return smoothPath(points);
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

function formatChartTick(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value < 100) return value.toFixed(1).replace(/\.0$/, "");
  return Math.round(value).toString();
}

function chartAxisMax(value: number) {
  if (!Number.isFinite(value) || value <= 100) return 100;
  if (value <= 200) return Math.ceil(value / 25) * 25;
  if (value <= 500) return Math.ceil(value / 50) * 50;

  return Math.ceil(value / 100) * 100;
}

function stressMovement(downloadDelta: number | null, uploadDelta: number | null) {
  return Math.max(0, downloadDelta ?? 0, uploadDelta ?? 0);
}

function loadedLatency(downloadLatency: number | null, uploadLatency: number | null) {
  if (downloadLatency === null && uploadLatency === null) return null;
  return Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
}

function findingFor(
  grade: Grade,
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadMbps: number | null
) {
  const typical = `${formatLatency(idle)} ms`;
  const downloadChange = latencyDelta(idle, downloadLatency);
  const uploadChange = latencyDelta(idle, uploadLatency);
  const meaningfulDownload = (downloadChange ?? 0) > 10;
  const meaningfulUpload = (uploadChange ?? 0) > 10;
  const severeMovement = stressMovement(downloadChange, uploadChange) >= 80;
  const uploadDominates =
    meaningfulUpload && (uploadChange ?? 0) > Math.max(10, (downloadChange ?? 0) * 1.35);
  const downloadDominates =
    meaningfulDownload && (downloadChange ?? 0) > Math.max(10, (uploadChange ?? 0) * 1.35);

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
    if (severeMovement || grade === "F") {
      return `This connection became hard to trust once it was busy. ${source} Calls, games, and interactive work may stall even if a normal speed test looks fine. ${repeatNote}`;
    }

    return `This connection stayed usable, but the test found bufferbloat when the line was busy. ${source} You may notice lag during calls, games, or uploads. ${repeatNote}`;
  }

  if (grade === "B") {
    return `This is a solid result with some added delay under load. ${source} Most everyday use should be fine, but latency-sensitive work may feel less crisp when the connection is busy.`;
  }

  if (grade === "A+" || grade === "A") {
    if (grade === "A+") {
      return `Exceptional result. The connection stayed calm while the test filled the line, so latency-sensitive apps should have plenty of room even when other traffic is active.`;
    }

    if ((idle ?? 0) < 100) {
      return `Excellent bufferbloat result. The test pushed download and upload traffic, and latency / ping stayed close to its normal level.`;
    }

    if ((idle ?? 0) <= 120) {
      return `Excellent bufferbloat result. Your normal latency / ping is moderate at about ${typical}, but it did not get much worse when the connection was busy.`;
    }

    return `Good bufferbloat result, with an important footnote: the connection stayed stable under load, but the normal latency / ping is already high at about ${typical}.`;
  }

  return `This run measured ${formatSpeed(downloadMbps)} Mbps download, but did not produce a complete latency / ping under load result.`;
}

function applicationRankingsFor(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadDelta: number | null,
  uploadDelta: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null,
  quietVariation: number | null,
  downloadVariation: number | null,
  uploadVariation: number | null
) {
  const baseline = idle ?? 0;
  const worstLoadedLatency = Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
  const movement = stressMovement(downloadDelta, uploadDelta);
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
    if (score >= 85) return { label: "Very reliable", tone: "excellent" as const };
    if (score >= 70) return { label: "Reliable", tone: "good" as const };
    if (score >= 50) return { label: "Unstable", tone: "fair" as const };
    return { label: "Poor", tone: "poor" as const };
  };

  return [
    {
      symbol: "⌁",
      name: "Web browsing",
      score: clampScore(96 - movement * 0.28 - loadedVariation * 0.1 - Math.max(0, worstLoadedLatency - 160) * 0.25),
    },
    {
      symbol: "▶",
      name: "Video streaming",
      score: clampScore(speedScore(down, 25, 8) - movement * 0.06 - loadedVariation * 0.04),
    },
    {
      symbol: "☎",
      name: "Voice calls",
      score: clampScore(
        96 - Math.max(0, baseline - 90) * 0.2 - movement * 0.45 - worstVariation * 0.48 - Math.max(0, 1 - up) * 18
      ),
    },
    {
      symbol: "◉",
      name: "Video calls",
      score: clampScore(
        94 -
          Math.max(0, baseline - 80) * 0.22 -
          movement * 0.5 -
          worstVariation * 0.4 -
          Math.max(0, 10 - down) * 2 -
          Math.max(0, 3 - up) * 10
      ),
    },
    {
      symbol: "◆",
      name: "Online gaming",
      score: clampScore(96 - Math.max(0, baseline - 40) * 0.4 - movement * 0.5 - worstVariation * 0.52),
    },
    {
      symbol: "⇧",
      name: "Cloud backup",
      score: clampScore(speedScore(up, 10, 2) - movement * 0.35 - (uploadVariation ?? 0) * 0.12),
    },
  ]
    .map((item) => ({ ...item, ...labelFor(item.score) }))
    .sort((a, b) => b.score - a.score);
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [preflightSeconds, setPreflightSeconds] = useState(PREFLIGHT_SECONDS);
  const [preflightPaused, setPreflightPaused] = useState(false);

  const [idle, setIdle] = useState<number | null>(null);
  const [downloadLatency, setDownloadLatency] = useState<number | null>(null);
  const [uploadLatency, setUploadLatency] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [phase, setPhase] = useState<TestPhase | "ready">("ready");
  const [status, setStatus] = useState("ready");
  const [latencySamples, setLatencySamples] = useState<LatencySamplesByPhase>(
    () => emptyLatencySamples()
  );
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

  const diagnosisRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const testStartedAtRef = useRef<number | null>(null);
  const testRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    sendAnalyticsEvent(
      analyticsPayload(analyticsSessionId(), "session", readStoredTestCount())
    );
  }, []);

  const openPreflight = useCallback(() => {
    setPreflightSeconds(PREFLIGHT_SECONDS);
    setPreflightPaused(false);
    setShowPreflight(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("start") !== "1") return;

    const timer = window.setTimeout(() => {
      openPreflight();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [openPreflight]);

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
      setError(null);
      setRunning(true);
      setShowPreflight(false);
      setAnalyzing(false);
      setFinished(false);
      setIdle(null);
      setDownloadLatency(null);
      setUploadLatency(null);
      setDownloadMbps(null);
      setUploadMbps(null);
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
          setLatencySamples(cloneLatencySamples(update.latencySamples));
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
      setLatencySamples(cloneLatencySamples(result.latencySamples));
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
        completedQuietVariation,
        completedDownloadVariation,
        completedUploadVariation
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
      if (storedShareId && typeof window !== "undefined") {
        window.location.assign(`/test?result=${storedShareId}`);
        return;
      }

      setAnalyzing(false);
      setFinished(true);
      setShareUrl(
        storedShareId && typeof window !== "undefined"
          ? `${window.location.origin}/test?result=${storedShareId}`
          : null
      );
    } catch (err) {
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
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      if (testRunIdRef.current === runId) {
        testRunIdRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!showPreflight || preflightPaused || running || analyzing || finished || error) {
      return;
    }

    if (preflightSeconds <= 0) {
      const timer = window.setTimeout(() => {
        void runTest();
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    const timer = window.setTimeout(() => {
      setPreflightSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    analyzing,
    error,
    finished,
    preflightPaused,
    preflightSeconds,
    runTest,
    running,
    showPreflight,
  ]);

  const automaticStage = running && !analyzing ? stageIndex(status) : 0;
  const phaseDetail = getPhaseDetail(phase, status);
  const downloadDelta = latencyDelta(idle, downloadLatency);
  const uploadDelta = latencyDelta(idle, uploadLatency);
  const liveStages = [
    {
      stage: 1,
      title: "Quiet latency",
      theme: "baseline",
      icon: "⌁",
      ping: idle,
      sampleCount: sampleCounts.idle,
      done: idle !== null,
      speed: null,
      speedLabel: null,
    },
    {
      stage: 2,
      title: "Download load",
      theme: "download",
      icon: "↓",
      ping: downloadLatency,
      sampleCount: sampleCounts.download,
      done: downloadLatency !== null,
      speed: downloadMbps,
      speedLabel: "Download throughput",
    },
    {
      stage: 3,
      title: "Upload load",
      theme: "upload",
      icon: "↑",
      ping: uploadLatency,
      sampleCount: sampleCounts.upload,
      done: uploadLatency !== null,
      speed: uploadMbps,
      speedLabel: "Upload throughput",
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
  const quietVariation = phaseLatencyVariation(latencySamples.idle);
  const downloadVariation = phaseLatencyVariation(latencySamples.download);
  const uploadVariation = phaseLatencyVariation(latencySamples.upload);
  const variationValues = [quietVariation, downloadVariation, uploadVariation].filter(
    (value): value is number => value !== null
  );
  const medianVariation = variationValues.length > 0 ? sampleMedian(variationValues) : null;
  const applicationRankingsResult = applicationRankingsFor(
    idle,
    downloadLatency,
    uploadLatency,
    downloadDelta,
    uploadDelta,
    downloadMbps,
    uploadMbps,
    quietVariation,
    downloadVariation,
    uploadVariation
  );
  const totalScoredSamples = sampleCounts.idle + sampleCounts.download + sampleCounts.upload;
  const shareText =
    "I used Bufferbloat.org to check how my internet connection performs in real-life situations. It is more accurate than an ordinary speed test for this question, non-commercial, and open source.";
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
      setShareMessage("Share link is unavailable for this run.");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setShareMessage("Share text copied.");
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
      section: "Latency variation",
      metric: "Quiet latency variation",
      value: formatLatency(quietVariation),
      unit: "ms",
      note: "Average absolute change between consecutive scored quiet latency / ping samples.",
    },
    {
      section: "Latency variation",
      metric: "Download latency variation",
      value: formatLatency(downloadVariation),
      unit: "ms",
      note: "Average absolute change between consecutive scored latency / ping samples during download load.",
    },
    {
      section: "Latency variation",
      metric: "Upload latency variation",
      value: formatLatency(uploadVariation),
      unit: "ms",
      note: "Average absolute change between consecutive scored latency / ping samples during upload load.",
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
      metric: "Settling period",
      value: String(LOAD_SETTLING_SECONDS),
      unit: "sec",
      note: "Initial loaded interval excluded before loaded medians are scored.",
    },
    ...applicationRankingsResult.map((item, index) => ({
      section: "Application fit",
      metric: `${index + 1}. ${item.name}`,
      value: String(item.score),
      unit: "/100",
      note: `${item.label}. Ranked using measured latency under load, latency movement, and relevant throughput.`,
    })),
    {
      section: "Privacy",
      metric: "Export contents",
      value: "Measurement data only",
      note: "The CSV export excludes IP address, location, browser fingerprint, and device identity.",
    },
  ];

  return (
    <main className="test-shell">
      {!finished && (
        <header className="test-page-heading">
          <span>Bufferbloat test</span>
          <h1>Testing your internet connection</h1>
        </header>
      )}

      {!error && !running && !analyzing && !finished && !showPreflight && (
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker">
                INTERNET RELIABILITY DIAGNOSTIC
              </div>

              <h1>Bufferbloat test</h1>

              <p className="hero-subtitle">
                Measure whether your internet connection stays reliable while
                download and upload traffic are active.
              </p>

              <p className="hero-description">
                The bufferbloat test compares normal latency with latency under
                load. It normally takes less than a minute and is designed to be
                faster than the alternative.
              </p>

              <button
                className="hero-start-button"
                onClick={openPreflight}
                disabled={running || analyzing}
              >
                Start test
              </button>

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


          </div>
        </section>
      )}

      {!error && !running && !analyzing && !finished && showPreflight && (
        <section className="terminal-card preflight-card">
          <div className="preflight-layout">
            <div className="preflight-copy">
              <span>Before the measurement</span>
              <h1>We are about to test your connection</h1>
              <p>
                Browser measurements are sensitive to other traffic. For the
                cleanest run:
              </p>

              <ul className="preflight-caveats">
                <li>Disable VPN if you want to test the raw connection.</li>
                <li>Pause downloads, backups, calls, and streams.</li>
                <li>Keep this tab visible; the test stops if focus changes.</li>
              </ul>

              <div
                className={`preflight-countdown ${preflightPaused ? "paused" : ""}`}
                role="timer"
                aria-live="polite"
              >
                <strong>{preflightSeconds}</strong>
                <span>{preflightPaused ? "Countdown paused" : "Starting automatically"}</span>
                <em>
                  The full test usually takes about a minute.
                </em>
              </div>

              <div className="preflight-actions">
                <button onClick={runTest} disabled={running || analyzing}>
                  Start now
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setPreflightPaused((current) => !current);
                  }}
                  disabled={running || analyzing}
                >
                  {preflightPaused ? "Continue countdown" : "Stop countdown"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="test-stop-stage">
          <div className="stopped-test-underlay" aria-hidden="true">
            <section className="instrument-panel">
              <ForegroundRunNotice progress={testProgress} phase={phase} />

              <TestProcedurePanel
                phase={phase}
                status={status}
                phaseDetail={phaseDetail}
                idle={idle}
                downloadLatency={downloadLatency}
                uploadLatency={uploadLatency}
                downloadMbps={downloadMbps}
                uploadMbps={uploadMbps}
              />

              {phase !== "warmup" && (
                <div className="live-chart-layout">
                  <LatencyPhaseChart samples={latencySamples} mode="live" grade={grade} activePhase={phase} />

                  {activeLiveStage && (
                    <ActiveMeasurementCard
                      title={activeLiveStage.title}
                      theme={activeLiveStage.theme}
                      icon={activeLiveStage.icon}
                      ping={activeLiveStage.ping}
                      sampleCount={activeLiveStage.sampleCount}
                      speed={activeLiveStage.speed}
                      speedLabel={activeLiveStage.speedLabel}
                      phaseState="settling"
                    />
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="test-stop-overlay" aria-live="assertive">
            <div className="terminal-card error-card test-stop-card test-stop-screen">
              <Image
                src="/test-paused.svg"
                alt=""
                width={220}
                height={150}
                className="test-stop-illustration"
                aria-hidden="true"
              />
              <span>Test stopped to protect accuracy</span>
              <strong>Focus moved away from this tab</strong>
              <p>
                We had to stop this run because background tabs can be throttled,
                which may compromise the quality of the measurement. Please
                restart and keep this tab visible until the result appears.
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
              <Image
                src="/test-foreground.svg"
                alt=""
                width={220}
                height={150}
                className="test-stop-illustration"
                aria-hidden="true"
              />
              <span>Preparing your scorecard</span>
              <strong>Calculating result</strong>
              <p>
                Comparing the quiet, download, and upload measurements before
                showing the final bufferbloat grade.
              </p>
              <div className="analysis-progress" aria-hidden="true">
                <div />
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
          scorecardMetrics={[
            {
              label: "Latency / ping",
              value: `${formatLatency(idle)} ms`,
            },
            {
              label: "Download stress",
              value: formatDelta(downloadDelta),
            },
            {
              label: "Upload stress",
              value: formatDelta(uploadDelta),
            },
            {
              label: "Median latency variation",
              value: `${formatLatency(medianVariation)} ms`,
            },
          ]}
          finding={findingFor(
            grade,
            idle,
            downloadLatency,
            uploadLatency,
            downloadMbps
          )}
          applicationRankings={applicationRankingsResult}
          chartSlot={
            <LatencyPhaseChart samples={latencySamples} mode="result" grade={grade} />
          }
          technicalRows={technicalRows}
          signupSlot={<SignupBox testCount={completedTestCount} />}
        />
      </div>
    </>
  )}

      {running && (
        <section className="instrument-panel">
          <ForegroundRunNotice progress={testProgress} phase={phase} />

          <TestProcedurePanel
            phase={phase}
            status={status}
            phaseDetail={phaseDetail}
            idle={idle}
            downloadLatency={downloadLatency}
            uploadLatency={uploadLatency}
            downloadMbps={downloadMbps}
            uploadMbps={uploadMbps}
          />

          {phase !== "warmup" && (
            <div className="live-chart-layout">
              <LatencyPhaseChart samples={latencySamples} mode="live" grade={grade} activePhase={phase} />

              {activeLiveStage && (
                <ActiveMeasurementCard
                  title={activeLiveStage.title}
                  theme={activeLiveStage.theme}
                  icon={activeLiveStage.icon}
                  ping={activeLiveStage.ping}
                  sampleCount={activeLiveStage.sampleCount}
                  speed={activeLiveStage.speed}
                  speedLabel={activeLiveStage.speedLabel}
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
          )}

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
            <PrintResultButton />
          </div>
          {sharePanelOpen && (
            <section className="result-share-panel" id="result-share-panel" aria-label="Share result">
              <p>{shareText}</p>
              <div className="result-share-links">
                <a href={shareLinks.email}>Email</a>
                <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
                <button type="button" onClick={copyShareText}>Copy</button>
              </div>
            </section>
          )}
          {shareMessage && <p>{shareMessage}</p>}
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
}: {
  samples: LatencySamplesByPhase;
  grade?: Grade;
  mode?: "live" | "result";
  activePhase?: TestPhase | "ready";
}) {
  const displaySamples =
    mode === "result"
      ? {
          idle: smoothDisplaySamples(samples.idle),
          download: smoothDisplaySamples(samples.download),
          upload: smoothDisplaySamples(samples.upload),
        }
      : samples;
  const allSamples = [...samples.idle, ...samples.download, ...samples.upload];
  const plottedSamples = [
    ...displaySamples.idle,
    ...displaySamples.download,
    ...displaySamples.upload,
  ];
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
      : [Math.max(0, item.median - item.variation), item.median + item.variation]
  );
  const valuesPlottedForScale = [...plottedSamples, ...medianValues, ...variationBounds];
  const maxPlottedSample = valuesPlottedForScale.length
    ? Math.max(...valuesPlottedForScale)
    : 100;
  const axisMin = 0;
  const axisMax = chartAxisMax(maxPlottedSample);
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
  const idlePath = samplePath(displaySamples.idle, phaseRanges.idle[0], phaseRanges.idle[1], yFor);
  const downloadPath = samplePath(
    displaySamples.download,
    phaseRanges.download[0],
    phaseRanges.download[1],
    yFor
  );
  const uploadPath = samplePath(displaySamples.upload, phaseRanges.upload[0], phaseRanges.upload[1], yFor);
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
  const variationValues = variationBands
    .map((band) => band.variation)
    .filter((value): value is number => value !== null);
  const worstVariation = variationValues.length ? Math.max(...variationValues) : null;
  const phaseMedians = [
    { key: "idle", className: "median-idle", range: phaseRanges.idle, value: sampleMedian(samples.idle) },
    {
      key: "download",
      className: "median-download",
      range: phaseRanges.download,
      value: sampleMedian(samples.download),
    },
    { key: "upload", className: "median-upload", range: phaseRanges.upload, value: sampleMedian(samples.upload) },
  ] as const;
  const phaseSampleMarkers = [
    {
      key: "idle",
      label: "Quiet",
      className: "sample-idle",
      range: phaseRanges.idle,
      values: samples.idle,
      median: sampleMedian(samples.idle),
    },
    {
      key: "download",
      label: "Download stress",
      className: "sample-download",
      range: phaseRanges.download,
      values: samples.download,
      median: sampleMedian(samples.download),
    },
    {
      key: "upload",
      label: "Upload stress",
      className: "sample-upload",
      range: phaseRanges.upload,
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
  const idleCoverKind =
    samples.download.length > 0 || samples.upload.length > 0
      ? "completed"
      : livePhaseIndex < 0
        ? "pending"
        : "";
  const downloadCoverKind =
    samples.upload.length > 0
      ? "completed"
      : livePhaseIndex < 1
        ? "pending"
        : "";
  const uploadCoverKind = livePhaseIndex < 2 ? "pending" : "";
  const livePhaseCovers = [
    {
      key: "idle",
      label: idleCoverKind === "completed" ? "quiet complete" : idleCoverKind === "pending" ? "quiet pending" : "",
      x: chart.left,
      kind: idleCoverKind,
    },
    {
      key: "download",
      label:
        downloadCoverKind === "completed"
          ? "download complete"
          : downloadCoverKind === "pending"
            ? "download pending"
            : "",
      x: chart.left + phaseWidth,
      kind: downloadCoverKind,
    },
    {
      key: "upload",
      label: uploadCoverKind === "pending" ? "upload pending" : "",
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
        <div className="latency-phase-legend" aria-hidden="true">
          <span className="idle">quiet line</span>
          <span className="download">download stress</span>
          <span className="upload">upload stress</span>
          {mode === "result" ? (
            <>
              <span className="variation">variation band</span>
              <span className="reference">median ping</span>
            </>
          ) : null}
        </div>
      </div>

      <svg viewBox="0 0 720 360" role="img" aria-labelledby={`latency-phase-chart-${mode}`}>
        <title id={`latency-phase-chart-${mode}`}>
          Ping samples by test phase
        </title>

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
              <text className="chart-axis-label" x={12} y={y + 4}>{formatChartTick(tick)}</text>
            </g>
          );
        })}
        <text className="chart-axis-label" x={11} y={18}>ms</text>
        {mode === "result" && worstVariation !== null ? (
          <g className="chart-variation-callout">
            <rect x={524} y={chart.top + 10} width={150} height={29} rx={0} />
            <text x={536} y={chart.top + 29}>worst variation {formatLatency(worstVariation)} ms</text>
          </g>
        ) : null}
        <line className="phase-break" x1={chart.left + phaseWidth} y1={chart.top} x2={chart.left + phaseWidth} y2={chart.bottom} />
        <line className="phase-break" x1={chart.left + phaseWidth * 2} y1={chart.top} x2={chart.left + phaseWidth * 2} y2={chart.bottom} />

        {mode === "result" &&
          variationBands.map((band) => {
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

        {idlePath && <path className="latency-line line-idle" d={idlePath} />}
        {revealDownload && downloadPath && <path className="latency-line line-download" d={downloadPath} />}
        {revealUpload && uploadPath && <path className="latency-line line-upload" d={uploadPath} />}

        {phaseSampleMarkers.map((point) => (
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

        {mode === "result" &&
          hasSamples &&
          phaseMedians.map((median) => {
            if (median.value === null) {
              return null;
            }

            const y = yFor(median.value);
            const x = median.range[0] + (median.range[1] - median.range[0]) / 2;
            const labelY = y < chart.top + 34 ? y + 27 : y - 19;

            return (
              <g key={median.key} className={`latency-median-marker ${median.className}`}>
                <line
                  className="latency-median-line"
                  x1={median.range[0]}
                  y1={y}
                  x2={median.range[1]}
                  y2={y}
                />
                <circle cx={x} cy={y} r={7} />
                <text x={x} y={labelY}>{formatLatency(median.value)} ms</text>
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

        <text className="chart-phase-label" x={chart.left + 10} y={354}>quiet</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth + 10} y={354}>download</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth * 2 + 10} y={354}>upload</text>
      </svg>

    </section>
  );
}

function getPhaseDetail(phase: TestPhase | "ready", status: string) {
  if (phase === "warmup") {
    return {
      eyebrow: "Preparing",
      title: "Preparing the measurement",
      detail:
        "The browser is opening the test path first so setup noise is not counted in your result.",
    };
  }

  if (phase === "idle") {
    return {
      eyebrow: "Step 1 of 3",
      title: "Measuring your baseline",
      detail:
        "First we record latency / ping before adding any download or upload load.",
    };
  }

  if (phase === "download") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 2 of 3",
      title: settling ? "Warming up download" : "Measuring ping during download",
      detail: settling
        ? "Download traffic is already running. These first seconds are excluded while the load settles."
        : "Now we compare ping against the baseline while the connection is busy downloading.",
    };
  }

  if (phase === "upload") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 3 of 3",
      title: settling ? "Warming up upload" : "Measuring ping during upload",
      detail: settling
        ? "Upload traffic is already running. These first seconds are excluded while the load settles."
        : "Now we compare ping against the baseline while the connection is busy uploading.",
    };
  }

  if (phase === "analysis") {
    return {
      eyebrow: "Calculating",
      title: "Preparing your result",
      detail:
        "The scorecard compares baseline ping with ping during download and upload load.",
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
}: {
  progress: number;
  phase: TestPhase | "ready" | "analysis";
}) {
  const boundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const label =
    phase === "analysis"
      ? "Calculating result"
      : phase === "warmup"
        ? "Preparing measurement"
        : "Measurement in progress";

  return (
    <div className="foreground-run-notice" role="status" aria-live="polite">
      <div className="test-progress-meta">
        <span>{label}</span>
        <strong>{boundedProgress}%</strong>
      </div>
      <div className="test-progress-track" aria-hidden="true">
        <span style={{ width: `${boundedProgress}%` }} />
      </div>
      <p>Keep this tab in the foreground. The test takes about a minute.</p>
    </div>
  );
}

function TestProcedurePanel({
  phase,
  status,
  phaseDetail,
  idle,
  downloadLatency,
  uploadLatency,
  downloadMbps,
  uploadMbps,
}: {
  phase: TestPhase | "ready";
  status: string;
  phaseDetail: ReturnType<typeof getPhaseDetail>;
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
}) {
  const visiblePhase =
    phase === "idle" || phase === "download" || phase === "upload"
      ? phase
      : phase === "analysis"
        ? "upload"
        : "idle";
  const steps = [
    {
      phase: "idle",
      label: "Quiet",
      purpose:
        "Record response time before adding traffic.",
      evidence:
        idle === null ? "Waiting for samples" : `${formatLatency(idle)} ms current median`,
    },
    {
      phase: "download",
      label: "Download",
      purpose:
        "Check whether latency rises during download.",
      evidence:
        downloadLatency === null
          ? `${DOWNLOAD_STREAM_LABEL} during this step`
          : `${formatLatency(downloadLatency)} ms median, ${formatSpeed(downloadMbps)} Mb/s`,
    },
    {
      phase: "upload",
      label: "Upload",
      purpose:
        "Check whether latency rises during upload.",
      evidence:
        uploadLatency === null
          ? `${UPLOAD_STREAM_LABEL} during this step`
          : `${formatLatency(uploadLatency)} ms median, ${formatSpeed(uploadMbps)} Mb/s`,
    },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.phase === visiblePhase);
  const auxiliaryState =
    phase === "warmup"
      ? {
          className: "warmup",
          title: "Preparing measurement",
          detail: "No scored latency samples are recorded yet.",
        }
      : phase === "analysis"
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
          const stepSettling =
            active &&
            (status.includes("settling") || status.includes("starting"));

          return (
            <li
              key={step.phase}
              className={`${active ? "active" : ""} ${
                complete ? "complete" : ""
              } ${pending ? "pending" : ""} ${step.phase}`}
            >
              <i aria-hidden="true" />
              <span>{complete ? "✓" : index + 1}</span>
              <strong>{step.label}</strong>
              {active && <em>{stepSettling ? "warming up" : "sampling"}</em>}
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

      {!auxiliaryState && (
        <div className="procedure-current">
          <span>{phaseDetail.eyebrow}</span>
          <h2>{phaseDetail.title}</h2>
          <p>{phaseDetail.detail}</p>
        </div>
      )}
    </section>
  );
}

function ActiveMeasurementCard({
  title,
  theme,
  icon,
  ping,
  sampleCount,
  speed,
  speedLabel,
  phaseState,
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  sampleCount: number;
  speed?: number | null;
  speedLabel?: string | null;
  phaseState: "settling" | "starting" | "recording";
}) {
  const speedTitle =
    theme === "download"
      ? "Download speed"
      : theme === "upload"
        ? "Upload speed"
        : "Added traffic";

  return (
    <section className={`active-measurement-card live-measurement-strip ${theme}`} aria-live="polite">
      <div className="active-measurement-header">
        <div className="stage-icon">{icon}</div>

        <div>
          <span>Current measurement</span>
          <strong>{title}</strong>
        </div>
      </div>

      <dl className="live-measurement-grid">
        <div>
          <dt>Current median</dt>
          <dd>{ping === null ? "waiting" : `${formatLatency(ping)} ms`}</dd>
        </div>

        <div>
          <dt>Samples</dt>
          <dd>{sampleCount}</dd>
        </div>

        <div>
          <dt>Phase</dt>
          <dd>{phaseState}</dd>
        </div>

        <div>
          <dt>{speedTitle}</dt>
          <dd>{speedLabel ? (speed == null ? "measuring" : `${formatSpeed(speed)} Mb/s`) : "none"}</dd>
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
