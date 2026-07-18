import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bufferbloat Test Methodology Hub",
  description:
    "Methodology hub for the Bufferbloat.org browser test: measurement flow, scoring, median ping, p95 latency spread, privacy, and CSV export fields.",
  alternates: {
    canonical: "https://bufferbloat.org/docs",
  },
  openGraph: {
    title: "Bufferbloat Test Methodology Hub",
    description:
      "Inspect how Bufferbloat.org measures internet reliability and latency under load in the browser.",
    url: "https://bufferbloat.org/docs",
  },
};

const technicalDetailFields = [
  {
    variable: "grade",
    value: "A+ through F",
    description:
      "Overall bufferbloat grade computed from quiet latency, loaded latency, and latency movement under download/upload load.",
  },
  {
    variable: "measured_at",
    value: "ISO timestamp",
    description:
      "Browser-side completion time for the run. This is the time attached to the exported scorecard.",
  },
  {
    variable: "test_duration",
    value: "seconds or m:ss",
    description:
      "Elapsed time from measurement start through result computation, displayed in the same compact format as the scorecard.",
  },
  {
    variable: "quiet_latency_samples_ms",
    value: "comma-separated milliseconds",
    description:
      "Raw scored latency / ping samples collected during the quiet phase before intentional load is applied.",
  },
  {
    variable: "download_latency_samples_ms",
    value: "comma-separated milliseconds",
    description:
      "Raw scored latency / ping samples collected while download load is active, after the settling interval is excluded.",
  },
  {
    variable: "upload_latency_samples_ms",
    value: "comma-separated milliseconds",
    description:
      "Raw scored latency / ping samples collected while upload load is active, after the settling interval is excluded.",
  },
  {
    variable: "quiet_median_latency_ms",
    value: "milliseconds",
    description:
      "Median latency / ping before intentional download or upload traffic is applied.",
  },
  {
    variable: "download_loaded_latency_ms",
    value: "milliseconds",
    description:
      "Median latency / ping while the download load phase is active, after the settling interval is excluded.",
  },
  {
    variable: "upload_loaded_latency_ms",
    value: "milliseconds",
    description:
      "Median latency / ping while the upload load phase is active, after the settling interval is excluded.",
  },
  {
    variable: "download_stress_ms",
    value: "milliseconds",
    description:
      "Download-loaded median latency minus quiet median latency. Positive values mean added delay under download pressure.",
  },
  {
    variable: "upload_stress_ms",
    value: "milliseconds",
    description:
      "Upload-loaded median latency minus quiet median latency. Positive values mean added delay under upload pressure.",
  },
  {
    variable: "worst_loaded_latency_ms",
    value: "milliseconds",
    description:
      "Higher of the download-loaded and upload-loaded median latency values.",
  },
  {
    variable: "quiet_latency_spread_ms",
    value: "milliseconds",
    description:
      "95th percentile scored latency / ping minus the median during the quiet phase. This shows the upper-end spread of normal ping before intentional load.",
  },
  {
    variable: "download_latency_spread_ms",
    value: "milliseconds",
    description:
      "95th percentile scored latency / ping minus the median during download load. This is shown as a diagnostic tail-latency signal.",
  },
  {
    variable: "upload_latency_spread_ms",
    value: "milliseconds",
    description:
      "95th percentile scored latency / ping minus the median during upload load. This is shown as a diagnostic tail-latency signal.",
  },
  {
    variable: "quiet_application_tail_ms",
    value: "milliseconds",
    description:
      "Robust quiet-line upper-tail estimate used for application-fit scoring. For small sample counts, this leans closer to p90-style spread so isolated spikes do not dominate the rating.",
  },
  {
    variable: "download_application_tail_ms",
    value: "milliseconds",
    description:
      "Robust download-load upper-tail estimate used for application-fit scoring. The visible p95 spread remains available as a diagnostic metric.",
  },
  {
    variable: "upload_application_tail_ms",
    value: "milliseconds",
    description:
      "Robust upload-load upper-tail estimate used for application-fit scoring. The visible p95 spread remains available as a diagnostic metric.",
  },
  {
    variable: "download_throughput_mbps",
    value: "Mbps",
    description:
      "Estimated downstream throughput measured during the download load phase.",
  },
  {
    variable: "upload_throughput_mbps",
    value: "Mbps",
    description:
      "Estimated upstream throughput measured during the upload load phase.",
  },
  {
    variable: "quiet_scored_samples",
    value: "count",
    description:
      "Number of quiet latency samples included in the displayed median and score calculation.",
  },
  {
    variable: "download_scored_samples",
    value: "count",
    description:
      "Number of download-loaded latency samples included after warm-up and settling exclusions.",
  },
  {
    variable: "upload_scored_samples",
    value: "count",
    description:
      "Number of upload-loaded latency samples included after warm-up and settling exclusions.",
  },
  {
    variable: "total_scored_latency_samples",
    value: "count",
    description:
      "Total quiet, download-loaded, and upload-loaded latency samples used for the displayed medians and grade.",
  },
  {
    variable: "latency_probe",
    value: "endpoint name",
    description:
      "Latency probe endpoint used for small ping-like browser requests during the test.",
  },
  {
    variable: "download_stream_count",
    value: "streams",
    description:
      "Number of parallel browser download requests used to create downstream load.",
  },
  {
    variable: "download_payload_size_mb",
    value: "MB",
    description:
      "Size of the payload file requested by each download stream.",
  },
  {
    variable: "upload_stream_count",
    value: "streams",
    description:
      "Number of parallel browser upload requests used to create upstream load.",
  },
  {
    variable: "upload_chunk_size_mb",
    value: "MB",
    description:
      "Size of the repeated upload payload chunk sent by each upload stream.",
  },
  {
    variable: "warm_up",
    value: "inclusion rule",
    description:
      "Indicates that session warm-up and quiet-line ping warm-up requests are excluded from the scored medians.",
  },
  {
    variable: "quiet_warmup_period_sec",
    value: "seconds",
    description:
      "Unscored quiet-line latency probe interval excluded before baseline latency samples are recorded.",
  },
  {
    variable: "settling_period_sec",
    value: "seconds",
    description:
      "Initial interval excluded from loaded phases so throughput and latency are scored after load begins to stabilize.",
  },
  {
    variable: "web_browsing_score",
    value: "0-100 score",
    description:
      "Application-fit score for web browsing, derived from loaded latency, latency movement, and a light robust-tail adjustment.",
  },
  {
    variable: "video_streaming_score",
    value: "0-100 score",
    description:
      "Application-fit score for video streaming, weighted more heavily toward download throughput with some latency-stability adjustment.",
  },
  {
    variable: "audio_calls_score",
    value: "0-100 score",
    description:
      "Application-fit score for audio calls, derived from baseline latency, latency movement, robust tail latency, and minimum upload capacity.",
  },
  {
    variable: "video_calls_score",
    value: "0-100 score",
    description:
      "Application-fit score for video calls, derived from baseline latency, latency movement, robust tail latency, download throughput, and upload throughput.",
  },
  {
    variable: "low_latency_games_score",
    value: "0-100 score",
    description:
      "Application-fit score for low-latency games, weighted toward low baseline latency, low added latency under load, and robust tail latency.",
  },
  {
    variable: "cloud_backup_score",
    value: "0-100 score",
    description:
      "Application-fit score for cloud backup, weighted toward upload throughput with a latency-stability adjustment.",
  },
  {
    variable: "export_contents",
    value: "privacy statement",
    description:
      "States that the CSV export contains measurement data only and excludes IP address, location, browser fingerprint, and device identity.",
  },
];

