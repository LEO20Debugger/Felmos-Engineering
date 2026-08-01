"use client";

import { useActionState, useState } from "react";

import type { AdminLead } from "@/lib/admin/api";
import {
  deleteLead,
  resendLead,
  restoreLead,
  updateLead,
  type FormState,
} from "../../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Toast } from "../Toast";

export type Lead = AdminLead;

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
 *
 * The select checkbox sits outside the expand button rather than inside it,
 * because a control nested in a button swallows its own clicks.
 */
export function LeadCard({
  lead,
  selected,
  onSelect,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saveState, save] = useActionState<FormState, FormData>(updateLead, {
    ok: false,
  });
  const [resendState, resend] = useActionState<FormState, FormData>(resendLead, {
    ok: false,
  });

  const deleted = lead.isDeleted === 1;

  const attribution: [string, string][] = [
    ["Came from", lead.referrerHost ?? ""],
    ["Landed on", lead.landingPath ?? ""],
    ["Campaign source", lead.utmSource ?? ""],
    ["Campaign medium", lead.utmMedium ?? ""],
    ["Campaign", lead.utmCampaign ?? ""],
    ["Device", lead.device ?? ""],
  ].filter(([, value]) => value !== "") as [string, string][];

  return (
    <div
      className="adm-card"
      style={{ padding: "0.9rem", opacity: deleted ? 0.6 : 1 }}
    >
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <label className="adm-row-tick" style={{ paddingTop: "0.15rem" }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(lead.id)}
            aria-label={`Select the request from ${lead.name}`}
          />
        </label>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            display: "flex",
            flex: 1,
            minWidth: 0,
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
                deleted
                  ? "adm-pill-gone"
                  : lead.status === "won"
                    ? "adm-pill-live"
                    : lead.status === "lost" || lead.status === "spam"
                      ? "adm-pill-gone"
                      : "adm-pill-draft"
              }`}
            >
              {deleted ? "deleted" : lead.status}
            </span>
            <span className="adm-muted" style={{ display: "block", fontSize: "0.7rem" }}>
              {formatDate(lead.createdAt)}
            </span>
          </span>
        </button>
      </div>

      {lead.emailStatus !== "sent" ? (
        <p className="adm-error" style={{ marginBottom: 0 }}>
          {/* The error text may or may not already be a sentence, so don't
              blindly append a full stop to it. */}
          Not emailed
          {lead.emailError ? ` — ${lead.emailError.replace(/\.$/, "")}` : ""}.
        </p>
      ) : null}

      {deleted ? (
        <form action={restoreLead} style={{ marginTop: "0.6rem" }}>
          <input type="hidden" name="id" value={lead.id} />
          <button className="adm-btn adm-btn-ghost" style={{ minHeight: "2.25rem" }}>
            Restore
          </button>
        </form>
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
            <dt className="adm-muted">Confirmation</dt>
            <dd style={{ margin: 0 }}>
              {lead.confirmationSentAt
                ? `Sent to ${lead.email}`
                : "Not sent yet"}
            </dd>
            {attribution.map(([label, value]) => (
              <span key={label} style={{ display: "contents" }}>
                <dt className="adm-muted">{label}</dt>
                <dd style={{ margin: 0, wordBreak: "break-word" }}>{value}</dd>
              </span>
            ))}
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

          {!deleted ? (
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
          ) : null}

          <Toast state={saveState} />
          <Toast state={resendState} />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: "0.9rem",
            }}
          >
            {lead.emailStatus !== "sent" ? (
              <form action={resend}>
                <input type="hidden" name="id" value={lead.id} />
                <button className="adm-btn adm-btn-ghost">
                  Try sending the email again
                </button>
              </form>
            ) : null}

            {!deleted ? (
              <form action={deleteLead} style={{ marginLeft: "auto" }}>
                <input type="hidden" name="id" value={lead.id} />
                {/* Soft delete — the row is recoverable from "Show deleted",
                    which is why this is a single confirm rather than a
                    heavier warning. */}
                <ConfirmButton confirmLabel="Confirm delete">Delete</ConfirmButton>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
