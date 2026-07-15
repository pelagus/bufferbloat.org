import type { Metadata } from "next";
import { SeoLandingPage, type SeoGuide } from "../seo-pages";

export const metadata: Metadata = {
  title: "Zoom Internet Test",
  description:
    "Run an independent Zoom internet test that measures latency under load, upload behavior, and connection stability for video meetings.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/zoom-internet-test",
  },
  openGraph: {
    title: "Zoom Internet Test",
    description:
      "Check whether your internet connection is stable enough for video meetings when the line is busy.",
    url: "https://bufferbloat.org/learn/zoom-internet-test",
  },
};

const guide: SeoGuide = {
  eyebrow: "zoom internet test",
  title: "Zoom internet test",
  intro:
    "If video meetings lag while ordinary speed tests look fine, the missing signal is often latency under load. Bufferbloat.org independently measures whether your internet connection stays responsive during download and upload pressure.",
  calloutLabel: "meeting-quality signal",
  calloutTitle: "Test the connection behavior that ordinary speed tests miss.",
  calloutBody:
    "This is not a Zoom service test and Bufferbloat.org is not affiliated with Zoom. It measures the local connection conditions that affect video meetings in real use.",
  cards: [
    {
      label: "Upload",
      title: "Your camera and audio",
      body:
        "Meetings depend on outbound traffic. Upload congestion can delay audio, video, and screen sharing.",
    },
    {
      label: "Download",
      title: "Other participants",
      body:
        "Download load can also add delay if queueing builds while receiving data.",
    },
    {
      label: "Ping",
      title: "Responsiveness",
      body:
        "Stable ping under load is a better meeting-quality signal than throughput alone.",
    },
  ],
  notes: [
    {
      title: "Why speed tests can miss meeting problems",
      body: [
        "A speed test can report good megabits per second while queues add delay to small interactive packets.",
        "Video meetings care about timely delivery, not just total capacity.",
      ],
    },
    {
      title: "How to run a cleaner test",
      body: [
        "Keep the tab in the foreground, disable VPN if possible, and pause other heavy activity during the run.",
        "If the result looks borderline, test again at another time of day because network performance can vary.",
      ],
    },
  ],
  related: [
    { href: "/learn/zoom-network-test", label: "Zoom network test" },
    { href: "/learn/calls-internet-test", label: "Calls internet test" },
    { href: "/learn/internet-connection-quality", label: "Internet connection quality" },
  ],
};

export default function Page() {
  return <SeoLandingPage guide={guide} />;
}