export default function Page() {
  return (
    <main className="page-shell resource-page docs-page">
      <p className="eyebrow">documentation</p>

      <h1 className="page-title compact">Methodology hub</h1>

      <p className="page-copy">
        Bufferbloat.org is designed to be inspectable. This is the trust layer:
        how the browser test runs, what is scored, why the scorecard uses
        median ping and p95 latency spread, what can be exported, and where the
        limits are.
      </p>

      <div className="resource-top-action">
        <Link href="/test">Run the bufferbloat test</Link>
        <span>Then use this page to inspect how the result was produced.</span>
      </div>

      <section className="resource-grid" aria-label="Methodology hub links">
        <article>
          <span>test flow</span>
          <h2>How the browser test runs</h2>
          <p>
            Warm-up, quiet-line ping, download load, upload load, and result
            computation.
          </p>
          <Link className="resource-card-link" href="#browser-test-flow">
            Jump to test flow
          </Link>
        </article>

        <article>
          <span>reference point</span>
          <h2>Why median ping is used</h2>
          <p>
            The scorecard uses the middle of the measured samples so one odd
            browser hiccup does not become the whole story.
          </p>
          <Link className="resource-card-link" href="/learn/median-ping-vs-average-ping">
            Read median guide
          </Link>
        </article>

        <article>
          <span>upper delay</span>
          <h2>Why p95 latency spread is used</h2>
          <p>
            The test looks at repeated high-delay behavior instead of showing a
            vague jitter number or one worst ping.
          </p>
          <Link className="resource-card-link" href="/learn/latency-spread-vs-jitter">
            Read spread guide
          </Link>
        </article>

        <article>
          <span>export</span>
          <h2>How to inspect and export your data</h2>
          <p>
            The result page includes a technical drawer and CSV export so the
            measurement can be reviewed outside the website.
          </p>
          <Link className="resource-card-link" href="/learn/technical-details-export">
            Read export guide
          </Link>
        </article>

        <article>
          <span>field reference</span>
          <h2>Technical-detail export fields</h2>
          <p>
            Stable variable names, value types, and definitions for the CSV
            export and technical table.
          </p>
          <Link className="resource-card-link" href="#technical-detail-export-fields">
            Jump to fields
          </Link>
        </article>

        <article>
          <span>limits</span>
          <h2>Limits and privacy</h2>
          <p>
            What a browser test can and cannot promise, what is retained, and
            what the export deliberately excludes.
          </p>
          <Link className="resource-card-link" href="#limits-and-privacy">
            Jump to limits
          </Link>
        </article>
      </section>

      <section className="resource-grid" id="browser-test-flow">
        <article>
          <span>phase 1</span>
          <h2>Warm-up</h2>
          <p>
            Small preflight ping, download, upload, and quiet-line ping requests
            prepare the browser path. These samples are excluded from final
            medians.
          </p>
        </article>

        <article>
          <span>phase 2</span>
          <h2>Quiet latency</h2>
          <p>
            The test first warms the quiet ping path, then samples baseline
            latency before adding download or upload pressure.
          </p>
        </article>

        <article>
          <span>phase 3</span>
          <h2>Download load</h2>
          <p>
            The browser creates download pressure with parallel streams and
            keeps probing latency during a short unscored settling period
            before recording the scored samples.
          </p>
        </article>

        <article>
          <span>phase 4</span>
          <h2>Upload load</h2>
          <p>
            The browser sends repeated upload chunks, keeps probing during the
            unscored ramp period, then records latency while upload pressure is
            established.
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
        <h2>Measurement method</h2>
        <p>
          The browser test uses median-style reporting, a Cloudflare Speed
          latency probe, a 100 MB download payload repeated across four
          streams, and repeated 1 MB upload chunks across three streams. The
          result grade is primarily about latency stability under load; low
          throughput is reported separately and is not automatically treated as
          bufferbloat. Latency spread is computed from the scored latency
          samples as 95th percentile ping minus median ping for each phase. It
          remains visible as a diagnostic tail-latency signal. Application
          performance uses a more robust upper-tail estimate when sample counts
          are small, so one or two isolated spikes can be shown without
          dominating the rating.
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
          uses orange for quiet-line samples, blue for download-loaded samples,
          purple for upload-loaded samples, and highlighted median ping dots
          for the final comparison.
        </p>

        <p>
          The technical-details drawer contains the structured measurement
          record used by the scorecard: phase medians, stress deltas,
          p95 latency spread, robust application-tail estimates, throughput
          estimates, scored sample counts, raw scored latency sample lists,
          sample ranges, method notes, and
          application-performance scoring. The same record can be exported as
          CSV for review.
        </p>
      </section>

      <section className="resource-note" id="technical-detail-export-fields">
        <h2>Technical-detail export fields</h2>
        <p>
          The result page exposes a technical-details drawer and CSV export.
          The scorecard keeps the table compact, while this section documents
          what each exported variable means. The CSV export uses stable
          variable names and raw values so the record can be reviewed in a
          spreadsheet or cited in a technical report.
          For the user-facing explanation, read{" "}
          <Link href="/learn/technical-details-export">
            how to inspect and export your test data
          </Link>.
        </p>

        <div className="technical-field-table-wrap">
          <table className="technical-field-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Value type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {technicalDetailFields.map((field) => (
                <tr key={field.variable}>
                  <th scope="row">{field.variable}</th>
                  <td>{field.value}</td>
                  <td>{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="resource-note" id="limits-and-privacy">
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

        <p>
          Bufferbloat.org records first-party operational analytics for test
          quality and shared result links: session/test events, success or
          failure, coarse location from hosting headers, broad browser/OS/device
          category, bucketed viewport, measured results, chart samples, and
          application-fit scores. It does not store IP addresses, precise
          geolocation, full user-agent strings, or fingerprinting signals.
        </p>

        <p>
          Shared result pages are backed by the same completed-test analytics
          record; they do not create a second copy of the result. Analytics and
          shared result records are retained for up to 180 days and are deleted
          automatically after that window.
        </p>

        <div className="resource-links">
          <Link href="/test">
            Run the bufferbloat test
          </Link>
          <Link href="/privacy">
            Privacy policy
          </Link>
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
          <a href="/learn#authoritative-resources">
            Further reading and external resources
          </a>
        </div>
      </section>
    </main>
  );
}
