"use client";

import { useState } from "react";

type Signup = {
  email: string;
  created_at: string;
  user_agent: string | null;
};

type SignupsResponse = {
  ok?: boolean;
  message?: string;
  signups?: Signup[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function SignupsAdminPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signups, setSignups] = useState<Signup[] | null>(null);

  async function loadSignups(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/signups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = (await response.json()) as SignupsResponse;

    setLoading(false);

    if (!response.ok || !data.ok) {
      setSignups(null);
      setMessage(data.message || "Unable to load signups.");
      return;
    }

    setSignups(data.signups || []);
    setMessage("");
  }

  return (
    <main className="page-shell admin-shell">
      <p className="eyebrow">private</p>

      <h1 className="page-title compact">Signup list</h1>

      <p className="page-copy">
        Read-only view of email signups stored in Cloudflare D1.
      </p>

      <section className="terminal-card admin-panel">
        <form onSubmit={loadSignups} className="admin-login-form">
          <label htmlFor="signups-password">Password</label>

          <div>
            <input
              id="signups-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : "View signups"}
            </button>
          </div>
        </form>

        {message && (
          <p className="admin-message bad">{message}</p>
        )}

        {signups && (
          <div className="admin-results">
            <div className="admin-results-summary">
              <strong>{signups.length}</strong>
              <span>{signups.length === 1 ? "signup" : "signups"}</span>
            </div>

            {signups.length === 0 ? (
              <p className="muted">No signups found.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Created</th>
                      <th>User agent</th>
                    </tr>
                  </thead>

                  <tbody>
                    {signups.map((signup) => (
                      <tr key={`${signup.email}-${signup.created_at}`}>
                        <td>{signup.email}</td>
                        <td>{formatDate(signup.created_at)}</td>
                        <td>{signup.user_agent || "unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
