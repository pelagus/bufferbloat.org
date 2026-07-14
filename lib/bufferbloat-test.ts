export type TestPhase =
  | "warmup"
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
  recentLatencySamples: number[];
  latencySampleCount: number;
  latencySamples: LatencySamplesByPhase;
};

export type TestResult = {
  idle: number | null;
  downloadLatency: number | null;
  uploadLatency: number | null;

  downloadMbps: number | null;
  uploadMbps: number | null;

  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  latencySamples: LatencySamplesByPhase;
};

export type LatencySamplesByPhase = {
  idle: number[];
  download: number[];
  upload: number[];
};

const DOWNLOAD_URL = "https://files.bufferbloat.org/100mb.bin";
const LATENCY_URL = "https://speed.cloudflare.com/__down?bytes=1";
const UPLOAD_URL = "https://speed.cloudflare.com/__up";

const IDLE_DURATION_MS = 8000;
const LOADED_DURATION_MS = 18000;
const MIN_PHASE_WARMUP_MS = 3000;
const IDLE_SETTLE_MS = MIN_PHASE_WARMUP_MS;
const LOADED_SETTLE_MS = Math.max(6000, MIN_PHASE_WARMUP_MS);
const LOADED_RECORDING_MS = LOADED_DURATION_MS - LOADED_SETTLE_MS;
const SAMPLE_DELAY_MS = 250;
const FREEZE_FINAL_MS = 900;
const WARMUP_MIN_VISIBLE_MS = 5500;
const WARMUP_SETTLE_MS = 500;
const WARMUP_DOWNLOAD_BYTES = 256 * 1024;
const WARMUP_UPLOAD_BYTES = 64 * 1024;
const DOWNLOAD_STREAMS = 4;
const UPLOAD_STREAMS = 3;
const UPLOAD_STREAM_PAYLOAD_BYTES = 1024 * 1024;
const MIN_LATENCY_SAMPLES = 3;
const VISIBILITY_ABORT_MESSAGE =
  "Test stopped because this tab left the foreground. To protect accuracy, keep Bufferbloat.org visible until the run finishes.";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException(VISIBILITY_ABORT_MESSAGE, "AbortError");
  }
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    throwIfAborted(signal);

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);

    function abort() {
      window.clearTimeout(timeout);
      reject(new DOMException(VISIBILITY_ABORT_MESSAGE, "AbortError"));
    }

    signal?.addEventListener("abort", abort, { once: true });
  });
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

  const response = await fetch(`${LATENCY_URL}&bloat=${crypto.randomUUID()}`, {
    cache: "no-store",
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`Latency probe failed with HTTP ${response.status}`);
  }

  return performance.now() - started;
}

async function sampleLatency(
  durationMs: number,
  onSample: (sample: number) => void,
  signal?: AbortSignal
) {
  const samples: number[] = [];
  const end = performance.now() + durationMs;

  while (performance.now() < end) {
    throwIfAborted(signal);

    try {
      const sample = await probeLatency();
      throwIfAborted(signal);
      samples.push(sample);
      onSample(sample);
    } catch (error) {
      if (isAbortError(error)) throw error;
    }

    await wait(SAMPLE_DELAY_MS, signal);
  }

  if (samples.length < MIN_LATENCY_SAMPLES) {
    throw new Error("Too few latency samples were collected.");
  }

  return samples;
}

async function warmUpLatencyPath(durationMs: number, signal?: AbortSignal) {
  const end = performance.now() + durationMs;

  while (performance.now() < end) {
    throwIfAborted(signal);

    try {
      await probeLatency();
      throwIfAborted(signal);
    } catch (error) {
      if (isAbortError(error)) throw error;
    }

    await wait(SAMPLE_DELAY_MS, signal);
  }
}

async function warmUpDownload() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`${DOWNLOAD_URL}?bloat=${crypto.randomUUID()}&warmup=1`, {
      cache: "no-store",
      headers: {
        Range: `bytes=0-${WARMUP_DOWNLOAD_BYTES - 1}`,
      },
      mode: "cors",
      signal: controller.signal,
    });

    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();
    let bytes = 0;

    while (bytes < WARMUP_DOWNLOAD_BYTES) {
      const { done, value } = await reader.read();

      if (done) break;

      bytes += value.byteLength;
    }

    await reader.cancel().catch(() => {});
  } catch {
  } finally {
    window.clearTimeout(timeout);
  }
}

async function warmUpUpload() {
  try {
    await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: randomPayload(WARMUP_UPLOAD_BYTES),
    });
  } catch {}
}

async function warmUpSession(signal?: AbortSignal) {
  throwIfAborted(signal);

  await Promise.allSettled([
    probeLatency(),
    warmUpDownload(),
    warmUpUpload(),
  ]);

  await wait(WARMUP_SETTLE_MS, signal);
}

