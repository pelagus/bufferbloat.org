import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Bufferbloat.org Exists",
  description:
    "Why Bufferbloat.org exists: an independent open-source bufferbloat test for measuring internet reliability and latency under load.",
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
          Internet connection quality is too important to be left to opaque
          and gimmicky speed tests.
        </p>
      </section>

      <section className="mission-prose" aria-label="Project mission">
        <p>
          Most people are told to judge their internet connection by speed.
          More technical users know to look at ping. Both are useful, but they
          still leave out the question people actually feel in daily life: does
          the connection stay usable when the line is busy?
        </p>

        <p>
          Speed tests mostly report throughput: how much data can move through
          the connection. Ping tests report how quickly the connection responds
          while it is quiet. Bufferbloat is the missing measurement: what
          happens to response time when downloads, uploads, calls, games, and
          other traffic are competing for the same connection?
        </p>

        <p>
          A connection can show impressive throughput and a decent quiet ping,
          then still make video calls freeze, games stutter, websites hesitate,
          and remote desktops feel broken once the network gets busy. That is
          the problem Bufferbloat.org measures.
        </p>

        <p>
          This gap has been known for years. In a 2011 ACM Queue discussion,
          Vint Cerf, Van Jacobson, Nick Weaver, and Jim Gettys discussed
          bufferbloat as a real weakness in how the internet is experienced and
          measured. The core lesson still matters: if you test only bandwidth
          or only idle latency, you miss how the network behaves when it is
          actually busy.
        </p>

        <p>
          Networking researchers have understood this for years, and there are
          excellent research projects and commercial products in this space. But
          I could not find the tool I wanted: a fast, transparent, browser-based
          test that anyone could use, inspect, share, and improve.
        </p>

        <p>
          Bufferbloat.org exists to make that missing measurement accessible. It
          measures not just how much data your connection can move, but how well
          it continues to respond while moving it.
        </p>

        <p>
          Bufferbloat.org is an independent open-source project built around
          that principle. The code is open. The methodology is public. The
          limitations are documented. The goal is to make connection quality
          easier to measure, easier to understand, and easier to discuss.
        </p>

        <p>
          I have spent more than two decades working on internet products and
          infrastructure, and the same pattern keeps coming back: the web gets
          better when important systems can be inspected, measured, questioned,
          and improved in public. Bufferbloat.org is an attempt to apply that
          idea to the basic act of understanding whether a connection works well
          in real life.
        </p>

        <p className="mission-closing">
          Because internet connection quality is more than speed and ping.
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
            The test focuses on what happens when the connection is busy, not
            only on idle ping or peak throughput.
          </p>
        </article>

        <article>
          <span>03</span>
          <h2>Public method</h2>
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
