import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why We Use Latency Spread, not Jitter",
  description:
    "Why latency spread is a better signal than ordinary ping or jitter for real-world network reliability.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/latency-spread-vs-jitter",
  },
  openGraph: {
    title: "Why We Use Latency Spread, not Jitter",
    description:
      "Why latency spread is a better signal than ordinary ping or jitter for real-world network reliability.",
    url: "https://bufferbloat.org/learn/latency-spread-vs-jitter",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">measurement guide</p>

      <h1 className="page-title compact">Why We Use Latency Spread, not Jitter</h1>

      <p className="page-copy">
        Bufferbloat.org does not show a generic jitter number because the
        question we care about is more specific: how far do the high-delay ping
        samples move away from the median during quiet, download, and upload
        load? We call that latency spread, and it is one of the signals the
        <Link href="/learn/what-bufferbloat-speed-test-measures"> bufferbloat
        test measures</Link>.
      </p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the bufferbloat test</Link>
        <span>See latency spread on your own connection.</span>
      </div>

      <section className="resource-note">
        <h2>What latency spread is measuring</h2>
        <p>
          Latency spread is the gap between the median ping and the 95th
          percentile ping in a phase of the test. You do not need the notation
          to read the scorecard, but for completeness the calculation is:
        </p>

        <p className="resource-formula" aria-label="Latency spread formula">
          <span>latency spread</span>
          <strong>=</strong>
          <span>P<sub>95</sub>(ping)</span>
          <strong>-</strong>
          <span>P<sub>50</sub>(ping)</span>
        </p>

        <p>
          <Link href="/learn/median-ping-vs-average-ping">Median ping</Link>{" "}
          is the center of the measured samples. P<sub>95</sub> is near the
          high end: high enough to reflect bad delay moments, but less fragile
          than using the single worst ping. Latency spread is the distance
          between those two points.
        </p>

        <p>
          Another way to read P<sub>95</sub>: sort the scored pings from lowest
          to highest, then look near the 95% mark. About 95% of the measured
          pings are at or below that value, so it represents the upper-delay
          behavior without handing the result to one isolated spike.
        </p>

        <p>
          This is deliberately different from showing a vague jitter number.
          Jitter can mean several different calculations depending on the tool.
          Latency spread says exactly what is being compared and why it matters
          for a browser bufferbloat test. If you want the broader context, read
          how <Link href="/learn/latency-under-load">latency under load</Link>{" "}
          works.
        </p>
      </section>

      <section className="resource-diagram-block" aria-labelledby="model-comparison-heading">
        <div>
          <p className="eyebrow">visual model</p>
          <h2 id="model-comparison-heading">Three summaries, three different answers</h2>
          <p>
            The same ping samples can be summarized as average jitter, worst
            ping, or latency spread. Average jitter focuses on sample-to-sample
            movement. Worst ping focuses on one sample. Latency spread focuses
            on the upper-delay behavior relative to the median.
          </p>
        </div>
        <LatencyModelDiagram />
      </section>

      <section className="resource-note">
        <h2>Why we do not call this jitter</h2>
        <p>
          Jitter is a real networking term, but speed tests often use it as a
          loose label for several different ideas. Sometimes it means the
          average change from one ping sample to the next. Sometimes users read
          the worst ping in a run as if it were the instability number. Those
          are related signals, but they answer different questions.
        </p>

        <p>
          Average sample-to-sample jitter can hide the problem we care about:
          a line can look calm most of the time and still have a few
          high-delay moments that disrupt calls or games. Worst ping has the
          opposite problem: it can overreact to one isolated browser pause,
          Wi-Fi hiccup, or scheduling delay. That is why this page pairs with
          the separate explanation of <Link href="/learn/median-ping-vs-average-ping">why
          the test uses median ping</Link>.
        </p>

        <p>
          Bufferbloat.org uses the more literal term latency spread because it
          says what the scorecard is actually showing: how much distance there
          is between the median ping and the upper end of the measured pings
          during quiet, download, and upload phases.
        </p>
      </section>

      <section className="metric-decision-block" aria-labelledby="latency-spread-decision-question">
        <p className="metric-decision-question" id="latency-spread-decision-question">
          <strong>Question:</strong> which number best captures the high-delay
          moments users feel without letting one odd ping sample dominate the
          result?
        </p>

        <div className="resource-grid metric-choice-grid" aria-label="Why latency spread is used instead of jitter or worst ping">
          <article>
            <span>Average jitter</span>
            <h2>Can smooth over the bad moments</h2>
            <p>
              Usually the average change between neighboring ping samples. Useful
              in some packet analysis, but it can hide short high-delay periods
              that users actually feel.
            </p>
          </article>

          <article>
            <span>Worst ping</span>
            <h2>Can overreact to one sample</h2>
            <p>
              Easy to understand, but brittle in a browser. One Wi-Fi retry,
              browser pause, or scheduling hiccup can become the whole story.
            </p>
          </article>

          <article>
            <span>Latency spread</span>
            <h2>Best fit for this test</h2>
            <p>
              Uses p95 minus median. It catches repeated high-delay behavior while
              avoiding the fragility of grading the run by a single outlier.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-note">
        <h2>How the test calculates it</h2>
        <p>
          For each phase, the test records ping samples. It finds the median,
          which is the center of the sampled pings for that phase. It also
          finds the 95th percentile, which sits near the high end of the samples
          without being the single worst outlier. Latency spread is the
          difference between those two values.
        </p>

        <p>
          This makes the number practical rather than theatrical. It still sees
          the uncomfortable upper end of the run, but it does not let one
          strange browser hiccup define the whole connection. The exact exported
          field is documented in the <Link href="/docs#technical-detail-export-fields">technical
          details</Link>, and the measurement flow is described in the{" "}
          <Link href="/docs">methodology</Link>.
        </p>
      </section>

      <section className="resource-diagram-block" aria-labelledby="p95-heading">
        <div>
          <p className="eyebrow">p95 versus maximum</p>
          <h2 id="p95-heading">Why p95 is not the same as worst ping</h2>
          <p>
            The maximum ping is the single highest sample. The 95th percentile
            is still near the high end, but it is less exposed to one-off noise.
            That is why latency spread uses p95 rather than the maximum: it
            measures the upper-delay behavior of the run, not just the most
            dramatic dot on the chart.
          </p>
        </div>
        <PercentileDiagram />
      </section>

      <section className="resource-note">
        <h2>How to read it</h2>
        <p>
          Smaller is steadier. A low latency spread means the worse moments
          stayed close to the median ping. A high latency spread means the
          connection had enough delay swings to feel uneven, especially for
          calls, low-latency games, and interactive work.
        </p>

        <p>
          Do not read latency spread alone. The bufferbloat grade still asks
          the main question: did download or upload load add delay? Latency
          spread answers the follow-up: even if the median looks acceptable,
          did the samples stay tight enough for the connection to feel stable?
          That is also why the result includes an <Link href="/learn/internet-connection-quality">internet
          connection quality</Link> scorecard rather than one isolated number.
        </p>

        <p>
          The easiest way to see it is to run the <Link href="/test?start=1">bufferbloat
          test</Link>. The scorecard shows the spread next to the measured
          phases so you can compare what happened while the line was quiet,
          downloading, and uploading.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>check your own line</span>
          <h2>See whether latency spread shows up on your connection.</h2>
          <p>
            Run the test and compare quiet-line ping with what happens while
            download and upload load are active. The result shows latency
            spread beside the measured chart, not as a vague jitter number.
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
          <Link href="/learn/median-ping-vs-average-ping">
            Why we use median ping
          </Link>
          <Link href="/learn/latency-under-load">
            Latency under load
          </Link>
          <Link href="/learn/what-bufferbloat-speed-test-measures">
            What the test measures
          </Link>
          <Link href="/learn">Back to Learn</Link>
        </div>
      </section>
    </main>
  );
}

