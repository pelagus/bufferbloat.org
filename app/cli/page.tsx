export default function Page() {
  return (
    <main className="page-shell">
      <p className="eyebrow">command line</p>

      <h1 className="page-title">
        Install the CLI
      </h1>

      <p className="page-copy">
        The bufferbloat.org CLI will provide repeatable network diagnostics
        directly from your terminal.
      </p>

      <div className="terminal-card">
        npm install -g bufferbloat
      </div>
    </main>
  );
}
