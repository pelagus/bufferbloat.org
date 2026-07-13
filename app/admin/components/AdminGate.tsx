"use client";

import { useState } from "react";

type SessionResponse = {
  ok?: boolean;
  message?: string;
};

export default function AdminGate() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function unlock(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = (await response.json().catch(() => ({}))) as SessionResponse;

    setLoading(false);

    if (!response.ok || !data.ok) {
      setMessage(data.message || "Unable to unlock admin.");
      return;
    }

    window.location.reload();
  }

  return (
    <main className="page-shell admin-shell">
      <p className="eyebrow">private</p>

      <h1 className="page-title compact">Admin</h1>

      <p className="page-copy">
        Enter the shared admin password to access Bufferbloat.org operational
        tools.
      </p>

      <section className="terminal-card admin-panel admin-access-panel">
        <form onSubmit={unlock} className="admin-login-form">
          <label htmlFor="admin-password">Password</label>

          <div>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Unlocking..." : "Unlock admin"}
            </button>
          </div>
        </form>

        {message && (
          <p className="admin-message bad">{message}</p>
        )}
      </section>
    </main>
  );
}
