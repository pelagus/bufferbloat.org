"use client";

import { useEffect, useRef, useState } from "react";

type SignupResponse = {
  ok?: boolean;
  message?: string;
};

export default function SignupBox({ testCount }: { testCount: number }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hidden, setHidden] = useState(() => (
    typeof document !== "undefined" &&
    document.cookie.includes("bufferbloat_signup=1")
  ));
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (hidden || state !== "idle") return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [hidden, state]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setState("error");
      setMessage("Enter your email to get project updates.");
      inputRef.current?.focus({ preventScroll: true });
      return;
    }

    setState("loading");
    setMessage("");

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: trimmedEmail, testCount }),
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

        <div className="signup-copy">
          <h2>You’re on the list</h2>
          <p>We’ll send concise updates as the test and methodology improve.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="signup-card">
      <div className="signup-icon">✉</div>

      <div className="signup-copy">
        <h2>Follow the project</h2>
        <p>Get occasional notes when the open-source test or methodology changes.</p>
      </div>

      <form onSubmit={submit} noValidate>
        <input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          aria-label="Email address for Bufferbloat.org project updates"
          aria-invalid={state === "error"}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === "error") {
              setState("idle");
              setMessage("");
            }
          }}
        />

        <button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Saving..." : "Subscribe"}
        </button>

        <small>No spam. We store your email, rough location, and completed-test count.</small>
      </form>

      {message && (
        <p className={`signup-message ${state === "error" ? "bad" : "good"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
