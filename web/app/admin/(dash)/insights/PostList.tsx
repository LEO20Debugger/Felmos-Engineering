"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import type { AdminPost } from "@/lib/admin/api";
import { Toast } from "../Toast";
import { bulkPosts, restorePost, type FormState } from "../../actions";

/**
 * The article list, with multi-select — the same component as TeamList and
 * ProjectList, against posts.
 *
 * A client component only because selection is client state. The checkbox sits
 * outside the <Link>, since a checkbox inside a link navigates instead of
 * ticking.
 *
 * The thumbnail URL and the formatted date are both built on the server and
 * passed in: the first so this file never needs the media helpers, the second
 * because toLocaleDateString with no explicit locale resolves differently on
 * the server and the client and produces a hydration mismatch.
 */

type Row = AdminPost & { thumb: string | null; dateLabel: string };

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

export function PostList({
  posts,
  showDeleted,
}: {
  posts: Row[];
  showDeleted: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, action] = useActionState<FormState, FormData>(bulkPosts, {
    ok: false,
  });

  /* Drop the selection once the batch lands — the list re-renders from the
     server, and a delete removes rows from this view entirely. */
  useEffect(() => {
    if (state.ok) setSelected([]);
  }, [state]);

  const selectable = posts.filter((p) => (showDeleted ? true : !p.isDeleted));

  const allSelected =
    selectable.length > 0 && selected.length === selectable.length;

  const toggle = (id: number) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const chosen = posts.filter((p) => selected.includes(p.id));
  const anyDeleted = chosen.some((p) => p.isDeleted);
  const anyLive = chosen.some((p) => !p.isDeleted);

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
              setSelected(allSelected ? [] : selectable.map((p) => p.id))
            }
          />
          {allSelected ? "Clear selection" : `Select all ${selectable.length}`}
        </label>
      ) : null}

      <div className="adm-card">
        {posts.length === 0 ? (
          <p className="adm-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
            No articles yet.
          </p>
        ) : (
          posts.map((post) => {
            const meta =
              [
                post.category,
                post.dateLabel,
                post.authorName,
                post.readMinutes ? `${post.readMinutes} min read` : null,
              ]
                .filter(Boolean)
                .join(" · ") || `/${post.slug}`;

            return (
              <div key={post.id} className="adm-row">
                {/* The label is the tap target, not the checkbox — see
                    .adm-row-tick in admin.css. */}
                <label className="adm-row-tick">
                  <input
                    type="checkbox"
                    checked={selected.includes(post.id)}
                    onChange={() => toggle(post.id)}
                    aria-label={`Select ${post.title}`}
                  />
                </label>

                {post.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="adm-thumb"
                    src={post.thumb}
                    alt=""
                    width={48}
                    height={48}
                  />
                ) : (
                  <span className="adm-thumb" aria-hidden />
                )}

                {/* Deleted rows aren't links — the edit page would only offer
                    changes that can't be saved. */}
                {post.isDeleted ? (
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{post.title}</strong>
                    <span className="adm-muted">{meta}</span>
                  </span>
                ) : (
                  <Link
                    href={`/admin/insights/${post.id}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.title}
                    </strong>
                    <span className="adm-muted">{meta}</span>
                  </Link>
                )}

                <span
                  className={`adm-pill ${
                    post.isDeleted
                      ? "adm-pill-gone"
                      : post.status === "published"
                        ? "adm-pill-live"
                        : "adm-pill-draft"
                  }`}
                >
                  {post.isDeleted
                    ? "Deleted"
                    : post.status === "published"
                      ? "Live"
                      : "Draft"}
                </span>

                {post.isDeleted ? (
                  <form action={restorePost}>
                    <input type="hidden" name="id" value={post.id} />
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
              <ActionButton action="publish">Publish</ActionButton>
              <ActionButton action="draft">Move to draft</ActionButton>
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
