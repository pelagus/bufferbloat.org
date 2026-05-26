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

const IDLE_DURATION_MS = 7000;
const LOADED_DURATION_MS = 8500;
const SAMPLE_DELAY_MS = 300;
const FREEZE_FINAL_MS = 900;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function median(values: number[]) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2) return sorted[middle];

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function trimmedMedian(values: number[]) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);

  if (sorted.length >= 5) {
    sorted.shift();
    sorted.pop();
  }

  return median(sorted);
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

    await wait(SAMPLE_DELAY_MS);
  }

  return samples;
}

async function drainDownload(onMbps: (mbps: number) => void) {
  try {
    const started = performance.now();

    const response = await fetch(`${DOWNLOAD_URL}?bloat=${crypto.randomUUID()}`, {
      cache: "no-store",
      mode: "cors",
    });

    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();
    let bytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      bytes += value.byteLength;

      const elapsed = (performance.now() - started) / 1000;

      if (elapsed > 0) {
        onMbps((bytes * 8) / elapsed / 1_000_000);
      }
    }
  } catch {}
}

function randomPayload(size: number) {
  const payload = new Uint8Array(size);
  const chunk = 65536;

  for (let offset = 0; offset < payload.length; offset += chunk) {
    crypto.getRandomValues(
      payload.subarray(offset, Math.min(offset + chunk, payload.length))
    );
  }

  return payload;
}

async function uploadPressure(onMbps: (mbps: number) => void) {
  try {
    const payload = randomPayload(32 * 1024 * 1024);
    const started = performance.now();

    const progress = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000;

      if (elapsed > 0) {
        onMbps((payload.byteLength * 8) / elapsed / 1_000_000);
      }
    }, 500);

    try {
      await fetch(UPLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: payload,
      });
    } finally {
      window.clearInterval(progress);
    }

    const elapsed = (performance.now() - started) / 1000;

    if (elapsed > 0) {
      onMbps((payload.byteLength * 8) / elapsed / 1_000_000);
    }
  } catch {}
}

function degradationPercent(base: number | null, loaded: number | null) {
  if (!base || !loaded) return 0;
  return ((loaded - base) / base) * 100;
}

function gradeResult(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null
) {
  const downloadDegradation = degradationPercent(idle, downloadLatency);
  const uploadDegradation = degradationPercent(idle, uploadLatency);

  const weightedWorst = Math.max(
    downloadDegradation,
    uploadDegradation * 1.15
  );

  if (weightedWorst > 300) return "D";
  if (weightedWorst > 150) return "D";
  if (weightedWorst > 60) return "C";
  if (weightedWorst > 25) return "B";

  return "A";
}

export async function runBufferbloatTest(
  onUpdate: (update: TestUpdate) => void
): Promise<TestResult> {
  let idle: number | null = null;
  let downloadLatency: number | null = null;
  let uploadLatency: number | null = null;

  let downloadMbps: number | null = null;
  let uploadMbps: number | null = null;

  onUpdate({
    phase: "idle",
    status: "quiet line",
    message: "Measuring baseline response time.",
    progress: 6,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const idleSamples = await sampleLatency(IDLE_DURATION_MS, (sample) => {
    idle = sample;

    onUpdate({
      phase: "idle",
      status: "quiet line",
      message: "Sampling quiet-line ping.",
      progress: 22,
      idle,
      downloadLatency,
      uploadLatency,
      downloadMbps,
      uploadMbps,
    });
  });

  idle = trimmedMedian(idleSamples);

  onUpdate({
    phase: "download",
    status: "latency during download",
    message: "Measuring ping while download pressure is active.",
    progress: 34,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const downloadLoad = drainDownload((mbps) => {
    downloadMbps = mbps;
  });

  const downloadSamples = await sampleLatency(LOADED_DURATION_MS, (sample) => {
    downloadLatency = sample;

    onUpdate({
      phase: "download",
      status: "latency during download",
      message: "Sampling ping under download pressure.",
      progress: 58,
      idle,
      downloadLatency,
      uploadLatency,
      downloadMbps,
      uploadMbps,
    });
  });

  await Promise.race([downloadLoad, wait(1200)]);

  downloadLatency = trimmedMedian(downloadSamples);

  onUpdate({
    phase: "upload",
    status: "latency during upload",
    message: "Measuring ping while upload pressure is active.",
    progress: 68,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  const uploadLoad = uploadPressure((mbps) => {
    uploadMbps = mbps;
  });

  const uploadSamples = await sampleLatency(LOADED_DURATION_MS, (sample) => {
    uploadLatency = sample;

    onUpdate({
      phase: "upload",
      status: "latency during upload",
      message: "Sampling ping under upload pressure.",
      progress: 88,
      idle,
      downloadLatency,
      uploadLatency,
      downloadMbps,
      uploadMbps,
    });
  });

  await Promise.race([uploadLoad, wait(1200)]);

  uploadLatency = trimmedMedian(uploadSamples);

  onUpdate({
    phase: "analysis",
    status: "analysis",
    message: "Computing diagnosis from stable median samples.",
    progress: 96,
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
  });

  await wait(FREEZE_FINAL_MS);

  return {
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
    grade: gradeResult(idle, downloadLatency, uploadLatency),
  };
}
