import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <p className="eyebrow">bufferbloat.org</p>

      <h1 className="page-title">
        Fast internet can still feel bad.
      </h1>

      <p className="page-copy">
        Most speed tests tell you how much data your connection can move. This test checks whether it still responds quickly while busy.
      </p>

      <div className="mt-8">
        <Link
          href="/test"
          className="inline-block border border-black px-5 py-3 font-mono transition hover:bg-black hover:text-white"
        >
          Run the test
        </Link>
      </div>

      <div className="terminal-card">
        <div className="grid gap-3">
          <ExplainerRow
            step="1"
            condition="Quiet connection"
            what="Measure baseline latency before adding traffic."
          />

          <ExplainerRow
            step="2"
            condition="During download"
            what="Check if response time stays stable while receiving data."
          />

          <ExplainerRow
            step="3"
            condition="During upload"
            what="Check if response time spikes while sending data."
          />
        </div>
      </div>

      <section className="terminal-card">
        <p className="mb-3 font-mono text-sm text-neutral-500">
          why speed alone is misleading
        </p>

        <p className="text-neutral-700">
          Speed is how much data moves. Latency is how quickly your connection reacts. Bufferbloat happens when latency rises sharply while the connection is busy, making calls freeze, games lag, and pages hang even on a fast line.
        </p>
      </section>

      <section className="terminal-card">
        <p className="mb-3 font-mono text-sm text-neutral-500">
          what this test measures
        </p>

        <p className="text-neutral-700">
          The test compares latency when the connection is quiet with latency during heavy download and upload traffic. It also shows measured throughput so the result does not hide the usual speed number.
        </p>
      </section>
    </main>
  );
}

function ExplainerRow({
  step,
  condition,
  what,
}: {
  step: string;
  condition: string;
  what: string;
}) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-4 border border-neutral-200 p-4 md:grid-cols-[36px_180px_1fr]">
      <div className="font-mono text-sm text-neutral-500">
        {step}
      </div>

      <div className="font-mono text-sm">
        {condition}
      </div>

      <div className="text-sm text-neutral-600">
        {what}
      </div>
    </div>
  );
}
