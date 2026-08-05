"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminReview } from "@/lib/admin/api";
import { ConfirmButton } from "../ConfirmButton";
import { Toast } from "../Toast";
import type { ProjectOption } from "./data";
import {
  createReview,
  deleteReview,
  updateReview,
  type FormState,
} from "../../actions";

function SaveBar({ review }: { review?: AdminReview }) {
  const { pending } = useFormStatus();

  return (
    <div className="adm-savebar">
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : review ? "Save changes" : "Add review"}
      </button>
      <a href="/admin/reviews" className="adm-btn adm-btn-ghost">
        Cancel
      </a>
    </div>
  );
}

/** Five radios styled as stars, plus a "no rating" option that a visitor's
    form does not offer — see the note on the rating field below. */
function RatingField({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  return (
    <fieldset className="adm-field" style={{ border: 0, padding: 0, margin: "0 0 0.9rem" }}>
      <legend style={{ padding: 0 }}>Rating</legend>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              style={{
                cursor: "pointer",
                fontSize: "1.5rem",
                lineHeight: 1,
                color: n <= value ? "var(--color-accent-600)" : "var(--color-neutral-400)",
              }}
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="adm-sr-only"
              />
              {n <= value ? "★" : "☆"}
              <span className="adm-sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
            </label>
          ))}
        </div>

        {value > 0 ? (
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            style={{ minHeight: "2rem" }}
            onClick={() => onChange(0)}
          >
            Clear rating
          </button>
        ) : (
          <span className="adm-muted" style={{ fontSize: "0.8rem" }}>
            No rating
          </span>
        )}
      </div>
      {/* Unrated is a real state here and only here: quotes collected before
          ratings existed still belong on the site, and putting a star count on
          one would be inventing it. The public form requires a rating. */}
      <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
        Optional for reviews you enter yourself. Reviews left on the website
        always carry one.
      </span>
      {error ? <span className="adm-error">{error}</span> : null}
    </fieldset>
  );
}

export function ReviewForm({
  review,
  projects,
}: {
  review?: AdminReview;
  projects: ProjectOption[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    review ? updateReview : createReview,
    { ok: false }
  );

  const [rating, setRating] = useState(review?.rating ?? 0);

  /* Auto-fill the slug from the name while creating, and stop as soon as it is
     edited by hand. A review is never addressed by slug on the site, but the
     column is unique among live rows, so it still has to be something — and it
     is what makes a row findable in the database. */
  const [slug, setSlug] = useState(review?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(review));

  const err = (field: string) => state.errors?.[field];

  const fromVisitor = review?.source === "visitor";

  return (
    <form action={action} noValidate>
      {review ? <input type="hidden" name="id" value={review.id} /> : null}
      {/* An unrated review posts no radio at all, so the field would be absent
          from the FormData and the API would leave the old value in place.
          This carries the empty string, which the action reads as null. */}
      {rating === 0 ? <input type="hidden" name="rating" value="" /> : null}

      {fromVisitor ? (
        <div className="adm-note adm-note-info" style={{ marginBottom: "1rem" }}>
          <strong>Left on the website by {review.author}.</strong>
          <p style={{ margin: "0.35rem 0 0" }}>
            {review.submitterEmail ? (
              <>
                Contact: <a href={`mailto:${review.submitterEmail}`}>{review.submitterEmail}</a>.{" "}
              </>
            ) : null}
            Edit for typos if you need to, but publish it as written — this is
            somebody else&rsquo;s words.
          </p>
        </div>
      ) : null}

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <RatingField value={rating} onChange={setRating} error={err("rating")} />

        <label className="adm-field">
          <span>Review</span>
          <textarea
            className="adm-textarea"
            name="quote"
            defaultValue={review?.quote ?? ""}
            maxLength={2000}
            style={{ minHeight: "8rem" }}
            required
          />
          {err("quote") ? <span className="adm-error">{err("quote")}</span> : null}
        </label>

        <label className="adm-field">
          <span>Name</span>
          <input
            className="adm-input"
            name="author"
            defaultValue={review?.author ?? ""}
            maxLength={160}
            onChange={(event) => {
              if (slugTouched) return;
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, "")
                  .trim()
                  .replace(/[\s_]+/g, "-")
                  .replace(/-+/g, "-")
              );
            }}
            required
          />
          {err("author") ? <span className="adm-error">{err("author")}</span> : null}
        </label>

        <label className="adm-field">
          <span>Role</span>
          <input
            className="adm-input"
            name="role"
            defaultValue={review?.role ?? ""}
            maxLength={160}
            placeholder="Property Developer"
          />
          {err("role") ? <span className="adm-error">{err("role")}</span> : null}
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Company</span>
          <input
            className="adm-input"
            name="company"
            defaultValue={review?.company ?? ""}
            maxLength={160}
            placeholder="Okafor Estates"
          />
          {err("company") ? <span className="adm-error">{err("company")}</span> : null}
        </label>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Reference (internal)</span>
          <input
            className="adm-input"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            Not shown anywhere on the website — it only has to be unique.
          </span>
          {err("slug") ? <span className="adm-error">{err("slug")}</span> : null}
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Project</span>
          <select
            className="adm-select"
            name="projectId"
            defaultValue={review?.projectId ? String(review.projectId) : ""}
          >
            <option value="">Not tied to a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            Also shows this review on that project&rsquo;s page.
          </span>
          {err("projectId") ? <span className="adm-error">{err("projectId")}</span> : null}
        </label>
      </div>

      <div className="adm-card" style={{ padding: "1rem" }}>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Visibility</span>
          <select
            className="adm-select"
            name="status"
            defaultValue={review?.status ?? "draft"}
          >
            <option value="draft">
              {fromVisitor
                ? "Pending — not on the website"
                : "Draft — not on the website"}
            </option>
            <option value="published">Live — visible to everyone</option>
          </select>
        </label>
      </div>

      {!state.ok && state.message ? (
        <p className="adm-error" style={{ marginTop: "0.75rem" }}>
          {state.message}
        </p>
      ) : null}

      <Toast state={state} />
      <SaveBar review={review} />
    </form>
  );
}

/** Separate form element — a nested <form> is invalid HTML, so delete cannot
    live inside the edit form above. */
export function DeleteReviewForm({ id }: { id: number }) {
  return (
    <form action={deleteReview}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton confirmLabel="Yes, delete it">Delete review</ConfirmButton>
    </form>
  );
}
