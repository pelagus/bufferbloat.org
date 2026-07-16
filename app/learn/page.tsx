import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Learn About Bufferbloat",
  description:
    "Learn what bufferbloat is, why speed tests miss it, why latency under load matters, and which open-source resources explain how to fix it.",
  alternates: {
    canonical: "https://bufferbloat.org/learn",
  },
  openGraph: {
    title: "Learn About Bufferbloat",
    description:
      "A practical guide to bufferbloat, internet reliability, loaded latency, and authoritative open-source networking resources.",
    url: "https://bufferbloat.org/learn",
  },
};

export default function Page() {
  const linkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
  };

  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">education</p>

      <h1 className="page-title compact">Learn about bufferbloat</h1>

      <p className="page-copy">
        Bufferbloat is excessive latency caused by queues that grow too large
        when a network connection is busy. It is one reason a connection can
        look fast in a speed test but still feel slow in real use.
      </p>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>browser test</span>
          <h2>Measure your connection before reading too far.</h2>
          <p>
            The test takes less than a minute and gives the examples on this
            page a concrete reference: quiet ping, download stress, upload
            stress, throughput, and a bufferbloat grade.
          </p>

          <div className="guide-test-actions">
            <Link href="/test?start=1" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs" className="guide-secondary-action">
              Read methodology
            </Link>
          </div>
        </div>

        <div className="guide-test-micro" aria-hidden="true">
          <div>
            <span>quiet</span>
            <strong>24 ms</strong>
            <em>baseline ping</em>
          </div>
          <div>
            <span>download</span>
            <strong>+94</strong>
            <em>stress delta</em>
          </div>
          <div>
            <span>upload</span>
            <strong>+388</strong>
            <em>bufferbloat signal</em>
          </div>
        </div>
      </section>

      <section className="resource-grid">
        <article>
          <span>01</span>
          <h2>Throughput is not reliability</h2>
          <p>
            Throughput measures how much data can move. Reliability asks
            whether the network keeps answering quickly while that movement is
            happening. Both matter, but they explain different user
            experiences.
          </p>
        </article>

        <article>
          <span>02</span>
          <h2>Idle ping is incomplete</h2>
          <p>
            A quiet connection can have excellent ping. Bufferbloat appears when
            a download, upload, backup, or video stream fills queues and pushes
            interactive traffic behind bulk traffic.
          </p>
        </article>

        <article>
          <span>03</span>
          <h2>Loaded latency is the signal</h2>
          <p>
            Measuring latency while traffic is active shows whether the
            connection remains usable under everyday pressure.
          </p>
        </article>
      </section>

      <section className="resource-note">
        <h2>Why upload often matters</h2>
        <p>
          Many home connections have much less upload capacity than download
          capacity. A cloud backup, video call, or large file upload can fill
          the upstream path and make the whole connection feel delayed.
        </p>
      </section>

      <section className="resource-note learning-directory" id="authoritative-resources">
        <div>
          <p className="eyebrow">deep dives</p>
          <h2>Choose the guide that matches the question</h2>
        </div>

        <p>
          Bufferbloat.org is built around one idea, but people arrive from
          different problems: calls breaking up, games feeling delayed, speed
          tests that look fine, or a general sense that the connection is not
          reliable. Start with the closest question, then follow the links from
          there.
        </p>

        <div className="learning-path-label">
          <span>Start here</span>
          <p>The core concepts behind the test.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Core concept</span>
            <h3>
              <Link href="/learn/bufferbloat-speed-test">
                Bufferbloat speed test
              </Link>
            </h3>
            <p>
              Why a normal speed test can look excellent while calls, games,
              and browsing still degrade when the line is busy.
            </p>
          </article>

          <article>
            <span>Measurement reference</span>
            <h3>
              <Link href="/learn/what-bufferbloat-speed-test-measures">
                What the test measures
              </Link>
            </h3>
            <p>
              The plain-language reference for throughput, quiet ping, loaded
              ping, latency spread, and what each value means.
            </p>
          </article>

          <article>
            <span>Technical signal</span>
            <h3>
              <Link href="/learn/latency-under-load">
                Latency under load
              </Link>
            </h3>
            <p>
              What loaded latency means, how it differs from idle ping, and why
              it is the core signal in a bufferbloat test.
            </p>
          </article>

          <article>
            <span>Technical signal</span>
            <h3>
              <Link href="/learn/latency-spread-vs-jitter">
                Why we don’t show jitter
              </Link>
            </h3>
            <p>
              Why changing ping can matter as much as the average ping number,
              and why this test uses latency spread as a practical stability
              signal.
            </p>
          </article>
        </div>

        <div className="learning-path-label">
          <span>If you are judging the connection</span>
          <p>Use these when the question is broader than one app.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Connection quality</span>
            <h3>
              <Link href="/learn/internet-connection-quality">
                Internet connection quality
              </Link>
            </h3>
            <p>
              Why connection quality combines throughput, latency, loaded ping,
              and variation instead of relying on Mbps alone.
            </p>
          </article>

          <article>
            <span>Reliability</span>
            <h3>
              <Link href="/learn/internet-reliability-test">
                Internet reliability test
              </Link>
            </h3>
            <p>
              How to check whether a fast-looking connection stays usable when
              calls, browsing, uploads, and shared use are active.
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
              Why useful latency testing compares normal ping with ping during
              download and upload load.
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
              What connection stability means when latency changes under real
              download and upload pressure.
            </p>
          </article>

          <article>
            <span>Whole network</span>
            <h3>
              <Link href="/learn/network-stability-test">
                Network stability test
              </Link>
            </h3>
            <p>
              How to measure whether a network stays steady when download and
              upload traffic are active.
            </p>
          </article>
        </div>

        <div className="learning-path-label">
          <span>If a specific app is suffering</span>
          <p>Use these when the symptom is calls, meetings, games, or streaming.</p>
        </div>

        <div className="learning-resource-list">
          <article>
            <span>Calls</span>
            <h3>
              <Link href="/learn/calls-internet-test">
                Calls internet test
              </Link>
            </h3>
            <p>
              Why video and audio calls depend on stable latency under load,
              especially on shared connections.
            </p>
          </article>

          <article>
            <span>Video meetings</span>
            <h3>
              <Link href="/learn/zoom-internet-test">
                Zoom internet test
              </Link>
            </h3>
            <p>
              An independent guide to the connection behavior that affects
              video meetings when the line is busy.
            </p>
          </article>

          <article>
            <span>Video meetings</span>
            <h3>
              <Link href="/learn/zoom-network-test">
                Zoom network test
              </Link>
            </h3>
            <p>
              How to test latency, upload behavior, and queueing delay for
              meeting-like network conditions.
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
              Why low-latency games need stable ping under load, not only a
              good idle ping number.
            </p>
          </article>

          <article>
            <span>Planned deep dives</span>
            <h3>Speed, throughput, and perceived quality</h3>
            <p>
              Next planned guides: why throughput is not the whole meaning of
              speed, why fast internet can feel slow, and why slower
              connections can still feel usable when latency stays stable.
            </p>
          </article>
        </div>
      </section>

      <section className="resource-note learning-directory">
        <div>
          <p className="eyebrow">further reading</p>
          <h2>Authoritative resources</h2>
        </div>

        <p>
          These projects, papers, standards, and tools are useful starting
          points for understanding bufferbloat, measuring loaded latency more
          deeply, and fixing it in real networks.
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
