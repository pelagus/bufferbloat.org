"use client";

import { useEffect, useMemo, useState } from "react";

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Page() {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const [progress, setProgress] = useState(0);

  const [idle, setIdle] = useState("—");
  const [download, setDownload] = useState("—");
  const [upload, setUpload] = useState("—");

  const [phase, setPhase] = useState(
    "This test checks whether your internet stays responsive while busy."
  );

  const [grade, setGrade] = useState("D");

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return p + Math.random() * 2.2;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setIdle(`${random(8, 22)}ms`);

      if (download !== "—") {
        setDownload(`${random(120, 320)}ms`);
      }

      if (upload !== "—") {
        setUpload(`${random(220, 520)}ms`);
      }
    }, 220);

    return () => clearInterval(interval);
  }, [running, download, upload]);

  async function runTest() {
    setRunning(true);
    setFinished(false);

    setProgress(0);

    setIdle("measuring...");
    setDownload("—");
    setUpload("—");

    setPhase(
      "Checking how responsive your connection feels when nothing else is happening..."
    );

    await wait(5000);

    const finalIdle = random(10, 18);
    setIdle(`${finalIdle}ms`);

    setDownload("measuring...");

    setPhase(
      "Checking whether downloads make video calls, browsing, or gaming feel sluggish..."
    );

    await wait(9000);

    const finalDownload = random(180, 320);
    setDownload(`${finalDownload}ms`);

    setUpload("measuring...");

    setPhase(
      "Checking whether uploads from this or other devices make the whole connection unstable..."
    );

    await wait(9000);

    const finalUpload = random(320, 520);
    setUpload(`${finalUpload}ms`);

    setPhase(
      "Comparing quiet vs busy conditions to estimate connection stability..."
    );

    await wait(4000);

    setProgress(100);

    const computedGrade =
      finalUpload > 450
        ? "D"
        : finalUpload > 350
          ? "C"
          : "B";

    setGrade(computedGrade);

    setRunning(false);
    setFinished(true);
  }

  const diagnosis = useMemo(() => {
    if (grade === "D") {
      return {
        summary:
          "Your connection becomes noticeably unstable when busy.",
        impact:
          "Video calls could start breaking up if someone else is watching videos, backing up photos, or uploading files on the same network.",
        fix:
          "Your router may be too old, or it may need traffic management features enabled. Modern routers with Smart Queue Management can often improve this dramatically.",
      };
    }

    if (grade === "C") {
      return {
        summary:
          "Your connection slows down under stress, but remains usable most of the time.",
        impact:
          "You may notice occasional lag spikes during heavy downloads or uploads.",
        fix:
          "Router tuning or upgrading to a newer model could improve responsiveness.",
      };
    }

    return {
      summary:
        "Your connection stays reasonably stable even while busy.",
      impact:
        "Most people on the network should be able to browse, stream, and call without major interruptions.",
      fix:
        "No major issues detected.",
      };
  }, [grade]);

  return (
    <main className="page-shell">
      <p className="eyebrow">network diagnostic</p>

      <h1 className="page-title">Run a bufferbloat test</h1>

      <p className="page-copy">
        Check whether your internet stays smooth when the network becomes busy.
      </p>

      {!running && !finished && (
        <div className="terminal-card">
          <p className="mb-4 font-mono text-sm text-neutral-600">
            For the most accurate result:
          </p>

          <ul className="space-y-2 font-mono text-sm text-neutral-700">
            <li>• Keep this tab open and focused during the test</li>
            <li>• Avoid downloads, cloud backups, or streaming</li>
            <li>• Other active devices on the same Wi-Fi can affect the result</li>
          </ul>
        </div>
      )}

      <button
        onClick={runTest}
        disabled={running}
        className="mt-10 border border-black px-5 py-3 font-mono transition hover:bg-black hover:text-white disabled:opacity-40"
      >
        {running ? "Testing..." : finished ? "Run again" : "Start test"}
      </button>

      {(running || finished) && (
        <div className="terminal-card">
          {running && (
            <>
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between font-mono text-sm">
                  <span>Test progress</span>
                  <span>{Math.floor(progress)}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-black transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <pre className="leading-8 whitespace-pre-wrap">{`Idle latency .......... ${idle}
Busy download .......... ${download}
Busy upload ............ ${upload}

${phase}`}</pre>

              <div className="mt-6 border-t border-neutral-200 pt-4 font-mono text-sm text-neutral-600">
                Keep this tab visible during the test. Browsers slow down
                measurements in background tabs, which can distort the result.
              </div>
            </>
          )}

          {finished && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-neutral-500">
                    overall grade
                  </p>

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
                  Idle: {idle}
                  <br />
                  Download: {download}
                  <br />
                  Upload: {upload}
                </div>
              </div>

              <div className="space-y-6 font-mono">
                <div>
                  <p className="mb-2 text-sm text-neutral-500">
                    what this means
                  </p>

                  <p>{diagnosis.summary}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-neutral-500">
                    real-world impact
                  </p>

                  <p>{diagnosis.impact}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-neutral-500">
                    possible fixes
                  </p>

                  <p>{diagnosis.fix}</p>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <p className="mb-4 text-sm text-neutral-500">
                    Want personalized fixes for your router?
                  </p>

                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="border border-black px-4 py-3 font-mono outline-none"
                    />

                    <button className="border border-black px-5 py-3 font-mono transition hover:bg-black hover:text-white">
                      Send optimization guide
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
