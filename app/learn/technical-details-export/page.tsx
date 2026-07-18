import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Inspect and Export Your Bufferbloat Test Data",
  description:
    "How Bufferbloat.org exposes raw ping samples, medians, p95 latency spread, throughput, and CSV export data for each test result.",
  alternates: {
    canonical: "https://bufferbloat.org/learn/technical-details-export",
  },
  openGraph: {
    title: "How to Inspect and Export Your Bufferbloat Test Data",
    description:
      "Open the technical details drawer, inspect the measurement record, and export the result as CSV.",
    url: "https://bufferbloat.org/learn/technical-details-export",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">measurement guide</p>

      <h1 className="page-title compact">How to inspect and export your test data</h1>

      <p className="page-copy">
        A bufferbloat test result should not be a black box. Every completed
        Bufferbloat.org scorecard includes a technical details drawer and a CSV
        export so the measurement can be checked, compared, or taken away from
        the website.
      </p>

      <div className="resource-top-action">
        <Link href="/test">Run the bufferbloat test</Link>
        <span>Open the technical details after the result appears.</span>
      </div>

      <section className="resource-note">
        <h2>What the export is for</h2>
        <p>
          The scorecard is intentionally readable: grade, assessment, application
          performance, and a chart. The export is for the next layer down. It
          lets you inspect the actual values behind that scorecard instead of
          accepting a single number on trust.
        </p>

        <p>
          That can be useful when you want to compare repeated runs, document a
          router or ISP problem, include evidence in a support request, or check
          whether the result was shaped by one strange run.
        </p>
      </section>

      <section className="resource-note">
        <h2>What is included</h2>
        <p>
          The export contains the same measurement record used by the result
          page. It includes the raw scored ping samples, phase medians, p95
          latency spread, load deltas, throughput estimates, sample counts,
          method settings, and application performance ratings.
        </p>

        <ul className="resource-measure-list">
          <li>
            <strong>Raw scored ping samples</strong>
            <span>
              Comma-separated milliseconds for quiet line, download on, and
              upload on phases.
            </span>
          </li>
          <li>
            <strong>Median ping and loaded deltas</strong>
            <span>
              The center of each phase and how much delay download or upload
              added compared with the quiet line.
            </span>
          </li>
          <li>
            <strong>P95 latency spread</strong>
            <span>
              The gap between median ping and the upper-delay behavior in each
              phase.
            </span>
          </li>
          <li>
            <strong>Throughput and method settings</strong>
            <span>
              Download/upload estimates plus the stream counts, payload sizes,
              warm-up rules, and settling rules used for the run.
            </span>
          </li>
        </ul>
      </section>

      <section className="metric-decision-block" aria-labelledby="export-decision-question">
        <p className="metric-decision-question" id="export-decision-question">
          <strong>Question:</strong> what should a transparent browser test let
          you take away after the scorecard appears?
        </p>

        <div className="resource-grid metric-choice-grid" aria-label="What the technical export is designed to do">
          <article>
            <span>Readable result</span>
            <h2>Explain what happened</h2>
            <p>
              The scorecard gives the human answer first: whether the
              connection stayed usable when the line was busy.
            </p>
          </article>

          <article>
            <span>Inspectable record</span>
            <h2>Show the underlying data</h2>
            <p>
              Technical details expose the samples and derived values that led
              to the grade, assessment, and application performance.
            </p>
          </article>

          <article>
            <span>Portable export</span>
            <h2>Let you keep the evidence</h2>
            <p>
              CSV makes the result usable outside Bufferbloat.org: spreadsheet,
              support ticket, comparison log, or technical report.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-note">
        <h2>What is deliberately excluded</h2>
        <p>
          The CSV export is measurement data, not a user profile. It does not
          include your IP address, precise location, browser fingerprint,
          full user-agent string, or device identity. Shared result pages are
          backed by the same completed-test record rather than a second copy of
          the result.
        </p>

        <p>
          The exact list of exported fields is kept in the{" "}
          <Link href="/docs#technical-detail-export-fields">
            technical-detail export field reference
          </Link>. The broader retention and privacy notes are in the{" "}
          <Link href="/docs#limits-and-privacy">methodology hub</Link>.
        </p>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>try it on your line</span>
          <h2>Run a test, then open the technical details.</h2>
          <p>
            The normal scorecard tells you what the result means. The export
            gives you the data behind it.
          </p>

          <div className="guide-test-actions">
            <Link href="/test" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs#technical-detail-export-fields" className="guide-secondary-action">
              Read the field reference
            </Link>
          </div>
        </div>
      </section>

      <section className="resource-related" aria-label="Continue reading">
        <p className="eyebrow">continue reading</p>
        <h2>Related measurement guides</h2>
        <p>
          These explain the main values you will see in the technical export.
        </p>

        <div className="resource-links">
          <Link href="/learn/what-bufferbloat-speed-test-measures">
            What the bufferbloat test measures
          </Link>
          <Link href="/learn/latency-spread-vs-jitter">
            Why we use latency spread, not jitter
          </Link>
          <Link href="/learn/median-ping-vs-average-ping">
            Why we use median ping
          </Link>
          <Link href="/docs">Methodology hub</Link>
        </div>
      </section>
    </main>
  );
}
