"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import type { AdminReview } from "@/lib/admin/api";
import { Toast } from "../Toast";
import { bulkReviews, restoreReview, type FormState } from "../../actions";

/**
 * The reviews list, with multi-select — the same component as TeamList and
 * ProjectList, against reviews.
 *
 * Two things it does that the others don't. The primary action is Approve
 * rather than Publish, because on the pending view that is what the person is
 * actually doing and the word matters when the thing being published was
 * written by somebody else. And each row shows where the review came from: a
 * draft written by staff and a submission from a stranger need different
 * scrutiny, and `status` alone cannot tell them apart.
 */

type Row = AdminReview & { dateLabel: string };

const STARS = (rating: number | null) =>
  rating === null ? null : "★".repeat(rating) + "☆".repeat(5 - rating);

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

export function ReviewList({
  reviews,
  showDeleted,
  view,
}: {
  reviews: Row[];
  showDeleted: boolean;
  view: string;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, action] = useActionState<FormState, FormData>(bulkReviews, {
    ok: false,
  });

  /* Drop the selection once the batch lands — approving a set removes those
     rows from the pending view entirely, and leaving ticks behind would arm
     the bar with ids that are no longer on screen. */
  useEffect(() => {
    if (state.ok) setSelected([]);
  }, [state]);

  const selectable = reviews.filter((r) => (showDeleted ? true : !r.isDeleted));

  const allSelected =
    selectable.length > 0 && selected.length === selectable.length;

  const toggle = (id: number) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const chosen = reviews.filter((r) => selected.includes(r.id));
  const anyDeleted = chosen.some((r) => r.isDeleted);
  const anyLive = chosen.some((r) => !r.isDeleted);
  const anyUnpublished = chosen.some(
    (r) => !r.isDeleted && r.status !== "published"
  );
  const anyPublished = chosen.some(
    (r) => !r.isDeleted && r.status === "published"
  );

  const emptyMessage =
    view === "pending"
      ? "Nothing waiting for approval. New reviews from the website land here."
      : showDeleted
        ? "No deleted reviews."
        : "No reviews here yet.";

  return (
    <>
      {selectable.length > 0 ? (
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
            onChange={() =>
              setSelected(allSelected ? [] : selectable.map((r) => r.id))
            }
          />
          {allSelected ? "Clear selection" : `Select all ${selectable.length}`}
        </label>
      ) : null}

      <div className="adm-card">
        {reviews.length === 0 ? (
          <p className="adm-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
            {emptyMessage}
          </p>
        ) : (
          reviews.map((review) => {
            const stars = STARS(review.rating);
            const who =
              [review.role, review.company].filter(Boolean).join(", ") ||
              review.submitterEmail ||
              "";

            /* A pending review is a visitor's draft. Staff drafts show as
               "Draft", because nobody is waiting on those. */
            const pending = review.source === "visitor" && review.status === "draft";

            return (
              <div key={review.id} className="adm-row" style={{ alignItems: "flex-start" }}>
                <label className="adm-row-tick">
                  <input
                    type="checkbox"
                    checked={selected.includes(review.id)}
                    onChange={() => toggle(review.id)}
                    aria-label={`Select the review from ${review.author}`}
                  />
                </label>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {stars ? (
                      <span
                        aria-label={`${review.rating} out of 5`}
                        style={{
                          color: "var(--color-accent-600)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {stars}
                      </span>
                    ) : (
                      <span className="adm-muted" style={{ fontSize: "0.8rem" }}>
                        No rating
                      </span>
                    )}
                    <strong>{review.author}</strong>
                  </div>

                  {review.isDeleted ? (
                    <p className="adm-muted" style={{ margin: "0.3rem 0 0" }}>
                      {review.quote}
                    </p>
                  ) : (
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <p style={{ margin: "0.3rem 0 0", opacity: 0.85 }}>
                        {review.quote.length > 180
                          ? `${review.quote.slice(0, 180)}…`
                          : review.quote}
                      </p>
                    </Link>
                  )}

                  <p
                    className="adm-muted"
                    style={{ margin: "0.35rem 0 0", fontSize: "0.78rem" }}
                  >
                    {[
                      review.source === "visitor" ? "From the website" : "Added by staff",
                      who,
                      review.dateLabel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <span
                  className={`adm-pill ${
                    review.isDeleted
                      ? "adm-pill-gone"
                      : review.status === "published"
                        ? "adm-pill-live"
                        : pending
                          ? "adm-pill-wait"
                          : "adm-pill-draft"
                  }`}
                >
                  {review.isDeleted
                    ? "Deleted"
                    : review.status === "published"
                      ? "Live"
                      : pending
                        ? "Pending"
                        : "Draft"}
                </span>

                {review.isDeleted ? (
                  <form action={restoreReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <button
                      className="adm-btn adm-btn-ghost"
                      style={{ minHeight: "2.25rem" }}
                    >
                      Restore
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <Toast state={state} />

      {selected.length > 0 ? (
        <form action={action} className="adm-savebar" style={{ flexWrap: "wrap" }}>
          {selected.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}

          <strong style={{ marginRight: "auto" }}>
            {selected.length} selected
          </strong>

          {/* Approve is offered only when something in the selection isn't
              already live, and Unpublish only when something is — a bar that
              always shows both makes you read the rows to work out which one
              does anything. */}
          {anyUnpublished ? (
            <ActionButton action="publish">Approve &amp; publish</ActionButton>
          ) : null}

          {anyPublished ? (
            <ActionButton action="draft">Unpublish</ActionButton>
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
