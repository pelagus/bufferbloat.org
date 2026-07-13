import type { Grade } from "../../../lib/test-copy";

export function stageIndex(status: string) {
  if (status.includes("idle") || status.includes("baseline") || status.includes("quiet")) return 1;
  if (status.includes("download")) return 2;
  if (status.includes("upload")) return 3;
  return 0;
}

export function severityClass(grade: Grade) {
  if (grade === "F" || grade === "D") return "bad";
  if (grade === "C") return "warn";
  if (grade === "B") return "ok";
  if (grade === "A+" || grade === "A") return "good";
  return "";
}

export function diagnosisFor(
  grade: Grade,
  down: number | null,
  up: number | null,
  idle: number | null,
  downloadLatency: number | null,
  uploadLatency: number | null
) {
  const weakThroughput = (down ?? 0) < 3 || (up ?? 0) < 1;

  const downloadDelta =
    idle && downloadLatency ? ((downloadLatency - idle) / idle) * 100 : 0;

  const uploadDelta =
    idle && uploadLatency ? ((uploadLatency - idle) / idle) * 100 : 0;

  const uploadWorse = uploadDelta > downloadDelta * 1.25;
  const downloadWorse = downloadDelta > uploadDelta * 1.25;

  if (weakThroughput) {
    return {
      headline: "Your connection looks weak before stress becomes the main issue.",
      label: "Weak",
      bullets: [
        "Speed was very low, so normal browsing may already feel slow.",
        "Loaded latency / ping still matters, but this run mainly shows limited capacity.",
        "Repeat the test later with the same device and location.",
      ],
    };
  }

  if (grade === "F" || grade === "D" || grade === "C") {
    return {
      headline: uploadWorse
        ? "Latency / ping rose most during upload."
        : downloadWorse
        ? "Latency / ping rose most during download."
        : grade === "F"
          ? "Latency / ping collapsed under load."
          : "Your connection becomes unstable under load.",
      label: grade === "F" ? "Severe" : grade === "D" ? "Poor" : "Uneven",
      bullets: [
        uploadWorse
          ? "Lag rises most sharply while sending data."
          : downloadWorse
          ? "Lag rises most sharply while receiving data."
          : "Lag rises when the connection gets busy.",
        "Calls, games, and page loads may freeze even when speed tests look acceptable.",
        "A stronger diagnosis needs repeated runs plus device and network context.",
      ],
    };
  }

  if (grade === "A+") {
    return {
      headline: "Everything measured very reliably in this run.",
      label: "Very reliable",
      bullets: [
        "Latency / ping stayed very low while the connection was busy.",
        "Upload and download stress did not add meaningful delay.",
        "Repeat later to confirm consistency.",
      ],
    };
  }

  return {
    headline: "Your internet looked reliable in this run.",
    label: "Stable",
    bullets: [
      "Lag did not spike while the connection was busy.",
      "Upload and download traffic stayed within a reasonable range.",
      "Repeat later to confirm consistency.",
    ],
  };
}
