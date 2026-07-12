import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-panel home-as-test">
        <div className="hero-copy">
          <div className="hero-kicker">Open-source internet responsiveness test</div>

          <h1>Fast internet can still feel slow.</h1>

          <p className="hero-subtitle">
            Bufferbloat.org compares quiet latency with latency during download
            and upload load, so you can see whether a connection stays
            responsive while it is busy.
          </p>

          <div className="home-hero-actions">
            <Link href="/test" className="hero-start-button">
              Run the test
            </Link>

            <div className="home-hero-links" aria-label="Project references">
              <Link href="/docs">Methodology</Link>
              <a
                href="https://github.com/pelagus/bufferbloat.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
              <Link href="/learn">Learn</Link>
            </div>
          </div>

          <div className="home-trust-strip" aria-label="Project trust signals">
            <span>Quiet latency</span>
            <span>Download load</span>
            <span>Upload load</span>
            <span>Median reporting</span>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <article>
          <span>Problem</span>
          <h2>Throughput is not responsiveness</h2>
          <p>
            A connection can show high download speed and still feel unreliable
            if latency rises when the line is busy. That is why calls freeze,
            games stutter, and pages stall during ordinary network use.
          </p>
        </article>

        <article>
          <span>Method</span>
          <h2>Measure latency under load</h2>
          <p>
            The test samples quiet latency, then measures latency while
            download and upload traffic are active. The goal is a practical
            signal that users can understand and experts can inspect.
          </p>
        </article>
      </section>

      <section className="home-panel latency-trace-panel">
        <div className="trace-header">
          <div>
            <p className="eyebrow">example measurement trace</p>
            <h2>Latency should remain stable when traffic is active.</h2>
          </div>

          <dl className="trace-summary" aria-label="Example latency summary">
            <div>
              <dt>Quiet</dt>
              <dd>24 ms</dd>
            </div>
            <div>
              <dt>Download load</dt>
              <dd>118 ms</dd>
            </div>
            <div>
              <dt>Upload load</dt>
              <dd>412 ms</dd>
            </div>
          </dl>
        </div>

        <div className="latency-chart" aria-label="Example latency over time chart">
          <svg viewBox="0 0 900 300" role="img" aria-labelledby="latency-chart-title">
            <title id="latency-chart-title">
              Example latency trace showing quiet, download load, and upload load phases
            </title>
            <line x1="64" y1="38" x2="64" y2="246" className="axis" />
            <line x1="64" y1="246" x2="850" y2="246" className="axis" />
            <line x1="64" y1="198" x2="850" y2="198" className="grid-line" />
            <line x1="64" y1="150" x2="850" y2="150" className="grid-line" />
            <line x1="64" y1="102" x2="850" y2="102" className="grid-line" />
            <line x1="64" y1="54" x2="850" y2="54" className="grid-line" />

            <text x="28" y="250" className="axis-label">0</text>
            <text x="20" y="154" className="axis-label">200</text>
            <text x="20" y="58" className="axis-label">400</text>
            <text x="64" y="276" className="phase-label">quiet</text>
            <text x="332" y="276" className="phase-label">download load</text>
            <text x="634" y="276" className="phase-label">upload load</text>

            <rect x="64" y="38" width="246" height="208" className="phase phase-quiet" />
            <rect x="310" y="38" width="270" height="208" className="phase phase-download" />
            <rect x="580" y="38" width="270" height="208" className="phase phase-upload" />

            <path
              className="latency-line baseline-line"
              d="M64 232 L104 234 L144 231 L184 232 L224 230 L264 233 L304 231"
            />
            <path
              className="latency-line loaded-line"
              d="M310 226 L338 214 L366 220 L394 208 L422 216 L450 198 L478 204 L506 190 L534 205 L562 196 L580 198 L606 130 L632 82 L658 96 L684 62 L710 88 L736 58 L762 76 L788 50 L814 68 L850 46"
            />
          </svg>
        </div>

        <p className="trace-caption">
          Illustrative data. The live test reports measured quiet latency,
          download latency under load, upload latency under load, and throughput.
        </p>
      </section>

      <section className="home-reference-panel">
        <div>
          <p className="eyebrow">public-interest resource</p>
          <h2>Open methodology, inspectable implementation.</h2>
        </div>

        <p>
          Bufferbloat.org is an independent open-source project. It documents
          how the browser test works, links to source code, and keeps
          limitations visible so the measurement can be evaluated and improved.
        </p>

        <div className="home-reference-links">
          <Link href="/mission">Mission</Link>
          <Link href="/docs">Methodology</Link>
          <a
            href="https://github.com/pelagus/bufferbloat.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </section>

    </main>
  );
}