function LatencyModelDiagram() {
  return (
    <figure className="latency-spread-diagram model-comparison-diagram">
      <svg
        aria-labelledby="model-comparison-svg-title model-comparison-svg-desc"
        role="img"
        viewBox="0 0 920 430"
      >
        <title id="model-comparison-svg-title">Three ways to summarize the same ping samples</title>
        <desc id="model-comparison-svg-desc">
          A latency chart with quiet, download, and upload phases shows why
          latency spread is measured from the median to the 95th percentile.
        </desc>
        <defs>
          <pattern id="model-grid" width="36" height="32" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect className="diagram-panel" x="1" y="1" width="918" height="428" rx="0" />
        <text className="diagram-card-title" x="34" y="36">same measured trace</text>
        <text className="diagram-axis-label" x="704" y="36">Latency / Ping in milliseconds</text>

        <g transform="translate(62 64)">
          <rect className="diagram-grid" x="0" y="0" width="796" height="260" fill="url(#model-grid)" />
          <rect className="diagram-phase-quiet" x="48" y="26" width="214" height="198" />
          <rect className="diagram-phase-download" x="262" y="26" width="252" height="198" />
          <rect className="diagram-phase-upload" x="514" y="26" width="250" height="198" />

          <line className="diagram-axis" x1="48" y1="224" x2="764" y2="224" />
          <line className="diagram-axis" x1="48" y1="26" x2="48" y2="224" />
          <line className="diagram-section-rule" x1="262" y1="26" x2="262" y2="224" />
          <line className="diagram-section-rule" x1="514" y1="26" x2="514" y2="224" />

          <text className="diagram-axis-label" x="16" y="32">ms</text>
          <text className="diagram-axis-label" x="16" y="224">0</text>
          <text className="diagram-axis-label" x="10" y="126">100</text>
          <text className="diagram-axis-label" x="10" y="32">200</text>

          <polyline
            className="diagram-line diagram-line-quiet"
            points="66,162 86,156 106,164 126,158 146,166 166,154 186,160 206,118 226,166 246,158"
          />
          <polyline
            className="diagram-line diagram-line-download"
            points="284,164 304,158 324,166 344,152 364,170 384,124 404,160 424,150 444,136 464,166 494,154"
          />
          <polyline
            className="diagram-line diagram-line-upload"
            points="536,164 556,156 576,172 596,150 616,168 636,108 656,92 676,146 696,166 716,156 744,162"
          />

          {[
            [66, 162], [86, 156], [106, 164], [126, 158], [146, 166],
            [166, 154], [186, 160], [206, 118], [226, 166], [246, 158],
          ].map(([cx, cy]) => (
            <circle className="diagram-dot diagram-dot-quiet" cx={cx} cy={cy} key={`q-${cx}`} r="3.5" />
          ))}
          {[
            [284, 164], [304, 158], [324, 166], [344, 152], [364, 170],
            [384, 124], [404, 160], [424, 150], [444, 136], [464, 166], [494, 154],
          ].map(([cx, cy]) => (
            <circle className="diagram-dot diagram-dot-download" cx={cx} cy={cy} key={`d-${cx}`} r="3.5" />
          ))}
          {[
            [536, 164], [556, 156], [576, 172], [596, 150], [616, 168],
            [636, 108], [656, 92], [676, 146], [696, 166], [716, 156], [744, 162],
          ].map(([cx, cy]) => (
            <circle className="diagram-dot diagram-dot-upload" cx={cx} cy={cy} key={`u-${cx}`} r="3.5" />
          ))}

          <line className="diagram-median" x1="536" y1="160" x2="744" y2="160" />
          <circle className="diagram-median-dot" cx="628" cy="160" r="9" />
          <text className="diagram-median-label" x="596" y="150">median ping</text>

          <line className="diagram-p95" x1="536" y1="110" x2="744" y2="110" />
          <circle className="diagram-p95-dot" cx="636" cy="108" r="6" />
          <text className="diagram-p95-label" x="546" y="100">95th percentile</text>

          <path className="diagram-bracket" d="M 778 110 L 790 110 L 790 160 L 778 160" />
          <text className="diagram-spread-label" x="644" y="132">latency spread</text>

          <text className="diagram-stage-label diagram-label-quiet" x="126" y="248">quiet line</text>
          <text className="diagram-stage-label diagram-label-download" x="348" y="248">download load</text>
          <text className="diagram-stage-label diagram-label-upload" x="606" y="248">upload load</text>
        </g>

        <g className="diagram-legend" transform="translate(76 378)">
          <line className="diagram-line-quiet" x1="0" y1="0" x2="34" y2="0" />
          <text x="44" y="5">quiet line</text>
          <line className="diagram-line-download" x1="160" y1="0" x2="194" y2="0" />
          <text x="204" y="5">download load</text>
          <line className="diagram-line-upload" x1="356" y1="0" x2="390" y2="0" />
          <text x="400" y="5">upload load</text>
          <circle className="diagram-median-dot" cx="560" cy="0" r="7" />
          <text x="574" y="5">median ping</text>
          <line className="diagram-p95" x1="704" y1="0" x2="738" y2="0" />
          <text x="748" y="5">p95</text>
        </g>
      </svg>
      <figcaption>
        Latency spread is read on the same kind of trace the test produces:
        find the median ping, find the high-end P95 point, then measure the
        distance between them.
      </figcaption>
    </figure>
  );
}

