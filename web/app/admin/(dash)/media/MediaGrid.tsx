"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminMedia } from "@/lib/admin/api";
import {
  bulkDeleteMedia,
  deleteMedia,
  updateMedia,
  type FormState,
} from "../../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Toast } from "../Toast";

type Item = AdminMedia & { thumb: string | null };

/**
 * The library grid, with an inline editor for the selected image.
 *
 * A panel rather than a modal dialog: on a phone a modal covering the grid
 * makes it impossible to see which image you picked, and <dialog> still needs
 * focus-trap handling that a plain expanding panel does not.
 */
export function MediaGrid({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [ticked, setTicked] = useState<number[]>([]);

  const [bulkState, bulkAction] = useActionState<FormState, FormData>(
    bulkDeleteMedia,
    { ok: false }
  );

  /* Clear the ticks once a batch lands — the grid re-renders from the server
     and the deleted tiles are gone, so holding their ids would arm the bar with
     images that no longer exist. Blocked ones are re-selectable by hand; they
     need a decision, not a retry of the same click. */
  useEffect(() => {
    if (bulkState.message) setTicked([]);
  }, [bulkState]);

  const tick = (id: number) =>
    setTicked((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const allTicked = items.length > 0 && ticked.length === items.length;

  return (
    <>
      {items.length > 0 ? (
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
            checked={allTicked}
            onChange={() => setTicked(allTicked ? [] : items.map((i) => i.id))}
          />
          {allTicked ? "Clear selection" : `Select all ${items.length}`}
        </label>
      ) : null}

      <div
        style={{
          display: "grid",
          /* Two columns on a phone, filling out to six on a wide screen,
             without a media query per breakpoint. */
          gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
          gap: "0.6rem",
        }}
      >
        {items.map((item) => (
          /* The checkbox is a sibling of the tile, not a child: a checkbox
             inside a <button> is invalid, and clicking it would open the
             editor instead of ticking. */
          <div key={item.id} style={{ position: "relative" }}>
            <button
              type="button"
              className="adm-tile"
              onClick={() => setSelected(item)}
              aria-pressed={selected?.id === item.id}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                padding: 0,
                border:
                  selected?.id === item.id
                    ? "2px solid var(--color-accent-600)"
                    : "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "var(--color-neutral-300)",
                cursor: "pointer",
                opacity: ticked.includes(item.id) ? 0.55 : 1,
              }}
            >
              {item.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumb}
                  alt={item.alt}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${item.focalX}% ${item.focalY}%`,
                    display: "block",
                  }}
                />
              ) : null}

              {item.alt.trim() === "" ? (
                <span
                  className="adm-pill adm-pill-gone"
                  style={{ position: "absolute", left: 4, bottom: 4 }}
                >
                  No text
                </span>
              ) : null}
            </button>

            <input
              type="checkbox"
              checked={ticked.includes(item.id)}
              onChange={() => tick(item.id)}
              aria-label={`Select ${item.alt || item.title || `image ${item.id}`}`}
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                width: "1.15rem",
                height: "1.15rem",
                cursor: "pointer",
                /* Its own backing, so it stays visible over a pale photograph. */
                accentColor: "var(--color-accent-600)",
                boxShadow: "0 0 0 3px rgba(0,0,0,0.35)",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>

      <Toast state={bulkState} />

      {ticked.length > 0 ? (
        <form action={bulkAction} className="adm-savebar" style={{ flexWrap: "wrap" }}>
          {ticked.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}

          <strong style={{ marginRight: "auto" }}>{ticked.length} selected</strong>

          <BulkDeleteButton count={ticked.length} />

          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            style={{ minHeight: "2.25rem" }}
            onClick={() => setTicked([])}
          >
            Cancel
          </button>
        </form>
      ) : null}

      {selected ? (
        <Editor
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

/** Two-step, like ConfirmButton — but inside the bulk form, so it submits it. */
function BulkDeleteButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(timer);
  }, [armed]);

  /* Disarm whenever the selection changes size — the confirmation was for the
     set that was on screen when it was armed, not whatever it is now. */
  useEffect(() => setArmed(false), [count]);

  if (pending) {
    return (
      <button className="adm-btn adm-btn-danger" disabled style={{ minHeight: "2.25rem" }}>
        Deleting…
      </button>
    );
  }

  return armed ? (
    <button className="adm-btn adm-btn-danger" style={{ minHeight: "2.25rem" }}>
      Yes, delete {count}
    </button>
  ) : (
    <button
      type="button"
      className="adm-btn adm-btn-danger"
      style={{ minHeight: "2.25rem" }}
      onClick={() => setArmed(true)}
    >
      Delete
    </button>
  );
}

function Editor({ item, onClose }: { item: Item; onClose: () => void }) {
  const [saveState, save] = useActionState<FormState, FormData>(updateMedia, {
    ok: false,
  });
  const [deleteState, remove] = useActionState<FormState, FormData>(
    deleteMedia,
    { ok: false }
  );

  const [focal, setFocal] = useState({ x: item.focalX, y: item.focalY });

  return (
    <div className="adm-card" style={{ padding: "1rem", marginTop: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <strong>{item.title ?? `Image ${item.id}`}</strong>
        <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="adm-grid adm-grid-2" style={{ marginTop: "0.75rem" }}>
        <div>
          {/* Click to set the focal point. This replaces choosing crop
              dimensions by hand: the editor points at the subject, and every
              layout crops around it via CSS object-position. */}
          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setFocal({
                x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
                y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
              });
            }}
            style={{
              position: "relative",
              display: "block",
              width: "100%",
              padding: 0,
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              cursor: "crosshair",
              background: "var(--color-neutral-300)",
            }}
          >
            {item.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumb}
                alt={item.alt}
                style={{ width: "100%", display: "block" }}
              />
            ) : null}
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: `${focal.x}%`,
                top: `${focal.y}%`,
                width: 14,
                height: 14,
                marginLeft: -7,
                marginTop: -7,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 0 0 2px rgba(0,0,0,.45)",
              }}
            />
          </button>
          <p className="adm-muted" style={{ fontSize: "0.75rem" }}>
            Click the most important part of the picture. Crops keep it in
            frame.
          </p>
        </div>

        <div>
          <form action={save}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="focalX" value={focal.x} />
            <input type="hidden" name="focalY" value={focal.y} />

            <label className="adm-field">
              <span>Description</span>
              <textarea
                className="adm-textarea"
                name="alt"
                defaultValue={item.alt}
                maxLength={300}
                style={{ minHeight: "5rem" }}
              />
            </label>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button className="adm-btn">Save</button>
            </div>
          </form>

          <form action={remove} style={{ marginTop: "1.25rem" }}>
            <input type="hidden" name="id" value={item.id} />
            <ConfirmButton confirmLabel="Yes, delete it">Delete image</ConfirmButton>
            {!deleteState.ok && deleteState.message ? (
              /* Kept inline as well as in the toast: the API's 409 names every
                 service, project, article or person still using this image,
                 which is a list worth reading rather than watching fade. */
              <p className="adm-error">{deleteState.message}</p>
            ) : null}
          </form>

          <Toast state={saveState} />
          <Toast state={deleteState} />
        </div>
      </div>
    </div>
  );
}
