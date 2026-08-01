"use client";

import { useId, useMemo, useState } from "react";

import type { AdminPostBlock } from "@/lib/admin/api";

/**
 * The article body, edited block by block.
 *
 * Posts are structured data, not a box of formatted text — that decision is
 * made in the schema and the site's renderer, and this is the editor that
 * matches it. Each block is one of four kinds the renderer already knows how to
 * draw, so nothing an editor can produce here can reach the site as a section
 * that renders blank.
 *
 * The whole body leaves as one hidden JSON field. Blocks are added, removed and
 * reordered in the browser, so there is no fixed set of input names to post —
 * and encoding position into names (`body.3.items.1`) would mean reassembling
 * an array out of a flat FormData on the server, which is the same round trip
 * with more ways to go wrong.
 *
 * List items are edited as one line each in a textarea, the same idiom the
 * services form uses for benefits: it is the shape people already type lists
 * in, and it avoids a nested add/remove control inside a block that is itself
 * add/removable.
 */

type Kind = AdminPostBlock["kind"];

/** A block plus the key React needs. Ids are client-side only and never sent —
    two paragraphs with identical text are still different blocks, and using the
    array index as a key makes a deletion re-use the wrong DOM node. */
type Editable = {
  key: string;
  kind: Kind;
  /** For p / h2 / quote. */
  text: string;
  /** For quote. */
  attribution: string;
  /** For list — one item per line. */
  items: string;
};

const LABELS: Record<Kind, string> = {
  p: "Paragraph",
  h2: "Heading",
  quote: "Pull quote",
  list: "List",
};

const HINTS: Record<Kind, string> = {
  p: "One idea. Long paragraphs are fine — the article page sets the measure.",
  h2: "A section heading. These are the only headings the article renders.",
  quote: "Set apart from the body. Attribution is optional.",
  list: "One item per line. Blank lines are ignored.",
};

let counter = 0;
const nextKey = () => `b${(counter += 1)}`;

function toEditable(block: AdminPostBlock): Editable {
  return {
    key: nextKey(),
    kind: block.kind,
    text: block.kind === "list" ? "" : block.text,
    attribution: block.kind === "quote" ? (block.attribution ?? "") : "",
    items: block.kind === "list" ? block.items.join("\n") : "",
  };
}

function blank(kind: Kind): Editable {
  return { key: nextKey(), kind, text: "", attribution: "", items: "" };
}

/**
 * Back to the wire shape, dropping anything empty.
 *
 * An empty block is a block someone added and then thought better of. The API
 * rejects them, and failing a save over a stray empty paragraph would be a poor
 * trade for what the editor actually meant.
 */
function serialise(blocks: Editable[]): AdminPostBlock[] {
  const out: AdminPostBlock[] = [];

  for (const block of blocks) {
    if (block.kind === "list") {
      const items = block.items
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (items.length > 0) out.push({ kind: "list", items });
      continue;
    }

    const text = block.text.trim();
    if (!text) continue;

    if (block.kind === "quote") {
      const attribution = block.attribution.trim();
      out.push({ kind: "quote", text, ...(attribution ? { attribution } : {}) });
    } else {
      out.push({ kind: block.kind, text });
    }
  }

  return out;
}

const words = (blocks: AdminPostBlock[]): number =>
  blocks.reduce((count, block) => {
    const text = block.kind === "list" ? block.items.join(" ") : block.text;
    return count + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);

export function BlockEditor({
  name,
  initial,
}: {
  name: string;
  initial: AdminPostBlock[];
}) {
  const [blocks, setBlocks] = useState<Editable[]>(() =>
    initial.length > 0 ? initial.map(toEditable) : [blank("p")]
  );

  const fieldId = useId();

  const payload = useMemo(() => serialise(blocks), [blocks]);
  const count = words(payload);

  const update = (key: string, patch: Partial<Editable>) =>
    setBlocks((list) =>
      list.map((b) => (b.key === key ? { ...b, ...patch } : b))
    );

  const remove = (key: string) =>
    setBlocks((list) => list.filter((b) => b.key !== key));

  const move = (index: number, by: -1 | 1) =>
    setBlocks((list) => {
      const to = index + by;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(to, 0, moved as Editable);
      return next;
    });

  const add = (kind: Kind) => setBlocks((list) => [...list, blank(kind)]);

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(payload)} />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "0.6rem",
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--color-neutral-800)",
          }}
        >
          Article
        </span>
        {/* Reading time is derived by the API from exactly this text, so the
            estimate here is the figure the site will print rather than a
            second calculation that can disagree with it. */}
        <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
          {payload.length} block{payload.length === 1 ? "" : "s"} · {count} word
          {count === 1 ? "" : "s"} · ~{Math.max(1, Math.round(count / 200))} min
          read
        </span>
      </div>

      {blocks.map((block, index) => (
        <div
          key={block.key}
          className="adm-card"
          style={{ padding: "0.75rem", marginBottom: "0.6rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <select
              className="adm-select"
              value={block.kind}
              onChange={(event) =>
                update(block.key, { kind: event.target.value as Kind })
              }
              aria-label={`Block ${index + 1} type`}
              style={{ width: "auto", minWidth: "9rem" }}
            >
              {(Object.keys(LABELS) as Kind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {LABELS[kind]}
                </option>
              ))}
            </select>

            <span style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
              <button
                type="button"
                className="adm-btn adm-btn-ghost"
                style={{ minHeight: "2.25rem" }}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move block ${index + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-ghost"
                style={{ minHeight: "2.25rem" }}
                onClick={() => move(index, 1)}
                disabled={index === blocks.length - 1}
                aria-label={`Move block ${index + 1} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-ghost"
                style={{ minHeight: "2.25rem" }}
                onClick={() => remove(block.key)}
                aria-label={`Remove block ${index + 1}`}
              >
                Remove
              </button>
            </span>
          </div>

          {block.kind === "list" ? (
            <textarea
              className="adm-textarea"
              id={`${fieldId}-${block.key}`}
              value={block.items}
              onChange={(event) =>
                update(block.key, { items: event.target.value })
              }
              placeholder={"First point\nSecond point"}
              style={{ minHeight: "7rem" }}
            />
          ) : block.kind === "h2" ? (
            <input
              className="adm-input"
              id={`${fieldId}-${block.key}`}
              value={block.text}
              onChange={(event) => update(block.key, { text: event.target.value })}
              maxLength={200}
              placeholder="Section heading"
            />
          ) : (
            <textarea
              className="adm-textarea"
              id={`${fieldId}-${block.key}`}
              value={block.text}
              onChange={(event) => update(block.key, { text: event.target.value })}
              maxLength={block.kind === "quote" ? 1200 : 5000}
              style={{ minHeight: block.kind === "quote" ? "5rem" : "9rem" }}
              placeholder={block.kind === "quote" ? "The line worth pulling out" : ""}
            />
          )}

          {block.kind === "quote" ? (
            <input
              className="adm-input"
              value={block.attribution}
              onChange={(event) =>
                update(block.key, { attribution: event.target.value })
              }
              maxLength={160}
              placeholder="Attribution (optional)"
              style={{ marginTop: "0.5rem" }}
            />
          ) : null}

          <p
            className="adm-muted"
            style={{ margin: "0.4rem 0 0", fontSize: "0.75rem" }}
          >
            {HINTS[block.kind]}
          </p>
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {(Object.keys(LABELS) as Kind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            className="adm-btn adm-btn-ghost"
            style={{ minHeight: "2.25rem" }}
            onClick={() => add(kind)}
          >
            + {LABELS[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}
