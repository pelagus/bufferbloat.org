import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Calls Internet Test",
  description:
    "Run a calls internet test that checks whether ping stays stable during download and upload load, the condition that affects video and audio calls.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/calls-internet-test",
  },
  openGraph: {
    title: "Calls Internet Test",
    description:
      "Check whether your internet connection is likely to stay reliable for video and audio calls under load.",
    url: "https://bufferbloat.org/learn/calls-internet-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "calls internet test",
  title: "Calls internet test",
  intro:
    "A connection can have enough megabits per second for calls and still feel delayed, choppy, or unstable. Bufferbloat.org tests the latency behavior that matters when calls share the connection with downloads and uploads.",
  calloutLabel: "video and audio calls",
  calloutTitle: "Check whether calls stay usable when the connection is busy.",
  calloutBody:
    "Run the browser test to see quiet ping, ping during download load, ping during upload load, and an application performance estimate for calls.",
  cards: [
    {
      label: "Video calls",
      title: "Delay and turn-taking",
      body:
        "Calls suffer when ping rises under load, because speech and video packets wait behind bulk traffic.",
    },
    {
      label: "Audio calls",
      title: "Stable response time",
      body:
        "Audio can use little bandwidth, but it still needs stable latency and low variation to avoid awkward pauses.",
    },
    {
      label: "Shared networks",
      title: "Busy-line behavior",
      body:
        "The important question is not only whether a call works alone, but whether it works while other devices are active.",
    },
  ],
  notes: [
    {
      title: "Why calls can fail on a fast connection",
      body: [
        "Throughput measures capacity. Calls depend heavily on timely delivery. When upload or download queues fill, packets can be delayed even though the connection still has high speed-test numbers.",
        "The bufferbloat signal is the increase in latency while traffic is active.",
      ],
    },
    {
      title: "What the result tells you",
      body: [
        "The scorecard ranks application performance and shows the measured latency trace, so you can see whether the line stayed close to normal or became unstable under pressure.",
        "For calls, the most important signals are loaded latency and latency variation, not only download speed.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-reliability-test", label: "Internet reliability test" },
    { href: "/learn/latency-under-load", label: "Latency under load" },
    { href: "/learn/network-stability-test", label: "Network stability test" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
