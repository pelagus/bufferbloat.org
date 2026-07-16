import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Bufferbloat Speed Test - A More Complete Speed Test",
  description:
    "A bufferbloat speed test measures throughput, quiet ping, loaded ping, and latency spread so you can judge whether a connection stays usable in real life.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/bufferbloat-speed-test",
  },
  openGraph: {
    title:
      "Bufferbloat Speed Test - A More Complete Speed Test",
    description:
      "Learn why a useful speed test should measure throughput, ping, loaded latency, and latency spread.",
    url: "https://bufferbloat.org/learn/bufferbloat-speed-test",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">bufferbloat test</p>

      <h1 className="page-title compact">Bufferbloat speed test</h1>

      <p className="page-copy">
        A useful speed test should do more than report how much data can move.
        Bufferbloat.org also checks whether the connection stays usable while
        download and upload traffic are active.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>Free, open source, no ads.</span>
      </div>

      <section className="resource-note">
        <h2>The frustrating gap in ordinary speed tests</h2>
        <p>
          Most people do not care about networking terminology. They care that
          the call freezes, the game lags, or the whole connection starts to
          feel heavy the moment somebody uploads, downloads, or backs something
          up. Ordinary speed tests can miss that because they mostly answer one
          capacity question: how much data can move right now?
        </p>
      </section>

      <section className="resource-note">
        <h2>A broader connection-quality test</h2>
        <p>
          A standard speed test measures throughput: how many megabits per
          second your connection can push through. It is a real number and it
          matters, especially for big downloads or 4K streaming. But throughput
          answers &ldquo;how much can this line carry,&rdquo; not
          &ldquo;does this line stay usable while it is carrying something.&rdquo;
        </p>

        <p>
          Bufferbloat.org keeps that throughput information, then adds the
          missing signals: quiet-line ping, loaded ping during download,
          loaded ping during upload, and latency spread. For judging the
          quality of a connection in real life, that makes it a more complete
          replacement for a throughput-only speed test.
        </p>

        <p>
          Bufferbloat is the hidden failure this exposes: delay caused by
          packets waiting in queues when the connection is busy. It is invisible
          to a test that only cares about peak throughput or quiet-line ping.
        </p>
      </section>

      <section className="resource-note">
        <h2>What a bufferbloat speed test actually measures</h2>
        <p>
          The scorecard brings together throughput, quiet-line ping, loaded
          ping during download and upload, and latency spread. Those signals
          answer the practical question a speed test should answer: does this
          connection stay usable when it is busy?
        </p>
        <p>
          For the full breakdown of each value, read{" "}
          <Link href="/learn/what-bufferbloat-speed-test-measures">
            what a bufferbloat speed test measures
          </Link>
          .
        </p>
      </section>

      <section className="resource-note">
        <h2>How the test runs</h2>
        <p>
          The test measures your quiet-line ping first, then loads the
          connection with download traffic while continuing to sample latency,
          then does the same with upload traffic. Each phase gets compared back
          to the quiet baseline. The difference, meaning how much extra delay
          showed up once the line got busy, is the core signal.
        </p>

        <p>
          The whole thing runs in your browser and normally finishes in under a
          minute. It is not laboratory-grade. Browser-based measurement is
          affected by your device, Wi-Fi, background apps, and plain network
          noise. If a result looks unexpectedly bad, or unexpectedly perfect,
          run it again before drawing conclusions.
        </p>
      </section>

      <section className="resource-note">
        <h2>Reading your result</h2>
        <p>
          A good result means ping barely moved between quiet, download, and
          upload phases. The connection kept its composure under load. A poor
          result means latency jumped once traffic started flowing, which is a
          strong sign that calls, games, or anything else needing quick, steady
          responses will suffer whenever the line is busy, even if the
          throughput number still looks great.
        </p>

        <p>
          Latency spread matters too. Two connections can have the same
          median ping, but the one with a smaller gap between its median ping
          and its 95th percentile ping usually feels more stable for calls,
          games, and remote work.
        </p>

        <p>
          For the cleanest run: keep the tab open and visible, pause other big
          downloads or backups if you can, and turn off a VPN if you want to see
          the raw connection rather than the VPN&apos;s.
        </p>
      </section>

      <section className="resource-note">
        <h2>Why this page points to an open test</h2>
        <p>
          Bufferbloat is easy to miss precisely because it hides behind
          good-looking throughput numbers. A test built to catch it should not
          be a black box. The code and methodology are public, so anyone can
          check how the numbers are produced, or point out where they are
          wrong.
        </p>

        <p>
          Bufferbloat.org is free and open source, and it will not run ads. If
          it ever needs funding beyond what a small open-source project can
          sustain on its own, that should come from donations, grants,
          sponsorships, or paid tools, not from anything that changes what the
          test measures, how the methodology works, or what happens to your
          results.
        </p>
      </section>

      <section className="resource-note">
        <h2>A small origin note</h2>
        <p>
          Bufferbloat.org exists because this kind of measurement should exist.
          Internet connection quality is too important to be left to opaque and
          gimmicky speed tests, and something as basic as checking the quality
          of a connection should be free, transparent, and accessible to
          everyone.
          The project started with the hidden problem of bufferbloat and is
          meant to stay inspectable as the test improves.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>see it on your own connection</span>
          <h2>
            Judge connection quality, not just the headline speed number.
          </h2>
          <p>
            Run the test, watch what happens to ping the moment download and
            upload load kick in, and decide whether your line stays usable
            under real pressure.
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

      <div className="resource-links">
        <Link href="/learn/latency-under-load">
          Learn about latency under load
        </Link>
        <Link href="/learn/what-bufferbloat-speed-test-measures">
          What the test measures
        </Link>
        <Link href="/learn/latency-spread-vs-jitter">
          Why we don’t show jitter
        </Link>
        <Link href="/learn/internet-reliability-test">
          Internet reliability test
        </Link>
        <Link href="/learn">Back to Learn</Link>
        <a
          href="https://github.com/pelagus/bufferbloat.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Inspect the source
        </a>
      </div>
    </main>
  );
}
