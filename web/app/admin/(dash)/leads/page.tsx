import Link from "next/link";

import { api } from "@/lib/admin/api";
import { LeadCard, type Lead } from "./LeadCard";

export const metadata = { title: "Inspection requests" };

const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const { leads } = await api.get<{ leads: Lead[] }>(
    `/admin/leads${status ? `?status=${encodeURIComponent(status)}` : ""}`
  );

  /* Surfaced prominently rather than buried on each row: an enquiry that was
     captured but never emailed is the failure mode most likely to cost a job,
     and it is invisible unless someone is told about it. */
  const undelivered = leads.filter((l) => l.emailStatus !== "sent").length;

  return (
    <>
      <h1 className="adm-h1">Inspection requests</h1>
      <p className="adm-muted" style={{ margin: "0.15rem 0 1rem" }}>
        {leads.length} {status ? `with status “${status}”` : "in total"}
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/leads?status=${filter.value}` : "/admin/leads"}
            className="adm-btn adm-btn-ghost"
            style={{
              minHeight: "2.25rem",
              ...((status ?? "") === filter.value
                ? {
                    background: "var(--color-accent-100)",
                    borderColor: "var(--color-accent-600)",
                  }
                : {}),
            }}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {undelivered > 0 ? (
        <div className="adm-note adm-note-warn" style={{ marginBottom: "1rem" }}>
          <strong>
            {undelivered} request{undelivered === 1 ? " was" : "s were"} not
            emailed.
          </strong>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.875rem" }}>
            They are saved here and nothing is lost. This usually means no
            sending account is configured yet — once it is, they go out
            automatically within fifteen minutes.
          </p>
        </div>
      ) : null}

      {leads.length === 0 ? (
        <div className="adm-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="adm-muted" style={{ margin: 0 }}>
            No requests yet. They appear here the moment someone submits the
            contact form.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </>
  );
}
