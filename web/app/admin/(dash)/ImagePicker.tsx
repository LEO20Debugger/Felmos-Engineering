"use client";

import { useState } from "react";

import type { AdminImage } from "@/lib/admin/api";

export type PickerOption = {
  id: number;
  alt: string;
  title: string | null;
  thumb: string | null;
};

/**
 * Choose an image for a content item.
 *
 * Picks from the existing library rather than uploading inline — uploading
 * from inside another form would mean a nested <form>, which is invalid HTML,
 * and it keeps the "describe every image" rule in one place (the media page).
 */
export function ImagePicker({
  name,
  current,
  options,
}: {
  name: string;
  current: AdminImage | null;
  options: PickerOption[];
}) {
  const [selectedId, setSelectedId] = useState<number | "">(current?.id ?? "");
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === selectedId);

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
        Image
      </span>

      <input type="hidden" name={name} value={selectedId} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {selected?.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.thumb}
            alt=""
            width={64}
            height={64}
            style={{
              width: "4rem",
              height: "4rem",
              objectFit: "cover",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-divider)",
            }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-neutral-300)",
            }}
          />
        )}

        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          onClick={() => setOpen((v) => !v)}
        >
          {selected ? "Change image" : "Choose image"}
        </button>

        {selected ? (
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            onClick={() => setSelectedId("")}
          >
            Remove
          </button>
        ) : null}
      </div>

      {selected && selected.alt.trim() === "" ? (
        <p className="adm-error" style={{ marginTop: "0.4rem" }}>
          This image has no description. Add one on the Media page — screen
          readers and search engines both rely on it.
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
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.alt || option.title || `Image ${option.id}`}
                onClick={() => {
                  setSelectedId(option.id);
                  setOpen(false);
                }}
                style={{
                  aspectRatio: "1",
                  padding: 0,
                  border:
                    option.id === selectedId
                      ? "2px solid var(--color-accent-600)"
                      : "1px solid var(--color-divider)",
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
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
