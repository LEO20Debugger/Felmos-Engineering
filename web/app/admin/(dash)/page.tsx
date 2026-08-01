import Link from "next/link";
import { Settings } from "lucide-react";

import { api, currentUser, type AdminService } from "@/lib/admin/api";

/**
 * Overview.
 *
 * Deliberately thin for now: it counts what exists. The lead and traffic
 * panels land with Phases 6 and 7, when there is real data behind them —
 * showing empty charts before then would suggest something is broken.
 */
export default async function OverviewPage() {
  const user = await currentUser();
  const isOwner = user?.role === "owner";

  const { services } = await api.get<{ services: AdminService[] }>(
    "/admin/services"
  );

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
        <div className="adm-card adm-stat">
          <b>—</b>
          <span className="adm-muted">Inspection requests</span>
        </div>
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

      <div className="adm-card" style={{ padding: "1rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-heading)" }}>
          Still to come
        </h2>
        <p className="adm-muted" style={{ margin: 0 }}>
          Inspection requests, visitor numbers and the remaining content types
          arrive in later stages. Services are editable now —{" "}
          <Link href="/admin/services">start there</Link>.
        </p>
      </div>
    </>
  );
}
