import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Zoom Network Test",
  description:
    "Run an independent Zoom network test for the latency-under-load behavior that affects video meetings when a connection is busy.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/zoom-network-test",
  },
  openGraph: {
    title: "Zoom Network Test",
    description:
      "Measure whether your connection stays responsive enough for video meetings while download and upload traffic are active.",
    url: "https://bufferbloat.org/learn/zoom-network-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "zoom network test",
  title: "Zoom network test",
  intro:
    "Video meetings need more than raw speed. This independent test checks whether latency / ping stays stable when the connection is busy, which is one reason meetings can lag even on a fast-looking line.",
  calloutLabel: "independent browser test",
  calloutTitle: "Measure the network behavior that affects video meetings.",
  calloutBody:
    "Bufferbloat.org is not affiliated with Zoom. It measures quiet ping, loaded ping, throughput, and latency variation so you can see whether the line stays usable during meeting-like conditions.",
  cards: [
    {
      label: "Latency",
      title: "Conversation delay",
      body:
        "When latency rises, people talk over each other and screen sharing can feel delayed.",
    },
    {
      label: "Upload",
      title: "Your outbound video",
      body:
        "Video meetings depend on upload too. A busy upstream path can make the whole connection feel laggy.",
    },
    {
      label: "Load",
      title: "Other traffic matters",
      body:
        "A meeting may work alone but degrade when someone else starts a download, backup, or stream.",
    },
  ],
  notes: [
    {
      title: "Why this is not a vendor status check",
      body: [
        "This page does not test Zoom servers or diagnose a Zoom account. It tests your local connection behavior under load.",
        "That is useful because many meeting problems come from latency and queueing on the access connection, router, Wi-Fi, or upstream path.",
      ],
    },
    {
      title: "How to interpret the score",
      body: [
        "A good result means ping stayed close to normal while download and upload traffic were active. A poor result suggests bufferbloat or unstable local network behavior.",
        "Repeat the test with VPN disabled and other activity paused if the result is unexpectedly bad.",
      ],
    },
  ],
  related: [
    { href: "/learn/zoom-internet-test", label: "Zoom internet test" },
    { href: "/learn/calls-internet-test", label: "Calls internet test" },
    { href: "/docs", label: "Measurement methodology" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
