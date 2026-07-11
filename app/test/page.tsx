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

  const [progress, setProgress] = useState(0);
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
      setGrade("—");
      setRecentLatencySamples([]);

      const result = await runBufferbloatTest((update) => {
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
      });

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
      setMessage("Computing diagnosis from completed measurements.");

      await wait(3200);

      setAnalyzing(false);
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown test error");
      setRunning(false);
      setAnalyzing(false);
      setPhase("ready");
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
      {!running && !analyzing && !finished && (
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker">
                NETWORK RESPONSIVENESS DIAGNOSTIC
              </div>

              <h1>Bufferbloat test</h1>

              <p className="hero-subtitle">
                We’ll measure quiet ping latency, then repeat the measurement while your connection is under download and upload pressure.
              </p>

              <p className="hero-description">
                Keep this tab visible during the test.
              </p>

              <button
                className="hero-start-button"
                onClick={runTest}
                disabled={running || analyzing}
              >
                Start test
              </button>

              <section className="test-measures-mini">
                <h2>What this test measures</h2>

                <div>
                  <article>
                    <span>01</span>
                    <strong>Quiet ping latency</strong>
                    <p>Baseline response time before adding traffic.</p>
                  </article>

                  <article>
                    <span>02</span>
                    <strong>Download latency</strong>
                    <p>Whether ping rises while receiving data.</p>
                  </article>

                  <article>
                    <span>03</span>
                    <strong>Upload latency</strong>
                    <p>Whether ping rises while sending data.</p>
                  </article>
                </div>
              </section>
            </div>


          </div>
        </section>
      )}

      {error && (
        <section className="terminal-card error-card">
          Test error: {error}
        </section>
      )}

      {analyzing && (
        <section className="analysis-card">
          <div className="analysis-loader tall">
            <span />
            <div>
              <p>Crunching numbers...</p>
              <small>
                Comparing quiet latency, stressed latency, throughput, payload size, and client telemetry.
              </small>
            </div>
          </div>

          <div className="analysis-progress">
            <div />
          </div>
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

          <SignupBox />
        </>
      )}

      {(running || analyzing) && (
        <section className="instrument-panel">
          {running && (
            <>
              <div className="test-status-row top">
                <span>{message}</span>
                <span>{Math.floor(progress)}%</span>
              </div>

              <div className="progress-bar top">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <PhaseStepper phase={phase} status={status} />

              <div className="phase-detail-card" aria-live="polite">
                <div>
                  <span>{phaseDetail.eyebrow}</span>
                  <strong>{phaseDetail.title}</strong>
                  <p>{phaseDetail.detail}</p>
                </div>

                <div className="phase-facts">
                  {phase === "download" && (
                    <>
                      <span>{DOWNLOAD_STREAM_LABEL} active</span>
                      <span>{formatSpeed(downloadMbps)} Mb/s estimate</span>
                    </>
                  )}

                  {phase === "upload" && (
                    <>
                      <span>{UPLOAD_STREAM_LABEL} active</span>
                      <span>{formatSpeed(uploadMbps)} Mb/s estimate</span>
                    </>
                  )}

                  {phase === "idle" && (
                    <>
                      <span>No stress traffic</span>
                      <span>{formatLatency(idle)} ms current median</span>
                    </>
                  )}

                  {phase === "warmup" && (
                    <>
                      <span>Preflight only</span>
                      <span>Excluded from medians</span>
                    </>
                  )}
                </div>
              </div>
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
      eyebrow: "Step 1 of 4",
      title: "Warming up the session",
      detail: "Small ping, download, and upload requests prepare the browser path before measurement starts.",
    };
  }

  if (phase === "idle") {
    return {
      eyebrow: "Step 2 of 4",
      title: "Measuring quiet latency",
      detail: "No extra stress traffic is added during this baseline median.",
    };
  }

  if (phase === "download") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 3 of 4",
      title: settling ? "Stabilizing download pressure" : "Measuring latency during download",
      detail: settling
        ? "Download streams are already running; these first seconds are excluded from the median."
        : "Latency samples are now being recorded while download pressure stays active.",
    };
  }

  if (phase === "upload") {
    const settling = status.includes("settling") || status.includes("starting");

    return {
      eyebrow: "Step 4 of 4",
      title: settling ? "Stabilizing upload pressure" : "Measuring latency during upload",
      detail: settling
        ? "Upload streams are already running; these first seconds are excluded from the median."
        : "Latency samples are now being recorded while upload pressure stays active.",
    };
  }

  return {
    eyebrow: "Ready",
    title: "Ready to test",
    detail: "Start a run to measure quiet and loaded latency.",
  };
}

