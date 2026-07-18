import Link from "next/link";
import type { LearnArticle } from "../../content/articles";

export type LearnGuide = LearnArticle["guide"];

export function LearnArticlePage({ guide }: { guide: LearnGuide }) {
  const comparison = comparisonForGuide(guide.eyebrow);
  const showEvidence = shouldShowEvidenceForGuide(guide.eyebrow);

  return (
    <main className="page-shell resource-page article-template">
      <p className="eyebrow">{guide.eyebrow}</p>

      <h1 className="page-title compact">{guide.title}</h1>

      <p className="page-copy">{guide.intro}</p>

      {comparison ? (
        <section className="intent-comparison" aria-label="What this guide adds">
          <div>
            <span>Ordinary speed tests show</span>
            <p>{comparison.speedTest}</p>
          </div>
          <div>
            <span>This guide explains</span>
            <p>{comparison.thisGuide}</p>
          </div>
        </section>
      ) : null}

      <section className="resource-grid">
        {guide.cards.map((card) => (
          <article key={card.title}>
            <span>{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      {showEvidence ? <ReliabilityVisuals /> : null}

      {guide.notes.map((note) => (
        <section className="resource-note" key={note.title}>
          <h2>{note.title}</h2>
          {note.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      {guide.applicationRatings ? (
        <ApplicationRatingsGuide ratings={guide.applicationRatings} />
      ) : null}

      {guide.deepDive ? (
        <section className="resource-note article-deep-dive">
          <span>deeper guide</span>
          <h2>{guide.deepDive.title}</h2>
          <p>{guide.deepDive.body}</p>
          <Link href={guide.deepDive.href}>{guide.deepDive.label}</Link>
        </section>
      ) : null}

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
            <Link href="/test" className="guide-primary-action">
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

function ApplicationRatingsGuide({
  ratings,
}: {
  ratings: NonNullable<LearnGuide["applicationRatings"]>;
}) {
  return (
    <>
      <section className="resource-note">
        <h2>{ratings.title}</h2>
        <p>{ratings.body}</p>

        <figure className="application-rating-example">
          <div className="application-rating-window">
            <div className="application-rating-header">
              <span>Application performance</span>
              <strong>Example scorecard section</strong>
            </div>

            <ol className="application-rating-list">
              <li className="excellent">
                <span className="rating-symbol" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="img">
                    <path d="M20 18 31 10v28L20 30H11V18h9Z" />
                    <path d="M36 18c2.3 3.7 2.3 8.3 0 12M40 14c4.3 6 4.3 14 0 20" />
                  </svg>
                </span>
                <span className="rating-copy">
                  <strong>Audio calls</strong>
                  <em>Very reliable</em>
                </span>
              </li>
              <li className="fair">
                <span className="rating-symbol" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="img">
                    <rect x="7" y="14" width="25" height="21" rx="2" />
                    <path d="M32 21l9-5v17l-9-5" />
                    <path d="M14 21h10M14 27h7" />
                  </svg>
                </span>
                <span className="rating-copy">
                  <strong>Video calls</strong>
                  <em>Usable</em>
                </span>
              </li>
              <li className="poor">
                <span className="rating-symbol" aria-hidden="true">
                  <svg viewBox="0 0 48 48" role="img">
                    <path d="M15 20h18c4.4 0 8 3.6 8 8v6c0 2.2-1.8 4-4 4-2.8 0-4.5-4-7-4H18c-2.5 0-4.2 4-7 4-2.2 0-4-1.8-4-4v-6c0-4.4 3.6-8 8-8Z" />
                    <path d="M16 26v8M12 30h8M30 29h.1M36 33h.1" />
                  </svg>
                </span>
                <span className="rating-copy">
                  <strong>Low-latency games</strong>
                  <em>Poor</em>
                </span>
              </li>
            </ol>
          </div>
          <figcaption>{ratings.caption}</figcaption>
        </figure>
      </section>

      <section className="resource-note">
        <h2>How to interpret those labels</h2>
        <ul className="rating-interpretation-list">
          {ratings.labels.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.body}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function shouldShowEvidenceForGuide(eyebrow: string) {
  return !(
    eyebrow.includes("calls") ||
    eyebrow.includes("video meeting") ||
    eyebrow.includes("gaming")
  );
}

function comparisonForGuide(eyebrow: string) {
  if (eyebrow.includes("calls")) {
    return {
      speedTest: "Whether the line has enough capacity in quiet conditions.",
      thisGuide:
        "Why audio, video, and turn-taking can still suffer when load adds delay.",
    };
  }

  if (eyebrow.includes("video meeting")) {
    return {
      speedTest: "A download or upload number outside the meeting context.",
      thisGuide:
        "Why meeting traffic depends on stable upload, download, and latency under load.",
    };
  }

  if (eyebrow.includes("gaming")) {
    return {
      speedTest: "How much data the connection can move.",
      thisGuide:
        "Why low ping, low latency spread, and busy-line stability matter more for games.",
    };
  }

  if (eyebrow.includes("reliability")) {
    return {
      speedTest: "Throughput in Mbps, usually while the line is mostly quiet.",
      thisGuide:
        "Whether the connection can be depended on while calls, games, uploads, and shared use are happening.",
    };
  }

  if (eyebrow.includes("stability")) {
    return {
      speedTest: "A capacity number that can miss jumpy delay.",
      thisGuide:
        "Whether latency stays predictable or spikes when the connection is busy.",
    };
  }

  return null;
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
