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
    "An open-source browser-based bufferbloat test that explains why an internet connection can feel slow or unreliable even when speed tests look fast.",
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
              Open-source browser test. Public methodology. Inspectable results.
            </p>

            <h1>Bufferbloat.org</h1>

            <p className="hero-subtitle">
              Your internet can be unstable even when ordinary speed tests say
              it is fast.
            </p>

            <p className="home-hero-description">
              Megabits per second do not tell the whole story. Latency / ping
              helps, but only when measured while the connection is doing real
              work. Bufferbloat.org recreates busy conditions and gives you a
              practical assessment of how your connection behaves in real life.
            </p>

            <div className="home-hero-actions">
              <Link href="/test?start=1" className="hero-start-button">
                Run test
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
              <span>example scorecard trace</span>
              <strong>Latency / Ping in milliseconds</strong>
            </div>

            <dl className="instrument-metrics">
              <div>
                <dt>Download speed</dt>
                <dd>22 Mbps</dd>
              </div>
              <div>
                <dt>Upload speed</dt>
                <dd>10 Mbps</dd>
              </div>
              <div>
                <dt>Test duration</dt>
                <dd>47 sec</dd>
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
                  <text x="324" y="198">median dots</text>
                </g>
              </svg>
            </div>

            <p>
              Illustrative data. The live test reports a scorecard with a
              measured latency trace, median dots, throughput, and public
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
            <dd>Medians and throughput</dd>
          </div>
        </dl>
      </section>

      <section className="home-grid project-principles">
        <article>
          <span>Problem</span>
          <h2>Throughput is not the whole story</h2>
          <p>
            A connection can show high Mbps and still feel unreliable if ping
            rises when the line is busy. Calls freeze, games stutter, and pages
            stall because responsiveness changed under real-world load.
          </p>
        </article>

        <article>
          <span>Method</span>
          <h2>Measure bufferbloat directly</h2>
          <p>
            The test samples quiet latency, then measures latency while
            download and upload traffic are active. The goal is a practical
            signal that users can understand and experts can inspect.
          </p>
        </article>

        <article>
          <span>Project</span>
          <h2>A public reference for internet reliability</h2>
          <p>
            Source code and methodology are public. The site keeps measurement
            details and limitations visible so results can be checked, debated,
            and improved.
          </p>
        </article>
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
