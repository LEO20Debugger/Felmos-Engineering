import Link from "next/link";
import { Download, Search } from "lucide-react";

import {
  api,
  type AdminLeadCounts,
  type AdminLeadsPayload,
} from "@/lib/admin/api";
import { LeadList } from "./LeadList";

export const metadata = { title: "Inspection requests" };

const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  /* Present because it is a real status the card can set — leaving it off the
     filters made anything marked spam unreachable except through "All". */
  { value: "spam", label: "Spam" },
] as const;

type Query = {
  status?: string;
  q?: string;
  deleted?: string;
  page?: string;
};

/** Rebuild the current URL with one parameter changed. Anything that narrows
    the list also resets to page one — otherwise searching from page four
    lands on an empty result that looks like "no matches". */
function href(current: Query, patch: Partial<Query>): string {
  const params = new URLSearchParams();
  const next = { ...current, ...patch };

  if (patch.status !== undefined || patch.q !== undefined) delete next.page;

  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }

  return params.size > 0 ? `/admin/leads?${params}` : "/admin/leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;
  const { status = "", q = "", deleted, page = "1" } = query;
  const showDeleted = deleted === "1";

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (showDeleted) params.set("deleted", "1");
  params.set("page", page);

  const [payload, counts] = await Promise.all([
    api.get<AdminLeadsPayload>(`/admin/leads?${params}`),
    api.get<AdminLeadCounts>("/admin/leads/counts"),
  ]);

  const { leads, total, perPage } = payload;
  const current = Math.max(1, Number(page) || 1);
  const pages = Math.max(1, Math.ceil(total / perPage));

  /* The export covers the filtered set, not the visible page — so it carries
     the filters but never the page number. */
  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (q) exportParams.set("q", q);
  if (showDeleted) exportParams.set("deleted", "1");

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="adm-h1">Inspection requests</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 1rem" }}>
            {total} {showDeleted ? "deleted" : ""}
            {q ? ` matching “${q}”` : status ? ` with status “${status}”` : " in total"}
          </p>
        </div>

        <a
          className="adm-btn adm-btn-ghost"
          href={`/admin/leads/export${exportParams.size > 0 ? `?${exportParams}` : ""}`}
          style={{ alignItems: "center", gap: "0.4rem" }}
        >
          <Download size={16} aria-hidden />
          <span>Export CSV</span>
        </a>
      </div>

      {/* A plain GET form, so a search is a URL you can bookmark, share and
          reload — and so it works before any JavaScript has loaded. */}
      <form
        action="/admin/leads"
        style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}
      >
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {showDeleted ? <input type="hidden" name="deleted" value="1" /> : null}

        <input
          className="adm-input"
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Search requests"
          placeholder="Search name, phone, email, location or service"
          style={{ flex: 1, minWidth: 0 }}
        />

        <button className="adm-btn" style={{ alignItems: "center", gap: "0.4rem" }}>
          <Search size={16} aria-hidden />
          <span>Search</span>
        </button>
      </form>

      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {FILTERS.map((filter) => {
          const n = filter.value
            ? counts.byStatus[filter.value as keyof typeof counts.byStatus]
            : counts.total;

          return (
            <Link
              key={filter.value}
              href={href(query, { status: filter.value })}
              className="adm-btn adm-btn-ghost"
              style={{
                minHeight: "2.25rem",
                ...(status === filter.value
                  ? {
                      background: "var(--color-accent-100)",
                      borderColor: "var(--color-accent-600)",
                    }
                  : {}),
              }}
            >
              {filter.label}
              <span className="adm-muted" style={{ marginLeft: "0.35rem" }}>
                {n ?? 0}
              </span>
            </Link>
          );
        })}

        {counts.deleted > 0 || showDeleted ? (
          <Link
            href={href(query, { deleted: showDeleted ? "" : "1" })}
            className="adm-btn adm-btn-ghost"
            style={{
              minHeight: "2.25rem",
              marginLeft: "auto",
              ...(showDeleted
                ? {
                    background: "var(--color-accent-100)",
                    borderColor: "var(--color-accent-600)",
                  }
                : {}),
            }}
          >
            {showDeleted ? "Hide deleted" : `Show deleted (${counts.deleted})`}
          </Link>
        ) : null}
      </div>

      {/* Surfaced prominently rather than buried on each row: an enquiry that
          was captured but never emailed is the failure mode most likely to
          cost a job, and it is invisible unless someone is told about it. */}
      {counts.undelivered > 0 ? (
        <div className="adm-note adm-note-warn" style={{ marginBottom: "1rem" }}>
          <strong>
            {counts.undelivered} request{counts.undelivered === 1 ? " was" : "s were"} not
            emailed.
          </strong>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.875rem" }}>
            They are saved here and nothing is lost. This usually means no
            sending account is configured yet — once it is, they go out
            automatically within fifteen minutes.
          </p>
        </div>
      ) : null}

      <LeadList leads={leads} />

      {pages > 1 ? (
        <nav
          aria-label="Pages"
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginTop: "1rem",
          }}
        >
          {current > 1 ? (
            <Link
              href={href(query, { page: String(current - 1) })}
              className="adm-btn adm-btn-ghost"
              style={{ minHeight: "2.25rem" }}
            >
              Previous
            </Link>
          ) : null}

          <span className="adm-muted" style={{ margin: "0 auto" }}>
            Page {current} of {pages}
          </span>

          {current < pages ? (
            <Link
              href={href(query, { page: String(current + 1) })}
              className="adm-btn adm-btn-ghost"
              style={{ minHeight: "2.25rem" }}
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
