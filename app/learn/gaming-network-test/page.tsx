import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Gaming Network Test",
  description:
    "Run a gaming network test that checks ping stability, latency under load, and bufferbloat behavior while download and upload traffic are active.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/gaming-network-test",
  },
  openGraph: {
    title: "Gaming Network Test",
    description:
      "Check whether your connection stays responsive enough for low-latency games when the line is busy.",
    url: "https://bufferbloat.org/learn/gaming-network-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "gaming network test",
  title: "Gaming network test",
  intro:
    "Online games are sensitive to latency and latency spread. Bufferbloat.org checks whether ping stays stable when download and upload traffic are active, instead of only measuring idle ping.",
  calloutLabel: "low-latency games",
  calloutTitle: "Check whether load makes your ping jump.",
  calloutBody:
    "Run the test to see quiet-line ping, loaded ping, latency spread, and an application performance estimate for low-latency games.",
  cards: [
    {
      label: "Ping",
      title: "Baseline delay",
      body:
        "A low quiet-line ping helps games feel immediate, but it does not guarantee the line stays stable.",
    },
    {
      label: "Load",
      title: "Bufferbloat spikes",
      body:
        "Games can suffer when downloads, uploads, or other devices make packets wait in queues.",
    },
    {
      label: "Spread",
      title: "Consistency matters",
      body:
        "Even when average ping looks acceptable, a large latency spread can make movement and hit registration feel uneven.",
    },
  ],
  notes: [
    {
      title: "Why gaming tests should include load",
      body: [
        "A game rarely has the whole connection to itself. Other devices, background downloads, updates, and uploads can create queueing delay.",
        "This test measures whether the connection stays responsive during that pressure.",
      ],
    },
    {
      title: "What this test cannot know",
      body: [
        "The browser cannot test the route to a specific game server. It can test the local connection behavior that often explains lag on otherwise fast connections.",
        "For a full diagnosis, combine this result with in-game ping to the actual server region.",
      ],
    },
  ],
  related: [
    { href: "/learn/internet-latency-test", label: "Internet latency test" },
    { href: "/learn/network-stability-test", label: "Network stability test" },
    { href: "/learn/latency-under-load", label: "Latency under load" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
