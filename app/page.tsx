import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-panel home-as-test">
        <div className="hero-copy">
          <div className="hero-kicker">BUFFERBLOAT TEST</div>

          <h1>Fast internet can still feel bad.</h1>

          <p className="hero-subtitle">
            Most speed tests measure bandwidth. Bufferbloat.org measures whether
            your connection stays responsive while busy.
          </p>

          <Link href="/test" className="hero-start-button">
            Run the bufferbloat test
          </Link>
        </div>
      </section>

      <section className="home-grid">
        <article>
          <h2>Why bufferbloat matters</h2>
          <p>
            A connection can have high download speed and still feel bad if
            latency spikes under load. That causes video calls to freeze, games
            to lag, and pages to stall.
          </p>
        </article>

        <article>
          <h2>What makes this different</h2>
          <p>
            This test focuses on responsiveness, not just throughput. It compares
            quiet latency with latency during download and upload pressure.
          </p>
        </article>
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
