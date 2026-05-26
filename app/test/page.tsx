"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runBufferbloatTest } from "../../lib/bufferbloat-test";
import { initialTestMessage, preTestInstruction, type Grade } from "../../lib/test-copy";
import ResultCard from "./components/ResultCard";
import SignupBox from "./components/SignupBox";
import { formatLatency, formatSpeed, speedWidth } from "./components/format";
import { diagnosisFor, stageIndex } from "./components/diagnosis";

const DOWNLOAD_TEST_SIZE = "100 MB";
const UPLOAD_TEST_SIZE = "32 MB";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [manualStage, setManualStage] = useState<number | null>(null);

  const [progress, setProgress] = useState(0);
  const [idle, setIdle] = useState<number | null>(null);
  const [downloadLatency, setDownloadLatency] = useState<number | null>(null);
  const [uploadLatency, setUploadLatency] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [status, setStatus] = useState("ready");
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

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      memory: (navigator as any).deviceMemory || "unknown",
      cores: navigator.hardwareConcurrency || "unknown",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine ? "online" : "offline",
    };
  }, []);

  async function runTest() {
    try {
      setError(null);
      setManualStage(null);
      setRunning(true);
      setAnalyzing(false);
      setFinished(false);
      setProgress(0);
      setIdle(null);
      setDownloadLatency(null);
      setUploadLatency(null);
      setDownloadMbps(null);
      setUploadMbps(null);
      setGrade("—");

      const result = await runBufferbloatTest((update) => {
        setStatus(update.status);
        setMessage(update.message);
        setProgress(update.progress);
        setIdle(update.idle);
        setDownloadLatency(update.downloadLatency);
        setUploadLatency(update.uploadLatency);
        setDownloadMbps(update.downloadMbps);
        setUploadMbps(update.uploadMbps);
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
      setStatus("diagnosis");
      setMessage("Computing diagnosis from completed measurements.");

      await wait(3200);

      setAnalyzing(false);
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown test error");
      setRunning(false);
      setAnalyzing(false);
    }
  }

  const automaticStage = running && !analyzing ? stageIndex(status) : 0;
  const openStage = running ? automaticStage : manualStage;

  const diagnosis = diagnosisFor(
    grade,
    downloadMbps,
    uploadMbps,
    idle,
    downloadLatency,
    uploadLatency
  );

  function toggleStage(stage: number, done: boolean) {
    if (running || analyzing || !done) return;
    setManualStage(manualStage === stage ? null : stage);
  }

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
                Your internet can look fast and still feel terrible.
              </p>

              <p className="hero-description">
                This test measures whether latency explodes while your connection is busy.
                That is what causes calls to freeze, games to lag, and pages to stall
                during uploads or downloads.
              </p>

              <button
                className="hero-start-button"
                onClick={runTest}
                disabled={running || analyzing}
              >
                Start test
              </button>
            </div>

            <div className="hero-visual">
              <div className="signal-card">
                <div className="signal-label">QUIET LINE</div>
                <div className="signal-value stable">24 ms</div>
              </div>

              <div className="signal-arrow">↓</div>

              <div className="signal-card stressed">
                <div className="signal-label">UNDER LOAD</div>
                <div className="signal-value danger">412 ms</div>
              </div>

              <div className="signal-caption">
                Bufferbloat is excessive latency caused by network congestion.
              </div>
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
            technical={
              `
Quiet-line average ping latency: ${formatLatency(idle)} ms
Download-stress average ping latency: ${formatLatency(downloadLatency)} ms
Upload-stress average ping latency: ${formatLatency(uploadLatency)} ms

Download throughput: ${formatSpeed(downloadMbps)} Mbps
Upload throughput: ${formatSpeed(uploadMbps)} Mbps

Download test payload size: ${DOWNLOAD_TEST_SIZE}
Upload test payload size: ${UPLOAD_TEST_SIZE}

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

      {(running || analyzing || finished) && (
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
            </>
          )}

          <div className="stage-accordion">
            <StagePanel
              stage={1}
              expanded={openStage === 1}
              title="Median ping latency under quiet conditions"
              ping={idle}
              done={idle !== null}
              onToggle={() => toggleStage(1, idle !== null)}
            >
              <MetricCard
                label="Network stress"
                title="No additional stress"
                value="none"
                footer="baseline measurement"
                theme="baseline"
              />

              <PingCard
                title="Quiet-line ping"
                value={idle}
                active={automaticStage === 1}
                theme="baseline"
              />
            </StagePanel>

            <StagePanel
              stage={2}
              expanded={openStage === 2}
              title="Median ping latency with download stress"
              ping={downloadLatency}
              speed={downloadMbps}
              speedLabel="Median download speed"
              done={downloadLatency !== null}
              onToggle={() => toggleStage(2, downloadLatency !== null)}
            >
              <SpeedGauge
                label="Download stress"
                title="Receiving test file"
                value={downloadMbps}
                payload={DOWNLOAD_TEST_SIZE}
                theme="download"
              />

              <PingCard
                title="Download-stress ping"
                value={downloadLatency}
                active={automaticStage === 2}
                theme="download"
              />
            </StagePanel>

            <StagePanel
              stage={3}
              expanded={openStage === 3}
              title="Median ping latency with upload stress"
              ping={uploadLatency}
              speed={uploadMbps}
              speedLabel="Median upload speed"
              done={uploadLatency !== null}
              onToggle={() => toggleStage(3, uploadLatency !== null)}
            >
              <SpeedGauge
                label="Upload stress"
                title="Sending test payload"
                value={uploadMbps}
                payload={UPLOAD_TEST_SIZE}
                theme="upload"
              />

              <PingCard
                title="Upload-stress ping"
                value={uploadLatency}
                active={automaticStage === 3}
                theme="upload"
              />
            </StagePanel>
          </div>
        </section>
      )}

      {finished && (
        <button onClick={runTest}>Run another test</button>
      )}
    </main>
  );
}

function StagePanel({
  stage,
  expanded,
  title,
  ping,
  speed,
  speedLabel,
  done,
}: {
  stage: number;
  expanded: boolean;
  title: string;
  ping: number | null;
  speed?: number | null;
  speedLabel?: string;
  done: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const theme = stage === 2 ? "download" : stage === 3 ? "upload" : "baseline";

  return (
    <section className={`stage-panel ${expanded ? "active-now" : "complete"} ${theme}`}>
      <div className="stage-panel-header">
        <div className="stage-icon">
          {done ? "✓" : theme === "download" ? "↓" : theme === "upload" ? "↑" : "⌁"}
        </div>

        <div className="stage-title-block">
          <strong>{title}</strong>
        </div>

        <div className="stage-summary">
          <div className="median-ping-readout">
            <span>Median ping</span>
            <strong>{ping === null ? "—" : `${formatLatency(ping)} ms`}</strong>

            {expanded && ping !== null && (
              <div className="ping-flyout" aria-hidden="true">
                {[0.94, 1.02, 0.98, 1.06, 1].map((factor, index) => (
                  <em
                    key={index}
                    style={{ "--sample-index": index } as React.CSSProperties}
                  >
                    {Math.round(ping * factor)}ms
                  </em>
                ))}
              </div>
            )}
          </div>

          {speedLabel && (
            <div className="summary-speed">
              <span>{speedLabel}</span>
              <Speedometer value={speed ?? null} />
              <strong>{speed == null ? "—" : `${formatSpeed(speed)} Mb/s`}</strong>
            </div>
          )}
        </div>
      </div>
    </section>
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

function MetricCard({
  label,
  title,
  value,
  footer,
  theme,
}: {
  label: string;
  title: string;
  value: string;
  footer: string;
  theme: string;
}) {
  return (
    <div className={`metric-card ${theme}`}>
      <p>{label}</p>
      <h3>{title}</h3>
      <div className="big-read">{value}</div>
      <small>{footer}</small>
    </div>
  );
}

function SpeedGauge({
  label,
  title,
  value,
  payload,
  theme,
}: {
  label: string;
  title: string;
  value: number | null;
  payload: string;
  theme: string;
}) {
  return (
    <div className={`metric-card speed-gauge ${theme}`}>
      <p>{label}</p>
      <h3>{title}</h3>

      <div className="dial" style={{ "--dial": `${speedWidth(value)}%` } as React.CSSProperties}>
        <div className="dial-value">
          {formatSpeed(value)}
          <span>Mbps</span>
        </div>
      </div>

      <small>{payload} payload</small>
    </div>
  );
}

function PingCard({
  title,
  value,
  active,
  theme,
}: {
  title: string;
  value: number | null;
  active: boolean;
  theme: string;
}) {
  const samples =
    value === null
      ? ["…", "…", "…", "…", "…"]
      : [
          Math.round(value * 0.96),
          Math.round(value * 1.01),
          Math.round(value),
          Math.round(value * 0.98),
          Math.round(value * 1.03),
        ];

  return (
    <div className={`metric-card ping ${theme} ${active ? "active" : "locked"}`}>
      <p>Ping latency</p>
      <h3>{title}</h3>

      <div className="sample-row">
        {samples.map((sample, index) => (
          <span
            key={index}
            style={{ "--sample-index": index } as React.CSSProperties}
          >
            {sample}
          </span>
        ))}
      </div>

      <div className="wave-row">
        {samples.map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="big-read">
        {formatLatency(value)} ms
      </div>

      <small>{active ? "sampling trials" : "median locked"}</small>
    </div>
  );
}
