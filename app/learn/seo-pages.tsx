import Link from "next/link";

export type SeoGuide = {
  eyebrow: string;
  title: string;
  intro: string;
  calloutLabel: string;
  calloutTitle: string;
  calloutBody: string;
  cards: Array<{
    label: string;
    title: string;
    body: string;
  }>;
  notes: Array<{
    title: string;
    body: string[];
  }>;
  related: Array<{
    href: string;
    label: string;
  }>;
};

export function SeoLandingPage({ guide }: { guide: SeoGuide }) {
  return (
    <main className="page-shell resource-page">
      <p className="eyebrow">{guide.eyebrow}</p>

      <h1 className="page-title compact">{guide.title}</h1>

      <p className="page-copy">{guide.intro}</p>

      <div className="resource-top-action">
        <Link href="/test?start=1">Run the test</Link>
        <span>Browser-based, usually about a minute.</span>
      </div>

      <section className="resource-grid">
        {guide.cards.map((card) => (
          <article key={card.title}>
            <span>{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <ReliabilityVisuals />

      {guide.notes.map((note) => (
        <section className="resource-note" key={note.title}>
          <h2>{note.title}</h2>
          {note.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      <section className="resource-note">
        <h2>Continue reading</h2>
        <p>
          These are the most useful next explanations if you are trying to
          understand why a connection can look fine in speed tests but still
          feel unreliable in real use.
        </p>

        <div className="resource-links">
          {guide.related.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/learn">Back to Learn</Link>
        </div>
      </section>

      <section className="guide-test-callout" aria-label="Run the bufferbloat test">
        <div className="guide-test-copy">
          <span>{guide.calloutLabel}</span>
          <h2>{guide.calloutTitle}</h2>
          <p>{guide.calloutBody}</p>

          <div className="guide-test-actions">
            <Link href="/test?start=1" className="guide-primary-action">
              Run the bufferbloat test
            </Link>
            <Link href="/docs" className="guide-secondary-action">
              Read methodology
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReliabilityVisuals() {
  return (
    <section className="resource-evidence" aria-label="Internet reliability test evidence">
      <div className="resource-evidence-heading">
        <span>what speed tests miss</span>
        <h2>Bufferbloat is the part people usually do not know to measure</h2>
      </div>

      <div className="resource-evidence-table" role="table" aria-label="Comparison of internet tests">
        <div role="row" className="resource-evidence-row heading">
          <span role="columnheader">Signal</span>
          <span role="columnheader">What people expect</span>
          <span role="columnheader">What can be hidden</span>
        </div>
        <div role="row" className="resource-evidence-row">
          <strong role="cell">Throughput</strong>
          <span role="cell">A fast Mb/s number means the line is good</span>
          <span role="cell">Capacity does not prove the line stays responsive</span>
        </div>
        <div role="row" className="resource-evidence-row">
          <strong role="cell">Idle latency / ping</strong>
          <span role="cell">A low ping means delay is under control</span>
          <span role="cell">Quiet ping can change once the line is busy</span>
        </div>
        <div role="row" className="resource-evidence-row selected">
          <strong role="cell">Bufferbloat</strong>
          <span role="cell">Most people do not expect this to be separate</span>
          <span role="cell">Queues can add delay during download or upload load</span>
        </div>
      </div>

      <div className="resource-measure-strip" aria-label="Measurement phases">
        <div className="quiet">
          <span>01</span>
          <strong>quiet baseline</strong>
          <em>baseline ping</em>
        </div>
        <div className="download">
          <span>02</span>
          <strong>download load</strong>
          <em>loaded ping</em>
        </div>
        <div className="upload">
          <span>03</span>
          <strong>upload load</strong>
          <em>loaded ping</em>
        </div>
      </div>
    </section>
  );
}
