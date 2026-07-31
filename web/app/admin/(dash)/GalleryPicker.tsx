"use client";

import { useState } from "react";

import type { AdminImage } from "@/lib/admin/api";
import type { PickerOption } from "./ImagePicker";

/**
 * Choose and order several images — the gallery behind a project's hero.
 *
 * The ordered sibling of ImagePicker, and it picks from the same library for
 * the same reason: uploading from inside another form would mean a nested
 * <form>, which is invalid HTML, and it keeps "describe every image" on the
 * media page where it belongs.
 *
 * Ordering is done with move-left/move-right buttons rather than drag and drop.
 * Drag needs a dependency, needs a keyboard fallback built anyway to be usable
 * at all, and is genuinely awkward on the phone this dashboard is most often
 * opened on. Two buttons are none of those things.
 */
export function GalleryPicker({
  name,
  current,
  options,
}: {
  name: string;
  current: AdminImage[];
  options: PickerOption[];
}) {
  const [selected, setSelected] = useState<number[]>(current.map((i) => i.id));
  const [open, setOpen] = useState(false);

  const byId = new Map(options.map((o) => [o.id, o]));

  const move = (index: number, by: number) => {
    setSelected((ids) => {
      const next = [...ids];
      const target = index + by;
      if (target < 0 || target >= next.length) return ids;
      [next[index], next[target]] = [next[target] as number, next[index] as number];
      return next;
    });
  };

  const toggle = (id: number) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  /* One comma-separated value rather than repeated inputs: the order is the
     thing being edited here, and a single string carries it unambiguously. */
  const missingAlt = selected.filter((id) => !(byId.get(id)?.alt ?? "").trim());

  return (
    <div className="adm-field">
      <span
        style={{
          display: "block",
          marginBottom: "0.3rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--color-neutral-800)",
        }}
      >
        Gallery
      </span>

      <input type="hidden" name={name} value={selected.join(",")} />

      <p className="adm-muted" style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>
        The photographs shown on the project&rsquo;s own page, in this order.
        The main image above is separate — it&rsquo;s what appears on the index
        and when the page is shared.
      </p>

      {selected.length === 0 ? (
        <p className="adm-muted" style={{ margin: "0 0 0.5rem" }}>
          No photographs yet.
        </p>
      ) : (
        <ol
          style={{
            display: "flex",
            gap: "0.5rem",
            listStyle: "none",
            margin: "0 0 0.6rem",
            padding: "0 0 0.3rem",
            overflowX: "auto",
          }}
        >
          {selected.map((id, index) => {
            const option = byId.get(id);

            return (
              <li key={id} style={{ flex: "0 0 auto", width: "6rem" }}>
                <span
                  style={{
                    display: "block",
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--color-divider)",
                    background: "var(--color-neutral-300)",
                  }}
                >
                  {option?.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={option.thumb}
                      alt={option.alt}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}

                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: "0.2rem",
                      left: "0.2rem",
                      padding: "0.05rem 0.3rem",
                      borderRadius: "var(--radius-sm, 4px)",
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      fontSize: "0.68rem",
                    }}
                  >
                    {index + 1}
                  </span>
                </span>

                <span style={{ display: "flex", gap: "0.2rem", marginTop: "0.3rem" }}>
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost"
                    style={{ flex: 1, minHeight: "1.9rem", padding: "0 0.2rem" }}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${option?.alt || "image"} earlier`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost"
                    style={{ flex: 1, minHeight: "1.9rem", padding: "0 0.2rem" }}
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    aria-label={`Move ${option?.alt || "image"} later`}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost"
                    style={{ flex: 1, minHeight: "1.9rem", padding: "0 0.2rem" }}
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${option?.alt || "image"}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <button
        type="button"
        className="adm-btn adm-btn-ghost"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Done choosing" : "Add photographs"}
      </button>

      {missingAlt.length > 0 ? (
        <p className="adm-error" style={{ marginTop: "0.4rem" }}>
          {missingAlt.length === 1 ? "One photograph has" : `${missingAlt.length} photographs have`}{" "}
          no description. Add one on the Media page — screen readers and search
          engines both rely on it.
        </p>
      ) : null}

      {open ? (
        <div
          className="adm-card"
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem",
            maxHeight: "18rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(6rem, 1fr))",
              gap: "0.5rem",
            }}
          >
            {options.map((option) => {
              const position = selected.indexOf(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.alt || option.title || `Image ${option.id}`}
                  aria-pressed={position !== -1}
                  onClick={() => toggle(option.id)}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    padding: 0,
                    border:
                      position === -1
                        ? "1px solid var(--color-divider)"
                        : "2px solid var(--color-accent-600)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    background: "var(--color-neutral-300)",
                    cursor: "pointer",
                  }}
                >
                  {option.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={option.thumb}
                      alt={option.alt}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}

                  {position !== -1 ? (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: "0.2rem",
                        left: "0.2rem",
                        padding: "0.05rem 0.3rem",
                        borderRadius: "var(--radius-sm, 4px)",
                        background: "var(--color-accent-600)",
                        color: "#fff",
                        fontSize: "0.68rem",
                      }}
                    >
                      {position + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
