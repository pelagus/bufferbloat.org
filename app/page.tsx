import Link from "next/link";

const homeStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bufferbloat.org",
  url: "https://bufferbloat.org",
  applicationCategory: "NetworkApplication",
  operatingSystem: "Any modern browser",
  isAccessibleForFree: true,
  description:
    "An open-source browser-based bufferbloat test that measures whether an internet connection stays usable when download and upload traffic are active.",
  codeRepository: "https://github.com/pelagus/bufferbloat.org",
};

export default function Home() {
  return (
    <main className="home-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeStructuredData),
        }}
      />

      <section className="hero-panel home-as-test">
        <div className="home-hero-grid">
          <div className="hero-copy">
            <p className="home-project-label">
              Free and open source. Public methodology. Inspectable results.
            </p>

            <h1>The real-life test for your internet connection</h1>

            <p className="hero-subtitle">
              Speed tests can say everything is fine while games lag, pages
              stall, and video calls drop in real life.
            </p>

            <p className="home-hero-description">
              Bufferbloat.org measures the hidden delay that appears when data
              queues behind real download and upload traffic. The result shows
              whether your connection stays usable in real life, not just how
              many megabits it can move in ideal conditions.
            </p>

            <div className="home-hero-actions">
              <Link href="/test" className="home-test-link">
                Open the browser test
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
            aria-label="Example bufferbloat test result"
          >
            <div className="instrument-header">
              <span>example scorecard</span>
              <strong>Bufferbloat grade</strong>
            </div>

            <div className="instrument-grade-row">
              <div className="instrument-grade">
                <span>grade</span>
                <strong>B</strong>
                <em>Some delay</em>
              </div>
              <p>
                Solid connection, but upload load adds enough latency to matter
                for calls or games when the line is busy.
              </p>
            </div>

            <dl className="instrument-metrics">
              <div>
                <dt>Latency / ping</dt>
                <dd>80 ms</dd>
              </div>
              <div>
                <dt>Download stress</dt>
                <dd>+6 ms</dd>
              </div>
              <div>
                <dt>Upload stress</dt>
                <dd>+34 ms</dd>
              </div>
              <div>
                <dt>Latency spread</dt>
                <dd>12 ms</dd>
              </div>
            </dl>

            <div
              className="instrument-trace"
              aria-label="Illustrative latency trace"
            >
              <svg viewBox="0 0 420 220" role="img" aria-labelledby="home-trace-title">
                <title id="home-trace-title">
                  Example trace where latency rises while traffic is active
                </title>
                <line x1="48" y1="142" x2="398" y2="142" className="trace-axis" />
                <line x1="48" y1="30" x2="398" y2="30" className="trace-grid" />
                <line x1="48" y1="86" x2="398" y2="86" className="trace-grid" />
                <text x="14" y="33" className="trace-axis-label">200</text>
                <text x="18" y="89" className="trace-axis-label">100</text>
                <text x="24" y="145" className="trace-axis-label">0</text>
                <text x="7" y="18" className="trace-axis-label">ms</text>
                <rect x="48" y="26" width="104" height="116" className="trace-zone trace-zone-quiet" />
                <rect x="152" y="26" width="122" height="116" className="trace-zone trace-zone-download" />
                <rect x="274" y="26" width="124" height="116" className="trace-zone trace-zone-upload" />
                <line x1="152" y1="26" x2="152" y2="142" className="trace-phase-break" />
                <line x1="274" y1="26" x2="274" y2="142" className="trace-phase-break" />
                <path
                  className="trace-line trace-line-quiet"
                  d="M48 98 L58 104 L70 99 L82 101 L94 96 L106 100 L118 88 L130 72 L142 68 L152 59"
                />
                <path
                  className="trace-line trace-line-download"
                  d="M164 97 L174 86 L184 103 L194 88 L204 99 L214 91 L224 96 L234 85 L244 91 L254 78 L264 101 L274 92"
                />
                <path
                  className="trace-line trace-line-upload"
                  d="M286 84 L296 31 L306 88 L316 100 L326 63 L336 53 L346 101 L356 94 L366 83 L376 37 L386 55 L398 89"
                />
                <g className="trace-median-marker">
                  <line x1="48" y1="97" x2="152" y2="97" />
                  <circle cx="100" cy="97" r="4.5" />
                  <text x="100" y="88">80 ms</text>
                </g>
                <g className="trace-median-marker">
                  <line x1="152" y1="94" x2="274" y2="94" />
                  <circle cx="213" cy="94" r="4.5" />
                  <text x="213" y="85">86 ms</text>
                </g>
                <g className="trace-median-marker">
                  <line x1="274" y1="78" x2="398" y2="78" />
                  <circle cx="336" cy="78" r="4.5" />
                  <text x="336" y="69">114 ms</text>
                </g>
                <text x="48" y="164" className="trace-label">quiet</text>
                <text x="166" y="164" className="trace-label">download</text>
                <text x="292" y="164" className="trace-label">upload</text>
                <g className="trace-legend">
                  <line x1="48" y1="194" x2="64" y2="194" className="legend-quiet" />
                  <text x="70" y="198">quiet</text>
                  <line x1="116" y1="194" x2="132" y2="194" className="legend-download" />
                  <text x="138" y="198">download</text>
                  <line x1="214" y1="194" x2="230" y2="194" className="legend-upload" />
                  <text x="236" y="198">upload</text>
                  <circle cx="314" cy="194" r="4" className="legend-median" />
                  <text x="324" y="198">median ping</text>
                </g>
              </svg>
            </div>

            <p>
              Illustrative B-grade result. The live test reports the measured
              trace, application performance, throughput, and public
              methodology.
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
            <dd>Ping, load, and Mbps</dd>
          </div>
        </dl>
      </section>

      <section className="home-grid project-principles">
        <article>
          <span>Problem</span>
          <h2>Connection quality is more than speed and ping</h2>
          <p>
            Most speed tests report throughput in Mbps. That matters, but it
            does not show whether calls, games, browsing, and streaming stay
            responsive while the connection is already carrying traffic.
          </p>
        </article>

        <article>
          <span>Method</span>
          <h2>Test the line while it is under pressure</h2>
          <p>
            The test samples quiet-line ping, then repeats the measurement
            while download and upload traffic are active. The important signal
            is how much responsiveness changes when the line is busy.
          </p>
        </article>

        <article>
          <span>Project</span>
          <h2>A public-interest test, not a black box</h2>
          <p>
            Measuring connection quality should be free, transparent, and
            accessible. Source code, methodology, and limitations are public so
            results can be checked, debated, and improved.
          </p>
        </article>
      </section>

      <section className="home-reference-panel">
        <div>
          <p className="eyebrow">public-interest resource</p>
          <h2>Open methodology, inspectable implementation.</h2>
        </div>

        <p>
          Bufferbloat.org exists because this kind of measurement should exist.
          Internet connection quality is too important to be left to opaque and
          gimmicky speed tests. The public test is free, open source, and will
          never be supported by advertising. If the project needs funding to
          operate at scale, funding must not compromise the methodology,
          results, or user privacy.
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
