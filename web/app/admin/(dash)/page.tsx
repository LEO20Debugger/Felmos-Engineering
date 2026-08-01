import Link from "next/link";
import { Settings } from "lucide-react";

import {
  api,
  currentUser,
  type AdminLeadCounts,
  type AdminService,
} from "@/lib/admin/api";

/**
 * Overview.
 *
 * Deliberately thin: it counts what exists. The traffic panel lands with
 * Phase 7, when there is real data behind it — an empty chart before then
 * would suggest something is broken.
 */
export default async function OverviewPage() {
  const user = await currentUser();
  const isOwner = user?.role === "owner";

  const [{ services }, leads] = await Promise.all([
    api.get<{ services: AdminService[] }>("/admin/services"),
    api.get<AdminLeadCounts>("/admin/leads/counts"),
  ]);

  const published = services.filter((s) => s.status === "published").length;
  const drafts = services.length - published;
  const missingAlt = services.filter(
    (s) => s.image && s.image.alt.trim() === ""
  ).length;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="adm-h1">Overview</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            What&rsquo;s on the website right now.
          </p>
        </div>

        {isOwner && (
          <Link
            href="/admin/settings"
            className="adm-btn adm-btn-ghost adm-mobile-only"
            style={{ alignItems: "center", gap: "0.4rem" }}
          >
            <Settings size={16} aria-hidden />
            <span>Settings</span>
          </Link>
        )}
      </div>

      <div className="adm-grid adm-grid-2 adm-grid-4" style={{ marginBottom: "1.5rem" }}>
        <div className="adm-card adm-stat">
          <b>{published}</b>
          <span className="adm-muted">Services live</span>
        </div>
        <div className="adm-card adm-stat">
          <b>{drafts}</b>
          <span className="adm-muted">Services in draft</span>
        </div>
        {/* New rather than total: the number that matters on a dashboard is
            the one that needs acting on. */}
        <Link href="/admin/leads?status=new" className="adm-card adm-stat">
          <b>{leads.byStatus.new ?? 0}</b>
          <span className="adm-muted">New requests</span>
        </Link>
        <div className="adm-card adm-stat">
          <b>—</b>
          <span className="adm-muted">Visits this week</span>
        </div>
      </div>

      {missingAlt > 0 ? (
        <div className="adm-note adm-note-info" style={{ marginBottom: "1.5rem" }}>
          <strong>{missingAlt} image{missingAlt === 1 ? "" : "s"} without alt text.</strong>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem" }}>
            Alt text is read aloud by screen readers and used by search engines.
            The stock photographs were imported without it — add descriptions as
            you edit each item.
          </p>
        </div>
      ) : null}

      {leads.undelivered > 0 ? (
        <div className="adm-note adm-note-warn" style={{ marginBottom: "1.5rem" }}>
          <strong>
            {leads.undelivered} request
            {leads.undelivered === 1 ? " was" : "s were"} not emailed.
          </strong>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem" }}>
            Nothing is lost — they are saved in{" "}
            <Link href="/admin/leads">inspection requests</Link>. This usually
            means no sending account is configured yet.
          </p>
        </div>
      ) : null}

      <div className="adm-card" style={{ padding: "1rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-heading)" }}>
          Still to come
        </h2>
        <p className="adm-muted" style={{ margin: 0 }}>
          Visitor numbers arrive in a later stage. Everything else is editable
          now — <Link href="/admin/services">start with services</Link>.
        </p>
      </div>
    </>
  );
}
