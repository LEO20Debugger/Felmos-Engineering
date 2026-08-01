"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminLead } from "@/lib/admin/api";
import { bulkLeads, type FormState } from "../../actions";
import { Toast } from "../Toast";
import { LeadCard } from "./LeadCard";

/**
 * The inbox list, with multi-select — the same shape as PostList, against
 * enquiries.
 *
 * A client component only because selection is client state. The bulk actions
 * are triage plus soft delete rather than publish/draft: an enquiry is never
 * published, and the common batch job is "these forty are spam".
 */

function ActionButton({
  action,
  children,
  danger,
}: {
  action: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      name="action"
      value={action}
      disabled={pending}
      className={`adm-btn ${danger ? "adm-btn-danger" : ""}`}
      style={{ minHeight: "2.25rem" }}
    >
      {children}
    </button>
  );
}

export function LeadList({ leads }: { leads: AdminLead[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, action] = useActionState<FormState, FormData>(bulkLeads, {
    ok: false,
  });

  /* Drop the selection once the batch lands — the list re-renders from the
     server, and a delete can remove rows from this view entirely. */
  useEffect(() => {
    if (state.ok) setSelected([]);
  }, [state]);

  const allSelected = leads.length > 0 && selected.length === leads.length;

  const toggle = (id: number) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const chosen = leads.filter((l) => selected.includes(l.id));
  const anyDeleted = chosen.some((l) => l.isDeleted === 1);
  const anyLive = chosen.some((l) => l.isDeleted !== 1);

  if (leads.length === 0) {
    return (
      <div className="adm-card" style={{ padding: "2rem", textAlign: "center" }}>
        <p className="adm-muted" style={{ margin: 0 }}>
          No requests match this view. They appear here the moment someone
          submits the contact form.
        </p>
      </div>
    );
  }

  return (
    <>
      <label
        className="adm-muted"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
          minHeight: "2rem",
        }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => setSelected(allSelected ? [] : leads.map((l) => l.id))}
        />
        {allSelected ? "Clear selection" : `Select all ${leads.length}`}
      </label>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={selected.includes(lead.id)}
            onSelect={toggle}
          />
        ))}
      </div>

      <Toast state={state} />

      {/* The bar only exists while something is selected, so it never sits over
          the list taking up room for an action nobody asked for. */}
      {selected.length > 0 ? (
        <form action={action} className="adm-savebar" style={{ flexWrap: "wrap" }}>
          {selected.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}

          <strong style={{ marginRight: "auto" }}>
            {selected.length} selected
          </strong>

          {anyLive ? (
            <>
              <ActionButton action="contacted">Mark contacted</ActionButton>
              <ActionButton action="spam">Mark spam</ActionButton>
            </>
          ) : null}

          {anyDeleted ? <ActionButton action="restore">Restore</ActionButton> : null}

          {anyLive ? (
            <ActionButton action="delete" danger>
              Delete
            </ActionButton>
          ) : null}

          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            style={{ minHeight: "2.25rem" }}
            onClick={() => setSelected([])}
          >
            Cancel
          </button>
        </form>
      ) : null}
    </>
  );
}
