import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bufferbloat Test Methodology",
  description:
    "Technical notes for the Bufferbloat.org browser test: warm-up, latency under load, download stress, upload stress, scoring, privacy, and CSV export.",
  alternates: {
    canonical: "https://bufferbloat.org/docs",
  },
  openGraph: {
    title: "Bufferbloat Test Methodology",
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
    variable: "quiet_median_latency",
    value: "milliseconds",
    description:
      "Median latency / ping before intentional download or upload traffic is applied.",
  },
  {
    variable: "download_loaded_latency",
    value: "milliseconds",
    description:
      "Median latency / ping while the download load phase is active, after the settling interval is excluded.",
  },
  {
    variable: "upload_loaded_latency",
    value: "milliseconds",
    description:
      "Median latency / ping while the upload load phase is active, after the settling interval is excluded.",
  },
  {
    variable: "download_stress",
    value: "milliseconds",
    description:
      "Download-loaded median latency minus quiet median latency. Positive values mean added delay under download pressure.",
  },
  {
    variable: "upload_stress",
    value: "milliseconds",
    description:
      "Upload-loaded median latency minus quiet median latency. Positive values mean added delay under upload pressure.",
  },
  {
    variable: "worst_loaded_latency",
    value: "milliseconds",
    description:
      "Higher of the download-loaded and upload-loaded median latency values.",
  },
  {
    variable: "download_throughput",
    value: "Mbps",
    description:
      "Estimated downstream throughput measured during the download load phase.",
  },
  {
    variable: "upload_throughput",
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
    variable: "download_payload_size",
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
    variable: "upload_chunk_size",
    value: "MB",
    description:
      "Size of the repeated upload payload chunk sent by each upload stream.",
  },
  {
    variable: "warm_up",
    value: "inclusion rule",
    description:
      "Indicates that pre-measurement warm-up requests are excluded from the scored medians.",
  },
  {
    variable: "settling_period",
    value: "seconds",
    description:
      "Initial interval excluded from loaded phases so throughput and latency are scored after load begins to stabilize.",
  },
  {
    variable: "web_browsing",
    value: "0-100 score",
    description:
      "Application-fit score for web browsing, derived from loaded latency and latency movement.",
  },
  {
    variable: "video_streaming",
    value: "0-100 score",
    description:
      "Application-fit score for video streaming, weighted more heavily toward download throughput with some latency-stability adjustment.",
  },
  {
    variable: "voice_calls",
    value: "0-100 score",
    description:
      "Application-fit score for voice calls, derived from baseline latency, latency movement, and minimum upload capacity.",
  },
  {
    variable: "video_calls",
    value: "0-100 score",
    description:
      "Application-fit score for video calls, derived from baseline latency, latency movement, download throughput, and upload throughput.",
  },
  {
    variable: "online_gaming",
    value: "0-100 score",
    description:
      "Application-fit score for online gaming, weighted toward low baseline latency and low added latency under load.",
  },
  {
    variable: "cloud_backup",
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
        <h2>Technical-detail export fields</h2>
        <p>
          The result page exposes a technical-details drawer and CSV export.
          The export uses stable variable names, short descriptions, and raw
          values so the record can be reviewed in a spreadsheet or cited in a
          technical report.
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

        <p>
          Bufferbloat.org records first-party operational analytics for test
          quality: session/test events, success or failure, coarse location from
          hosting headers, broad browser/OS/device category, bucketed viewport,
          and measured results. It does not store IP addresses, precise
          geolocation, full user-agent strings, or fingerprinting signals.
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
