export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">documentation</p>

      <h1 className="page-title compact">Methodology and technical notes</h1>

      <p className="page-copy">
        Bufferbloat.org is designed to be inspectable. This page summarizes what
        the browser test measures, how the phases are structured, and where to
        review the source.
      </p>

      <section className="resource-grid">
        <article>
          <span>phase 1</span>
          <h2>Warm-up</h2>
          <p>
            Small preflight ping, download, and upload requests prepare the
            browser path. These samples are excluded from final medians.
          </p>
        </article>

        <article>
          <span>phase 2</span>
          <h2>Quiet latency</h2>
          <p>
            The test samples baseline latency before adding download or upload
            pressure.
          </p>
        </article>

        <article>
          <span>phase 3</span>
          <h2>Loaded latency</h2>
          <p>
            The test measures latency while download and upload pressure are
            active, excluding an initial settling period.
          </p>
        </article>
      </section>

      <section className="resource-note">
        <h2>Current public methodology</h2>
        <p>
          The browser test uses median-style reporting, a Cloudflare Speed
          latency probe, a 100 MB download payload repeated across parallel
          streams, and repeated upload chunks to measure responsiveness under
          load.
        </p>

        <div className="resource-links">
          <a
            href="https://github.com/pelagus/bufferbloat.org/blob/main/MEASUREMENT_METHODOLOGY.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Methodology document
          </a>
          <a
            href="https://github.com/pelagus/bufferbloat.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source repository
          </a>
          <a
            href="https://queue.acm.org/detail.cfm?id=2076798"
            target="_blank"
            rel="noopener noreferrer"
          >
            ACM Queue bufferbloat discussion
          </a>
        </div>
      </section>
    </main>
  );
}
