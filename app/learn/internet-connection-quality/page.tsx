import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Internet Connection Quality",
  description:
    "Internet connection quality is more than speed. Learn what matters for real-life reliability: throughput, ping, bufferbloat, latency under load, and latency spread.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/internet-connection-quality",
  },
  openGraph: {
    title: "Internet Connection Quality",
    description:
      "A practical explanation of what makes an internet connection feel reliable in real life, beyond a single speed-test number.",
    url: "https://bufferbloat.org/learn/internet-connection-quality",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">internet connection quality</p>

      <h1 className="page-title compact">Connection quality is more than speed and ping</h1>

      <p className="page-copy">
        When people ask whether an internet connection is good, they usually get
        one big number back: speed. That number matters, but it does not answer
        the whole question. A connection also needs to respond quickly, stay
        steady, and avoid building up delay when the line is busy. That hidden
        busy-line delay is the problem called bufferbloat.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>Check whether your connection stays usable in real life.</span>
      </div>

      <section className="resource-note">
        <h2>What connection quality means here</h2>
        <p>
          Bufferbloat.org treats connection quality as a combination of four
          signals. The test measures how much data the connection can move, how
          quickly it answers when quiet, how much delay appears during download
          and upload load, and how wide the ping samples spread during the run.
        </p>

        <ul className="resource-measure-list">
          <li>
            <strong>Throughput</strong>
            <span>
              What most people call speed: how much data can move per second.
              It matters for large downloads and high-resolution streaming.
            </span>
          </li>
          <li>
            <strong>Quiet-line ping</strong>
            <span>
              How quickly the connection responds before the test adds heavy
              traffic. Useful, but incomplete on its own.
            </span>
          </li>
          <li>
            <strong>Latency under load</strong>
            <span>
              Whether ping stays close to normal while download or upload
              traffic is active. This is where bufferbloat usually shows up.
            </span>
          </li>
          <li>
            <strong>Latency spread</strong>
            <span>
              How far the upper-delay ping samples move away from the median.
              This helps show whether the line feels steady or uneven.
            </span>
          </li>
        </ul>
      </section>

      <section className="metric-decision-block" aria-labelledby="connection-quality-question">
        <p className="metric-decision-question" id="connection-quality-question">
          <strong>Question:</strong> which measurement best answers whether a
          connection will feel usable during calls, games, browsing, streaming,
          and ordinary household traffic?
        </p>

        <div className="resource-grid metric-choice-grid" aria-label="Connection quality measurement options">
          <article>
            <span>Speed only</span>
            <h2>Useful, but too narrow</h2>
            <p>
              A high Mbps number tells you the line can move data. It does not
              prove small, time-sensitive packets keep moving promptly when the
              connection is already busy.
            </p>
          </article>

          <article>
            <span>Ping only</span>
            <h2>Helpful, but too quiet</h2>
            <p>
              A quiet ping result tells you the connection can answer quickly
              before pressure is added. Many real problems only appear after
              downloads, uploads, backups, or video calls start.
            </p>
          </article>

          <article>
            <span>Loaded quality</span>
            <h2>Best fit for real life</h2>
            <p>
              Measuring ping while the line is busy shows whether bufferbloat is
              adding delay. Adding latency spread helps show whether that delay
              is stable or uneven.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-evidence" aria-label="Internet connection quality evidence">
        <div className="resource-evidence-heading">
          <span>what changes under pressure</span>
          <h2>A good connection does not just look fast when idle</h2>
        </div>

        <div className="resource-evidence-table" role="table" aria-label="Connection quality signals">
          <div role="row" className="resource-evidence-row heading">
            <span role="columnheader">Signal</span>
            <span role="columnheader">What it tells you</span>
            <span role="columnheader">What it misses alone</span>
          </div>
          <div role="row" className="resource-evidence-row">
            <strong role="cell">Throughput</strong>
            <span role="cell">How much data can move through the line</span>
            <span role="cell">Whether delay grows when the line is busy</span>
          </div>
          <div role="row" className="resource-evidence-row">
            <strong role="cell">Quiet ping</strong>
            <span role="cell">How quickly the line responds before load</span>
            <span role="cell">What happens during upload or download pressure</span>
          </div>
          <div role="row" className="resource-evidence-row selected">
            <strong role="cell">Bufferbloat test</strong>
            <span role="cell">Whether the line stays usable under load</span>
            <span role="cell">Browser tests can be noisy, so repeat surprising bad runs</span>
          </div>
        </div>
      </section>

      <section className="resource-note">
        <h2>Why bufferbloat belongs in the definition</h2>
        <p>
          Bufferbloat is not just a speed problem. It happens when traffic piles
          up in queues and adds delay. The connection may still move plenty of
          data, but calls, games, remote work, and browsing can feel late because
          interactive packets wait behind bulk traffic.
        </p>

        <p>
          That is why the scorecard is built around loaded ping, not only the
          number usually shown by speed tests. For the measurement details, read
          <Link href="/learn/what-bufferbloat-speed-test-measures"> what the
          bufferbloat test measures</Link>. For the spread calculation, read
          <Link href="/learn/latency-spread-vs-jitter"> why we use latency
          spread, not jitter</Link>.
        </p>
      </section>

      <section className="resource-note">
        <h2>How to read a result</h2>
        <p>
          A strong result means the line stays responsive while download and
          upload traffic are active. A weaker result does not automatically mean
          the connection is broken. It means the line may be usable for raw data
          transfer but less dependable for time-sensitive work.
        </p>

        <p>
          This is also why the test reports application performance. Video
          streaming, browsing, calls, and low-latency games do not fail for the
          same reasons. Some depend more on throughput; others depend more on
          loaded ping and latency spread.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>measure your connection</span>
          <h2>See whether your internet stays usable when it is busy.</h2>
          <p>
            The bufferbloat test runs in the browser, measures quiet-line ping,
            download load, upload load, throughput, and latency spread, then
            turns the result into a scorecard you can inspect.
          </p>

          <div className="guide-test-actions">
            <Link href="/test?start=1" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs" className="guide-secondary-action">
              Read the methodology
            </Link>
          </div>
        </div>
      </section>

      <section className="resource-related" aria-label="Continue reading">
        <p className="eyebrow">continue reading</p>
        <h2>Useful next guides</h2>
        <div className="resource-links">
          <Link href="/learn/what-bufferbloat-speed-test-measures">
            What the bufferbloat test measures
          </Link>
          <Link href="/learn/latency-under-load">
            Latency under load
          </Link>
          <Link href="/learn/latency-spread-vs-jitter">
            Why we use latency spread, not jitter
          </Link>
          <Link href="/learn/median-ping-vs-average-ping">
            Why we use median ping
          </Link>
          <Link href="/learn">Back to Learn</Link>
        </div>
      </section>
    </main>
  );
}
