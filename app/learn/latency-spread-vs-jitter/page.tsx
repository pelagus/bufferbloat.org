import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why We Don’t Show Jitter",
  description:
    "Why latency spread is a better signal than ordinary ping or jitter for real-world network reliability.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/latency-spread-vs-jitter",
  },
  openGraph: {
    title: "Why We Don’t Show Jitter",
    description:
      "Why latency spread is a better signal than ordinary ping or jitter for real-world network reliability.",
    url: "https://bufferbloat.org/learn/latency-spread-vs-jitter",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">measurement guide</p>

      <h1 className="page-title compact">Why We Don&rsquo;t Show Jitter</h1>

      <p className="page-copy">
        TLDR: most speed tests ask an incomplete question. Speed matters, and
        ordinary ping helps, but neither tells you whether the connection stays
        reliable when it is busy. Bufferbloat.org uses latency spread because it
        is a better signal of real-life network reliability: how far the bad
        ping moments drift from the normal ones.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>See latency spread on your own connection.</span>
      </div>

      <section className="resource-note">
        <h2>Why speed and ordinary ping miss the point</h2>
        <p>
          The common frustration is simple: a connection can look good in a
          speed test and still feel unreliable in real life. A call is clear,
          then someone sounds robotic. A game responds, then one action lands
          late. A page starts loading, then pauses because someone else is using
          the line.
        </p>

        <p>
          Looking at speed alone is not enough, because speed mostly tells you
          how much data can move. Looking at one ping number is not enough
          either, because a typical ping can hide the moments where delay jumps
          high enough to be felt.
        </p>

        <p>
          But connection quality is more than both of those numbers. The real
          question is whether the connection stays predictable when the line is
          busy. Bufferbloat is one common reason it does not: delay can build up
          during downloads or uploads, even on a connection that looks fine when
          it is idle.
        </p>

        <p>
          That is where latency spread becomes useful. It is not asking for the
          single worst moment. It asks how far the high-delay moments drift from
          the normal ping during each part of the test.
        </p>
      </section>

      <section className="resource-diagram-block" aria-labelledby="same-median-heading">
        <div>
          <p className="eyebrow">visual model</p>
          <h2 id="same-median-heading">Same typical ping, different experience</h2>
          <p>
            Two connections can have the same typical ping and still feel very
            different. The one with wider spread has more moments where packets
            take noticeably longer than usual. Those moments are what people
            experience as calls breaking up, games feeling late, or remote work
            becoming uneven.
          </p>
        </div>
        <SameMedianDiagram />
      </section>

      <section className="resource-note">
        <h2>Why we do not call this jitter</h2>
        <p>
          Jitter is a real networking term, but in consumer tests it often
          becomes a vague label. Different tools calculate it differently, and
          many speed tests do not explain which definition they are using. The
          result can look precise while still being hard to interpret.
        </p>

        <p>
          Bufferbloat.org uses the more literal term latency spread because it
          says what the scorecard is actually showing: how much room there is
          between the normal ping and the higher-delay moments seen during
          quiet, download, and upload phases.
        </p>
      </section>

      <section className="resource-note">
        <h2>How the test calculates it</h2>
        <p>
          For each phase, the test records ping samples. It finds the median,
          which is the typical ping for that phase. It also finds the 95th
          percentile, which sits near the high end of the samples without being
          the single worst outlier. Latency spread is the difference between
          those two values.
        </p>

        <p>
          This makes the number practical rather than theatrical. It still sees
          the uncomfortable upper end of the run, but it does not let one
          strange browser hiccup define the whole connection. The exact exported
          field is documented in the <Link href="/docs#technical-detail-export-fields">technical details</Link>.
        </p>
      </section>

      <section className="resource-diagram-block" aria-labelledby="p95-heading">
        <div>
          <p className="eyebrow">why not worst ping</p>
          <h2 id="p95-heading">One spike should not define the result</h2>
          <p>
            The maximum ping is tempting because it is dramatic. It is also
            fragile. A single browser pause, Wi-Fi hiccup, or tab scheduling
            delay can make the maximum look worse than the connection usually
            behaves. The 95th percentile keeps the focus on bad moments that
            are present in the run, not just the single tallest spike.
          </p>
        </div>
        <PercentileDiagram />
      </section>

      <section className="resource-note">
        <h2>How to read it</h2>
        <p>
          Smaller is steadier. A low latency spread means the worse moments
          stayed close to the typical ping. A high latency spread means the
          connection had enough delay swings to feel uneven, especially for
          calls, low-latency games, and interactive work.
        </p>

        <p>
          Do not read latency spread alone. The bufferbloat grade still asks
          the main question: did download or upload load add delay? Latency
          spread answers the follow-up: even if the median looks acceptable,
          did the samples stay tight enough for the connection to feel stable?
        </p>

        <p>
          The easiest way to see it is to run the <Link href="/test?start=1">bufferbloat
          test</Link>. The scorecard shows the spread next to the measured
          phases so you can compare what happened while the line was quiet,
          downloading, and uploading.
        </p>
      </section>

      <div className="resource-links">
        <Link href="/learn/latency-under-load">
          Latency under load
        </Link>
        <Link href="/learn/what-bufferbloat-speed-test-measures">
          What the test measures
        </Link>
        <Link href="/learn/bufferbloat-speed-test">
          Bufferbloat speed test
        </Link>
        <Link href="/learn">Back to Learn</Link>
      </div>
    </main>
  );
}

