export default function Page() {
  return (
    <main className="page-shell">
      <p className="eyebrow">network diagnostic</p>

      <h1 className="page-title">
        Run a bufferbloat test
      </h1>

      <p className="page-copy">
        Browser-based testing is coming soon. For now, this page will become
        the place to measure idle, download, and upload latency under load.
      </p>

      <div className="terminal-card">
        Idle latency .......... 12ms
        <br />
        Download loaded ........ 214ms
        <br />
        Upload loaded .......... 387ms
      </div>
    </main>
  );
}
