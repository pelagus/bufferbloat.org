import { SharedResultContent } from "../result/[shareId]/page";
import TestPageClient from "./TestPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Bufferbloat Test",
  description:
    "Run an open-source bufferbloat test to see whether your internet connection stays reliable when download and upload traffic are active.",
  alternates: {
    canonical: "https://bufferbloat.org/test",
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
