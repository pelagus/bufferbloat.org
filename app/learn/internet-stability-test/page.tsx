import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Internet Stability Test",
  description:
    "Run an internet stability test that checks whether ping stays steady during download and upload load, the condition ordinary speed tests often miss.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-stability-test",
  },
  openGraph: {
    title: "Internet Stability Test",
    description:
      "Check whether your connection stays stable while the line is busy, not only when it is idle.",
    url: "https://bufferbloat.org/learn/internet-stability-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "internet stability test",
  title: "Internet stability test",
  intro:
    "An internet stability test should show whether latency stays steady while the connection is doing real work. Bufferbloat.org checks stability by measuring ping during quiet, download-loaded, and upload-loaded phases.",
  calloutLabel: "stability under pressure",
  calloutTitle: "Measure the delay that appears when the connection is busy.",
  calloutBody:
    "The result shows whether ping stays close to normal or jumps under load, which is often the difference between a line that feels stable and one that feels unpredictable.",
  cards: [
    {
      label: "01",
      title: "Stable ping",
      body:
        "A stable connection keeps latency close to its normal level when download and upload traffic are active.",
    },
    {
      label: "02",
      title: "Latency variation",
      body:
        "Variation matters because calls, games, and remote work can feel uneven when ping moves around under load.",
    },
    {
      label: "03",
      title: "Bufferbloat signal",
      body:
        "A large rise during download or upload stress suggests queues are adding delay before packets leave the network.",
    },
  ],
  notes: [
    {
      title: "Stability is about loaded behavior",
      body: [
        "Many tests measure a quiet line. Real use is usually noisier: someone uploads a file, a device syncs photos, a video stream starts, or a game runs while other traffic is active.",
        "Bufferbloat.org focuses on that busy condition so the result is closer to the way the connection feels in practice.",
      ],
    },
    {
      title: "Repeat tests when results look surprising",
      body: [
        "Browser tests can be noisy, and network conditions change during the day. If a result looks unusually poor or unusually good, repeat the test with VPNs disabled and other activity paused.",
        "The technical-details export keeps the measured samples inspectable instead of hiding everything behind a single score.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
    { href: "/learn/latency-under-load", label: "Latency under load" },
    { href: "/learn/bufferbloat-speed-test", label: "Bufferbloat speed test" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
