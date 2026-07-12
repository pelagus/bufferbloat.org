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

      <section className="resource-grid">
        <article>
          <span>01</span>
          <h2>Throughput is not responsiveness</h2>
          <p>
            Throughput measures how much data can move. Responsiveness measures
            how quickly the network answers while that movement is happening.
            Both matter, but they explain different user experiences.
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

      <section className="resource-note learning-directory">
        <div>
          <p className="eyebrow">further reading</p>
          <h2>Authoritative resources</h2>
        </div>

        <p>
          Bufferbloat.org is one small browser-based test in a much larger
          ecosystem. These projects, papers, standards, and tools are useful
          starting points for understanding the problem, measuring it more
          deeply, and fixing it in real networks.
        </p>

        <div className="learning-resource-list">
          <article>
            <span>Original project</span>
            <h3>
              <a href="https://www.bufferbloat.net/projects/" {...linkProps}>
                Bufferbloat.net
              </a>
            </h3>
            <p>
              The central community site for the Bufferbloat Project, including
              background, tests, mitigations, mailing lists, and related work.
            </p>
          </article>

          <article>
            <span>Accessible introduction</span>
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
              material, and the broader history of the project.
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
              experiments such as RRUL and latency-under-load testing.
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
              throughput, latency, jitter, and related metrics.
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
