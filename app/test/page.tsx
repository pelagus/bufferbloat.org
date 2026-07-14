import { SharedResultContent } from "../result/[shareId]/page";
import TestPageClient from "./TestPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string | string[]; start?: string | string[] }>;
}) {
  const params = await searchParams;
  const result = Array.isArray(params.result) ? params.result[0] : params.result;

  if (result && /^[a-f0-9]{18}$/i.test(result)) {
    return <SharedResultContent shareId={result} />;
  }

  return <TestPageClient />;
}
