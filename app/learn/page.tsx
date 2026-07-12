export default function Page() {
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
    </main>
  );
}
