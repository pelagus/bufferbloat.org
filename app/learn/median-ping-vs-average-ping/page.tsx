import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why We Use Median Ping, not Average Ping",
  description:
    "Why Bufferbloat.org uses median ping instead of average ping as the center of each measured phase.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/median-ping-vs-average-ping",
  },
  openGraph: {
    title: "Why We Use Median Ping, not Average Ping",
    description:
      "Why median ping is a better baseline than average ping for a browser bufferbloat test.",
    url: "https://bufferbloat.org/learn/median-ping-vs-average-ping",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">measurement guide</p>

      <h1 className="page-title compact">Why We Use Median Ping, not Average Ping</h1>

      <p className="page-copy">
        Bufferbloat.org uses median ping because the test needs a fair center
        for each phase. Average ping is familiar, but it can be pulled around
        by a few unusual samples. Median ping tells us where the connection
        usually was before we judge what happened under load.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>See the quiet-line center and loaded phases on your own connection.</span>
      </div>

      <section className="resource-note">
        <h2>The average answers a different question</h2>
        <p>
          Average ping adds all the ping samples together and divides by the
          number of samples. That can be useful, but it gives every sample the
          same influence. One browser pause, Wi-Fi retry, or short scheduling
          hiccup can move the average even if the connection spent most of the
          phase behaving normally.
        </p>

        <p>
          For a browser bufferbloat test, that is not the center we want. We
          need a reference point that represents the typical ping in the quiet,
          download, and upload phases. Then the scorecard can show whether load
          changed the connection in a way users would notice.
        </p>
      </section>

      <section className="resource-diagram-block" aria-labelledby="median-average-heading">
        <div>
          <p className="eyebrow">visual model</p>
          <h2 id="median-average-heading">One spike can move the average</h2>
          <p>
            Median ping uses the middle of the ordered samples. Average ping
            uses every sample equally, so a few high-delay values can pull it
            away from where the connection spent most of its time.
          </p>
        </div>
        <MedianAverageDiagram />
      </section>

      <section className="resource-note">
        <h2>Median ping gives the test a stable center</h2>
        <p>
          Median ping is the middle sample after the pings are ordered from
          lowest to highest. Half the scored samples are below it and half are
          above it. That makes it harder for a small number of unusually high
          samples to redefine the whole phase.
        </p>

        <p>
          This does not mean the high samples are ignored. It means they should
          not be allowed to distort the center of the measurement. The high end
          of the run has its own job, explained in <Link href="/learn/latency-spread-vs-jitter">why
          we use latency spread, not jitter</Link>.
        </p>
      </section>

      <section className="metric-decision-block" aria-labelledby="median-decision-question">
        <p className="metric-decision-question" id="median-decision-question">
          <strong>Question:</strong> which center point best represents where
          the connection usually was during a measured phase?
        </p>

        <div className="resource-grid metric-choice-grid" aria-label="Why median ping is used instead of average ping">
          <article>
            <span>Average ping</span>
            <h2>Useful, but easy to pull around</h2>
            <p>
              It includes every sample equally, so a few unusual pings can move
              the center away from the behavior that dominated the phase.
            </p>
          </article>

          <article>
            <span>Worst ping</span>
            <h2>Too fragile to be the center</h2>
            <p>
              The single highest ping can be informative, but it is not a
              center point. It can turn one isolated hiccup into the whole story.
            </p>
          </article>

          <article>
            <span>Median ping</span>
            <h2>Best fit for this test</h2>
            <p>
              It marks the middle of the measured phase, giving the scorecard a
              steadier reference before comparing quiet, download, and upload.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-note">
        <h2>How to read it</h2>
        <p>
          Median ping is the typical delay level for that part of the test. A
          low median is good, but it is not the whole result. A connection can
          have a decent quiet-line median and still become unreliable when
          download or upload load is active.
        </p>

        <p>
          That is why Bufferbloat.org does not stop at one ping number. Median
          ping gives the center. The loaded phases show whether the connection
          stays usable when busy. The technical fields are documented in the{" "}
          <Link href="/docs#technical-detail-export-fields">methodology notes</Link>.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>check your own line</span>
          <h2>See median ping inside the full bufferbloat scorecard.</h2>
          <p>
            Run the test to compare quiet-line ping with what happens while
            download and upload load are active. The result uses median ping as
            the center of each measured phase.
          </p>

          <div className="guide-test-actions">
            <Link href="/test?start=1" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs#technical-detail-export-fields" className="guide-secondary-action">
              Read the technical fields
            </Link>
          </div>
        </div>
      </section>

      <section className="resource-related" aria-label="Continue reading">
        <p className="eyebrow">continue reading</p>
        <h2>Related measurement guides</h2>
        <div className="resource-links">
          <Link href="/learn/latency-spread-vs-jitter">
            Why we use latency spread, not jitter
          </Link>
          <Link href="/learn/what-bufferbloat-speed-test-measures">
            What the test measures
          </Link>
          <Link href="/learn/latency-under-load">
            Latency under load
          </Link>
          <Link href="/learn">Back to Learn</Link>
        </div>
      </section>
    </main>
  );
}

function MedianAverageDiagram() {
  return (
    <figure className="latency-spread-diagram median-average-diagram">
      <svg
        aria-labelledby="median-average-svg-title median-average-svg-desc"
        role="img"
        viewBox="0 0 820 330"
      >
        <title id="median-average-svg-title">Median ping compared with average ping</title>
        <desc id="median-average-svg-desc">
          A set of ping samples cluster around a stable center with two high
          samples. The median line stays near the cluster while the average line
          is pulled upward.
        </desc>
        <defs>
          <pattern id="median-average-grid" width="34" height="30" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          </pattern>
        </defs>

        <rect className="diagram-panel" x="1" y="1" width="818" height="328" rx="0" />
        <rect className="diagram-grid" x="40" y="44" width="740" height="210" fill="url(#median-average-grid)" />

        <line className="diagram-axis" x1="78" y1="238" x2="752" y2="238" />
        <line className="diagram-axis" x1="78" y1="58" x2="78" y2="238" />
        <text className="diagram-axis-label" x="42" y="64">ms</text>

        <text className="diagram-card-title" x="100" y="36">same ping samples</text>
        <text className="diagram-axis-label" x="112" y="278">ordered over the phase</text>

        <polyline
          className="diagram-line diagram-line-muted"
          points="104,176 146,170 188,178 230,172 272,174 314,168 356,176 398,82 440,174 482,171 524,178 566,88 608,173 650,176 692,170"
        />

        <line className="diagram-median" x1="96" y1="174" x2="716" y2="174" />
        <text className="diagram-median-label" x="612" y="164">median: stable center</text>

        <line className="diagram-average" x1="96" y1="148" x2="716" y2="148" />
        <text className="diagram-average-label" x="584" y="138">average: pulled upward</text>

        <circle className="diagram-dot diagram-dot-spread" cx="398" cy="82" r="5" />
        <circle className="diagram-dot diagram-dot-spread" cx="566" cy="88" r="5" />
        <text className="diagram-note" x="282" y="72">high samples</text>

        <path className="diagram-soft-arrow" d="M 526 92 C 550 112 570 126 592 148" />
        <text className="diagram-note" x="108" y="302">median resists isolated high samples; average moves toward them</text>
      </svg>
      <figcaption>
        Median ping is not pretending the high samples did not happen. It gives
        the phase a cleaner center so unusual samples do not distort the
        baseline.
      </figcaption>
    </figure>
  );
}
