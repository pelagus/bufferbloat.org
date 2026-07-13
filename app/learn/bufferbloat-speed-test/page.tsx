import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bufferbloat Speed Test",
  description:
    "A bufferbloat speed test measures whether latency and ping stay stable while a connection is busy, not just peak download or upload throughput.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/bufferbloat-speed-test",
  },
  openGraph: {
    title: "Bufferbloat Speed Test",
    description:
      "Learn why a normal speed test can look fast while the connection still feels laggy under load.",
    url: "https://bufferbloat.org/learn/bufferbloat-speed-test",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">speed-test comparison</p>

      <h1 className="page-title compact">Bufferbloat speed test</h1>

      <p className="page-copy">
        A normal speed test tells you how much data your connection can move. A
        bufferbloat test asks a different question: does latency / ping stay
        stable while the connection is busy?
      </p>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>speed is only half the story</span>
          <h2>Run the test ordinary speed tests miss.</h2>
          <p>
            Measure quiet ping, ping under download load, ping under upload
            load, and throughput in one browser-based report.
          </p>

          <div className="guide-test-actions">
            <Link href="/test" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/learn/latency-under-load" className="guide-secondary-action">
              Learn the metric
            </Link>
          </div>
        </div>

        <div className="guide-test-micro" aria-hidden="true">
          <div>
            <span>speed</span>
            <strong>Mbps</strong>
            <em>throughput</em>
          </div>
          <div>
            <span>ping</span>
            <strong>ms</strong>
            <em>idle latency</em>
          </div>
          <div>
            <span>load</span>
            <strong>+ms</strong>
            <em>bufferbloat</em>
          </div>
        </div>
      </section>

      <section className="resource-note">
        <h2>Why speed alone is incomplete</h2>
        <p>
          Download and upload speed are throughput measurements. They are
          useful, but they do not fully explain internet reliability. A
          connection can report hundreds of megabits per second while video
          calls freeze, games feel delayed, and websites hesitate whenever other
          traffic is active.
        </p>

        <p>
          That gap is often latency under load. The connection still has
          capacity, but packets spend too long waiting in queues before they are
          transmitted.
        </p>
      </section>

      <section className="resource-grid">
        <article>
          <span>Speed test</span>
          <h2>Throughput</h2>
          <p>
            Measures peak download and upload rates. Useful for large files,
            streaming capacity, and plan verification.
          </p>
        </article>

        <article>
          <span>Ping test</span>
          <h2>Idle latency</h2>
          <p>
            Measures response time while the connection is quiet. Useful, but
            incomplete when the real problem appears only under load.
          </p>
        </article>

        <article>
          <span>Bufferbloat test</span>
          <h2>Loaded latency</h2>
          <p>
            Measures whether latency / ping rises during download and upload
            pressure. This is the practical signal for bufferbloat.
          </p>
        </article>
      </section>

      <section className="resource-note">
        <h2>What Bufferbloat.org reports</h2>
        <p>
          Bufferbloat.org records quiet latency, download-loaded latency,
          upload-loaded latency, download throughput, upload throughput, and a
          bufferbloat grade. The result separates the raw measurement from the
          interpretation so the method can be inspected.
        </p>

        <p>
          The test runs in the browser, normally takes less than a minute, and
          exposes a technical-details table that can be exported as CSV.
        </p>

        <div className="resource-links">
          <Link href="/test">Run the bufferbloat test</Link>
          <Link href="/learn/latency-under-load">
            Learn about latency under load
          </Link>
          <Link href="/docs">Read the methodology</Link>
        </div>
      </section>

      <section className="resource-note">
        <h2>When to use it</h2>
        <p>
          Run a bufferbloat test when the connection looks fast on paper but
          feels unreliable during calls, games, uploads, cloud backups, or
          shared household use.
        </p>

        <div className="resource-links">
          <Link href="/learn">Back to Learn</Link>
          <a
            href="https://github.com/pelagus/bufferbloat.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Inspect the source
          </a>
        </div>
      </section>
    </main>
  );
}
