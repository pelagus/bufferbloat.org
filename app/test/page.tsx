"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  runBufferbloatTest,
  type LatencySamplesByPhase,
  type TestPhase,
} from "../../lib/bufferbloat-test";
import { initialTestMessage, type Grade } from "../../lib/test-copy";
import ResultCard from "./components/ResultCard";
import SignupBox from "./components/SignupBox";
import { formatLatency, formatSpeed } from "./components/format";
import { diagnosisFor, stageIndex } from "./components/diagnosis";

const DOWNLOAD_TEST_SIZE = "100 MB file, repeated across 4 streams";
const UPLOAD_TEST_SIZE = "1 MB chunks, repeated across 3 streams";
const DOWNLOAD_STREAM_LABEL = "4 download streams";
const UPLOAD_STREAM_LABEL = "3 upload streams";
const METHODOLOGY_VERSION = "Browser latency-under-load v1";
const FOREGROUND_ERROR =
  "The test paused because this tab was no longer visible.";

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

function formatUserDelta(delta: number | null) {
  if (delta === null) return "unknown change";
  const rounded = Math.round(delta);
  if (Math.abs(rounded) <= 2) return "no meaningful increase";
  if (rounded < 0) return "no increase";
  return `${rounded} ms higher than before`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function niceLatencyCeiling(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 100;
  if (value <= 100) return 100;
  if (value <= 250) return Math.ceil(value / 50) * 50;
  if (value <= 600) return Math.ceil(value / 100) * 100;
  return Math.ceil(value / 250) * 250;
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
  loaded: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadMbps: number | null
) {
  const typical = `${formatLatency(idle)} ms`;
  const underLoad = `${formatLatency(loaded)} ms`;
  const downloadChange = latencyDelta(idle, downloadLatency);
  const uploadChange = latencyDelta(idle, uploadLatency);
  const downloadText = formatUserDelta(downloadChange);
  const uploadText = formatUserDelta(uploadChange);
  const meaningfulDownload = (downloadChange ?? 0) > 10;
  const meaningfulUpload = (uploadChange ?? 0) > 10;
  const uploadDominates =
    meaningfulUpload && (uploadChange ?? 0) > Math.max(10, (downloadChange ?? 0) * 1.35);
  const downloadDominates =
    meaningfulDownload && (downloadChange ?? 0) > Math.max(10, (uploadChange ?? 0) * 1.35);

  const direction = uploadDominates
    ? "The added delay was mainly during upload."
    : downloadDominates
      ? "The added delay was mainly during download."
      : meaningfulDownload || meaningfulUpload
        ? "Both loaded phases contributed to the added delay."
        : "Neither loaded phase added meaningful delay.";

  if (grade === "D" || grade === "C") {
    return `Latency rose from ${typical} to ${underLoad} under load. Download was ${downloadText}; upload was ${uploadText}. ${direction}`;
  }

  if (grade === "B") {
    return `Latency rose from ${typical} to ${underLoad} under load. Download was ${downloadText}; upload was ${uploadText}. ${direction}`;
  }

  if (grade === "A") {
    if ((idle ?? 0) < 100) {
      return `Excellent bufferbloat result. Latency stayed close to ${typical} under load, with worst loaded latency at ${underLoad}.`;
    }

    if ((idle ?? 0) <= 120) {
      return `Excellent bufferbloat result. Latency stayed close to ${typical} under load; baseline latency is moderate, but the connection remained stable.`;
    }

    return `Excellent bufferbloat result. Latency stayed close to ${typical} under load, though baseline latency is already high before the connection gets busy.`;
  }

  return `This run measured ${formatSpeed(downloadMbps)} Mbps download, but did not produce a complete latency-under-load result.`;
}

function reliabilityGroupsFor(
  grade: Grade,
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadDelta: number | null,
  uploadDelta: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null
) {
  const baseline = idle ?? 0;
  const worstLoadedLatency = Math.max(downloadLatency ?? 0, uploadLatency ?? 0);
  const movement = stressMovement(downloadDelta, uploadDelta);
  const enoughStreamingCapacity = (downloadMbps ?? 0) >= 25;
  const enoughCallUpload = (uploadMbps ?? 0) >= 5;
  const stable = grade === "A" || (grade === "B" && movement <= 60);
  const strained = grade === "D" || grade === "C" || movement > 100 || worstLoadedLatency > 180;
  type ReliabilityItem = { symbol: string; name: string; label: string };
  type ReliabilityGroup = {
    title: string;
    tone: "reliable" | "unstable";
    items: ReliabilityItem[];
  };

  if (strained) {
    return [
      {
        title: "Should work reliably",
        tone: "reliable" as const,
        items: [
          {
            symbol: "▶",
            name: "Streaming",
            label: enoughStreamingCapacity ? "Usually OK" : "May suffer",
          },
        ],
      },
      {
        title: "May suffer under load",
        tone: "unstable" as const,
        items: [
          { symbol: "⌁", name: "Browsing", label: "May suffer" },
          { symbol: "☎", name: "Voice calls", label: "May suffer" },
          { symbol: "◉", name: "Video calls", label: "Poor under load" },
          { symbol: "◆", name: "Gaming", label: "Poor under load" },
          { symbol: "⇧", name: "Large uploads", label: "Disruptive" },
        ],
      },
    ];
  }

  if (!stable) {
    return [
      {
        title: "Should work reliably",
        tone: "reliable" as const,
        items: [
          {
            symbol: "▶",
            name: "Streaming",
            label: enoughStreamingCapacity ? "Works well" : "Usually OK",
          },
          { symbol: "⌁", name: "Browsing", label: "Usually OK" },
          {
            symbol: "☎",
            name: "Voice calls",
            label: enoughCallUpload ? "Usually OK" : "May suffer",
          },
        ],
      },
      {
        title: "May suffer under load",
        tone: "unstable" as const,
        items: [
          { symbol: "◉", name: "Video calls", label: "May suffer" },
          { symbol: "◆", name: "Gaming", label: "May suffer" },
          { symbol: "⇧", name: "Large uploads", label: "May disrupt" },
        ],
      },
    ];
  }

  const reliableItems: ReliabilityItem[] = [
    { symbol: "▶", name: "Streaming", label: enoughStreamingCapacity ? "Works well" : "Usually OK" },
    { symbol: "⌁", name: "Browsing", label: "Works well" },
    { symbol: "☎", name: "Voice calls", label: enoughCallUpload ? "Works well" : "Usually OK" },
    { symbol: "◉", name: "Video calls", label: baseline <= 120 ? "Works well" : "Usually OK" },
  ];
  const unstableItems: ReliabilityItem[] = [];

  if (baseline < 100) {
    reliableItems.push({ symbol: "◆", name: "Gaming", label: baseline <= 60 ? "Works well" : "Good" });
  } else {
    unstableItems.push({ symbol: "◆", name: "Competitive gaming", label: "Baseline delay" });
  }

  const groups: ReliabilityGroup[] = [
    {
      title: "Should work reliably",
      tone: "reliable" as const,
      items: reliableItems,
    },
  ];

  if (unstableItems.length > 0) {
    groups.push({
      title: stable ? "Latency-sensitive uses" : "May suffer under load",
      tone: "unstable" as const,
      items: unstableItems,
    });
  }

  return groups;
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [preflightCountdown, setPreflightCountdown] = useState(5);

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
  const [message, setMessage] = useState(initialTestMessage);
  const [grade, setGrade] = useState<Grade>("—");
  const [error, setError] = useState<string | null>(null);
  const [resultMeasuredAt, setResultMeasuredAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resultDurationSeconds, setResultDurationSeconds] = useState<number | null>(null);

  const diagnosisRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const testStartedAtRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!running && !analyzing) return;

    const updateElapsed = () => {
      if (testStartedAtRef.current === null) return;
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - testStartedAtRef.current) / 1000)));
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(interval);
  }, [running, analyzing]);

  const runTest = useCallback(async function runTest() {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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
      setMessage(initialTestMessage);
      setLatencySampleCount(0);
      setSampleCounts({ idle: 0, download: 0, upload: 0 });
      setGrade("—");
      setResultMeasuredAt(null);
      setElapsedSeconds(0);
      setResultDurationSeconds(null);
      testStartedAtRef.current = Date.now();
      setLatencySamples(emptyLatencySamples());

      const result = await runBufferbloatTest(
        (update) => {
          setPhase(update.phase);
          setStatus(update.status);
          setMessage(update.message);
          setIdle(update.idle);
          setDownloadLatency(update.downloadLatency);
          setUploadLatency(update.uploadLatency);
          setDownloadMbps(update.downloadMbps);
          setUploadMbps(update.uploadMbps);
          setLatencySamples(cloneLatencySamples(update.latencySamples));
          setLatencySampleCount(update.latencySampleCount);
          if (
            update.phase === "idle" ||
            update.phase === "download" ||
            update.phase === "upload"
          ) {
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
      setMessage("Comparing quiet and loaded latency medians.");

      await wait(3200);

      if (testStartedAtRef.current !== null) {
        const finalDuration = Math.max(
          0,
          Math.round((Date.now() - testStartedAtRef.current) / 1000)
        );
        setElapsedSeconds(finalDuration);
        setResultDurationSeconds(finalDuration);
      }

      setAnalyzing(false);
      setFinished(true);
    } catch (err) {
      const stoppedForForeground =
        abortController.signal.aborted &&
        abortController.signal.reason === FOREGROUND_ERROR;

      setError(
        stoppedForForeground
          ? FOREGROUND_ERROR
          : err instanceof Error
            ? err.message
            : "Unknown test error"
      );
      setRunning(false);
      setAnalyzing(false);
      setPhase("ready");
      setStatus("stopped");
      setMessage("Test stopped before completion.");
      testStartedAtRef.current = null;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!showPreflight || running || analyzing || finished || error) return;

    const interval = window.setInterval(() => {
      setPreflightCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    const timer = window.setTimeout(() => {
      void runTest();
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [analyzing, error, finished, runTest, running, showPreflight]);

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

  return (
    <main className="test-shell">
      {!error && !running && !analyzing && !finished && !showPreflight && (
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker">
                NETWORK RESPONSIVENESS DIAGNOSTIC
              </div>

              <h1>Bufferbloat test</h1>

              <p className="hero-subtitle">
                Measure whether your internet connection stays responsive while
                download and upload traffic are active.
              </p>

              <p className="hero-description">
                The test compares normal latency with latency under load. It
                normally takes less than a minute and is designed to be faster
                than the alternative.
              </p>

              <button
                className="hero-start-button"
                onClick={() => {
                  setPreflightCountdown(5);
                  setShowPreflight(true);
                }}
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
            <div className="preflight-visual" aria-hidden="true">
              <Image
                src="/test-foreground.svg"
                alt=""
                width={260}
                height={180}
                priority
              />
            </div>

            <div className="preflight-copy">
              <span>Measurement starts shortly</span>
              <h1>Keep this tab in front</h1>
              <p>
                Browser tabs can be slowed when hidden. Stay on this page until
                the result appears so the measurement remains valid.
              </p>

              <div className="preflight-countdown" aria-live="polite">
                <span>Starting in</span>
                <strong>{preflightCountdown}</strong>
                <em>Usually under a minute.</em>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="terminal-card error-card test-stop-card test-stop-screen">
          <Image
            src="/test-paused.svg"
            alt=""
            width={220}
            height={150}
            className="test-stop-illustration"
            aria-hidden="true"
          />
          <span>Measurement paused</span>
          <strong>{error}</strong>
          <p>
            Nothing is wrong with your connection. Restart and keep this tab
            visible so the browser does not throttle the samples.
          </p>
          <button onClick={runTest} disabled={running || analyzing}>
            Restart test
          </button>
        </section>
      )}

      {analyzing && (
        <section className="instrument-panel">
          <ForegroundRunNotice elapsedSeconds={elapsedSeconds} />

          <TestProcedurePanel
            phase="analysis"
            status="analysis"
            message="Comparing normal latency with latency during download and upload."
            phaseDetail={getPhaseDetail("analysis", "analysis")}
            sampleCount={latencySampleCount}
            idle={idle}
            downloadLatency={downloadLatency}
            uploadLatency={uploadLatency}
            downloadMbps={downloadMbps}
            uploadMbps={uploadMbps}
          />

          <section className="analysis-card">
            <div className="analysis-loader tall">
              <span />
              <div>
                <p>Calculating report...</p>
                <small>
                  Comparing normal latency with latency during download and upload.
                </small>
              </div>
            </div>

            <div className="analysis-progress">
              <div />
            </div>
          </section>
        </section>
      )}

      {finished && (
        <>
      <div ref={diagnosisRef}>
        <ResultCard
          grade={grade}
          diagnosis={diagnosis}
          measuredAt={resultMeasuredAt ?? new Date().toISOString()}
          methodologyVersion={METHODOLOGY_VERSION}
          scorecardMetrics={[
            {
              label: "Median ping, normal",
              value: `${formatLatency(idle)} ms`,
            },
            {
              label: "Ping under download",
              value: `${formatLatency(downloadLatency)} ms`,
            },
            {
              label: "Download stress",
              value: formatDelta(downloadDelta),
            },
            {
              label: "Download speed",
              value: `${formatSpeed(downloadMbps)} Mbps`,
              tone: "secondary",
            },
            {
              label: "Upload speed",
              value: `${formatSpeed(uploadMbps)} Mbps`,
              tone: "secondary",
            },
            {
              label: "Test duration",
              value: formatDuration(resultDurationSeconds),
              tone: "secondary",
            },
          ]}
          finding={findingFor(
            grade,
            idle,
            underLoadLatency,
            downloadLatency,
            uploadLatency,
            downloadMbps
          )}
          reliabilityGroups={reliabilityGroupsFor(
            grade,
            idle,
            downloadLatency,
            uploadLatency,
            downloadDelta,
            uploadDelta,
            downloadMbps,
            uploadMbps
          )}
          scoredMeasurements={[
            {
              label: "Idle median",
              median: `${formatLatency(idle)} ms`,
              delta: "starting point",
              detail: "Response time before extra traffic was added.",
            },
            {
              label: "Download median",
              median: `${formatLatency(downloadLatency)} ms`,
              delta: formatUserDelta(downloadDelta),
              detail: "Response time while the browser was receiving traffic.",
            },
            {
              label: "Upload median",
              median: `${formatLatency(uploadLatency)} ms`,
              delta: formatUserDelta(uploadDelta),
              detail: "Response time while the browser was sending traffic.",
            },
          ]}
          chartSlot={
            <LatencyPhaseChart samples={latencySamples} mode="result" grade={grade} />
          }
          technicalRows={[
            {
              metric: "Test duration",
              value: formatDuration(resultDurationSeconds),
              note: "Elapsed time from measurement start through result computation.",
            },
            {
              metric: "Quiet median latency",
              value: `${formatLatency(idle)} ms`,
              note: "Baseline ping median before load.",
            },
            {
              metric: "Download-loaded latency",
              value: `${formatLatency(downloadLatency)} ms`,
              note: `Median while ${DOWNLOAD_STREAM_LABEL} were active.`,
            },
            {
              metric: "Upload-loaded latency",
              value: `${formatLatency(uploadLatency)} ms`,
              note: `Median while ${UPLOAD_STREAM_LABEL} were active.`,
            },
            {
              metric: "Download latency change",
              value: formatDelta(downloadDelta),
              note: "Loaded median minus quiet median.",
            },
            {
              metric: "Upload latency change",
              value: formatDelta(uploadDelta),
              note: "Loaded median minus quiet median.",
            },
            {
              metric: "Download throughput",
              value: `${formatSpeed(downloadMbps)} Mbps`,
              note: DOWNLOAD_TEST_SIZE,
            },
            {
              metric: "Upload throughput",
              value: `${formatSpeed(uploadMbps)} Mbps`,
              note: UPLOAD_TEST_SIZE,
            },
            {
              metric: "Latency probe",
              value: "Cloudflare Speed 1-byte endpoint",
              note: "Separate from the download file origin.",
            },
            {
              metric: "Warm-up",
              value: "Excluded from medians",
              note: "Small ping, download, and upload requests prepare the browser session.",
            },
            {
              metric: "Settling period",
              value: "First 4 seconds excluded",
              note: "Download and upload traffic reaches a steady rate before medians are scored.",
            },
          ]}
          signupSlot={<SignupBox />}
        />
      </div>
    </>
  )}

      {running && (
        <section className="instrument-panel">
          <ForegroundRunNotice elapsedSeconds={elapsedSeconds} />

          <TestProcedurePanel
            phase={phase}
            status={status}
            message={message}
            phaseDetail={phaseDetail}
            sampleCount={latencySampleCount}
            idle={idle}
            downloadLatency={downloadLatency}
            uploadLatency={uploadLatency}
            downloadMbps={downloadMbps}
            uploadMbps={uploadMbps}
          />

          <div className="live-chart-layout">
            <LatencyPhaseChart samples={latencySamples} mode="live" grade={grade} />

            {activeLiveStage && (
              <ActiveMeasurementCard
                title={activeLiveStage.title}
                theme={activeLiveStage.theme}
                icon={activeLiveStage.icon}
                ping={activeLiveStage.ping}
                sampleCount={activeLiveStage.sampleCount}
                speed={activeLiveStage.speed}
                speedLabel={activeLiveStage.speedLabel}
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
        <button onClick={runTest}>Run another test</button>
      )}
    </main>
  );
}

function LatencyPhaseChart({
  samples,
  grade,
  mode = "live",
}: {
  samples: LatencySamplesByPhase;
  grade?: Grade;
  mode?: "live" | "result";
}) {
  const allSamples = [...samples.idle, ...samples.download, ...samples.upload];
  const maxSample = allSamples.length ? Math.max(...allSamples) : 100;
  const axisMax = niceLatencyCeiling(maxSample * 1.15);
  const axisMid = axisMax / 2;
  const chart = {
    left: 58,
    top: 28,
    width: 628,
    height: 248,
    bottom: 276,
  };
  const phaseWidth = chart.width / 3;
  const phaseRanges = {
    idle: [chart.left, chart.left + phaseWidth - 10],
    download: [chart.left + phaseWidth + 10, chart.left + phaseWidth * 2 - 10],
    upload: [chart.left + phaseWidth * 2 + 10, chart.left + phaseWidth * 3],
  } as const;
  const yFor = (sample: number) =>
    chart.top + chart.height - (Math.max(0, sample) / axisMax) * chart.height;
  const idlePath = samplePath(samples.idle, phaseRanges.idle[0], phaseRanges.idle[1], yFor);
  const downloadPath = samplePath(
    samples.download,
    phaseRanges.download[0],
    phaseRanges.download[1],
    yFor
  );
  const uploadPath = samplePath(samples.upload, phaseRanges.upload[0], phaseRanges.upload[1], yFor);
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
  const hasSamples = allSamples.length > 0;
  const revealDownload = mode === "result" || samples.download.length > 0;
  const revealUpload = mode === "result" || samples.upload.length > 0;
  const completedLivePhases =
    mode === "live"
      ? [
          samples.download.length > 0
            ? { key: "idle", x: chart.left, width: phaseWidth }
            : null,
          samples.upload.length > 0
            ? { key: "download", x: chart.left + phaseWidth, width: phaseWidth }
            : null,
        ].filter((phase): phase is { key: string; x: number; width: number } => phase !== null)
      : [];
  const hiddenPhases = [
    !revealDownload
      ? {
          key: "download",
          label: "download pending",
          x: chart.left + phaseWidth,
        }
      : null,
    !revealUpload
      ? {
          key: "upload",
          label: "upload pending",
          x: chart.left + phaseWidth * 2,
        }
      : null,
  ].filter((phase): phase is { key: string; label: string; x: number } => phase !== null);
  const gradeClass =
    mode === "result" && grade && grade !== "—"
      ? `grade-${grade.toLowerCase()}`
      : "";

  return (
    <section className={`latency-phase-chart ${mode} ${gradeClass}`} aria-label="Latency samples by test phase">
      <div className="latency-phase-chart-header">
        <span>{mode === "result" ? "measured latency trace" : "live latency trace"}</span>
        <strong>Latency in milliseconds</strong>
      </div>

      <svg viewBox="0 0 720 330" role="img" aria-labelledby={`latency-phase-chart-${mode}`}>
        <title id={`latency-phase-chart-${mode}`}>
          Latency samples during quiet, download, and upload phases
        </title>

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

        {mode === "result" &&
          hasSamples &&
          phaseMedians.map((median) => {
            if (median.value === null) {
              return null;
            }

            const y = yFor(median.value);

            return (
              <line
                key={median.key}
                className={`latency-median-line ${median.className}`}
                x1={median.range[0]}
                y1={y}
                x2={median.range[1]}
                y2={y}
              />
            );
          })}
        {idlePath && <path className="latency-line line-idle" d={idlePath} />}
        {revealDownload && downloadPath && <path className="latency-line line-download" d={downloadPath} />}
        {revealUpload && uploadPath && <path className="latency-line line-upload" d={uploadPath} />}

        {completedLivePhases.map((phase) => (
          <rect
            key={phase.key}
            className="chart-phase-completed-layer"
            x={phase.x}
            y={chart.top}
            width={phase.width}
            height={chart.height}
          />
        ))}

        {mode === "live" &&
          hiddenPhases.map((phase) => (
            <g key={phase.key} className="chart-phase-obscured">
              <rect x={phase.x} y={chart.top} width={phaseWidth} height={chart.height} />
              <text x={phase.x + phaseWidth / 2} y={chart.top + chart.height / 2}>
                {phase.label}
              </text>
            </g>
          ))}

        <text className="chart-phase-label" x={chart.left + 10} y={310}>quiet</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth + 10} y={310}>download</text>
        <text className="chart-phase-label" x={chart.left + phaseWidth * 2 + 10} y={310}>upload</text>
      </svg>

      <div className="latency-phase-legend" aria-hidden="true">
        <span className="idle">quiet</span>
        <span className="download">download</span>
        <span className="upload">upload</span>
        {mode === "result" ? (
          <span className="reference">final medians</span>
        ) : (
          <span className="pending">pending phases hidden</span>
        )}
      </div>
    </section>
  );
}

function getPhaseDetail(phase: TestPhase | "ready", status: string) {
  if (phase === "warmup") {
    return {
      eyebrow: "Step 1 of 5",
      title: "Preparing the browser",
      detail:
        "A few starter requests are excluded from the result so setup effects do not affect the scored samples.",
    };
  }

  if (phase === "idle") {
    return {
      eyebrow: "Step 2 of 5",
      title: "Measuring normal latency",
      detail:
        "This records how fast the connection responds before download or upload traffic is added.",
    };
  }

  if (phase === "download") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 3 of 5",
      title: settling ? "Starting download traffic" : "Testing while downloading",
      detail: settling
        ? "The first seconds are ignored while download traffic reaches a steady rate."
        : "The test downloads data and checks whether response time rises.",
    };
  }

  if (phase === "upload") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 4 of 5",
      title: settling ? "Starting upload traffic" : "Testing while uploading",
      detail: settling
        ? "The first seconds are ignored while upload traffic reaches a steady rate."
        : "The test uploads data and checks whether response time rises.",
    };
  }

  if (phase === "analysis") {
    return {
      eyebrow: "Step 5 of 5",
      title: "Calculating the report",
      detail:
        "The report compares normal latency with latency during download and upload.",
    };
  }

  return {
    eyebrow: "Ready",
    title: "Ready to test",
    detail: "Start a run to measure normal latency and latency under load.",
  };
}

function ForegroundRunNotice({ elapsedSeconds }: { elapsedSeconds: number }) {
  return (
    <div className="foreground-run-notice" role="status" aria-live="polite">
      <strong>{formatDuration(elapsedSeconds)}</strong>
      <span>
        Keep this tab in the foreground. Do not worry, the test usually takes
        less than 1 minute.
      </span>
    </div>
  );
}

function TestProcedurePanel({
  phase,
  status,
  message,
  phaseDetail,
  sampleCount,
  idle,
  downloadLatency,
  uploadLatency,
  downloadMbps,
  uploadMbps,
}: {
  phase: TestPhase | "ready";
  status: string;
  message: string;
  phaseDetail: ReturnType<typeof getPhaseDetail>;
  sampleCount: number;
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
}) {
  const steps = [
    {
      phase: "warmup",
      label: "Warm-up",
      purpose:
        "Prepare the browser before recording scored samples.",
      evidence: "Excluded from medians",
    },
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
    {
      phase: "analysis",
      label: "Result",
      purpose:
        "Compare normal and loaded latency medians.",
      evidence: "Calculating report",
    },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.phase === phase);
  const settling = status.includes("settling") || status.includes("starting");
  const currentEvidence =
    phase === "warmup"
      ? "Warm-up requests excluded from scoring"
      : phase === "analysis"
        ? "Computing medians and grade"
        : settling
          ? "Settling period excluded from medians"
          : `Recording scored samples: ${sampleCount}`;

  return (
    <section className="test-procedure-panel" aria-live="polite">
      <ol className="procedure-stage-grid" aria-label="Test procedure">
        {steps.map((step, index) => {
          const active = step.phase === phase;
          const complete = currentIndex > index || (phase === "analysis" && step.phase !== "analysis");
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
              {active && <em>{stepSettling ? "settling" : step.phase === "analysis" ? "computing" : "sampling"}</em>}
            </li>
          );
        })}
      </ol>

      <div className="procedure-current">
        <span>{phaseDetail.eyebrow}</span>
        <h2>{phaseDetail.title}</h2>
        <p>{phaseDetail.detail}</p>
        <div className="procedure-evidence">
          <span>{currentEvidence}</span>
          <span>{message}</span>
        </div>
      </div>
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
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  sampleCount: number;
  speed?: number | null;
  speedLabel?: string | null;
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
          <dd>{ping === null ? "warming" : "recording"}</dd>
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
