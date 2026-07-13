import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Latency Under Load",
  description:
    "Latency under load explains whether ping stays low while download or upload traffic is active. It is the core signal behind the Bufferbloat.org test.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/latency-under-load",
  },
  openGraph: {
    title: "Latency Under Load",
    description:
      "Learn why idle ping is incomplete and why loaded latency matters for internet reliability.",
    url: "https://bufferbloat.org/learn/latency-under-load",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">technical guide</p>

      <h1 className="page-title compact">Latency under load</h1>

      <p className="page-copy">
        Latency under load measures whether a connection keeps answering
        quickly while it is also moving data. It is the difference between a
        connection that is merely fast and one that remains reliable when busy.
      </p>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>turn the concept into a measurement</span>
          <h2>See your own latency under load.</h2>
          <p>
            Bufferbloat.org compares normal latency / ping with latency during
            download and upload pressure, then shows the medians and chart used
            for the grade.
          </p>

          <div className="guide-test-actions">
            <Link href="/test" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs" className="guide-secondary-action">
              Inspect methodology
            </Link>
          </div>
        </div>

        <div className="guide-test-micro" aria-hidden="true">
          <div>
            <span>normal</span>
            <strong>ping</strong>
            <em>before traffic</em>
          </div>
          <div>
            <span>download</span>
            <strong>load</strong>
            <em>receive pressure</em>
          </div>
          <div>
            <span>upload</span>
            <strong>load</strong>
            <em>send pressure</em>
          </div>
        </div>
      </section>

      <section className="resource-note">
        <h2>What it means</h2>
        <p>
          Latency is the time it takes for a small request to travel out and
          receive a response. Most people call this ping. A connection can have
          good idle ping when nothing else is happening, then become much slower
          as soon as a download, upload, backup, or video stream fills the line.
        </p>

        <p>
          That loaded condition is where bufferbloat appears. Packets wait in
          oversized queues, so calls, games, remote desktops, and web pages feel
          delayed even when bandwidth still looks high.
        </p>
      </section>

      <section className="resource-grid">
        <article>
          <span>01</span>
          <h2>Quiet ping</h2>
          <p>
            The baseline. This is the latency / ping before the test adds
            intentional download or upload traffic.
          </p>
        </article>

        <article>
          <span>02</span>
          <h2>Download load</h2>
          <p>
            The test downloads data and checks whether latency rises while the
            downstream path is busy.
          </p>
        </article>

        <article>
          <span>03</span>
          <h2>Upload load</h2>
          <p>
            The test uploads data and checks whether latency rises while the
            upstream path is busy, a common weak point on home connections.
          </p>
        </article>
      </section>

      <section className="resource-note">
        <h2>Why a bufferbloat test measures this</h2>
        <p>
          Bufferbloat.org compares quiet latency with download-loaded and
          upload-loaded latency. The score is primarily about how much latency /
          ping moves under stress, not how many megabits per second the
          connection can move.
        </p>

        <p>
          Throughput still matters for some applications, but it answers a
          different question. Latency under load asks whether the network stays
          usable while it is busy.
        </p>

        <div className="resource-links">
          <Link href="/test">Run the bufferbloat test</Link>
          <Link href="/docs">Read the methodology</Link>
          <a
            href="https://github.com/pelagus/bufferbloat.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Inspect the source
          </a>
        </div>
      </section>

      <section className="resource-note">
        <h2>Related guide</h2>
        <p>
          If you arrived here from a speed-test comparison, the next useful
          explanation is why ordinary speed tests can miss bufferbloat.
        </p>

        <div className="resource-links">
          <Link href="/learn/bufferbloat-speed-test">
            Bufferbloat speed test
          </Link>
          <Link href="/learn">Back to Learn</Link>
        </div>
      </section>
    </main>
  );
}
