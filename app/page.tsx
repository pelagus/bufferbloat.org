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

      <section className="home-hero-intro">
        <div className="home-hero-grid">
          <div className="hero-copy">
            <p className="home-project-label">
              Open-source internet reliability project
            </p>

            <h1>Internet quality is what happens when the line is busy</h1>

            <p className="hero-subtitle">
              Bufferbloat.org helps explain why a connection can look fast but
              still feel bad during calls, games, browsing, and shared use.
            </p>

            <p className="home-hero-description">
              The project combines a browser bufferbloat test with public
              methodology and plain-language guides, so the result is something
              you can inspect instead of a black-box speed score.
            </p>

            <div className="home-hero-actions">
              <Link href="/test" className="home-test-link">
                Run the test
              </Link>

              <div className="home-hero-links" aria-label="Project references">
                <Link href="/learn">Start learning</Link>
                <Link href="/docs">Methodology</Link>
                <a
                  href="https://github.com/pelagus/bufferbloat.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </div>
            </div>

          </div>

          <aside className="home-signal-panel" aria-label="What the test checks">
            <div>
              <span>01</span>
              <strong>Quiet ping</strong>
              <p>Finds the baseline before the connection is busy.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Loaded ping</strong>
              <p>Checks whether delay rises during download and upload load.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Everyday feel</strong>
              <p>Turns the result into practical reliability signals.</p>
            </div>
          </aside>
        </div>

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
          Everyone should be able to understand whether their internet
          connection is stable, reliable, and ready for everyday life. The
          public test is free, open source, and will
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
