import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-panel home-as-test">
        <div className="hero-copy">
          <div className="hero-kicker">OPEN SOURCE INTERNET RESPONSIVENESS TEST</div>

          <h1>Fast internet can still feel slow.</h1>

          <p className="hero-subtitle">
            Most speed tests measure throughput. Bufferbloat.org measures
            whether your connection stays responsive while it is busy.
          </p>

          <Link href="/test" className="hero-start-button">
            Run the test
          </Link>

          <div className="home-trust-strip" aria-label="Project trust signals">
            <span>Open source</span>
            <span>Documented methodology</span>
            <span>Latency under load</span>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <article>
          <h2>Why speed tests miss the problem</h2>
          <p>
            A connection can show high download speed and still feel unreliable
            if latency rises when the line is busy. That is why calls freeze,
            games stutter, and pages stall during ordinary network use.
          </p>
        </article>

        <article>
          <h2>Why this project exists</h2>
          <p>
            This is an open-source test for latency under load, built because
            speed alone does not explain why fast connections still feel slow.
          </p>
          <Link href="/mission" className="home-text-link">
            Read the mission
          </Link>
        </article>
      </section>

      <section className="home-reference-panel">
        <div>
          <p className="eyebrow">public-interest resource</p>
          <h2>Built to be inspected, cited, and improved.</h2>
        </div>

        <p>
          Bufferbloat.org documents how the browser test works, links to source
          code, and keeps limitations visible. The goal is a practical signal
          that users can understand and experts can evaluate.
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

      <section className="home-panel home-latency-demo">
        <div className="signal-card">
          <div className="signal-label">BASELINE RESPONSE</div>
          <div className="signal-value stable">24 ms</div>
        </div>

        <div className="signal-arrow">↓</div>

        <div className="signal-card stressed">
          <div className="signal-label">RESPONSE UNDER PRESSURE</div>
          <div className="signal-value danger">412 ms</div>
        </div>

        <p className="signal-caption">
          Bufferbloat is excessive latency caused by network congestion.
        </p>
      </section>
    </main>
  );
}
