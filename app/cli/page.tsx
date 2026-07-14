import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command-Line Bufferbloat Testing",
  description:
    "Status page for planned command-line bufferbloat testing. The current public Bufferbloat.org test runs in the browser.",
  alternates: {
    canonical: "https://bufferbloat.org/cli",
  },
  openGraph: {
    title: "Command-Line Bufferbloat Testing",
    description:
      "Planned repeatable diagnostics outside the browser for Bufferbloat.org.",
    url: "https://bufferbloat.org/cli",
  },
};

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
          <a href="/test?start=1">Run the browser test</a>
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
