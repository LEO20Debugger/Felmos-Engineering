"use client";

import { useActionState, useState } from "react";

import type { AdminMedia } from "@/lib/admin/api";
import { deleteMedia, updateMedia, type FormState } from "../../actions";
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

  return (
    <>
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
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            aria-pressed={selected?.id === item.id}
            style={{
              position: "relative",
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
        ))}
      </div>

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
