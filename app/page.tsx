import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="home-hero">
        <p className="home-kicker">bufferbloat test</p>

        <h1>Test your internet responsiveness under load</h1>

        <p className="home-lede">
          Most speed tests only measure bandwidth. Bufferbloat.org checks whether
          your connection stays responsive while downloads and uploads are active.
        </p>

        <Link href="/test" className="primary-button">
          Run the bufferbloat test
        </Link>
      </section>

      <section className="home-panel">
        <h2>What this test measures</h2>

        <div className="home-steps">
          <article>
            <span>01</span>
            <h3>Quiet ping latency</h3>
            <p>Measures baseline response time before adding traffic.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Download latency</h3>
            <p>Checks whether ping rises while receiving data.</p>
          </article>

          <article>
            <span>03</span>
            <h3>Upload latency</h3>
            <p>Checks whether ping rises while sending data.</p>
          </article>
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
    </main>
  );
}
