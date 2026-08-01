"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import type { AdminProject } from "@/lib/admin/api";
import { Toast } from "../Toast";
import { bulkProjects, restoreProject, type FormState } from "../../actions";

/**
 * The projects list, with multi-select.
 *
 * A client component only because selection is client state. The rows are
 * otherwise the same markup the server version rendered — the checkbox sits
 * outside the <Link>, since a checkbox inside a link navigates instead of
 * ticking.
 *
 * The thumbnail URL is built on the server and passed in, so this file never
 * needs the media helpers or the API base.
 */

type Row = AdminProject & { thumb: string | null };

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
      /* Solid, like every other button that changes something. These are the
         whole point of the bar, and as outlines they read as disabled. */
      className={`adm-btn ${danger ? "adm-btn-danger" : ""}`}
      style={{ minHeight: "2.25rem" }}
    >
      {children}
    </button>
  );
}

export function ProjectList({
  projects,
  showDeleted,
}: {
  projects: Row[];
  showDeleted: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [state, action] = useActionState<FormState, FormData>(bulkProjects, {
    ok: false,
  });

  /* Drop the selection once the batch lands. The list re-renders from the
     server with new statuses, and leaving ticks on rows that may no longer be
     there — a delete removes them from this view entirely — would arm the bar
     with ids that no longer apply. */
  useEffect(() => {
    if (state.ok) setSelected([]);
  }, [state]);

  /* Deleted rows only accept restore, live ones only accept the rest. Mixing
     them in one selection would make the action bar lie about what it does, so
     the checkbox set is scoped to whichever list is on screen. */
  const selectable = projects.filter((p) =>
    showDeleted ? true : !p.isDeleted
  );

  const allSelected =
    selectable.length > 0 && selected.length === selectable.length;

  const toggle = (id: number) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const chosen = projects.filter((p) => selected.includes(p.id));
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
        {projects.length === 0 ? (
          <p className="adm-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
            No projects yet.
          </p>
        ) : (
          projects.map((project) => {
            const meta =
              [
                project.location,
                project.year ? String(project.year) : null,
                project.gallery.length > 0
                  ? `${project.gallery.length} photo${project.gallery.length === 1 ? "" : "s"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || `/${project.slug}`;

            return (
              <div key={project.id} className="adm-row">
                {/* The label is the tap target, not the checkbox — see
                    .adm-row-tick in admin.css. */}
                <label className="adm-row-tick">
                  <input
                    type="checkbox"
                    checked={selected.includes(project.id)}
                    onChange={() => toggle(project.id)}
                    aria-label={`Select ${project.title}`}
                  />
                </label>

                {project.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="adm-thumb"
                    src={project.thumb}
                    alt=""
                    width={48}
                    height={48}
                  />
                ) : (
                  <span className="adm-thumb" aria-hidden />
                )}

                {/* Deleted rows aren't links — the edit page would only offer
                    changes that can't be saved. */}
                {project.isDeleted ? (
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{project.title}</strong>
                    <span className="adm-muted">{meta}</span>
                  </span>
                ) : (
                  <Link
                    href={`/admin/projects/${project.id}`}
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
                      {project.title}
                    </strong>
                    <span className="adm-muted">{meta}</span>
                  </Link>
                )}

                <span
                  className={`adm-pill ${
                    project.isDeleted
                      ? "adm-pill-gone"
                      : project.status === "published"
                        ? "adm-pill-live"
                        : "adm-pill-draft"
                  }`}
                >
                  {project.isDeleted
                    ? "Deleted"
                    : project.status === "published"
                      ? "Live"
                      : "Draft"}
                </span>

                {project.isDeleted ? (
                  <form action={restoreProject}>
                    <input type="hidden" name="id" value={project.id} />
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
