import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionIsValid,
} from "../../lib/admin-auth";
import AdminGate from "./components/AdminGate";
import AdminLogoutButton from "./components/AdminLogoutButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminFrame>{children}</AdminFrame>;
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!adminSessionIsValid(session)) {
    return <AdminGate />;
  }

  return (
    <>
      <div className="admin-session-nav" aria-label="Admin navigation">
        <Link href="/admin">Admin</Link>
        <Link href="/admin/analytics">Analytics</Link>
        <Link href="/admin/signups">Signups</Link>
        <AdminLogoutButton />
      </div>

      {children}
    </>
  );
}
