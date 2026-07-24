import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Test Internet Reliability: Speed, Latency, and Bufferbloat",
  },
  description:
    "Run the open-source internet reliability test for speed, latency, and bufferbloat. This internet stability test and internet quality test measures latency under download and upload load.",
  alternates: {
    canonical: "https://bufferbloat.org/test",
  },
  openGraph: {
    title: "Test Internet Reliability: Speed, Latency, and Bufferbloat",
    description:
      "Measure whether your internet connection stays stable and reliable while download and upload traffic are active.",
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
