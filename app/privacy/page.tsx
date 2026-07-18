import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Bufferbloat.org, including test measurements, analytics, shared results, signup emails, local storage, and contact requests.",
  alternates: {
    canonical: "https://bufferbloat.org/privacy",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page privacy-page">
      <p className="eyebrow">privacy</p>
      <h1 className="page-title compact">Privacy policy</h1>
      <p className="page-copy">
        Bufferbloat.org is designed to measure connection quality without ads,
        marketing trackers, or selling personal data. This page explains what is
        collected, why it is collected, and how to contact me.
      </p>

      <section className="resource-note">
        <h2>Who runs this site</h2>
        <p>
          Bufferbloat.org is an independent public-interest internet utility.
          For privacy questions, deletion requests, or other requests about
          your data, use the <Link href="/contact">contact form</Link>.
        </p>
      </section>

      <section className="resource-note">
        <h2>What the test collects</h2>
        <p>
          When you run the test, the browser measures latency / ping samples,
          download throughput, upload throughput, timing information, scorecard
          values, and application-performance ratings. The site may also record
          technical context such as browser user agent, device class, viewport
          bucket, referrer host, country/region/city from infrastructure
          headers, and a per-tab session/run identifier.
        </p>
        <p>
          This data is used to produce your result, diagnose measurement
          reliability, improve the test, understand aggregate usage, and protect
          the service from misleading or broken runs.
        </p>
      </section>

      <section className="resource-note">
        <h2>Shared results</h2>
        <p>
          If a result is shared or stored, the saved record can include the
          scorecard, measurement values, raw scored latency samples, technical
          export fields, generated share ID, and creation time. Shared result
          links are intended to be accessible to anyone who has the link.
        </p>
      </section>

      <section className="resource-note">
        <h2>Email signups and contact messages</h2>
        <p>
          If you sign up for updates, the site stores your email address with
          rough location, browser user agent, and completed-test count. If you
          submit the contact form, the site stores and forwards your message,
          optional email address, category, page path, browser user agent, rough
          location, and optional screenshot metadata. Screenshots are forwarded
          by email when forwarding is configured.
        </p>
      </section>

      <section className="resource-note">
        <h2>Cookies, local storage, and analytics</h2>
        <p>
          The site uses local storage to remember a small completed-test count
          in your browser. The signup form sets a first-party cookie named{" "}
          <code>bufferbloat_signup</code> so it does not keep asking after a
          successful signup. These are not used for advertising.
        </p>
        <p>
          Bufferbloat.org does not use ad tracking or sell personal data. Server
          infrastructure may process normal request data such as IP address,
          timestamps, user agent, and security logs.
        </p>
      </section>

      <section className="resource-note">
        <h2>Service providers</h2>
        <p>
          The site uses infrastructure and services including Cloudflare, Vercel,
          GitHub, and an email forwarding provider when contact email forwarding
          is configured. These providers may process data needed to host,
          protect, deploy, observe, store, or forward the site and its messages.
        </p>
      </section>

      <section className="resource-note">
        <h2>Retention</h2>
        <p>
          Test analytics and shared result records are kept for product
          improvement, debugging, abuse prevention, and public-result access.
          Signup emails are kept until you ask to be removed. Contact messages
          are kept long enough to respond and maintain a record of requests.
          Infrastructure logs follow the retention settings of the relevant
          providers.
        </p>
      </section>

      <section className="resource-note">
        <h2>Your choices and rights</h2>
        <p>
          You can avoid sharing a result by not using the share link. You can
          avoid signup collection by not entering an email address. You can ask
          for access, correction, deletion, or restriction of personal data by
          using the <Link href="/contact">contact form</Link>.
        </p>
      </section>

      <section className="resource-note">
        <h2>Changes</h2>
        <p>
          This policy may change as the site evolves. The current version is
          published on this page.
        </p>
      </section>
    </main>
  );
}
