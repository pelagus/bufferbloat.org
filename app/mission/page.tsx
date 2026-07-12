import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Bufferbloat.org Exists",
  description:
    "Why Bufferbloat.org exists: an independent open-source project for measuring internet responsiveness and latency under load.",
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
          Most people are told to judge their internet connection by download
          speed. More technical users know to look at ping. Both are useful, but
          neither fully explains a question millions of people ask every day:
          why is my internet still laggy if I have hundreds of megabits per
          second?
        </p>

        <p>
          A connection can deliver excellent throughput while video calls
          freeze, games stutter, websites hesitate, and remote desktops become
          frustrating to use. The problem is often not bandwidth. It is latency
          under load.
        </p>

        <p>
          That is the problem Bufferbloat.org measures.
        </p>

        <p>
          This gap has been known for years. In a 2011 ACM Queue discussion on
          bufferbloat with Vint Cerf, Van Jacobson, Nick Weaver, and Jim Gettys,
          the participants made the core measurement problem clear: if you test
          only bandwidth or only idle latency, you miss how the network behaves
          when it is actually busy.
        </p>

        <p>
          Networking researchers have understood this for years, and there are
          excellent research projects and commercial products in this space. But
          I was surprised by how few open, transparent, browser-based tools
          existed for measuring it.
        </p>

        <p>
          I wanted a tool whose methodology anyone could inspect, whose
          implementation anyone could verify, and whose measurements anyone
          could improve. A test that measures not just how much data your
          connection can move, but how well it continues to respond while moving
          it.
        </p>

        <p>
          Bufferbloat.org is an independent open-source project built around
          that principle. The code is open. The methodology is public. The
          limitations are documented. The goal is to make internet
          responsiveness easier to measure, easier to understand, and easier to
          discuss.
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
            The methodology and implementation are public so developers and
            researchers can inspect how the test works.
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
            Measurements should be reproducible, methodology should be public,
            and implementation should never be a black box.
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
