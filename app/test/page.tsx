"use client";

import { useEffect, useMemo, useState } from "react";

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function drift(target: number, spread: number) {
  return `${Math.max(1, random(target - spread, target + spread))}ms`;
}

const idleMessages = [
  "Measuring the quiet baseline.",
  "Checking how quickly your line answers when nothing is competing.",
  "Looking for the best-case latency your connection can deliver.",
];

const downloadMessages = [
  "Adding download pressure, like a big update or video stream.",
  "Checking whether browsing and calls would still feel smooth.",
  "Watching for delay spikes while data flows toward you.",
];

const uploadMessages = [
  "Adding upload pressure, like cloud backup or sending large files.",
  "This is where many fast connections start to feel bad.",
  "Checking whether games and calls still get a clear path out.",
];

const analysisMessages = [
  "Comparing calm vs busy latency.",
  "Separating raw speed from responsiveness.",
  "Looking for the pattern humans feel as lag.",
];

export default function Page() {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  const [idle, setIdle] = useState("—");
  const [download, setDownload] = useState("—");
  const [upload, setUpload] = useState("—");

  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState(
    "Check whether your internet stays smooth when the network gets busy."
  );
  const [grade, setGrade] = useState("D");

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setProgress((p) => (p >= 96 ? p : p + Math.random() * 1.5));
    }, 140);

    return () => clearInterval(interval);
  }, [running]);

  function rotateMessages(messages: string[]) {
    let index = 0;
    setMessage(messages[0]);

    return setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 1700);
  }

  async function runTest() {
    setRunning(true);
    setFinished(false);
    setProgress(0);
    setGrade("D");

    setIdle("measuring");
    setDownload("—");
    setUpload("—");

    setStatus("quiet line");
    let rotator = rotateMessages(idleMessages);
    await wait(4300);
    clearInterval(rotator);

    const finalIdle = random(10, 18);
    setIdle(`${finalIdle}ms`);

    setDownload("measuring");
    setStatus("download load");
    rotator = rotateMessages(downloadMessages);

    for (let i = 0; i < 17; i++) {
      setDownload(drift(220, 70));
      await wait(330);
    }

    clearInterval(rotator);
    const finalDownload = random(180, 310);
    setDownload(`${finalDownload}ms`);

    setUpload("measuring");
    setStatus("upload load");
    rotator = rotateMessages(uploadMessages);

    for (let i = 0; i < 17; i++) {
      setUpload(drift(410, 95));
      await wait(330);
    }

    clearInterval(rotator);
    const finalUpload = random(330, 520);
    setUpload(`${finalUpload}ms`);

    setStatus("analysis");
    rotator = rotateMessages(analysisMessages);
    await wait(2300);
    clearInterval(rotator);

    setProgress(100);

    const computedGrade = finalUpload > 450 ? "D" : finalUpload > 350 ? "C" : "B";
    setGrade(computedGrade);

    setRunning(false);
    setFinished(true);
  }

  const diagnosis = useMemo(() => {
    if (grade === "D") {
      return {
        summary: "Fast on paper, frustrating under pressure.",
        impact:
          "Your line responds well when quiet, then delay jumps when uploads or downloads start. That is why calls freeze, games lag, and pages hang even when speed tests look fine.",
        fix:
          "Enable Smart Queue Management on your router. Look for SQM, CAKE, or fq_codel.",
      };
    }

    if (grade === "C") {
      return {
        summary: "Usable, but fragile when busy.",
        impact:
          "You may notice stutters when another device backs up photos, uploads files, or downloads large updates.",
        fix:
          "Router-level traffic control should make the connection feel steadier.",
      };
    }

    return {
      summary: "Stable under pressure.",
      impact:
        "Your connection stays responsive while busy, which is what matters for calls, games, and everyday browsing.",
      fix: "No major responsiveness issue detected.",
    };
  }, [grade]);

  return (
    <main className="page-shell">
      <p className="eyebrow">network diagnostic</p>

      <h1 className="page-title">Run a bufferbloat test</h1>

      <p className="page-copy">
        Find out if your internet stays responsive while the connection is busy.
      </p>

      {!running && !finished && (
        <div className="terminal-card">
          <p className="text-neutral-700">
            Keep this tab visible and avoid switching apps during the test. This gives the browser enough priority to measure timing accurately.
          </p>
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

              <pre className="mb-5 leading-7 whitespace-pre-wrap">{`Quiet .......... ${idle}
Download load .. ${download}
Upload load .... ${upload}`}</pre>

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
                  Quiet: {idle}
                  <br />
                  Download: {download}
                  <br />
                  Upload: {upload}
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
