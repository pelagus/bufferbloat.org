import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-panel home-as-test">
        <div className="home-hero-grid">
          <div className="hero-copy">
            <div className="home-project-label">
              <span>open-source project</span>
              <span>browser measurement</span>
              <span>methodology public</span>
            </div>

            <h1>Bufferbloat.org</h1>

            <p className="hero-subtitle">
              An open-source test for latency under load: the lag that appears
              when your connection is busy.
            </p>

            <p className="home-hero-description">
              Speed tests report throughput. Bufferbloat.org measures whether
              the network still responds while download and upload traffic are
              active, then shows the result in a report that can be inspected
              and cited.
            </p>

            <div className="home-hero-actions">
              <Link href="/test" className="hero-start-button">
                Run measurement
              </Link>

              <div className="home-hero-links" aria-label="Project references">
                <Link href="/docs">Read methodology</Link>
                <a
                  href="https://github.com/pelagus/bufferbloat.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View source
                </a>
                <Link href="/learn">Learn</Link>
              </div>
            </div>
          </div>

          <aside
            className="home-hero-instrument"
            aria-label="Example latency under load measurement"
          >
            <div className="instrument-header">
              <span>example run</span>
              <strong>latency under load</strong>
            </div>

            <dl className="instrument-metrics">
              <div>
                <dt>Quiet</dt>
                <dd>24 ms</dd>
              </div>
              <div>
                <dt>Loaded</dt>
                <dd>412 ms</dd>
              </div>
              <div>
                <dt>Added delay</dt>
                <dd>+388 ms</dd>
              </div>
            </dl>

            <div
              className="instrument-trace"
              aria-label="Illustrative latency trace"
            >
              <svg viewBox="0 0 420 170" role="img" aria-labelledby="home-trace-title">
                <title id="home-trace-title">
                  Example trace where latency rises while traffic is active
                </title>
                <line x1="28" y1="132" x2="392" y2="132" className="trace-axis" />
                <line x1="28" y1="38" x2="392" y2="38" className="trace-grid" />
                <line x1="28" y1="85" x2="392" y2="85" className="trace-grid" />
                <rect x="28" y="22" width="112" height="110" className="trace-zone trace-zone-quiet" />
                <rect x="140" y="22" width="126" height="110" className="trace-zone trace-zone-download" />
                <rect x="266" y="22" width="126" height="110" className="trace-zone trace-zone-upload" />
                <path
                  className="trace-line trace-line-quiet"
                  d="M28 123 L50 124 L72 122 L94 123 L116 121 L138 123"
                />
                <path
                  className="trace-line trace-line-load"
                  d="M140 120 L160 113 L180 118 L200 104 L220 109 L240 96 L266 101 L286 62 L306 46 L326 55 L346 36 L366 49 L392 31"
                />
                <text x="28" y="154" className="trace-label">quiet</text>
                <text x="154" y="154" className="trace-label">download</text>
                <text x="284" y="154" className="trace-label">upload</text>
              </svg>
            </div>

            <p>
              Same connection. Different question: does latency stay stable
              when the line is busy?
            </p>
          </aside>
        </div>

        <dl className="project-index" aria-label="Project summary">
          <div>
            <dt>Status</dt>
            <dd>Active public test</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <a
                href="https://github.com/pelagus/bufferbloat.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>
            </dd>
          </div>
          <div>
            <dt>Measures</dt>
            <dd>Latency under load</dd>
          </div>
          <div>
            <dt>Reports</dt>
            <dd>Medians and throughput</dd>
          </div>
        </dl>
      </section>

      <section className="home-grid project-principles">
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

        <article>
          <span>Project</span>
          <h2>A public reference for internet responsiveness</h2>
          <p>
            Source code and methodology are public. The site keeps measurement
            details and limitations visible so results can be checked, debated,
            and improved.
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
