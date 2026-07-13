import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bufferbloat Test",
  description:
    "Run the open-source Bufferbloat.org test to measure latency under load, ping stability, download stress, upload stress, and internet reliability.",
  alternates: {
    canonical: "https://bufferbloat.org/test",
  },
  openGraph: {
    title: "Bufferbloat Test",
    description:
      "Measure whether your internet connection stays reliable while download and upload traffic are active.",
    url: "https://bufferbloat.org/test",
  },
};

export default function TestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
