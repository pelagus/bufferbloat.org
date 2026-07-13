"use client";

import { useState } from "react";

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    await fetch("/api/admin/session", {
      method: "DELETE",
    }).catch(() => null);

    window.location.href = "/admin";
  }

  return (
    <button
      className="admin-logout-button"
      type="button"
      onClick={logout}
      disabled={loading}
    >
      {loading ? "Locking..." : "Lock admin"}
    </button>
  );
}
