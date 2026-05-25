export default function Page() {
  return (
    <main className="page-shell">
      <p className="eyebrow">documentation</p>

      <h1 className="page-title">
        Technical documentation
      </h1>

      <p className="page-copy">
        API references, testing methodology, queueing theory, and implementation
        details will live here.
      </p>

      <div className="terminal-card">
        docs/
        <br />
        ├── methodology
        <br />
        ├── cli
        <br />
        ├── api
        <br />
        └── fq_codel
      </div>
    </main>
  );
}
