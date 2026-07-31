import type { Metadata } from "next";
import { redirect } from "next/navigation";

import "../admin.css";
import { currentUser } from "@/lib/admin/api";
import { logout } from "../actions";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s — Felmos Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/* Never prerender or cache the dashboard: every page is per-user, per-tenant
   and reflects data that changes while you look at it. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Middleware already redirected anyone without a token, but it only checks
     that a cookie exists — it does not verify the signature (that would mean
     an API round trip on every navigation). This is the real check, and it
     also gives every page the user's name and role. */
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="adm">
      <header className="adm-top">
        <a href="/admin" className="adm-brand">
          Felmos Engineering Admin
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            className="adm-muted"
            style={{ color: "inherit", opacity: 0.8 }}
            title={`${user.email} · ${user.role}`}
          >
            {user.name}
          </span>
          <form action={logout}>
            <button
              className="adm-btn adm-btn-ghost"
              style={{
                color: "var(--color-on-dark)",
                borderColor: "rgba(255,255,255,0.3)",
                minHeight: "2.25rem",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="adm-body">
        <AdminNav role={user.role} />
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
