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
    "An open-source browser-based bufferbloat test for measuring internet reliability and latency under load.",
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
            <div className="home-project-label">
              <span>open-source project</span>
              <span>browser bufferbloat test</span>
              <span>methodology public</span>
            </div>

            <h1>Bufferbloat.org</h1>

            <p className="hero-subtitle">
              An open-source bufferbloat test for internet reliability: the lag
              that appears when your connection is busy.
            </p>

            <p className="home-hero-description">
              Speed tests report throughput. Bufferbloat.org measures whether
              the network still responds while download and upload traffic are
              active, then shows the result in a report that can be inspected
              and cited.
            </p>

            <div className="home-hero-actions">
              <Link href="/test" className="hero-start-button">
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
              <span>example bufferbloat trace</span>
              <strong>latency under load</strong>
            </div>

            <dl className="instrument-metrics">
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
              <div>
                <dt>Added delay</dt>
                <dd>+388 ms</dd>
              </div>
            </dl>

            <div
              className="instrument-trace"
              aria-label="Illustrative latency trace"
            >
              <svg viewBox="0 0 420 202" role="img" aria-labelledby="home-trace-title">
                <title id="home-trace-title">
                  Example trace where latency rises while traffic is active
                </title>
                <line x1="42" y1="132" x2="392" y2="132" className="trace-axis" />
                <line x1="42" y1="26" x2="392" y2="26" className="trace-grid" />
                <line x1="42" y1="79" x2="392" y2="79" className="trace-grid" />
                <text x="10" y="29" className="trace-axis-label">500</text>
                <text x="10" y="82" className="trace-axis-label">250</text>
                <text x="18" y="135" className="trace-axis-label">0</text>
                <text x="7" y="18" className="trace-axis-label">ms</text>
                <rect x="42" y="22" width="104" height="110" className="trace-zone trace-zone-quiet" />
                <rect x="146" y="22" width="122" height="110" className="trace-zone trace-zone-download" />
                <rect x="268" y="22" width="124" height="110" className="trace-zone trace-zone-upload" />
                <line x1="146" y1="22" x2="146" y2="132" className="trace-phase-break" />
                <line x1="268" y1="22" x2="268" y2="132" className="trace-phase-break" />
                <path
                  className="trace-line trace-line-reference"
                  d="M42 122 L66 123 L90 121 L114 122 L138 121 L162 122 L186 121 L210 122 L234 121 L258 122 L282 121 L306 122 L330 121 L354 122 L378 121 L392 122"
                />
                <path
                  className="trace-line trace-line-quiet"
                  d="M42 126 L64 125 L86 126 L108 124 L130 125 L144 124"
                />
                <path
                  className="trace-line trace-line-download"
                  d="M156 111 L174 103 L192 107 L210 96 L228 101 L246 90 L262 94"
                />
                <path
                  className="trace-line trace-line-upload"
                  d="M278 68 L296 44 L314 54 L332 36 L350 49 L368 31 L388 40"
                />
                <text x="42" y="154" className="trace-label">quiet</text>
                <text x="160" y="154" className="trace-label">download</text>
                <text x="286" y="154" className="trace-label">upload</text>
                <g className="trace-legend">
                  <line x1="42" y1="180" x2="58" y2="180" className="legend-quiet" />
                  <text x="64" y="184">quiet</text>
                  <line x1="110" y1="180" x2="126" y2="180" className="legend-download" />
                  <text x="132" y="184">download</text>
                  <line x1="208" y1="180" x2="224" y2="180" className="legend-upload" />
                  <text x="230" y="184">upload</text>
                  <line x1="288" y1="180" x2="304" y2="180" className="legend-reference" />
                  <text x="310" y="184">quiet median</text>
                </g>
              </svg>
            </div>

            <p>
              Illustrative data. The live test reports measured quiet latency,
              download latency under load, upload latency under load, and
              throughput.
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
          <h2>Throughput is not reliability</h2>
          <p>
            A connection can show high download speed and still feel unreliable
            if latency rises when the line is busy. That is why calls freeze,
            games stutter, and pages stall during ordinary network use.
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
