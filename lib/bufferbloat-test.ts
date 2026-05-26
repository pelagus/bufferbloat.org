export type TestPhase = "idle" | "download" | "upload" | "analysis";

export type TestUpdate = {
  phase: TestPhase;
  status: string;
  message: string;
  progress: number;
  idle: number | null;
  download: number | null;
  upload: number | null;
};

export type TestResult = {
  idle: number | null;
  download: number | null;
  upload: number | null;
  grade: "A" | "B" | "C" | "D";
};

const DOWNLOAD_URL = "https://files.bufferbloat.org/100mb.bin";
const UPLOAD_URL = "https://upload-sink.pelagus-limited.workers.dev/";

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
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, 2000);

  try {
    await fetch(`/favicon.ico?bloat=${crypto.randomUUID()}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    return performance.now() - started;
  } finally {
    window.clearTimeout(timeout);
  }
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
    } catch {
      // Ignore individual probe failures.
    }

    await wait(350);
  }

  return samples;
}

async function drainDownload() {
  try {
    const response = await fetch(`${DOWNLOAD_URL}?bloat=${crypto.randomUUID()}`, {
      cache: "no-store",
      mode: "cors",
    });

    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();

    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch {
    return;
  }
}

function randomPayload(size: number) {
  const payload = new Uint8Array(size);
  const chunkSize = 65536;

  for (let offset = 0; offset < payload.length; offset += chunkSize) {
    crypto.getRandomValues(
      payload.subarray(offset, Math.min(offset + chunkSize, payload.length))
    );
  }

  return payload;
}

async function uploadPressure() {
  try {
    await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: randomPayload(32 * 1024 * 1024),
    });
  } catch {
    return;
  }
}

function gradeResult(idle: number | null, download: number | null, upload: number | null) {
  const worstBusy = Math.max(download || 0, upload || 0);
  const increase = idle ? worstBusy / idle : 0;

  if (worstBusy > 350 || increase > 12) return "D";
  if (worstBusy > 180 || increase > 6) return "C";
  if (worstBusy > 90 || increase > 3) return "B";

  return "A";
}

export async function runBufferbloatTest(
  onUpdate: (update: TestUpdate) => void
): Promise<TestResult> {
  let idle: number | null = null;
  let download: number | null = null;
  let upload: number | null = null;

  onUpdate({
    phase: "idle",
    status: "quiet line",
    message: "Measuring how quickly your connection responds before adding pressure.",
    progress: 8,
    idle,
    download,
    upload,
  });

  const idleSamples = await sampleLatency(4500, (sample) => {
    idle = sample;

    onUpdate({
      phase: "idle",
      status: "quiet line",
      message: "Measuring the quiet baseline.",
      progress: 22,
      idle,
      download,
      upload,
    });
  });

  idle = percentile(idleSamples, 95);

  onUpdate({
    phase: "download",
    status: "download load",
    message: "Downloading an incompressible test file while checking if the line still answers quickly.",
    progress: 34,
    idle,
    download,
    upload,
  });

  const downloadPressure = drainDownload();

  const downloadSamples = await sampleLatency(6500, (sample) => {
    download = sample;

    onUpdate({
      phase: "download",
      status: "download load",
      message: "Checking whether browsing and calls would still feel smooth during a large download.",
      progress: 58,
      idle,
      download,
      upload,
    });
  });

  await Promise.race([downloadPressure, wait(1000)]);

  download = percentile(downloadSamples, 95);

  onUpdate({
    phase: "upload",
    status: "upload load",
    message: "Uploading disposable test data while checking if calls and games would still get through.",
    progress: 68,
    idle,
    download,
    upload,
  });

  const uploadLoad = uploadPressure();

  const uploadSamples = await sampleLatency(6500, (sample) => {
    upload = sample;

    onUpdate({
      phase: "upload",
      status: "upload load",
      message: "This is where many fast connections start to feel bad.",
      progress: 88,
      idle,
      download,
      upload,
    });
  });

  await Promise.race([uploadLoad, wait(1000)]);

  upload = percentile(uploadSamples, 95);

  onUpdate({
    phase: "analysis",
    status: "analysis",
    message: "Comparing quiet latency with busy latency. This is the part speed tests usually hide.",
    progress: 96,
    idle,
    download,
    upload,
  });

  await wait(1200);

  const grade = gradeResult(idle, download, upload);

  return {
    idle,
    download,
    upload,
    grade,
  };
}
