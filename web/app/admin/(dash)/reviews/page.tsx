import Link from "next/link";

import { api, type AdminReview } from "@/lib/admin/api";
import { ReviewList } from "./ReviewList";

export const metadata = { title: "Reviews" };

/**
 * The filters, in the order they are worked.
 *
 * "Pending" is first and is the default view, because it is the only one with
 * anything waiting on a person. Everything else is a record of decisions
 * already taken.
 */
const FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "drafts", label: "Drafts" },
  { value: "all", label: "All" },
] as const;

type View = (typeof FILTERS)[number]["value"];

/** The query the API needs for each view. Pending is the only one that filters
    on source — a staff draft is not something anybody is waiting to approve. */
function queryFor(view: View, showDeleted: boolean): string {
  const params = new URLSearchParams();

  if (view === "pending") {
    params.set("status", "draft");
    params.set("source", "visitor");
  } else if (view === "published") {
    params.set("status", "published");
  } else if (view === "drafts") {
    params.set("status", "draft");
  }

  if (showDeleted) params.set("deleted", "1");

  const query = params.toString();
  return query ? `?${query}` : "";
}

function href(view: View, showDeleted: boolean): string {
  const params = new URLSearchParams();
  if (view !== "pending") params.set("view", view);
  if (showDeleted) params.set("deleted", "1");

  const query = params.toString();
  return `/admin/reviews${query ? `?${query}` : ""}`;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; deleted?: string }>;
}) {
  const { view: rawView, deleted } = await searchParams;
  const showDeleted = deleted === "1";

  /* An unrecognised view falls back to pending rather than erroring — it
     arrives from a URL somebody may have edited or bookmarked. */
  const view = (FILTERS.find((f) => f.value === rawView)?.value ??
    "pending") as View;

  /* The pending count comes from the same endpoint the nav badge uses, so the
     two can never disagree about how much work is waiting. */
  const [{ reviews }, { pending }] = await Promise.all([
    api.get<{ reviews: AdminReview[] }>(
      `/admin/reviews${queryFor(view, showDeleted)}`
    ),
    api.get<{ pending: number }>("/admin/reviews/pending-count"),
  ]);

  /* Formatted here, with an explicit locale and UTC, so the server and the
     browser cannot render two different strings and trip hydration. */
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const rows = reviews.map((review) => ({
    ...review,
    dateLabel: formatter.format(new Date(review.createdAt)),
  }));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="adm-h1">Reviews</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            {pending > 0
              ? `${pending} waiting for approval`
              : "Nothing waiting for approval"}
          </p>
        </div>
        <Link href="/admin/reviews/new" className="adm-btn">
          Add review
        </Link>
      </div>

      {pending > 0 && view !== "pending" ? (
        <p className="adm-note adm-note-warn" style={{ marginBottom: "1rem" }}>
          {pending} review{pending === 1 ? "" : "s"} from the website{" "}
          {pending === 1 ? "is" : "are"} waiting for approval.{" "}
          <Link href={href("pending", false)}>Review {pending === 1 ? "it" : "them"}</Link>.
        </p>
      ) : null}

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
            href={href(filter.value, showDeleted)}
            className="adm-btn adm-btn-ghost"
            style={{
              minHeight: "2.25rem",
              ...(view === filter.value
                ? {
                    background: "var(--color-accent-100)",
                    borderColor: "var(--color-accent-600)",
                  }
                : {}),
            }}
          >
            {filter.label}
            {filter.value === "pending" && pending > 0 ? (
              <span className="adm-muted" style={{ marginLeft: "0.35rem" }}>
                {pending}
              </span>
            ) : null}
          </Link>
        ))}

        <Link
          href={href(view, !showDeleted)}
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
          {showDeleted ? "Hide deleted" : "Show deleted"}
        </Link>
      </div>

      <ReviewList reviews={rows} showDeleted={showDeleted} view={view} />
    </>
  );
}
