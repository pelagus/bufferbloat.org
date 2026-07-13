export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">documentation</p>

      <h1 className="page-title compact">Methodology and technical notes</h1>

      <p className="page-copy">
        Bufferbloat.org is designed to be inspectable. This page summarizes the
        browser measurement flow, what is scored, what is deliberately excluded,
        and where to inspect the public source.
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
          <h2>Download load</h2>
          <p>
            The browser creates download pressure with parallel streams and
            records latency after a short settling period.
          </p>
        </article>

        <article>
          <span>phase 4</span>
          <h2>Upload load</h2>
          <p>
            The browser sends repeated upload chunks while latency probes
            continue. Upload pressure is often where bufferbloat becomes
            visible.
          </p>
        </article>

        <article>
          <span>phase 5</span>
          <h2>Result computation</h2>
          <p>
            The scorecard compares quiet latency with loaded latency, draws the
            final trace, and exposes the technical record behind the result.
          </p>
        </article>
      </section>

      <section className="resource-note">
        <h2>Current public methodology</h2>
        <p>
          The browser test uses median-style reporting, a Cloudflare Speed
          latency probe, a 100 MB download payload repeated across four
          streams, and repeated 1 MB upload chunks across three streams. The
          result grade is primarily about latency stability under load; low
          throughput is reported separately and is not automatically treated as
          bufferbloat.
        </p>

        <p>
          The running test asks the tab to stay in the foreground. If the tab is
          hidden, the run stops instead of producing a result from throttled or
          paused browser activity.
        </p>
      </section>

      <section className="resource-note">
        <h2>What the scorecard exposes</h2>
        <p>
          Results show quiet latency, download stress, upload stress, download
          throughput, upload throughput, and test duration. The completed chart
          uses black for quiet samples, blue for download-loaded samples, purple
          for upload-loaded samples, and red median lines for the final
          comparison.
        </p>

        <p>
          The technical-details drawer contains the structured measurement
          record used by the scorecard: phase medians, stress deltas,
          throughput estimates, scored sample counts, sample ranges, method
          notes, and application-fit scoring. The same record can be exported
          as CSV for review.
        </p>
      </section>

      <section className="resource-note">
        <h2>Limits and privacy</h2>
        <p>
          Browser networking tests are useful but noisy. Results can be affected
          by browser scheduling, device load, Wi-Fi conditions, VPNs, background
          apps, router queues, ISP congestion, and mobile network variability.
        </p>

        <p>
          The technical export contains measurement data only. It does not
          include IP address, location, browser fingerprint, user-agent string,
          or device identity.
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
