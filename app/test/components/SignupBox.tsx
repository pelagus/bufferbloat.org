"use client";

import { useState } from "react";

type SignupResponse = {
  ok?: boolean;
  message?: string;
};

export default function SignupBox() {
  const [hidden, setHidden] = useState(() => (
    typeof document !== "undefined" &&
    document.cookie.includes("bufferbloat_signup=1")
  ));
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

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
          <p>We’ll send occasional project updates as the test and methodology improve.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="signup-card">
      <div className="signup-icon">✉</div>

      <div>
        <h2>Follow the project</h2>
        <p>
          Get occasional updates as the open-source test and methodology
          improve.
        </p>
      </div>

      <form onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Saving..." : "Subscribe"}
        </button>

        <small>No spam. Project updates only.</small>
      </form>

      {message && (
        <p className={`signup-message ${state === "error" ? "bad" : "good"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
