import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Internet Reliability, Stability, and Bufferbloat Guides",
  description:
    "A practical knowledge base for internet reliability, bufferbloat, latency under load, p95 spread, median ping, and open network measurement.",
  alternates: {
    canonical: "https://bufferbloat.org/learn",
  },
  openGraph: {
    title: "Internet Reliability, Stability, and Bufferbloat Guides",
    description:
      "Guides and research references for real-life network quality, bufferbloat, loaded latency, and transparent measurement methods.",
    url: "https://bufferbloat.org/learn",
  },
};

export default function Page() {
  const linkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
  };

  return (
    <main className="page-shell resource-page learn-hub">
      <p className="eyebrow">knowledge base</p>

      <h1 className="page-title compact">Internet reliability, explained</h1>

      <p className="page-copy">
        This is the learning hub for Bufferbloat.org: short guides, measurement
        notes, and research references about what makes an internet connection
        feel reliable in real life. Bufferbloat is the starting point, but the
        bigger question is connection quality under actual use. For why the
        project exists at all, read the <Link href="/mission">mission</Link>.
      </p>

      <section className="learn-hub-callout" aria-label="Run the bufferbloat test">
        <div>
          <span>start with your line</span>
          <h2>Run the test, then use the guides to understand the result.</h2>
          <p>
            The scorecard gives the rest of this page a concrete reference:
            quiet-line ping, ping while download and upload traffic are active,
            throughput, p95 spread, and an overall reliability grade.
          </p>
        </div>

        <div className="guide-test-actions">
          <Link href="/test" className="guide-primary-action">
            Run the bufferbloat test
          </Link>
          <Link href="/docs" className="guide-secondary-action">
            Methodology
          </Link>
        </div>
      </section>

      <section className="resource-note learning-directory">
        <div>
          <p className="eyebrow">article paths</p>
          <h2>Choose the question you are trying to answer</h2>
        </div>

        <p>
          These articles are meant to be complementary. Start with the practical
          question, then follow the links inside each guide when you need the
          measurement details.
        </p>

        <div className="learning-path-label">
          <span>Start here</span>
          <p>The core reference pages behind the scorecard.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Methodology</span>
            <h3>
              <Link href="/docs">
                Measurement methodology and technical docs
              </Link>
            </h3>
            <p>
              The full reference for how the browser test runs, what is scored,
              what is exported, and what the result page deliberately leaves
              out.
            </p>
          </article>

          <article>
            <span>Scorecard reference</span>
            <h3>
              <Link href="/learn/what-bufferbloat-speed-test-measures">
                What a bufferbloat test actually measures
              </Link>
            </h3>
            <p>
              The best first read after running the test: throughput,
              quiet-line ping, loaded ping, p95 spread, and why this is not
              just another speed test.
            </p>
          </article>

          <article>
            <span>Connection quality</span>
            <h3>
              <Link href="/learn/internet-connection-quality">
                What internet connection quality really means
              </Link>
            </h3>
            <p>
              A broader guide to why one number cannot explain whether a line
              feels usable, unreliable, stable, or frustrating in daily use.
            </p>
          </article>

          <article>
            <span>Core signal</span>
            <h3>
              <Link href="/learn/latency-under-load">
                Why latency under load matters
              </Link>
            </h3>
            <p>
              The central bufferbloat concept: ping can look fine when the line
              is quiet, then change when download or upload traffic starts.
            </p>
          </article>

          <article>
            <span>Data export</span>
            <h3>
              <Link href="/learn/technical-details-export">
                How to inspect and export your test data
              </Link>
            </h3>
            <p>
              What the technical details drawer contains, what the CSV export is
              for, and where the exact field definitions live.
            </p>
          </article>
        </div>

        <div className="learning-path-label">
          <span>Measurement concepts</span>
          <p>Why the scorecard uses these specific measurement choices.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Reliability metric</span>
            <h3>
              <Link href="/learn/latency-spread-vs-jitter">
                Why we use latency spread, not jitter
              </Link>
            </h3>
            <p>
              Why p95 spread is more useful than average jitter or worst ping
              for spotting repeated high-delay moments during real load.
            </p>
          </article>

          <article>
            <span>Reference point</span>
            <h3>
              <Link href="/learn/median-ping-vs-average-ping">
                Why we use median ping, not average ping
              </Link>
            </h3>
            <p>
              Why the middle of the measured samples is a better reference
              point for a browser-based reliability test than the arithmetic
              average.
            </p>
          </article>

          <article>
            <span>Planned deep dives</span>
            <h3>Topics this knowledge base should cover next</h3>
            <p>
              I want to cover the topics people actually run into: why
              throughput is not the whole meaning of speed, why fast internet
              can feel slow, why slower connections can still feel usable, how
              Wi-Fi and routers change the result, and what fixes are realistic
              at home.
            </p>
          </article>

        </div>

        <div className="learning-path-label">
          <span>Real-life use cases</span>
          <p>Use these when the problem is how the connection feels.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Reliability</span>
            <h3>
              <Link href="/learn/internet-reliability-test">
                Internet reliability test
              </Link>
            </h3>
            <p>
              Start here if the line feels unpredictable and ordinary tests do
              not explain why calls, browsing, or shared use still suffer.
            </p>
          </article>

          <article>
            <span>Stability</span>
            <h3>
              <Link href="/learn/internet-stability-test">
                Internet stability test
              </Link>
            </h3>
            <p>
              Use this when the connection feels jumpy: fine one moment, then
              suddenly delayed, spiky, or inconsistent under normal use.
            </p>
          </article>

          <article>
            <span>Latency</span>
            <h3>
              <Link href="/learn/internet-latency-test">
                Internet latency test
              </Link>
            </h3>
            <p>
              A guide to ping, response time, and why a quiet latency number is
              not enough to judge real-life network quality.
            </p>
          </article>

          <article>
            <span>Calls and meetings</span>
            <h3>
              <Link href="/learn/calls-internet-test">
                Calls internet test
              </Link>
            </h3>
            <p>
              Why video and audio calls can fail on connections that have
              enough throughput, especially while uploads or other devices are
              active.
            </p>
          </article>

          <article>
            <span>Video meetings</span>
            <h3>
              <Link href="/learn/zoom-internet-test">
                Zoom is right: “Your internet connection is unstable”
              </Link>
            </h3>
            <p>
              Bufferbloat.org is not affiliated with Zoom; this explains the
              network behavior that makes meeting-like traffic degrade under
              load.
            </p>
          </article>

          <article>
            <span>Video meeting results</span>
            <h3>
              <Link href="/learn/video-meeting-test-results">
                How to read video-meeting test results
              </Link>
            </h3>
            <p>
              After running the test, use upload load, download load, quiet
              ping, and latency spread to understand meeting reliability.
            </p>
          </article>

          <article>
            <span>Gaming</span>
            <h3>
              <Link href="/learn/gaming-network-test">
                Gaming network test
              </Link>
            </h3>
            <p>
              Low-latency games expose delay and ping spread quickly, even when
              the connection looks fast in a conventional test.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-note learning-directory">
        <div>
          <p className="eyebrow">bibliography</p>
          <h2>Technical references and further reading</h2>
        </div>

        <p>
          These are sources I respect and consider foundational to this work:
          community projects, standards, algorithms, and tools that shaped how
          Bufferbloat.org thinks about bufferbloat, queue management, loaded
          latency measurement, and practical fixes in real networks.
        </p>

        <div className="learning-resource-list">
          <article>
            <span>Community background</span>
            <h3>
              <a
                href="https://www.bufferbloat.net/projects/bloat/wiki/"
                {...linkProps}
              >
                Bufferbloat Project wiki
              </a>
            </h3>
            <p>
              A readable entry point for symptoms, experiments, fixes, glossary
              material, and the broader history of bufferbloat research.
            </p>
          </article>

          <article>
            <span>Community site</span>
            <h3>
              <a href="https://www.bufferbloat.net/" {...linkProps}>
                Bufferbloat.net
              </a>
            </h3>
            <p>
              The long-running community home for bufferbloat research,
              projects, documentation, and practical deployment notes.
            </p>
          </article>

          <article>
            <span>Historical reference</span>
            <h3>
              <a href="https://queue.acm.org/detail.cfm?id=2076798" {...linkProps}>
                ACM Queue: BufferBloat
              </a>
            </h3>
            <p>
              The 2011 ACM Queue discussion with Vint Cerf, Van Jacobson, Nick
              Weaver, and Jim Gettys that helped bring the problem to wider
              attention.
            </p>
          </article>

          <article>
            <span>IETF recommendation</span>
            <h3>
              <a href="https://www.rfc-editor.org/rfc/rfc7567" {...linkProps}>
                RFC 7567: Active Queue Management
              </a>
            </h3>
            <p>
              IETF recommendations for active queue management, the class of
              techniques used to control queueing delay before buffers fill.
            </p>
          </article>

          <article>
            <span>AQM algorithm</span>
            <h3>
              <a href="https://www.rfc-editor.org/rfc/rfc8289" {...linkProps}>
                RFC 8289: CoDel
              </a>
            </h3>
            <p>
              The RFC for Controlled Delay Active Queue Management, one of the
              foundational approaches to controlling bufferbloat-generated delay.
            </p>
          </article>

          <article>
            <span>Queue scheduler</span>
            <h3>
              <a href="https://www.rfc-editor.org/rfc/rfc8290" {...linkProps}>
                RFC 8290: FQ-CoDel
              </a>
            </h3>
            <p>
              The flow-queueing CoDel scheduler and AQM algorithm, published by
              authors from the bufferbloat community.
            </p>
          </article>

          <article>
            <span>Home-network fix</span>
            <h3>
              <a
                href="https://www.bufferbloat.net/projects/codel/wiki/Cake/"
                {...linkProps}
              >
                CAKE on Bufferbloat.net
              </a>
            </h3>
            <p>
              Documentation for CAKE, a queue management and traffic-shaping
              system designed for home gateways and last-mile connections.
            </p>
          </article>

          <article>
            <span>Router implementation</span>
            <h3>
              <a href="https://openwrt.org/" {...linkProps}>
                OpenWrt
              </a>
            </h3>
            <p>
              Open-source router firmware commonly used with SQM, CAKE, and
              FQ-CoDel to reduce loaded latency on home networks.
            </p>
          </article>

          <article>
            <span>Advanced testing</span>
            <h3>
              <a href="https://flent.org/" {...linkProps}>
                Flent
              </a>
            </h3>
            <p>
              The FLExible Network Tester, widely used for repeatable network
              experiments such as RRUL and loaded-latency testing.
            </p>
          </article>

          <article>
            <span>Open measurement data</span>
            <h3>
              <a href="https://www.measurementlab.net/tests/ndt/" {...linkProps}>
                M-Lab NDT
              </a>
            </h3>
            <p>
              Measurement Lab&apos;s Network Diagnostic Tool and public data
              platform for internet performance research.
            </p>
          </article>

          <article>
            <span>Public speed test</span>
            <h3>
              <a href="https://speed.cloudflare.com/" {...linkProps}>
                Cloudflare Speed Test
              </a>
            </h3>
            <p>
              A public browser-based network performance test that reports
              throughput, latency, latency spread, and related metrics.
            </p>
          </article>

          <article>
            <span>Consumer comparison</span>
            <h3>
              <a href="https://www.waveform.com/tools/bufferbloat" {...linkProps}>
                Waveform Bufferbloat Test
              </a>
            </h3>
            <p>
              A popular consumer bufferbloat test and useful point of comparison
              for explaining loaded latency to a broader audience.
            </p>
          </article>

          <article>
            <span>ISP operations</span>
            <h3>
              <a href="https://libreqos.com/" {...linkProps}>
                LibreQoS
              </a>
            </h3>
            <p>
              Open-source quality-of-experience tooling for ISPs, closely
              aligned with modern queue management and latency-aware networks.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
