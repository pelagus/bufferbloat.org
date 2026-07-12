export default function Page() {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">planned tooling</p>

      <h1 className="page-title compact">Command-line testing</h1>

      <p className="page-copy">
        A command-line tool is planned for repeatable diagnostics outside the
        browser. The current public test is the browser-based implementation.
      </p>

      <section className="resource-note">
        <h2>Status</h2>
        <p>
          The CLI is not published yet. For now, use the browser test and review
          the open-source implementation on GitHub.
        </p>

        <div className="resource-links">
          <a href="/test">Run the browser test</a>
          <a
            href="https://github.com/pelagus/bufferbloat.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source code
          </a>
        </div>
      </section>
    </main>
  );
}
