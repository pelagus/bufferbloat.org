"use client";

import { useEffect, useState } from "react";

type Signup = {
  email: string;
  created_at: string;
  user_agent: string | null;
  test_count: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
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

function formatLocation(signup: Signup) {
  return [signup.city, signup.region, signup.country]
    .filter(Boolean)
    .join(", ") || "unknown";
}

export default function SignupsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [signups, setSignups] = useState<Signup[] | null>(null);

  useEffect(() => {
    async function loadSignups() {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/signups", {
        method: "POST",
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

    void loadSignups();
  }, []);

  return (
    <main className="page-shell admin-shell">
      <p className="eyebrow">private</p>

      <h1 className="page-title compact">Signup list</h1>

      <p className="page-copy">
        Read-only view of email signups stored in Cloudflare D1.
      </p>

      <section className="terminal-card admin-panel">
        {loading && (
          <p className="admin-message">Loading signups...</p>
        )}

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
                      <th>Tests</th>
                      <th>Location</th>
                      <th>User agent</th>
                    </tr>
                  </thead>

                  <tbody>
                    {signups.map((signup) => (
                      <tr key={`${signup.email}-${signup.created_at}`}>
                        <td>{signup.email}</td>
                        <td>{formatDate(signup.created_at)}</td>
                        <td>{signup.test_count ?? 0}</td>
                        <td>{formatLocation(signup)}</td>
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
