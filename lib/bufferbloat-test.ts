export type TestPhase =
  | "idle"
  | "download"
  | "upload"
  | "analysis";

export type TestUpdate = {
  phase: TestPhase;
  status: string;
  message: string;
  progress: number;

  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;

  downloadMbps: number | null;
  uploadMbps: number | null;
};

export type TestResult = {
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;

  downloadMbps: number | null;
  uploadMbps: number | null;

  grade: "A" | "B" | "C" | "D";
};

const DOWNLOAD_URL = "https://files.bufferbloat.org/100mb.bin";
const PING_URL = "https://files.bufferbloat.org/ping.txt";
const UPLOAD_URL = "https://upload-sink.pelagus-limited.workers.dev/";
const UPLOAD_ESTIMATE_FACTOR = 0.7;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values: number[], p: number) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;

  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function probeLatency() {
  const started = performance.now();

  await fetch(`${PING_URL}?bloat=${crypto.randomUUID()}`, {
    cache: "no-store",
  });

  return performance.now() - started;
}

async function sampleLatency(
  durationMs: number,
  onSample: (sample: number) => void
) {
  const samples: number[] = [];
  const end = performance.now() + durationMs;

  while (performance.now() < end) {
    try {
      const sample = await probeLatency();
      samples.push(sample);
      onSample(sample);
    } catch {}

    await wait(350);
  }

  return samples;
}

async function drainDownload(
  onMbps: (mbps: number) => void
) {
  try {
    const started = performance.now();

    const response = await fetch(
      `${DOWNLOAD_URL}?bloat=${crypto.randomUUID()}`,
      {
        cache: "no-store",
        mode: "cors",
      }
    );

    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();

    let bytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      bytes += value.byteLength;

      const elapsed =
        (performance.now() - started) / 1000;

      const mbps =
        (bytes * 8) / elapsed / 1_000_000;

      onMbps(mbps);
    }
  } catch {}
}

function randomPayload(size: number) {
  const payload = new Uint8Array(size);
  const chunk = 65536;

  for (
    let offset = 0;
    offset < payload.length;
    offset += chunk
  ) {
    crypto.getRandomValues(
      payload.subarray(
        offset,
        Math.min(offset + chunk, payload.length)
      )
    );
  }

  return payload;
}

async function uploadPressure(
  onMbps: (mbps: number) => void
) {
  try {
    const payload = randomPayload(
      32 * 1024 * 1024
    );

    const started = performance.now();

    const progress = window.setInterval(() => {
      const elapsed =
        (performance.now() - started) / 1000;

      if (elapsed > 0) {
        const estimatedMbps =
          (payload.byteLength * 8) /
          elapsed /
          1_000_000;

        onMbps(estimatedMbps * UPLOAD_ESTIMATE_FACTOR);
      }
    }, 500);

    try {
      await fetch(UPLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/octet-stream",
        },
        body: payload,
      });
    } finally {
      window.clearInterval(progress);
    }

    const elapsed =
      (performance.now() - started) / 1000;

    const mbps =
      (payload.byteLength * 8) /
      elapsed /
      1_000_000;

    onMbps(mbps);
  } catch {}
}

function gradeResult(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null
) {
  const worstBusy = Math.max(
    downloadLatency || 0,
    uploadLatency || 0
  );

  const increase = idle
    ? worstBusy / idle
    : 0;

  if (worstBusy > 350 || increase > 12)
    return "D";

  if (worstBusy > 180 || increase > 6)
    return "C";

  if (worstBusy > 90 || increase > 3)
    return "B";

  return "A";
}

export async function runBufferbloatTest(
  onUpdate: (update: TestUpdate) => void
): Promise<TestResult> {
  let idle: number | null = null;

  let downloadLatency: number | null =
    null;

  let uploadLatency: number | null = null;

  let downloadMbps: number | null = null;

  let uploadMbps: number | null = null;

  onUpdate({
    phase: "idle",
    status: "quiet line",
    message:
      "Measuring how quickly your internet responds before adding traffic.",
    progress: 8,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const idleSamples =
    await sampleLatency(4500, (sample) => {
      idle = sample;

      onUpdate({
        phase: "idle",
        status: "quiet line",
        message:
          "Checking the baseline response time of the connection.",
        progress: 24,
        idle,
        downloadLatency,
        uploadLatency,
        downloadMbps,
        uploadMbps,
      });
    });

  idle = percentile(idleSamples, 95);

  onUpdate({
    phase: "download",
    status: "latency during download",
    message:
      "Downloading a large incompressible file while checking whether response time stays stable.",
    progress: 34,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const downloadLoad = drainDownload(
    (mbps) => {
      downloadMbps = mbps;
    }
  );

  const downloadSamples =
    await sampleLatency(6500, (sample) => {
      downloadLatency = sample;

      onUpdate({
        phase: "download",
        status: "latency during download",
        message:
          "Fast downloads are good. The important part is whether the connection still reacts quickly while busy.",
        progress: 58,
        idle,
        downloadLatency,
        uploadLatency,
        downloadMbps,
        uploadMbps,
      });
    });

  await Promise.race([
    downloadLoad,
    wait(1000),
  ]);

  downloadLatency = percentile(
    downloadSamples,
    95
  );

  onUpdate({
    phase: "upload",
    status: "latency during upload",
    message:
      "Uploads are where many connections become unstable for calls and games.",
    progress: 68,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const uploadLoad = uploadPressure(
    (mbps) => {
      uploadMbps = mbps;
    }
  );

  const uploadSamples =
    await sampleLatency(6500, (sample) => {
      uploadLatency = sample;

      onUpdate({
        phase: "upload",
        status: "latency during upload",
        message:
          "Checking whether response time spikes while the line is sending data.",
        progress: 88,
        idle,
        downloadLatency,
        uploadLatency,
        downloadMbps,
        uploadMbps,
      });
    });

  await Promise.race([
    uploadLoad,
    wait(1000),
  ]);

  uploadLatency = percentile(
    uploadSamples,
    95
  );

  onUpdate({
    phase: "analysis",
    status: "analysis",
    message:
      "Comparing quiet response time with busy response time.",
    progress: 96,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  await wait(1200);

  return {
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
    grade: gradeResult(
      idle,
      downloadLatency,
      uploadLatency
    ),
  };
}
