"use client";

import { useEffect, useState } from "react";

type SignupResponse = {
  ok?: boolean;
  message?: string;
};

export default function SignupBox() {
  const [hidden, setHidden] = useState(true);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const alreadySignedUp =
      typeof window !== "undefined" &&
      document.cookie.includes("bufferbloat_signup=1");

    setHidden(alreadySignedUp);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setState("loading");
    setMessage("");

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json()) as SignupResponse;

    if (!response.ok) {
      setState("error");
      setMessage(data.message || "Something went wrong.");
      return;
    }

    document.cookie =
      "bufferbloat_signup=1; path=/; max-age=31536000; SameSite=Lax";

    setState("done");
    setMessage("Thanks. We’ll be in contact soon.");
    setEmail("");

    setTimeout(() => {
      setHidden(true);
    }, 2200);
  }

  if (hidden && state !== "done") {
    return null;
  }

  if (state === "done") {
    return (
      <section className="signup-card signup-success">
        <div className="signup-icon">✓</div>

        <div>
          <h2>You’re on the list</h2>
          <p>We’ll contact you when deeper personalised diagnostics become available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="signup-card">
      <div className="signup-icon">✉</div>

      <div>
        <h2>Get the full fix guide</h2>
        <p>
          Get notified when personalised bufferbloat diagnostics and
          connection-specific advice become available.
        </p>
      </div>

      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Saving..." : "Notify me"}
        </button>

        <small>▣ No spam. Unsubscribe at any time.</small>
      </form>

      {message && (
        <p className={`signup-message ${state === "error" ? "bad" : "good"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
