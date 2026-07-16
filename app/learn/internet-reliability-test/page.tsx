import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Internet Reliability Test",
  description:
    "Discover bufferbloat, the hidden latency problem that can make a fast internet connection feel unreliable under load.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-reliability-test",
  },
  openGraph: {
    title: "Internet Reliability Test",
    description:
      "Find the hidden latency problem ordinary speed tests often miss.",
    url: "https://bufferbloat.org/learn/internet-reliability-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "internet reliability test",
  title: "Internet reliability test",
  intro:
    "I built Bufferbloat.org because I kept running into a simple question existing tools did not answer well: why can an internet connection still feel unstable when ordinary speed tests say it is fast? The search started with the elusive problem of bufferbloat, where latency rises only when the connection is busy, and grew into a free, open-source test for judging the real quality of an internet connection.",
  calloutLabel: "find hidden delay",
  calloutTitle: "Run a browser-based bufferbloat test.",
  calloutBody:
    "The test compares normal ping with ping while download and upload load are active. It is free and open source because this kind of internet measurement should be inspectable.",
  cards: [
    {
      label: "1",
      title: "Speed tests miss the queue",
      body:
        "Megabits per second tell you how much data can move. They usually do not show whether packets are waiting in a long queue before they move.",
    },
    {
      label: "2",
      title: "Quiet ping can look fine",
      body:
        "A basic ping test measures the connection when little else is happening. Bufferbloat often appears only after the connection becomes busy.",
    },
    {
      label: "3",
      title: "Loaded ping reveals it",
      body:
        "The useful question is whether ping stays close to normal while download or upload traffic is active. If it jumps, the line may feel unreliable even though it is fast.",
    },
  ],
  notes: [
    {
      title: "What bufferbloat is",
      body: [
        "Bufferbloat is extra delay caused by traffic sitting in oversized network queues. It is not the same thing as a slow connection. It is a responsiveness problem that shows up when the connection is under pressure.",
        "That is why it surprises people: the connection can report strong throughput and a good quiet ping, but still make calls, games, or websites feel delayed when something else is using the line.",
      ],
    },
    {
      title: "Why speed tests often miss it",
      body: [
        "A normal speed test is mostly a throughput test. It can say the pipe is large without telling you whether the pipe stays responsive while it is full.",
        "A simple ping test is useful, but only as a baseline. To reveal bufferbloat, you need to keep measuring ping while the connection is busy downloading and uploading.",
      ],
    },
    {
      title: "How this test looks for it",
      body: [
        "Bufferbloat.org first measures quiet-line ping. Then it adds download load and upload load while continuing to sample ping. The important result is the added delay under load.",
        "This does not prove the exact device causing the problem, and it is not an uptime or packet-loss diagnostic. It answers the practical reliability question most people actually feel: does the connection stay responsive when real traffic is active?",
      ],
    },
  ],
  related: [
    {
      href: "/learn/bufferbloat-speed-test",
      label: "Why fast internet can still feel slow",
    },
    {
      href: "/learn/latency-under-load",
      label: "What latency under load means",
    },
    {
      href: "/learn/internet-connection-quality",
      label: "How to judge connection quality",
    },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
