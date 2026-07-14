import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Internet Reliability Test",
  description:
    "Run an internet reliability test that measures whether latency and ping stay stable while download and upload traffic are active.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-reliability-test",
  },
  openGraph: {
    title: "Internet Reliability Test",
    description:
      "Check whether a fast-looking connection remains reliable in real-world busy conditions.",
    url: "https://bufferbloat.org/learn/internet-reliability-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "internet reliability test",
  title: "Internet reliability test",
  intro:
    "An internet reliability test asks whether the connection keeps responding while it is busy. Bufferbloat.org tests that by comparing normal ping with ping during download and upload pressure.",
  calloutLabel: "real-world connection check",
  calloutTitle: "See whether the line stays usable under load.",
  calloutBody:
    "Run one browser test to measure quiet ping, loaded ping, throughput, and a bufferbloat grade that explains how the connection is likely to feel in everyday use.",
  cards: [
    {
      label: "Calls",
      title: "Video and voice",
      body:
        "Calls need low and stable latency. A connection can have enough throughput for video but still feel delayed when queues fill.",
    },
    {
      label: "Browsing",
      title: "Web responsiveness",
      body:
        "Pages can hesitate when interactive requests are stuck behind large downloads, uploads, or cloud sync traffic.",
    },
    {
      label: "Shared use",
      title: "Busy household networks",
      body:
        "Reliability matters most when several devices are active at once, not when a speed test has the line to itself.",
    },
  ],
  notes: [
    {
      title: "Throughput is not the whole story",
      body: [
        "Megabits per second measure throughput. They do not tell you whether the connection stays responsive when upload and download traffic are active.",
        "Bufferbloat.org keeps throughput visible, but the reliability signal is how much latency changes while the line is under stress.",
      ],
    },
    {
      title: "Why this is a bufferbloat test",
      body: [
        "Bufferbloat is the delay that appears when queues grow too large. The user experience is simple: the internet may still be fast, but it stops feeling responsive.",
        "The test is open source and browser-based so the core method can be inspected, discussed, and improved.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-latency-test", label: "Internet latency test" },
    { href: "/learn/internet-stability-test", label: "Internet stability test" },
    { href: "/docs", label: "Measurement methodology" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