function PhaseStepper({
  phase,
  status,
}: {
  phase: TestPhase | "ready";
  status: string;
}) {
  const steps = [
    { phase: "warmup", label: "Warm-up" },
    { phase: "idle", label: "Quiet" },
    { phase: "download", label: "Download" },
    { phase: "upload", label: "Upload" },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.phase === phase);

  return (
    <ol className="phase-stepper" aria-label="Test progress">
      {steps.map((step, index) => {
        const active = step.phase === phase;
        const complete = currentIndex > index || phase === "analysis";
        const settling =
          active &&
          (status.includes("settling") || status.includes("starting"));

        return (
          <li
            key={step.phase}
            className={`${active ? "active" : ""} ${complete ? "complete" : ""}`}
          >
            <span>{complete ? "✓" : index + 1}</span>
            <strong>{step.label}</strong>
            {active && (
              <em>{settling ? "settling" : step.phase === "warmup" ? "warming" : "measuring"}</em>
            )}
          </li>
        );
      })}
    </ol>
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
  return (
    <section className={`active-measurement-card ${theme}`} aria-live="polite">
      <div className="active-measurement-header">
        <div className="stage-icon">{icon}</div>

        <div>
          <span>Measuring now</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="active-measurement-grid">
        <div className="active-readout">
          <span>Median ping</span>
          <strong>{ping === null ? "—" : `${formatLatency(ping)} ms`}</strong>

          <div className="active-samples" aria-hidden="true">
            {(samples.length > 0 ? samples : [null, null, null, null, null]).map((sample, index) => (
              <em
                key={sample === null ? `empty-${index}` : `${sample}-${index}`}
                className={sample === null ? "empty-sample" : undefined}
                style={{ "--sample-index": index } as React.CSSProperties}
              >
                {sample === null ? "00ms" : `${Math.round(sample)}ms`}
              </em>
            ))}
          </div>
        </div>

        <div className="active-speed">
          <span>{speedLabel ?? "Traffic pressure"}</span>
          {speedLabel ? (
            <>
              <Speedometer value={speed ?? null} />
              <strong>{speed == null ? "—" : `${formatSpeed(speed)} Mb/s`}</strong>
            </>
          ) : (
            <strong>No added load</strong>
          )}
        </div>
      </div>
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

function Speedometer({ value }: { value: number | null }) {
  const percent = Math.min(100, Math.max(0, value ?? 0));
  const angle = -90 + percent * 1.8;
  const arcLength = 142;
  const dashOffset = arcLength - (arcLength * percent) / 100;

  return (
    <svg className="speedometer" viewBox="0 0 120 70" aria-hidden="true">
      <path className="speedometer-bg" d="M15 60 A45 45 0 0 1 105 60" />
      <path
        className="speedometer-fill"
        d="M15 60 A45 45 0 0 1 105 60"
        style={{
          strokeDasharray: arcLength,
          strokeDashoffset: dashOffset,
        }}
      />
      <line
        className="speedometer-needle"
        x1="60"
        y1="60"
        x2="60"
        y2="22"
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: "60px 60px" }}
      />
      <circle className="speedometer-dot" cx="60" cy="60" r="5" />
      <text x="18" y="64">0</text>
      <text x="55" y="20">50</text>
      <text x="94" y="64">100</text>
    </svg>
  );
}