function SameMedianDiagram() {
  return (
    <figure className="latency-spread-diagram">
      <svg
        aria-labelledby="same-median-svg-title same-median-svg-desc"
        role="img"
        viewBox="0 0 760 320"
      >
        <title id="same-median-svg-title">Two latency traces with the same median but different spread</title>
        <desc id="same-median-svg-desc">
          A steady connection and an uneven connection share the same median
          ping line, but the uneven connection reaches a much higher 95th
          percentile.
        </desc>
        <defs>
          <pattern id="spread-grid" width="38" height="32" patternUnits="userSpaceOnUse">
            <path d="M 38 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect className="diagram-panel" x="1" y="1" width="758" height="318" rx="0" />
        <rect className="diagram-grid" x="32" y="34" width="696" height="230" fill="url(#spread-grid)" />

        <line className="diagram-axis" x1="68" y1="246" x2="708" y2="246" />
        <line className="diagram-axis" x1="68" y1="56" x2="68" y2="246" />
        <text className="diagram-axis-label" x="34" y="62">ms</text>
        <text className="diagram-axis-label" x="88" y="280">steady line</text>
        <text className="diagram-axis-label" x="446" y="280">same median, wider spread</text>

        <line className="diagram-median" x1="82" y1="176" x2="688" y2="176" />
        <text className="diagram-median-label" x="580" y="165">median ping</text>

        <polyline
          className="diagram-line diagram-line-steady"
          points="88,178 118,174 148,177 178,175 208,178 238,173 268,176 298,174 328,177"
        />
        <circle className="diagram-dot diagram-dot-steady" cx="118" cy="174" r="4" />
        <circle className="diagram-dot diagram-dot-steady" cx="238" cy="173" r="4" />

        <polyline
          className="diagram-line diagram-line-spread"
          points="418,177 448,174 478,180 508,146 538,178 568,120 598,176 628,96 658,174"
        />
        <circle className="diagram-dot diagram-dot-spread" cx="568" cy="120" r="4" />
        <circle className="diagram-dot diagram-dot-spread" cx="628" cy="96" r="4" />

        <line className="diagram-p95" x1="418" y1="104" x2="674" y2="104" />
        <text className="diagram-p95-label" x="438" y="92">95th percentile</text>
        <path className="diagram-bracket" d="M 692 104 L 708 104 L 708 176 L 692 176" />
        <text className="diagram-spread-label" x="606" y="145">spread</text>
      </svg>
      <figcaption>
        Latency spread separates a steady connection from one that is often
        fine but has enough high-delay moments to feel unreliable.
      </figcaption>
    </figure>
  );
}

function PercentileDiagram() {
  const samples = [
    { x: 74, y: 180 },
    { x: 114, y: 176 },
    { x: 154, y: 178 },
    { x: 194, y: 172 },
    { x: 234, y: 179 },
    { x: 274, y: 170 },
    { x: 314, y: 176 },
    { x: 354, y: 134 },
    { x: 394, y: 150 },
    { x: 434, y: 122 },
    { x: 474, y: 158 },
    { x: 514, y: 140 },
    { x: 554, y: 112 },
    { x: 594, y: 146 },
    { x: 634, y: 74 },
    { x: 674, y: 172 },
  ];

  return (
    <figure className="latency-spread-diagram percentile-diagram">
      <svg
        aria-labelledby="percentile-svg-title percentile-svg-desc"
        role="img"
        viewBox="0 0 760 300"
      >
        <title id="percentile-svg-title">95th percentile spread compared with worst ping</title>
        <desc id="percentile-svg-desc">
          Ping samples cluster around a median with several high-delay samples.
          The 95th percentile ignores the single highest outlier while still
          representing the upper end.
        </desc>
        <rect className="diagram-panel" x="1" y="1" width="758" height="298" rx="0" />
        <line className="diagram-axis" x1="58" y1="236" x2="704" y2="236" />
        <line className="diagram-axis" x1="58" y1="48" x2="58" y2="236" />
        <text className="diagram-axis-label" x="26" y="54">ms</text>

        <line className="diagram-median" x1="72" y1="176" x2="692" y2="176" />
        <text className="diagram-median-label" x="74" y="164">median</text>
        <line className="diagram-p95" x1="72" y1="122" x2="692" y2="122" />
        <text className="diagram-p95-label" x="74" y="110">95th percentile</text>
        <line className="diagram-worst" x1="72" y1="74" x2="692" y2="74" />
        <text className="diagram-worst-label" x="74" y="62">single worst sample</text>

        <polyline
          className="diagram-line diagram-line-spread"
          points={samples.map((sample) => `${sample.x},${sample.y}`).join(" ")}
        />
        {samples.map((sample) => (
          <circle
            className={sample.y <= 78 ? "diagram-dot diagram-dot-worst" : "diagram-dot diagram-dot-spread"}
            cx={sample.x}
            cy={sample.y}
            key={`${sample.x}-${sample.y}`}
            r={sample.y <= 78 ? 5 : 3.5}
          />
        ))}

        <path className="diagram-bracket" d="M 718 122 L 734 122 L 734 176 L 718 176" />
        <text className="diagram-spread-label" x="578" y="153">reported spread</text>
        <path className="diagram-soft-arrow" d="M 628 76 C 664 92 682 104 694 122" />
        <text className="diagram-note" x="448" y="46">not driven by one spike</text>
      </svg>
      <figcaption>
        The 95th percentile still sees the uncomfortable upper tail, but it is
        less fragile than grading the whole connection by one worst sample.
      </figcaption>
    </figure>
  );
}
