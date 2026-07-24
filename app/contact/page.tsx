import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Bufferbloat.org About the Internet Quality Test",
  description:
    "Contact Bufferbloat.org, send privacy requests, report bugs, or suggest improvements to the internet quality test.",
  alternates: {
    canonical: "https://bufferbloat.org/contact",
  },
};

export default function Page() {
  return (
    <main className="page-shell resource-page contact-page">
      <p className="eyebrow">contact</p>
      <h1 className="page-title compact">Feedback, bug reports, and privacy requests</h1>
      <p className="page-copy">
        Use this form to report a problem with the test, suggest an improvement,
        ask a licensing question, or send a privacy request. Screenshots are
        optional, but useful when a chart or scorecard looks wrong.
      </p>

      <section className="resource-note">
        <h2>Send a message</h2>
        <ContactForm />
      </section>

      <section className="resource-note">
        <h2>Privacy requests</h2>
        <p>
          You can use the form for access, correction, deletion, or other
          privacy requests. If you are asking about a shared test result, include
          the result link if you have it.
        </p>
        <p>
          Read the <Link href="/privacy">privacy policy</Link> for details about
          what the site collects and why.
        </p>
      </section>
    </main>
  );
}