function startDownloadPressure(onMbps: (mbps: number) => void) {
  const controller = new AbortController();
  const started = performance.now();
  let bytes = 0;

  async function runStream(stream: number) {
    while (!controller.signal.aborted) {
      try {
        const response = await fetch(
          `${DOWNLOAD_URL}?bloat=${crypto.randomUUID()}&stream=${stream}`,
          {
            cache: "no-store",
            mode: "cors",
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();

          if (done) break;

          bytes += value.byteLength;

          const elapsed = (performance.now() - started) / 1000;

          if (elapsed > 0) {
            onMbps((bytes * 8) / elapsed / 1_000_000);
          }
        }

        await reader.cancel().catch(() => {});
      } catch (error) {
        if (!controller.signal.aborted) {
          console.debug("download pressure stream ended", error);
        }

        return;
      }
    }
  }

  const done = Promise.allSettled(
    Array.from({ length: DOWNLOAD_STREAMS }, (_, stream) => runStream(stream))
  );

  return {
    done,
    stop() {
      controller.abort();
    },
  };
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

function startUploadPressure(onMbps: (mbps: number) => void) {
  const controller = new AbortController();
  const started = performance.now();
  let bytes = 0;

  const progress = window.setInterval(() => {
    const elapsed = (performance.now() - started) / 1000;

    if (elapsed > 0) {
      onMbps((bytes * 8) / elapsed / 1_000_000);
    }
  }, 500);

  async function runStream(stream: number) {
    while (!controller.signal.aborted) {
      try {
        const payload = randomPayload(UPLOAD_STREAM_PAYLOAD_BYTES);

        const response = await fetch(`${UPLOAD_URL}?bloat=${crypto.randomUUID()}&stream=${stream}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: payload,
          signal: controller.signal,
        });

        if (!response.ok) return;

        const confirmedBytes = Number(
          response.headers.get("cf-meta-upload-bytes")
        );

        bytes += Number.isFinite(confirmedBytes)
          ? confirmedBytes
          : payload.byteLength;
      } catch (error) {
        if (!controller.signal.aborted) {
          console.debug("upload pressure stream ended", error);
        }

        return;
      }
    }
  }

  const done = Promise.allSettled(
    Array.from({ length: UPLOAD_STREAMS }, (_, stream) => runStream(stream))
  ).finally(() => {
    window.clearInterval(progress);
  });

  return {
    done,
    stop() {
      controller.abort();
      window.clearInterval(progress);
    },
  };
}

function degradationPercent(base: number | null, loaded: number | null) {
  if (!base || !loaded) return 0;
  return ((loaded - base) / base) * 100;
}

function gradeResult(
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null,
  downloadMbps: number | null,
  uploadMbps: number | null
) {
  const downloadDegradation = degradationPercent(idle, downloadLatency);
  const uploadDegradation = degradationPercent(idle, uploadLatency);
  const downloadDelta = downloadLatency !== null && idle !== null ? downloadLatency - idle : 0;
  const uploadDelta = uploadLatency !== null && idle !== null ? uploadLatency - idle : 0;

  const weightedWorst = Math.max(
    downloadDegradation,
    uploadDegradation * 1.15
  );
  const movement = Math.max(0, downloadDelta, uploadDelta);
  const worstLoadedLatency = Math.max(downloadLatency ?? 0, uploadLatency ?? 0);

  if (
    idle !== null &&
    idle <= 50 &&
    movement <= 8 &&
    (downloadMbps ?? 0) >= 25 &&
    (uploadMbps ?? 0) >= 10
  ) {
    return "A+";
  }
  if (
    movement <= 30 &&
    worstLoadedLatency <= 125 &&
    weightedWorst <= 85
  ) {
    return "A";
  }
  if (
    movement <= 60 &&
    worstLoadedLatency <= 170 &&
    weightedWorst <= 140
  ) {
    return "B";
  }
  if (
    movement <= 130 &&
    worstLoadedLatency <= 260 &&
    weightedWorst <= 260
  ) {
    return "C";
  }
  if (
    movement <= 260 &&
    worstLoadedLatency <= 450 &&
    weightedWorst <= 450
  ) {
    return "D";
  }

  return "F";
}

export async function runBufferbloatTest(
  onUpdate: (update: TestUpdate) => void,
  options: { signal?: AbortSignal } = {}
): Promise<TestResult> {
  const { signal } = options;
  let idle: number | null = null;
  let downloadLatency: number | null = null;
  let uploadLatency: number | null = null;

  let downloadMbps: number | null = null;
  let uploadMbps: number | null = null;
  let recentLatencySamples: number[] = [];
  let latencySampleCount = 0;
  const latencySamples: LatencySamplesByPhase = {
    idle: [],
    download: [],
    upload: [],
  };

  let currentUpdateMeta = {
    phase: "warmup" as TestPhase,
    status: "warmup",
    message: "Warming the test path before recording samples.",
    progress: 3,
  };

  function emitCurrent() {
    onUpdate({
      ...currentUpdateMeta,
      idle,
      downloadLatency,
      uploadLatency,
      downloadMbps,
      uploadMbps,
      recentLatencySamples,
      latencySampleCount,
      latencySamples,
    });
  }

  function emit(phase: TestPhase, status: string, message: string, progress: number) {
    currentUpdateMeta = { phase, status, message, progress };
    emitCurrent();
  }

  let lastThroughputEmitAt = 0;

  function emitThroughputUpdate() {
    const now = performance.now();

    if (now - lastThroughputEmitAt < 250) {
      return;
    }

    lastThroughputEmitAt = now;
    emitCurrent();
  }

  emit("warmup", "warmup", "Warming the test path before recording samples.", 3);

  throwIfAborted(signal);

  await Promise.all([
    warmUpSession(signal),
    wait(WARMUP_MIN_VISIBLE_MS, signal),
  ]);

  throwIfAborted(signal);

  emit("idle", "quiet settling", "Warming quiet-line ping before recording baseline samples.", 8);

  await warmUpLatencyPath(IDLE_SETTLE_MS, signal);

  emit("idle", "quiet measuring", "Measuring baseline response time.", 12);

  const idleSamples = await sampleLatency(IDLE_DURATION_MS, (sample) => {
    idle = sample;
    latencySamples.idle = [...latencySamples.idle, sample];
    recentLatencySamples = [...recentLatencySamples, sample].slice(-5);
    latencySampleCount += 1;

    emit("idle", "quiet measuring", "Sampling quiet-line ping.", 24);
  }, signal);

  idle = trimmedMedian(idleSamples);

  emit("download", "download starting", "Starting download pressure before recording loaded ping.", 34);

  recentLatencySamples = [];
  latencySampleCount = 0;

  const downloadPressure = startDownloadPressure((mbps) => {
    downloadMbps = mbps;
    emitThroughputUpdate();
  });
  const stopDownloadOnAbort = () => downloadPressure.stop();
  signal?.addEventListener("abort", stopDownloadOnAbort, { once: true });

  let downloadSamples: number[] = [];
  try {
    emit("download", "download settling", "Letting download pressure settle before recording samples.", 44);

    await warmUpLatencyPath(LOADED_SETTLE_MS, signal);

    emit("download", "download measuring", "Sampling ping under established download pressure.", 58);

    downloadSamples = await sampleLatency(LOADED_RECORDING_MS, (sample) => {
      downloadLatency = sample;
      latencySamples.download = [...latencySamples.download, sample];
      recentLatencySamples = [...recentLatencySamples, sample].slice(-5);
      latencySampleCount += 1;

      emit("download", "download measuring", "Sampling ping under established download pressure.", 58);
    }, signal);
  } finally {
    signal?.removeEventListener("abort", stopDownloadOnAbort);
    downloadPressure.stop();
    await Promise.race([downloadPressure.done, wait(1200)]);
  }

  downloadLatency = trimmedMedian(downloadSamples);

  emit("upload", "upload starting", "Starting upload pressure before recording loaded ping.", 68);

  recentLatencySamples = [];
  latencySampleCount = 0;

  const uploadPressure = startUploadPressure((mbps) => {
    uploadMbps = mbps;
    emitThroughputUpdate();
  });
  const stopUploadOnAbort = () => uploadPressure.stop();
  signal?.addEventListener("abort", stopUploadOnAbort, { once: true });

  let uploadSamples: number[] = [];
  try {
    emit("upload", "upload settling", "Letting upload pressure settle before recording samples.", 76);

    await warmUpLatencyPath(LOADED_SETTLE_MS, signal);

    emit("upload", "upload measuring", "Sampling ping under established upload pressure.", 88);

    uploadSamples = await sampleLatency(LOADED_RECORDING_MS, (sample) => {
      uploadLatency = sample;
      latencySamples.upload = [...latencySamples.upload, sample];
      recentLatencySamples = [...recentLatencySamples, sample].slice(-5);
      latencySampleCount += 1;

      emit("upload", "upload measuring", "Sampling ping under established upload pressure.", 88);
    }, signal);
  } finally {
    signal?.removeEventListener("abort", stopUploadOnAbort);
    uploadPressure.stop();
    await Promise.race([uploadPressure.done, wait(1200)]);
  }

  uploadLatency = trimmedMedian(uploadSamples);

  emit("analysis", "analysis", "Computing diagnosis from stable median samples.", 96);

  await wait(FREEZE_FINAL_MS, signal);

  return {
    idle,
    downloadLatency,
    uploadLatency,
    downloadMbps,
    uploadMbps,
    grade: gradeResult(idle, downloadLatency, uploadLatency, downloadMbps, uploadMbps),
    latencySamples,
  };
}
