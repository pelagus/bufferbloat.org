export default function Page() {
  return (
    <main className="page-shell">
      <p className="eyebrow">education</p>

      <h1 className="page-title">Learn about bufferbloat</h1>

      <p className="page-copy">
        Bufferbloat is excessive network latency caused by overloaded queues
        inside routers, modems, and operating systems.
      </p>

      <div className="terminal-card">
        Low bandwidth is not always the problem.
        <br />
        High latency under load is often worse.
      </div>
    </main>
  );
}
