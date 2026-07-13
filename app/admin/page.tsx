import Link from "next/link";

const adminSections = [
  {
    href: "/admin/analytics",
    title: "Analytics",
    eyebrow: "test events",
    description:
      "Review sessions, started/completed/failed tests, score distribution, device mix, coarse location, and recent measurement records.",
  },
  {
    href: "/admin/signups",
    title: "Signups",
    eyebrow: "email list",
    description:
      "Review project-update email signups, rough location, completed-test count, and user-agent context stored in Cloudflare D1.",
  },
];

export default function AdminMenuPage() {
  return (
    <main className="page-shell admin-shell">
      <p className="eyebrow">private</p>

      <h1 className="page-title compact">Admin</h1>

      <p className="page-copy">
        Private operational tools for Bufferbloat.org. Each section uses the
        same admin password gate.
      </p>

      <section className="admin-menu-grid" aria-label="Admin sections">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            className="terminal-card admin-menu-card"
            href={section.href}
          >
            <span>{section.eyebrow}</span>
            <strong>{section.title}</strong>
            <p>{section.description}</p>
            <em>Open →</em>
          </Link>
        ))}
      </section>
    </main>
  );
}
