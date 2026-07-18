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
          I studied telecommunications and networking twenty years ago.
          Bufferbloat did not have its current name yet, but the underlying
          problem was already known: queues filling up, latency rising, and
          connections becoming less usable under load. It is still with us now
          partly because the market learned to optimize for the wrong visible
          number.
        </p>

        <p>
          Speed tests made throughput easy to compare. ISPs turned Mbps into
          the backbone of internet marketing. Consumers learned to ask
          &quot;how fast is it?&quot; instead of &quot;does it stay usable when
          the connection is busy?&quot;
        </p>

        <p>
          The same pattern is now easy to feel on mobile. A phone can show 5G,
          report impressive download speed, and still feel less responsive when
          the radio link is busy, signal conditions change, or uploads fill the
          queue. Faster headline throughput has not removed the need to measure
          whether the connection stays usable in real life.
        </p>

        <p>
          That incentive structure leaves bufferbloat mostly invisible. A line
          can look fast in a speed test and still become unreliable during
          calls, games, streaming, backups, or ordinary household use. The
          problem is not just technical. It is educational.
        </p>

        <p>
          For years, people have been given incomplete language for connection
          quality. Speed matters. Ping matters. But neither explains whether
          small, time-sensitive packets still move promptly while the connection
          is already carrying traffic. That is the part people feel when a call
          freezes, a game spikes, or a page hangs while someone else is using
          the same line.
        </p>

        <p>
          Bufferbloat.org exists to make that missing part visible. It measures
          quiet-line ping, then measures what happens when download and upload
          load are active. It also reports throughput, because throughput still
          matters. The point is to stop treating one number as the whole story.
        </p>

        <p>
          This is also why the project has to be public. If the test is another
          black box, it only replaces one opaque measurement with another. The
          code is open. The methodology is public. The limitations are
          documented. The assumptions can be inspected, challenged, and
          improved.
        </p>

        <p>
          I want Bufferbloat.org to be both a test and a public resource: a
          place that helps people understand why connection quality is more than
          advertised Mbps, why latency changes under load, how routers and Wi-Fi
          affect the result, and which fixes are realistic outside a lab.
        </p>

        <p>
          Cloudflare infrastructure is a major reason this can exist as a free
          public tool. A test like this needs server resources that can absorb
          real browser traffic from real users; without that infrastructure, the
          cost of running it would have made the project unrealistic. The cost
          is still not zero, though. If Bufferbloat.org grows, I would rather
          keep maintenance sustainable through donations or community support
          than through ads, tracking, or commercial influence over the test.
        </p>

        <p className="mission-closing">
          Because internet connection quality is more than speed and ping. The
          simplest way to see that difference is to{" "}
          <Link href="/test?start=1">run the bufferbloat test</Link> and compare
          your quiet-line ping with what happens when download and upload load
          are active.
        </p>
      </section>

      <section className="mission-test-action" aria-label="Run the bufferbloat test">
        <div className="resource-top-action">
          <Link href="/test?start=1">See the measurement for yourself</Link>
          <span>
            Run the open bufferbloat test and compare quiet-line ping with a
            busy connection.
          </span>
        </div>
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
            <Link href="/test?start=1">Run the bufferbloat test</Link>
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
