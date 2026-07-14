import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Internet Latency Test",
  description:
    "Run an internet latency test that checks ping in normal conditions and under download and upload load, so you can see whether the connection stays usable when busy.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-latency-test",
  },
  openGraph: {
    title: "Internet Latency Test",
    description:
      "Measure quiet ping, loaded ping, and bufferbloat behavior with an open-source browser test.",
    url: "https://bufferbloat.org/learn/internet-latency-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "internet latency test",
  title: "Internet latency test",
  intro:
    "An internet latency test should do more than report idle ping. Bufferbloat.org measures ping before traffic is added, then checks whether latency stays stable while download and upload traffic are active.",
  calloutLabel: "browser-based latency test",
  calloutTitle: "Test ping where it matters: while the line is busy.",
  calloutBody:
    "The test normally takes about a minute and produces a shareable scorecard with quiet-line ping, download stress, upload stress, throughput, and technical samples.",
  cards: [
    {
      label: "01",
      title: "Quiet-line ping",
      body:
        "The baseline ping measurement shows how quickly the connection responds before the test adds load.",
    },
    {
      label: "02",
      title: "Download-loaded ping",
      body:
        "The test checks whether latency rises while the downstream path is busy receiving data.",
    },
    {
      label: "03",
      title: "Upload-loaded ping",
      body:
        "The test checks the upstream path too, because uploads are often where home connections develop the most delay.",
    },
  ],
  notes: [
    {
      title: "Why idle ping is not enough",
      body: [
        "A connection can show a low ping while nothing else is happening and still feel bad during video calls, games, backups, or shared household use.",
        "That difference is latency under load. It is the practical measurement behind a useful internet latency test, because it captures whether small interactive packets keep moving while bulk traffic is active.",
      ],
    },
    {
      title: "What the result means",
      body: [
        "Bufferbloat.org does not try to replace laboratory tools. It gives a fast, browser-based view of whether ping stays close to normal during realistic download and upload pressure.",
        "If the loaded latency rises sharply, the connection may feel unreliable even when an ordinary speed test reports good megabits per second.",
      ],
    },
  ],
  related: [
    { href: "/learn/latency-under-load", label: "Latency under load" },
    { href: "/learn/bufferbloat-speed-test", label: "Bufferbloat speed test" },
    { href: "/docs", label: "Measurement methodology" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
