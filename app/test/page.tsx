"use client";

import { useState } from "react";
import { runBufferbloatTest } from "../../lib/bufferbloat-test";
import {
  diagnosisCopy,
  initialTestMessage,
  preTestInstruction,
  type Grade,
} from "../../lib/test-copy";

function formatLatency(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}ms`;
}

function formatSpeed(value: number | null) {
  return value === null ? "—" : `${Math.round(value)} Mbps`;
}

function speedBlocks(value: number | null) {
  const count = value === null ? 0 : Math.min(18, Math.max(1, Math.round(value / 8)));
  return "█".repeat(count) + "░".repeat(18 - count);
}

function percentChange(base: number | null, value: number | null) {
  if (!base || !value) return "—";
  return `+${Math.round(((value - base) / base) * 100)}%`;
}

function ResultRow({
  title,
  note,
  latency,
  change,
  severity = "neutral",
}: {
  title: string;
  note: string;
  latency: string;
  change: string;
  severity?: "neutral" | "warn" | "bad";
}) {
  return (
    <div className="grid grid-cols-[1fr_90px_80px] gap-3 border-b border-neutral-200 px-3 py-3 last:border-b-0 md:grid-cols-[1fr_120px_100px]">
      <div>
        <p className="font-mono text-sm">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">{note}</p>
      </div>

      <div className="font-mono text-sm">{latency}</div>

      <div
        className={`font-mono text-sm ${
          severity === "bad"
            ? "text-red-600"
            : severity === "warn"
              ? "text-yellow-600"
              : "text-neutral-500"
        }`}
      >
        {change}
      </div>
    </div>
  );
}

function phaseStatus(
  phase: "quiet" | "download" | "upload",
  running: boolean,
  finished: boolean,
  activeStatus: string
) {
  if (finished) return "done";
  if (!running) return phase === "quiet" ? "ready" : "pending";

  if (phase === "quiet" && activeStatus === "quiet line") return "testing";
  if (phase === "download" && activeStatus === "latency during download") return "testing";
  if (phase === "upload" && activeStatus === "latency during upload") return "testing";

  if (phase === "quiet") return "done";
  if (phase === "download" && activeStatus === "latency during upload") return "done";
  if (phase === "download" && activeStatus === "analysis") return "done";
  if (phase === "upload" && activeStatus === "analysis") return "done";

  return "pending";
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
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

  async function runTest() {
    try {
      setError(null);
      setRunning(true);
      setFinished(false);
      setProgress(0);

      setIdle(null);
      setDownloadLatency(null);
      setUploadLatency(null);
      setDownloadMbps(null);
      setUploadMbps(null);

      setGrade("—");
      setStatus("starting");
      setMessage("Starting the measurement engine.");

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
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown test error");
    } finally {
      setRunning(false);
    }
  }

  const diagnosis = diagnosisCopy[grade];

  const rows = [
    {
      load: "Quiet",
      note: "No download or upload traffic",
      latency: idle,
      status: phaseStatus("quiet", running, finished, status),
    },
    {
      load: "During download",
      note: "Large file moving toward you",
      latency: downloadLatency,
      status: phaseStatus("download", running, finished, status),
    },
    {
      load: "During upload",
      note: "Temporary data moving out",
      latency: uploadLatency,
      status: phaseStatus("upload", running, finished, status),
    },
  ];

  return (
    <main className="page-shell">
      <p className="eyebrow">network diagnostic</p>

      <h1 className="page-title">Run a bufferbloat test</h1>

      <p className="page-copy">
        Find out if latency stays low while your internet is busy.
      </p>

      {!running && !finished && (
        <div className="terminal-card">
          <p className="text-neutral-700">{preTestInstruction}</p>
        </div>
      )}

      {error && (
        <div className="terminal-card border-red-600 text-red-700">
          Test error: {error}
        </div>
      )}

      <button
        onClick={runTest}
        disabled={running}
        className="mt-6 border border-black px-5 py-3 font-mono transition hover:bg-black hover:text-white disabled:opacity-40"
      >
        {running ? "Testing..." : finished ? "Run again" : "Start test"}
      </button>

      {(running || finished) && (
        <div className="terminal-card">
          {running && (
            <>
              <div className="mb-4 flex justify-between gap-4 font-mono text-sm">
                <span>{status}</span>
                <span>{Math.floor(progress)}%</span>
              </div>

              <div className="mb-5 h-2 w-full overflow-hidden border border-black">
                <div
                  className="h-full bg-black transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="overflow-hidden border border-neutral-200">
                <div className="grid grid-cols-[1fr_90px_80px] gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-500 md:grid-cols-[1fr_120px_100px]">
                  <span>network load</span>
                  <span>latency</span>
                  <span>status</span>
                </div>

                {rows.map((row) => (
                  <div
                    key={row.load}
                    className="grid grid-cols-[1fr_90px_80px] gap-3 border-b border-neutral-200 px-3 py-3 last:border-b-0 md:grid-cols-[1fr_120px_100px]"
                  >
                    <div>
                      <p className="font-mono text-sm">{row.load}</p>
                      <p className="mt-1 text-xs text-neutral-500">{row.note}</p>
                    </div>

                    <div className="font-mono text-sm">
                      {formatLatency(row.latency)}
                    </div>

                    <div className="font-mono text-xs text-neutral-500">
                      {row.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="border border-neutral-200 p-3">
                  <p className="font-mono text-sm">download speed</p>
                  <p className="mt-1 font-mono text-xl">
                    {formatSpeed(downloadMbps)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-neutral-500">
                    {speedBlocks(downloadMbps)}
                  </p>
                </div>

                <div className="border border-neutral-200 p-3">
                  <p className="font-mono text-sm">upload speed</p>
                  <p className="mt-1 font-mono text-xl">
                    {formatSpeed(uploadMbps)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-neutral-500">
                    {speedBlocks(uploadMbps)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-neutral-200 pt-4">
                <p className="text-neutral-700">{message}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Latency means response time. Bufferbloat happens when response time jumps while the connection is busy.
                </p>
              </div>
            </>
          )}

          {finished && (
            <>
              <div className="mb-6 flex items-start justify-between gap-8 border-b border-neutral-200 pb-6">
                <div>
                  <p className="text-sm text-neutral-500">responsiveness grade</p>

                  <h2
                    className={`mt-2 font-mono text-7xl font-bold ${
                      grade === "D"
                        ? "text-red-600"
                        : grade === "C"
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {grade}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm text-neutral-500">
                    measured throughput
                  </p>
                  <div className="mt-2 font-mono text-lg">
                    ↓ {formatSpeed(downloadMbps)}
                  </div>
                  <div className="font-mono text-lg">
                    ↑ {formatSpeed(uploadMbps)}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden border border-neutral-200">
                <div className="grid grid-cols-[1fr_90px_80px] gap-3 border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-500 md:grid-cols-[1fr_120px_100px]">
                  <span>network condition</span>
                  <span>latency</span>
                  <span>change</span>
                </div>

                <ResultRow
                  title="Quiet connection"
                  note="No significant traffic"
                  latency={formatLatency(idle)}
                  change="baseline"
                />

                <ResultRow
                  title="During heavy download"
                  note="Receiving large amounts of data"
                  latency={formatLatency(downloadLatency)}
                  change={percentChange(idle, downloadLatency)}
                  severity={
                    idle && downloadLatency && downloadLatency > idle * 2
                      ? "warn"
                      : "neutral"
                  }
                />

                <ResultRow
                  title="During heavy upload"
                  note="Sending large amounts of data"
                  latency={formatLatency(uploadLatency)}
                  change={percentChange(idle, uploadLatency)}
                  severity={
                    idle && uploadLatency && uploadLatency > idle * 2
                      ? "bad"
                      : "neutral"
                  }
                />
              </div>

              <div className="mt-6 space-y-5">
                <section>
                  <p className="mb-1 text-sm text-neutral-500">diagnosis</p>
                  <p>{diagnosis.summary}</p>
                </section>

                <section>
                  <p className="mb-1 text-sm text-neutral-500">what this means</p>
                  <p>{diagnosis.impact}</p>
                </section>

                <section>
                  <p className="mb-1 text-sm text-neutral-500">what to do next</p>
                  <p>{diagnosis.fix}</p>
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
