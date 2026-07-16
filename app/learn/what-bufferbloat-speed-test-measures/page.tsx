import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What a Bufferbloat Speed Test Measures",
  description:
    "A plain-language guide to the signals measured by Bufferbloat.org: throughput, quiet ping, loaded ping, and latency spread.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/what-bufferbloat-speed-test-measures",
  },
  openGraph: {
    title: "What a Bufferbloat Speed Test Measures",
    description:
      "Learn what the Bufferbloat.org test measures and why each signal matters for real-world connection quality.",
    url: "https://bufferbloat.org/learn/what-bufferbloat-speed-test-measures",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">measurement guide</p>

      <h1 className="page-title compact">
        What a bufferbloat speed test measures
      </h1>

      <p className="page-copy">
        Bufferbloat.org measures the pieces that need to be seen together:
        capacity, normal delay, delay while the line is busy, and how much that
        delay moves around.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>Free, open source, no ads.</span>
      </div>

      <section className="resource-note">
        <h2>The short version</h2>
        <p>
          A throughput-only speed test tells you how much data can move. A
          quiet ping test tells you how quickly the connection responds when it
          is not under pressure. A bufferbloat test asks the more useful
          question: does the connection still respond quickly when download and
          upload traffic are active?
        </p>
      </section>

      <section className="resource-note">
        <h2>The signals in the scorecard</h2>

        <ul className="resource-measure-list">
          <li>
            <strong>Download throughput</strong>
            <span>
              how much data the connection can receive during the download load
              phase.
            </span>
          </li>
          <li>
            <strong>Upload throughput</strong>
            <span>
              how much data the connection can send during the upload load
              phase.
            </span>
          </li>
          <li>
            <strong>Quiet-line latency / ping</strong>
            <span>
              the normal response time before the test adds download or upload
              traffic.
            </span>
          </li>
          <li>
            <strong>Latency during download load</strong>
            <span>
              response time while the browser is receiving data and the
              downstream path is busy.
            </span>
          </li>
          <li>
            <strong>Latency during upload load</strong>
            <span>
              response time while the browser is sending data and the upstream
              path is busy.
            </span>
          </li>
          <li>
            <strong>Latency spread</strong>
            <span>
              the 95th percentile ping minus the median ping during each phase.
              This is a practical upper-spread signal related to jitter.
            </span>
          </li>
        </ul>
      </section>

      <section className="resource-note">
        <h2>What turns those numbers into a bufferbloat result</h2>
        <p>
          The core bufferbloat signal is the difference between quiet-line
          latency and loaded latency. If ping stays close to normal while the
          test is downloading and uploading, the connection is behaving well
          under pressure. If ping rises sharply, queues are probably adding
          delay.
        </p>

        <p>
          Throughput still matters for some uses, especially streaming and large
          transfers, but low throughput alone is not bufferbloat. A slower
          connection can still feel good if latency stays stable. A fast
          connection can feel bad if latency jumps whenever the line is busy.
        </p>
      </section>

      <section className="resource-note">
        <h2>Why latency spread is included</h2>
        <p>
          Two connections can have the same median ping and still feel
          different. The one with a lower upper-end spread is usually easier for
          calls, games, and remote work to handle. That is why the scorecard
          includes latency spread as a supporting signal for application
          performance.
        </p>

        <p>
          Bufferbloat.org uses the plain term latency spread because browser
          tests and network tools may calculate jitter differently. The current
          method uses 95th percentile ping minus median ping so the scorecard
          captures bad-but-representative moments without treating one isolated
          spike as the whole result.
        </p>
      </section>

      <section className="resource-note">
        <h2>What this test does not measure</h2>
        <p>
          This is a short browser test, not a full network audit. It does not
          prove long-term uptime, diagnose Wi-Fi interference by itself, map
          every ISP routing problem, or replace sustained packet-loss testing.
          If a result looks surprising, run the test again and compare.
        </p>
      </section>

      <div className="resource-links">
        <Link href="/learn/bufferbloat-speed-test">
          Bufferbloat speed test
        </Link>
        <Link href="/learn/latency-under-load">
          Latency under load
        </Link>
        <Link href="/learn/latency-spread-vs-jitter">
          Why we don’t show jitter
        </Link>
        <Link href="/docs">Measurement methodology</Link>
      </div>
    </main>
  );
}
