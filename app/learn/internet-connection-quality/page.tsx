import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Internet Connection Quality",
  description:
    "Measure internet connection quality with an open-source browser test for latency, loaded ping, throughput, and bufferbloat behavior.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-connection-quality",
  },
  openGraph: {
    title: "Internet Connection Quality",
    description:
      "A practical way to measure whether your connection feels reliable in real-world conditions, not only how many Mbps it can move.",
    url: "https://bufferbloat.org/learn/internet-connection-quality",
  },
};

const guide: SeoGuide = {
  eyebrow: "internet connection quality",
  title: "Internet connection quality",
  intro:
    "Internet connection quality is more than throughput. Bufferbloat.org measures whether latency / ping stays stable while download and upload traffic are active, then explains what that means for everyday use.",
  calloutLabel: "real-world quality check",
  calloutTitle: "Measure how the connection behaves while it is busy.",
  calloutBody:
    "Run the bufferbloat test to get a scorecard with quiet-line ping, loaded ping, latency spread, throughput, and application performance estimates.",
  cards: [
    {
      label: "Throughput",
      title: "How much data moves",
      body:
        "Mbps matters for large downloads and high-resolution streaming, but it is not the whole story.",
    },
    {
      label: "Latency",
      title: "How quickly it responds",
      body:
        "Ping shows response time. Testing it under load shows whether the line stays usable in real conditions.",
    },
    {
      label: "Spread",
      title: "How consistent it feels",
      body:
        "Large latency spread can make calls, games, and interactive work feel uneven even when averages look acceptable.",
    },
  ],
  notes: [
    {
      title: "A better question than fast or slow",
      body: [
        "A connection can be fast for downloads and still poor for interactive use. The practical question is whether it stays responsive while traffic is active.",
        "That is the quality signal Bufferbloat.org is designed to expose.",
      ],
    },
    {
      title: "What the scorecard includes",
      body: [
        "The result combines a simple grade with a measured latency trace and exportable technical details.",
        "That keeps the page useful for non-technical users while still being inspectable for engineers, researchers, and journalists.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
    { href: "/learn/network-stability-test", label: "Network stability test" },
    { href: "/learn/bufferbloat-speed-test", label: "Bufferbloat speed test" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
