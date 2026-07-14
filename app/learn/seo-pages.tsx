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

        <div className="guide-test-micro" aria-hidden="true">
          <div>
            <span>quiet</span>
            <strong>ping</strong>
            <em>normal line</em>
          </div>
          <div>
            <span>download</span>
            <strong>load</strong>
            <em>receive pressure</em>
          </div>
          <div>
            <span>upload</span>
            <strong>load</strong>
            <em>send pressure</em>
          </div>
        </div>
      </section>

      <section className="resource-grid">
        {guide.cards.map((card) => (
          <article key={card.title}>
            <span>{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

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
          These related pages explain the measurement terms and the open-source
          methodology behind the test.
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
    </main>
  );
}
