"use client";

import { useActionState, useState } from "react";

import { resendLead, updateLead, type FormState } from "../../actions";
import { Toast } from "../Toast";

export type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  serviceText: string;
  preferredDate: string | null;
  message: string | null;
  status: string;
  emailStatus: "pending" | "sent" | "failed";
  emailError: string | null;
  referrerHost: string | null;
  landingPath: string | null;
  internalNotes: string | null;
  createdAt: string;
};

const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;

/** Fixed to UTC, matching the site's own date handling — without it the server
    and the browser can disagree and React reports a hydration mismatch. */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value.replace(" ", "T") + "Z"));

/**
 * One enquiry, expanding in place.
 *
 * A card rather than a table row, and a list rather than a detail route: on a
 * phone a table of eleven columns is unreadable, and the useful actions — call
 * them, email them, mark contacted — should not require a second page load.
 */
export function LeadCard({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [saveState, save] = useActionState<FormState, FormData>(updateLead, {
    ok: false,
  });
  const [resendState, resend] = useActionState<FormState, FormData>(resendLead, {
    ok: false,
  });

  return (
    <div className="adm-card" style={{ padding: "0.9rem" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex",
          width: "100%",
          gap: "0.75rem",
          alignItems: "flex-start",
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block" }}>{lead.name}</strong>
          <span className="adm-muted">
            {lead.serviceText} · {lead.location}
          </span>
        </span>

        <span style={{ textAlign: "right", flex: "none" }}>
          <span
            className={`adm-pill ${
              lead.status === "won"
                ? "adm-pill-live"
                : lead.status === "lost" || lead.status === "spam"
                  ? "adm-pill-gone"
                  : "adm-pill-draft"
            }`}
          >
            {lead.status}
          </span>
          <span className="adm-muted" style={{ display: "block", fontSize: "0.7rem" }}>
            {formatDate(lead.createdAt)}
          </span>
        </span>
      </button>

      {lead.emailStatus !== "sent" ? (
        <p className="adm-error" style={{ marginBottom: 0 }}>
          {/* The error text may or may not already be a sentence, so don't
              blindly append a full stop to it. */}
          Not emailed
          {lead.emailError ? ` — ${lead.emailError.replace(/\.$/, "")}` : ""}.
        </p>
      ) : null}

      {open ? (
        <div style={{ marginTop: "0.9rem" }}>
          {/* tel: and mailto: rather than plain text — on a phone this is the
              difference between a lead you can act on and one you retype. */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a className="adm-btn" href={`tel:${lead.phone.replace(/\s/g, "")}`}>
              Call {lead.phone}
            </a>
            <a className="adm-btn adm-btn-ghost" href={`mailto:${lead.email}`}>
              Email
            </a>
            <a
              className="adm-btn adm-btn-ghost"
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.3rem 0.75rem",
              margin: "1rem 0",
              fontSize: "0.9rem",
            }}
          >
            <dt className="adm-muted">Email</dt>
            <dd style={{ margin: 0 }}>{lead.email}</dd>
            <dt className="adm-muted">Preferred</dt>
            <dd style={{ margin: 0 }}>{lead.preferredDate ?? "Not specified"}</dd>
            {lead.referrerHost ? (
              <>
                <dt className="adm-muted">Came from</dt>
                <dd style={{ margin: 0 }}>{lead.referrerHost}</dd>
              </>
            ) : null}
          </dl>

          {lead.message ? (
            <p
              style={{
                padding: "0.75rem",
                background: "var(--color-neutral-100)",
                borderLeft: "3px solid var(--color-accent-600)",
                borderRadius: "var(--radius-sm)",
                whiteSpace: "pre-wrap",
              }}
            >
              {lead.message}
            </p>
          ) : (
            <p className="adm-muted">No message left.</p>
          )}

          <form action={save}>
            <input type="hidden" name="id" value={lead.id} />

            <label className="adm-field">
              <span>Status</span>
              <select className="adm-select" name="status" defaultValue={lead.status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="adm-field">
              <span>Internal notes</span>
              <textarea
                className="adm-textarea"
                name="internalNotes"
                defaultValue={lead.internalNotes ?? ""}
                placeholder="Not shown to the client."
                style={{ minHeight: "4.5rem" }}
              />
            </label>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button className="adm-btn">Save</button>
            </div>
          </form>

          <Toast state={saveState} />
          <Toast state={resendState} />

          {lead.emailStatus !== "sent" ? (
            <form action={resend} style={{ marginTop: "0.9rem" }}>
              <input type="hidden" name="id" value={lead.id} />
              <button className="adm-btn adm-btn-ghost">
                Try sending the email again
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
