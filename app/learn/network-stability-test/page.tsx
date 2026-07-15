import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Network Stability Test",
  description:
    "Run a network stability test that checks whether latency and ping stay steady while download and upload traffic are active.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/network-stability-test",
  },
  openGraph: {
    title: "Network Stability Test",
    description:
      "Check whether your network stays stable under real download and upload load.",
    url: "https://bufferbloat.org/learn/network-stability-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "network stability test",
  title: "Network stability test",
  intro:
    "A network stability test should show whether the connection keeps responding when the line is busy. Bufferbloat.org measures quiet ping, then compares it with ping during download and upload load.",
  calloutLabel: "stability under load",
  calloutTitle: "Measure whether the network stays steady when traffic starts.",
  calloutBody:
    "The browser test produces a scorecard with quiet-line ping, loaded ping, throughput, latency variation, and a bufferbloat grade.",
  cards: [
    {
      label: "01",
      title: "Quiet-line ping",
      body:
        "The test first measures the normal response time of the connection before adding load.",
    },
    {
      label: "02",
      title: "Download load",
      body:
        "Then it checks whether latency rises while the downstream path is busy receiving data.",
    },
    {
      label: "03",
      title: "Upload load",
      body:
        "Finally it checks the upstream path, where many home networks show the strongest bufferbloat symptoms.",
    },
  ],
  notes: [
    {
      title: "Stability is not the same as speed",
      body: [
        "A connection can have good throughput and still feel unstable if latency jumps whenever the line is busy.",
        "This test focuses on the part users feel during calls, games, browsing, and shared household use: whether ping stays close to normal under pressure.",
      ],
    },
    {
      title: "Why repeatable measurements matter",
      body: [
        "Network conditions vary during the day, and browser tests can be noisy. If a result looks surprising, run it again with VPNs disabled and other traffic paused.",
        "The technical-details export keeps the samples inspectable so the result is more than a black-box score.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-stability-test", label: "Internet stability test" },
    { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
    { href: "/docs", label: "Measurement methodology" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
