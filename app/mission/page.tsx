import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Bufferbloat.org Exists",
  description:
    "The mission behind Bufferbloat.org: an open, transparent browser-based test for internet responsiveness and latency under load.",
  alternates: {
    canonical: "https://bufferbloat.org/mission",
  },
};

export default function Page() {
  return (
    <main className="page-shell mission-shell">
      <section className="mission-hero">
        <p className="eyebrow">mission</p>

        <h1 className="page-title compact">Why this exists</h1>

        <p className="mission-lede">
          I built Bufferbloat.org because I could not find the tool I wanted.
        </p>
      </section>

      <section className="mission-prose" aria-label="Project mission">
        <p>
          Most internet speed tests tell you how many megabits per second your
          connection can deliver. Networking experts call this throughput. It is
          an important metric, but it does not explain why video calls still
          freeze, games still stutter, or websites become sluggish as soon as
          your connection is busy.
        </p>

        <p>
          More experienced users often look at ping. That is a step in the
          right direction, but idle ping is not the whole story either. A
          connection can have excellent idle latency until someone starts a
          large download or upload, at which point responsiveness can collapse.
        </p>

        <p>
          That is the problem Bufferbloat.org measures: latency under load.
        </p>

        <p>
          This gap has been known for years. In a 2011 ACM Queue discussion on
          bufferbloat with Vint Cerf, Van Jacobson, Nick Weaver, and Jim Gettys,
          the participants made the core measurement problem clear: if you test
          only bandwidth or only idle latency, you miss how the network behaves
          when it is actually busy.
        </p>

        <p>
          There are excellent research projects and commercial tools in this
          space, but I wanted a fast, open-source resource built around a
          browser-based test that anyone could inspect, verify, and improve. A
          test that measures not just how much data your connection can move,
          but how well it continues to respond while moving it.
        </p>

        <p>
          Bufferbloat.org is intentionally simple. The code is open. The
          methodology is public. The limitations are documented. The goal is to
          make internet responsiveness easier to measure, easier to understand,
          and easier to discuss.
        </p>

        <p className="mission-closing">
          Because internet performance is about more than megabits per second.
        </p>
      </section>

      <section className="mission-principles" aria-label="Project principles">
        <article>
          <span>01</span>
          <h2>Open core</h2>
          <p>
            The measurement engine is public so developers and researchers can
            inspect how the test works.
          </p>
        </article>

        <article>
          <span>02</span>
          <h2>Loaded latency</h2>
          <p>
            The test focuses on responsiveness while a connection is busy, not
            only on idle ping or peak throughput.
          </p>
        </article>

        <article>
          <span>03</span>
          <h2>Citable method</h2>
          <p>
            The methodology, caveats, and source code are intended to be clear
            enough for public-interest and academic reference.
          </p>
        </article>
      </section>

      <section className="mission-references" aria-label="References">
        <h2>References and project links</h2>

        <ul>
          <li>
            <a
              href="https://queue.acm.org/detail.cfm?id=2076798"
              target="_blank"
              rel="noopener noreferrer"
            >
              ACM Queue: &quot;BufferBloat: What&apos;s Wrong with the Internet?&quot;
            </a>
          </li>
          <li>
            <Link href="/docs">Measurement methodology and technical docs</Link>
          </li>
          <li>
            <a
              href="https://github.com/pelagus/bufferbloat.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source code on GitHub
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
