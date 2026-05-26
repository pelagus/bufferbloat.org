"use client";

import { useState } from "react";
import { runBufferbloatTest } from "../../lib/bufferbloat-test";
import {
  diagnosisCopy,
  initialTestMessage,
  preTestInstruction,
  type Grade,
} from "../../lib/test-copy";

function format(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}ms`;
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [idle, setIdle] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
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
      setDownload(null);
      setUpload(null);
      setGrade("—");
      setStatus("starting");
      setMessage("Starting the measurement engine.");

      const result = await runBufferbloatTest((update) => {
        setStatus(update.status);
        setMessage(update.message);
        setProgress(update.progress);
        setIdle(update.idle);
        setDownload(update.download);
        setUpload(update.upload);
      });

      setIdle(result.idle);
      setDownload(result.download);
      setUpload(result.upload);
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

  return (
    <main className="page-shell">
      <p className="eyebrow">network diagnostic</p>

      <h1 className="page-title">Run a bufferbloat test</h1>

      <p className="page-copy">
        Find out if your internet stays responsive while the connection is busy.
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

              <pre className="mb-5 leading-7 whitespace-pre-wrap">{`Quiet .......... ${format(idle)}
Download load .. ${format(download)}
Upload load .... ${format(upload)}`}</pre>

              <p className="border-t border-neutral-200 pt-4 text-neutral-700">
                {message}
              </p>
            </>
          )}

          {finished && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">responsiveness grade</p>

                  <h2
                    className={`font-mono text-6xl font-bold ${
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

                <div className="font-mono text-sm text-neutral-600">
                  Quiet: {format(idle)}
                  <br />
                  Download: {format(download)}
                  <br />
                  Upload: {format(upload)}
                </div>
              </div>

              <div className="space-y-5">
                <section>
                  <p className="mb-1 text-sm text-neutral-500">diagnosis</p>
                  <p>{diagnosis.summary}</p>
                </section>

                <section>
                  <p className="mb-1 text-sm text-neutral-500">what this feels like</p>
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
