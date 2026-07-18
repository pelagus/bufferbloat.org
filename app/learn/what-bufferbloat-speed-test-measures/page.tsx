import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What a Bufferbloat Speed Test Measures",
  description:
    "A plain-language guide to the signals measured by Bufferbloat.org: throughput, quiet-line ping, loaded ping, and p95 spread.",
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
        A speed test usually tells you how much data can move. A bufferbloat
        test asks the next question: does the connection stay usable while that
        data is moving? Bufferbloat.org measures capacity, quiet-line delay,
        delay while the line is busy, and how far the high-delay samples move
        away from normal.
      </p>

      <div className="resource-top-action">
        <Link href="/test">Run the bufferbloat test</Link>
        <span>Free, open source, no ads.</span>
      </div>

      <section className="resource-note">
        <h2>The short version</h2>
        <p>
          A throughput-only speed test can say the line is large. A quiet ping
          test can say the line is quick when almost nothing is happening. A
          bufferbloat test checks the behavior people actually feel: whether the
          connection keeps responding while download and upload traffic are
          active.
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
            <strong>P95 spread</strong>
            <span>
              the 95th percentile ping minus the median ping during each phase.
              This is the upper-delay spread shown on the scorecard instead of
              a generic jitter number.
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
        <h2>Why p95 spread is included</h2>
        <p>
          Two connections can have the same median ping and still feel
          different. The one with a lower upper-end spread is usually easier for
          calls, games, and remote work to handle. That is why the scorecard
          includes p95 spread as a supporting signal for application
          performance.
        </p>

        <p>
          Bufferbloat.org uses the plain term latency spread because browser
          tests and network tools may calculate jitter differently. The current
          method uses 95th percentile ping minus median ping so the scorecard
          captures bad-but-representative moments without treating one isolated
          spike as the whole result. The reasoning is explained in{" "}
          <Link href="/learn/latency-spread-vs-jitter">
            why we use latency spread, not jitter
          </Link>
          .
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

      <section className="resource-note">
        <h2>Why the test is open</h2>
        <p>
          Bufferbloat is easy to miss because it can hide behind good-looking
          speed-test numbers. A test built to expose it should be inspectable:
          the code, methodology, and limitations should be public so the result
          can be checked, debated, and improved.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>try the measurement</span>
          <h2>See what happens when your own line gets busy.</h2>
          <p>
            Run the browser test to compare quiet-line ping with download and
            upload load. The scorecard shows the measured trace, application
            performance, and exportable technical details.
          </p>

          <div className="guide-test-actions">
            <Link href="/test" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/learn/technical-details-export" className="guide-secondary-action">
              Inspect and export the data
            </Link>
          </div>
        </div>
      </section>

      <section className="resource-related" aria-label="Continue reading">
        <p className="eyebrow">continue reading</p>
        <h2>Useful next guides</h2>
        <p>
          These pages explain the two measurement choices that make the
          scorecard less fragile than a single average or worst-case number.
        </p>

        <div className="resource-links">
        <Link href="/learn/latency-under-load">
          Latency under load
        </Link>
        <Link href="/learn/latency-spread-vs-jitter">
          Why we use latency spread, not jitter
        </Link>
        <Link href="/learn/median-ping-vs-average-ping">
          Why we use median ping
        </Link>
        <Link href="/docs">Measurement methodology</Link>
        </div>
      </section>
    </main>
  );
}
