"use client";

import { useState, type FormEvent } from "react";

const categories = [
  "Tool feedback",
  "Bug report",
  "Privacy request",
  "Licensing",
  "Other",
];

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (typeof window !== "undefined") {
      formData.set("pagePath", window.location.pathname);
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Unable to send message.");
      }

      setState("success");
      setMessage(data.message || "Thanks. Your message was sent.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to send message."
      );
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <input
        aria-hidden="true"
        autoComplete="off"
        className="contact-honeypot"
        name="website"
        tabIndex={-1}
        type="text"
      />

      <label>
        <span>What is this about?</span>
        <select name="category" defaultValue={categories[0]}>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Email address (optional)</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
      </label>

      <label>
        <span>Message</span>
        <textarea
          name="message"
          placeholder="What happened, what would improve the tool, or what privacy/licensing question should I look at?"
          required
          rows={8}
        />
      </label>

      <label>
        <span>Screenshot (optional)</span>
        <input accept="image/png,image/jpeg,image/webp" name="screenshot" type="file" />
      </label>

      <p className="contact-form-note">
        Screenshots are optional and limited to 5 MB. Submissions are stored
        for review and forwarded by email when forwarding is configured.
      </p>

      <button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Sending..." : "Send feedback"}
      </button>

      {message ? (
        <p className={`contact-form-message ${state === "error" ? "bad" : "good"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