function PercentileDiagram() {
  return (
    <figure className="latency-spread-diagram percentile-diagram">
      <svg
        aria-labelledby="percentile-svg-title percentile-svg-desc"
        role="img"
        viewBox="0 0 860 360"
      >
        <title id="percentile-svg-title">95th percentile spread compared with worst ping</title>
        <desc id="percentile-svg-desc">
          A live-test-style ping trace shows median ping, 95th percentile ping,
          and the single worst ping. The 95th percentile is near the high end
          without being the isolated maximum.
        </desc>
        <defs>
          <pattern id="percentile-grid" width="34" height="30" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          </pattern>
        </defs>
        <rect className="diagram-panel" x="1" y="1" width="858" height="358" rx="0" />
        <text className="diagram-card-title" x="32" y="34">how P95 is picked</text>
        <text className="diagram-axis-label" x="600" y="34">one scored phase of ping samples</text>

        <g transform="translate(54 62)">
          <rect className="diagram-grid" x="0" y="0" width="752" height="232" fill="url(#percentile-grid)" />
          <rect className="diagram-phase-upload" x="54" y="24" width="612" height="174" />
          <line className="diagram-axis" x1="54" y1="198" x2="666" y2="198" />
          <line className="diagram-axis" x1="54" y1="24" x2="54" y2="198" />
          <text className="diagram-axis-label" x="16" y="30">ms</text>
          <text className="diagram-axis-label" x="18" y="198">0</text>
          <text className="diagram-axis-label" x="10" y="116">100</text>
          <text className="diagram-axis-label" x="10" y="30">200</text>

          <polyline
            className="diagram-line diagram-line-upload"
            points="74,150 104,146 134,154 164,148 194,152 224,144 254,150 284,96 314,148 344,142 374,82 404,150 434,146 464,138 494,154 524,88 554,150 584,32 614,146 646,152"
          />

          {[
            [74, 150], [104, 146], [134, 154], [164, 148], [194, 152],
            [224, 144], [254, 150], [284, 96], [314, 148], [344, 142],
            [374, 82], [404, 150], [434, 146], [464, 138], [494, 154],
            [524, 88], [554, 150], [584, 32], [614, 146], [646, 152],
          ].map(([cx, cy]) => (
            <circle className="diagram-dot diagram-dot-upload" cx={cx} cy={cy} key={`p-${cx}`} r="3.8" />
          ))}

          <line className="diagram-median" x1="74" y1="148" x2="646" y2="148" />
          <circle className="diagram-median-dot" cx="314" cy="148" r="9" />
          <text className="diagram-median-label" x="270" y="136">median ping</text>

          <line className="diagram-p95" x1="74" y1="88" x2="646" y2="88" />
          <circle className="diagram-p95-dot" cx="524" cy="88" r="7" />
          <text className="diagram-p95-label" x="430" y="76">P95 ping</text>

          <circle className="diagram-dot diagram-dot-worst" cx="584" cy="32" r="6" />
          <line className="diagram-worst" x1="74" y1="32" x2="646" y2="32" />
          <text className="diagram-worst-label" x="488" y="20">single worst ping</text>

          <path className="diagram-bracket" d="M 680 88 L 696 88 L 696 148 L 680 148" />
          <text className="diagram-spread-label" x="532" y="122">latency spread</text>

          <path className="diagram-soft-arrow" d="M 516 92 C 482 112 442 124 404 136" />
          <text className="diagram-note" x="292" y="220">about 95% of samples are at or below P95</text>
        </g>
      </svg>
      <figcaption>
        P95 is not an average. It is an upper-percentile marker: most samples
        are below it, a few are above it, and one isolated worst ping does not
        get to define the whole phase.
      </figcaption>
    </figure>
  );
}
