"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, Plus, Trash2, UserCheck, UserX } from "lucide-react";

import {
  createMailRecipient,
  updateMailRecipient,
  deleteMailRecipient,
  type FormState,
} from "../../actions";
import type { AdminMailRecipient } from "@/lib/admin/api";
import { Toast } from "../Toast";
import { ConfirmButton } from "../ConfirmButton";

function AddSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" disabled={pending}>
      {pending ? "Adding…" : "Add recipient"}
    </button>
  );
}

export function MailRecipientsList({
  recipients,
}: {
  recipients: AdminMailRecipient[];
}) {
  const [createState, createAction] = useActionState<FormState, FormData>(
    createMailRecipient,
    { ok: false }
  );

  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ marginTop: "2.5rem" }}>
      <Toast state={createState} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h2 className="adm-h2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={20} aria-hidden /> Lead Email Recipients
          </h2>
          <p className="adm-muted" style={{ margin: "0.2rem 0 0" }}>
            Inspection requests and contact form submissions are routed to these addresses.
          </p>
        </div>

        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus size={16} aria-hidden /> {showAdd ? "Cancel" : "Add recipient"}
        </button>
      </div>

      {showAdd && (
        <div className="adm-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 className="adm-h3" style={{ marginBottom: "1rem" }}>
            New Mail Recipient
          </h3>
          <form action={createAction}>
            <div className="adm-grid adm-grid-2">
              <label className="adm-field">
                <span>Email Address *</span>
                <input
                  className="adm-input"
                  name="email"
                  type="email"
                  placeholder="e.g. inspector@felmosengineering.com"
                  required
                />
              </label>

              <label className="adm-field">
                <span>Name / Recipient Label</span>
                <input
                  className="adm-input"
                  name="name"
                  placeholder="e.g. Chief Inspector"
                />
              </label>
            </div>

            <div className="adm-grid adm-grid-2" style={{ alignItems: "center" }}>
              <label className="adm-field">
                <span>Email Role</span>
                <select className="adm-select" name="role" defaultValue="to">
                  <option value="to">TO — Main recipient</option>
                  <option value="cc">CC — Carbon copy</option>
                  <option value="bcc">BCC — Blind carbon copy</option>
                </select>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <AddSubmit />
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="adm-card">
        {recipients.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }} className="adm-muted">
            No mail recipients configured.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-divider)", fontSize: "0.8rem", color: "var(--color-neutral-700)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>RECIPIENT</th>
                  <th style={{ padding: "0.75rem 1rem" }}>ROLE</th>
                  <th style={{ padding: "0.75rem 1rem" }}>STATUS</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid var(--color-divider)",
                      opacity: r.active ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{r.email}</div>
                      {r.name && (
                        <div className="adm-muted" style={{ fontSize: "0.85rem" }}>
                          {r.name}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background:
                            r.role === "to"
                              ? "var(--color-accent-100)"
                              : "var(--color-neutral-200)",
                          color:
                            r.role === "to"
                              ? "var(--color-accent-700)"
                              : "var(--color-neutral-800)",
                        }}
                      >
                        {r.role}
                      </span>
                    </td>

                    <td style={{ padding: "0.75rem 1rem" }}>
                      <form action={async (fd) => { await updateMailRecipient({ ok: false }, fd); }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="email" value={r.email} />
                        <input type="hidden" name="role" value={r.role} />
                        <input
                          type="hidden"
                          name="active"
                          value={r.active ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className="adm-btn adm-btn-ghost"
                          style={{
                            padding: "0.25rem 0.6rem",
                            fontSize: "0.8rem",
                            minHeight: "auto",
                          }}
                        >
                          {r.active ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-signal)" }}>
                              <UserCheck size={14} /> Active
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-muted)" }}>
                              <UserX size={14} /> Inactive
                            </span>
                          )}
                        </button>
                      </form>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <form action={deleteMailRecipient} style={{ display: "inline-block" }}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmButton confirmLabel="Confirm delete">
                          <Trash2 size={16} aria-hidden />
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
