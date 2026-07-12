"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { runBufferbloatTest, type TestPhase } from "../../lib/bufferbloat-test";
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

  const [progress, setProgress] = useState(0);
  const [idle, setIdle] = useState<number | null>(null);
  const [downloadLatency, setDownloadLatency] = useState<number | null>(null);
  const [uploadLatency, setUploadLatency] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [phase, setPhase] = useState<TestPhase | "ready">("ready");
  const [status, setStatus] = useState("ready");
  const [recentLatencySamples, setRecentLatencySamples] = useState<number[]>([]);
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
      setProgress(0);
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
      setRecentLatencySamples([]);

      const result = await runBufferbloatTest(
        (update) => {
          setPhase(update.phase);
          setStatus(update.status);
          setMessage(update.message);
          setProgress(update.progress);
          setIdle(update.idle);
          setDownloadLatency(update.downloadLatency);
          setUploadLatency(update.uploadLatency);
          setDownloadMbps(update.downloadMbps);
          setUploadMbps(update.uploadMbps);
          setRecentLatencySamples(update.recentLatencySamples);
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
      setGrade(result.grade);
      setResultMeasuredAt(new Date().toISOString());
      setProgress(100);

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
      samples: automaticStage === 1 ? recentLatencySamples : [],
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
      samples: automaticStage === 2 ? recentLatencySamples : [],
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
      samples: automaticStage === 3 ? recentLatencySamples : [],
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
  const underLoadDelta = latencyDelta(idle, underLoadLatency);

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
              <span>Accuracy check</span>
              <h1>Keep this tab visible</h1>
              <p>
                Browsers can slow hidden tabs. Keep Bufferbloat.org in the
                foreground until the result appears; if the tab leaves the
                foreground, the test stops to protect accuracy.
              </p>
              <p>
                It normally takes less than a minute, and this test is designed
                to be faster than the common alternative.
              </p>

              <div className="preflight-countdown" aria-live="polite">
                <strong>Starting in {preflightCountdown}</strong>
                <span>Stay on this tab while the measurement runs.</span>
              </div>

              <div className="preflight-actions">
                <button onClick={runTest} disabled={running || analyzing}>
                  Start now
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowPreflight(false)}
                >
                  Back
                </button>
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
          <TestProgressBar
            progress={progress}
            phase="analysis"
            elapsedSeconds={elapsedSeconds}
          />

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
              label: "Typical latency",
              value: `${formatLatency(idle)} ms`,
            },
            {
              label: "Latency under load",
              value: `${formatLatency(underLoadLatency)} ms`,
            },
            {
              label: "Added delay",
              value: formatDelta(underLoadDelta),
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
          <TestProgressBar
            progress={progress}
            phase={phase}
            elapsedSeconds={elapsedSeconds}
          />

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

          {activeLiveStage && (
            <ActiveMeasurementCard
              title={activeLiveStage.title}
              theme={activeLiveStage.theme}
              icon={activeLiveStage.icon}
              ping={activeLiveStage.ping}
              samples={activeLiveStage.samples}
              sampleCount={activeLiveStage.sampleCount}
              speed={activeLiveStage.speed}
              speedLabel={activeLiveStage.speedLabel}
            />
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
        <button onClick={runTest}>Run another test</button>
      )}
    </main>
  );
}

function TestProgressBar({
  progress,
  phase,
  elapsedSeconds,
}: {
  progress: number;
  phase: TestPhase | "analysis" | "ready";
  elapsedSeconds?: number;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`test-progress-rail ${phase}`}
      role="progressbar"
      aria-label="Test progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedProgress)}
    >
      <div className="test-progress-meta">
        <span>Measurement progress</span>
        <strong>
          {Math.round(clampedProgress)}%
          {typeof elapsedSeconds === "number" && (
            <em>{formatDuration(elapsedSeconds)}</em>
          )}
        </strong>
      </div>
      <div className="test-progress-track">
        <span style={{ width: `${clampedProgress}%` }} />
      </div>
    </div>
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

function LatencySparkline({ samples }: { samples: number[] }) {
  if (samples.length < 2) {
    return (
      <div className="latency-sparkline waiting">
        <span>waiting for latency samples</span>
      </div>
    );
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = Math.max(1, max - min);
  const points = samples
    .map((sample, index) => {
      const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * 100;
      const y = 34 - ((sample - min) / range) * 30;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="latency-sparkline" aria-label="Recent latency samples">
      <svg viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points} />
      </svg>
      <span>
        recent pings · {formatLatency(min)}-{formatLatency(max)} ms
      </span>
    </div>
  );
}

function ActiveMeasurementCard({
  title,
  theme,
  icon,
  ping,
  samples,
  sampleCount,
  speed,
  speedLabel,
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  samples: number[];
  sampleCount: number;
  speed?: number | null;
  speedLabel?: string | null;
}) {
  const visibleSamples = samples.slice(-5);
  const sparklineSamples = samples.slice(-16);
  const latestSample = visibleSamples.at(-1) ?? null;
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
          <dt>Latency now</dt>
          <dd>{latestSample === null ? "collecting" : `${formatLatency(latestSample)} ms`}</dd>
        </div>

        <div>
          <dt>Samples</dt>
          <dd>{sampleCount === 0 ? "excluded" : sampleCount}</dd>
        </div>

        <div>
          <dt>Current median</dt>
          <dd>{ping === null ? "pending" : `${formatLatency(ping)} ms`}</dd>
        </div>

        <div>
          <dt>{speedTitle}</dt>
          <dd>{speedLabel ? (speed == null ? "estimating" : `${formatSpeed(speed)} Mb/s`) : "none"}</dd>
        </div>
      </dl>

      <LatencySparkline samples={sparklineSamples} />
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
