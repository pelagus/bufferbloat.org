"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
const FOREGROUND_ERROR =
  "Test stopped because this tab left the foreground. To protect accuracy, keep Bufferbloat.org visible until the run finishes.";

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

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

export default function Page() {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState(false);

  const [, setProgress] = useState(0);
  const [idle, setIdle] = useState<number | null>(null);
  const [downloadLatency, setDownloadLatency] = useState<number | null>(null);
  const [uploadLatency, setUploadLatency] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [phase, setPhase] = useState<TestPhase | "ready">("ready");
  const [status, setStatus] = useState("ready");
  const [recentLatencySamples, setRecentLatencySamples] = useState<number[]>([]);
  const [message, setMessage] = useState(initialTestMessage);
  const [grade, setGrade] = useState<Grade>("—");
  const [error, setError] = useState<string | null>(null);

  const diagnosisRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const browserInfo = useMemo(() => {
    if (typeof window === "undefined") return null;

    const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      memory: navigatorWithMemory.deviceMemory || "unknown",
      cores: navigator.hardwareConcurrency || "unknown",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine ? "online" : "offline",
    };
  }, []);

  async function runTest() {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setError(null);
      setRunning(true);
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
      setGrade("—");
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
        },
        { signal: abortController.signal }
      );

      setIdle(result.idle);
      setDownloadLatency(result.downloadLatency);
      setUploadLatency(result.uploadLatency);
      setDownloadMbps(result.downloadMbps);
      setUploadMbps(result.uploadMbps);
      setGrade(result.grade);
      setProgress(100);

      setRunning(false);
      setAnalyzing(true);
      setPhase("analysis");
      setStatus("diagnosis");
      setMessage("Comparing quiet and loaded latency medians.");

      await wait(3200);

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
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }

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

  return (
    <main className="test-shell">
      {!error && !running && !analyzing && !finished && (
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
                The test compares quiet latency with latency under load. It
                normally takes less than a minute and is designed to be faster
                than the alternative.
              </p>

              <div className="accuracy-notice">
                <strong>Keep this page in the foreground.</strong>
                <p>
                  Browser scheduling changes when a tab is hidden. If you switch
                  tabs, minimize the browser, or leave the page, the test will
                  stop so the result is not misleading.
                </p>
              </div>

              <button
                className="hero-start-button"
                onClick={runTest}
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

      {error && (
        <section className="terminal-card error-card test-stop-card test-stop-screen">
          <span>Test stopped</span>
          <strong>{error}</strong>
          <p>
            Nothing is wrong with your connection. Restart the test and keep
            this tab visible until the result appears.
          </p>
          <button onClick={runTest} disabled={running || analyzing}>
            Restart test
          </button>
        </section>
      )}

      {analyzing && (
        <section className="instrument-panel">
          <div className="accuracy-banner" role="status">
            <strong>Accuracy check complete</strong>
            <p>Measurements are complete; the result is being computed.</p>
          </div>

          <TestProcedurePanel
            phase="analysis"
            status="analysis"
            message="Comparing quiet latency with download and upload latency under load."
            phaseDetail={getPhaseDetail("analysis", "analysis")}
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
                <p>Computing result...</p>
                <small>
                  Deriving the responsiveness grade from completed measurements.
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
            summary={[
              {
                label: "Quiet latency",
                value: `${formatLatency(idle)} ms`,
                detail: "baseline median",
              },
              {
                label: "Download load",
                value: formatDelta(downloadDelta),
                detail: `${formatLatency(downloadLatency)} ms median`,
              },
              {
                label: "Upload load",
                value: formatDelta(uploadDelta),
                detail: `${formatLatency(uploadLatency)} ms median`,
              },
            ]}
            technical={
              `
Quiet-line median ping latency: ${formatLatency(idle)} ms
Download-stress median ping latency: ${formatLatency(downloadLatency)} ms
Upload-stress median ping latency: ${formatLatency(uploadLatency)} ms
Download loaded latency increase: ${formatDelta(downloadDelta)}
Upload loaded latency increase: ${formatDelta(uploadDelta)}

Download throughput estimate: ${formatSpeed(downloadMbps)} Mbps
Upload throughput estimate: ${formatSpeed(uploadMbps)} Mbps

Download test payload size: ${DOWNLOAD_TEST_SIZE}
Upload test payload size: ${UPLOAD_TEST_SIZE}
Latency probe: Cloudflare Speed 1-byte endpoint, separate from download file origin
Session warm-up: small preflight ping, download, and upload requests excluded from medians
Loaded latency settling: first 4 seconds of download and upload pressure excluded from medians

Browser platform: ${browserInfo?.platform}
Browser language: ${browserInfo?.language}
Timezone: ${browserInfo?.timezone}
Approximate device memory: ${browserInfo?.memory} GB
Logical CPU cores: ${browserInfo?.cores}
Viewport size: ${browserInfo?.viewport}
Browser online state: ${browserInfo?.online}

User agent: ${browserInfo?.userAgent}
              `.trim()
            }
          />
          </div>

          <section className="result-method-note">
            <span>How to read this result</span>
            <p>
              The grade is based on median quiet latency compared with median
              latency during download and upload load. Warm-up and settling
              periods are excluded, and the run requires the tab to stay visible
              so browser throttling does not distort the samples.
            </p>
          </section>

          <SignupBox />
        </>
      )}

      {(running || analyzing) && (
        <section className="instrument-panel">
          <div className="accuracy-banner" role="status">
            <strong>Accuracy check active</strong>
            <p>
              Keep this tab visible; the test stops if the page leaves the
              foreground.
            </p>
          </div>

          {running && (
            <>
              <TestProcedurePanel
                phase={phase}
                status={status}
                message={message}
                phaseDetail={phaseDetail}
                idle={idle}
                downloadLatency={downloadLatency}
                uploadLatency={uploadLatency}
                downloadMbps={downloadMbps}
                uploadMbps={uploadMbps}
              />
            </>
          )}

          {activeLiveStage && (
            <ActiveMeasurementCard
              title={activeLiveStage.title}
              theme={activeLiveStage.theme}
              icon={activeLiveStage.icon}
              ping={activeLiveStage.ping}
              samples={activeLiveStage.samples}
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

function getPhaseDetail(phase: TestPhase | "ready", status: string) {
  if (phase === "warmup") {
    return {
      eyebrow: "Step 1 of 5",
      title: "Warming up the session",
      detail:
        "The browser makes small ping, download, and upload requests first. These samples are not scored; they reduce one-off setup effects before the real measurement starts.",
    };
  }

  if (phase === "idle") {
    return {
      eyebrow: "Step 2 of 5",
      title: "Measuring quiet latency",
      detail:
        "This is the baseline: how quickly the connection responds before the test adds extra traffic. Later stages are compared against this median.",
    };
  }

  if (phase === "download") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 3 of 5",
      title: settling ? "Stabilizing download pressure" : "Measuring latency during download",
      detail: settling
        ? "Download streams are filling the connection, but the first seconds are ignored so startup effects do not skew the median."
        : "Latency is sampled while download traffic stays active. This shows whether bulk receiving traffic makes the connection less responsive.",
    };
  }

  if (phase === "upload") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 4 of 5",
      title: settling ? "Stabilizing upload pressure" : "Measuring latency during upload",
      detail: settling
        ? "Upload streams are filling the upstream path, but the first seconds are ignored before the median is recorded."
        : "Latency is sampled while upload traffic stays active. Upload congestion is a common reason video calls, games, and browsing become sluggish.",
    };
  }

  if (phase === "analysis") {
    return {
      eyebrow: "Step 5 of 5",
      title: "Computing result",
      detail:
        "The result compares quiet latency with download-loaded and upload-loaded latency, then summarizes the responsiveness impact.",
    };
  }

  return {
    eyebrow: "Ready",
    title: "Ready to test",
    detail: "Start a run to measure quiet and loaded latency.",
  };
}

function TestProcedurePanel({
  phase,
  status,
  message,
  phaseDetail,
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
        "Prepare the browser path before recording scored samples.",
      evidence: "Excluded from medians",
    },
    {
      phase: "idle",
      label: "Quiet",
      purpose:
        "Record the baseline response time before adding traffic.",
      evidence:
        idle === null ? "Waiting for samples" : `${formatLatency(idle)} ms current median`,
    },
    {
      phase: "download",
      label: "Download",
      purpose:
        "Measure whether latency rises while download traffic is active.",
      evidence:
        downloadLatency === null
          ? `${DOWNLOAD_STREAM_LABEL} during this step`
          : `${formatLatency(downloadLatency)} ms median, ${formatSpeed(downloadMbps)} Mb/s`,
    },
    {
      phase: "upload",
      label: "Upload",
      purpose:
        "Measure whether latency rises while upload traffic is active.",
      evidence:
        uploadLatency === null
          ? `${UPLOAD_STREAM_LABEL} during this step`
          : `${formatLatency(uploadLatency)} ms median, ${formatSpeed(uploadMbps)} Mb/s`,
    },
    {
      phase: "analysis",
      label: "Result",
      purpose:
        "Compare quiet and loaded medians to derive the responsiveness grade.",
      evidence: "Computing diagnosis",
    },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.phase === phase);

  return (
    <section className="test-procedure-panel" aria-live="polite">
      <ol className="procedure-stage-grid" aria-label="Test procedure">
        {steps.map((step, index) => {
          const active = step.phase === phase;
          const complete = currentIndex > index || (phase === "analysis" && step.phase !== "analysis");
          const pending = !active && !complete;
          const settling =
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
              {active && <em>{settling ? "settling" : step.phase === "analysis" ? "computing" : "measuring"}</em>}
            </li>
          );
        })}
      </ol>

      <div className="procedure-current">
        <span>{phaseDetail.eyebrow}</span>
        <h2>{phaseDetail.title}</h2>
        <p>{phaseDetail.detail}</p>
        <em>{message}</em>
      </div>
    </section>
  );
}

function ActiveMeasurementCard({
  title,
  theme,
  icon,
  ping,
  samples,
  speed,
  speedLabel,
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  samples: number[];
  speed?: number | null;
  speedLabel?: string | null;
}) {
  const visibleSamples = samples.slice(-5);
  const sampleText =
    visibleSamples.length > 0
      ? visibleSamples.map((sample) => `${Math.round(sample)} ms`).join("  ")
      : "collecting";

  return (
    <section className={`active-measurement-card ${theme}`} aria-live="polite">
      <div className="active-measurement-header">
        <div className="stage-icon">{icon}</div>

        <div>
          <span>Live evidence</span>
          <strong>{title}</strong>
        </div>
      </div>

      <dl className="active-measurement-table">
        <div>
          <dt>Latency median</dt>
          <dd>{ping === null ? "pending" : `${formatLatency(ping)} ms`}</dd>
        </div>

        <div>
          <dt>{speedLabel ?? "Traffic pressure"}</dt>
          <dd>{speedLabel ? (speed == null ? "estimating" : `${formatSpeed(speed)} Mb/s`) : "none"}</dd>
        </div>

        <div>
          <dt>Recent samples</dt>
          <dd>{sampleText}</dd>
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
  speed,
  speedLabel,
}: {
  title: string;
  theme: "baseline" | "download" | "upload";
  icon: string;
  ping: number | null;
  speed?: number | null;
  speedLabel?: string | null;
}) {
  return (
    <article className={`completed-stage-summary ${theme}`}>
      <span>{icon}</span>

      <div>
        <strong>{title}</strong>
        <p>{formatLatency(ping)} ms median</p>
      </div>

      {speedLabel && (
        <em>{speed == null ? "—" : `${formatSpeed(speed)} Mb/s`}</em>
      )}
    </article>
  );
}
