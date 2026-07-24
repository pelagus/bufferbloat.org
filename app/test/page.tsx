import type { Metadata } from "next";
import { SharedResultContent } from "../result/[shareId]/page";
import TestPageClient from "./TestPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: {
    absolute: "Test Internet Reliability: Speed, Latency, and Bufferbloat",
  },
  description:
    "Run a free internet reliability test for speed, latency, and bufferbloat. This browser-based internet stability test and internet quality test shows whether ping stays stable under download and upload load.",
  alternates: {
    canonical: "https://bufferbloat.org/test",
  },
  openGraph: {
    title: "Test Internet Reliability: Speed, Latency, and Bufferbloat",
    description:
      "Run a free internet reliability test for speed, latency, and bufferbloat. See whether ping stays stable under download and upload load.",
    url: "https://bufferbloat.org/test",
  },
};

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string | string[]; start?: string | string[] }>;
}) {
  const params = await searchParams;
  const result = Array.isArray(params.result) ? params.result[0] : params.result;
  const start = Array.isArray(params.start) ? params.start[0] : params.start;

  if (result && /^[a-f0-9]{18}$/i.test(result)) {
    return <SharedResultContent shareId={result} />;
  }

  return <TestPageClient autoStart={start === "1"} />;
}
