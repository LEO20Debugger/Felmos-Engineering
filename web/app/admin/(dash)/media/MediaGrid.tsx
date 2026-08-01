"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { AdminMedia } from "@/lib/admin/api";
import {
  bulkDeleteMedia,
  deleteMedia,
  updateMedia,
  type FormState,
} from "../../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Toast } from "../Toast";

type Item = AdminMedia & { thumb: string | null; full: string | null };

/**
 * The library grid, with a full-screen viewer for the opened image.
 *
 * Tapping a tile opens the picture large, over the page, with arrows and the
 * left/right keys to walk the library. The description, focal point and delete
 * live in a panel beside it, so the thing being edited is on screen at a size
 * worth judging — which the old panel under the grid never managed on a phone.
 */
export function MediaGrid({ items }: { items: Item[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [ticked, setTicked] = useState<number[]>([]);

  const [bulkState, bulkAction] = useActionState<FormState, FormData>(
    bulkDeleteMedia,
    { ok: false }
  );

  /* The save and delete states live here rather than in the viewer so their
     toasts survive it closing — a delete unmounts the viewer by definition,
     and the confirmation is the whole point of the click. */
  const [saveState, save] = useActionState<FormState, FormData>(updateMedia, {
    ok: false,
  });
  const [deleteState, remove] = useActionState<FormState, FormData>(
    deleteMedia,
    { ok: false }
  );

  /* Which image the delete state belongs to. Without it, a refusal to delete
     one image would still be printed under the next one you opened. */
  const [deleteErrorFor, setDeleteErrorFor] = useState<number | null>(null);
  useEffect(() => setDeleteErrorFor(null), [openId]);

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

  /* Derived, not stored. A successful delete revalidates the page, the row
     leaves `items`, the index goes to -1 and the viewer closes itself — no
     effect needed to notice the image it was showing no longer exists. */
  const openIndex = items.findIndex((i) => i.id === openId);
  const open = openIndex === -1 ? null : items[openIndex];

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
             viewer instead of ticking. */
          <div key={item.id} style={{ position: "relative" }}>
            <button
              type="button"
              className="adm-tile"
              onClick={() => setOpenId(item.id)}
              aria-haspopup="dialog"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                padding: 0,
                border: "1px solid var(--color-divider)",
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
                /* Above the tile, which raises itself to z-index 1 on hover to
                   overlap its neighbours — and took the checkbox with it. */
                zIndex: 2,
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
      <Toast state={saveState} />
      <Toast state={deleteState} />

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

      {open ? (
        <Lightbox
          /* Keyed by id so the focal point and the description field reset to
             the new picture's own values as you page through. */
          key={open.id}
          item={open}
          position={openIndex + 1}
          total={items.length}
          onClose={() => setOpenId(null)}
          onStep={(delta) => {
            const next = items[openIndex + delta];
            if (next) setOpenId(next.id);
          }}
          hasPrev={openIndex > 0}
          hasNext={openIndex < items.length - 1}
          save={save}
          remove={remove}
          onDeleteSubmit={() => setDeleteErrorFor(open.id)}
          deleteError={
            deleteErrorFor === open.id && !deleteState.ok
              ? deleteState.message
              : undefined
          }
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

function Lightbox({
  item,
  position,
  total,
  onClose,
  onStep,
  hasPrev,
  hasNext,
  save,
  remove,
  onDeleteSubmit,
  deleteError,
}: {
  item: Item;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  hasPrev: boolean;
  hasNext: boolean;
  save: (payload: FormData) => void;
  remove: (payload: FormData) => void;
  onDeleteSubmit: () => void;
  deleteError?: string;
}) {
  const [focal, setFocal] = useState({ x: item.focalX, y: item.focalY });
  const dialog = useRef<HTMLDivElement>(null);

  /* Derived from the id rather than useId: only one viewer is ever mounted, so
     this is unique, and it stays readable in the DOM. */
  const saveFormId = `media-save-${item.id}`;

  /* Keyboard is how anyone reviewing a few hundred images will actually move
     through them. Arrows are ignored while a field has focus, so cursoring
     through the description does not jump to the next picture; Escape closes
     from anywhere, which is what people expect of it. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;
      if (typing) return;

      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  /* The page behind must not scroll under the viewer, and focus has to come
     back to the grid when it closes or a keyboard user is dropped at the top
     of the document. Mount-only: paging between images keys a fresh
     component, and restoring focus mid-run would fight the arrow buttons. */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="adm-lb"
      role="dialog"
      aria-modal="true"
      aria-label={item.title ?? `Image ${item.id}`}
      ref={dialog}
      tabIndex={-1}
      /* Only a click on the backdrop itself closes — one that started inside
         the picture and drifted out lands on a child and is left alone. */
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="adm-lb-head">
        <button
          type="button"
          className="adm-lb-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} strokeWidth={1.8} aria-hidden />
        </button>
        <strong className="adm-lb-title">{item.title ?? `Image ${item.id}`}</strong>
        <span className="adm-lb-count">
          {position} of {total}
        </span>
      </div>

      <div className="adm-lb-body">
        <div className="adm-lb-stage">
          <button
            type="button"
            className="adm-lb-btn adm-lb-nav adm-lb-prev"
            onClick={() => onStep(-1)}
            disabled={!hasPrev}
            aria-label="Previous image"
          >
            <ChevronLeft size={22} strokeWidth={1.8} aria-hidden />
          </button>

          {/* Click to set the focal point. This replaces choosing crop
              dimensions by hand: the editor points at the subject, and every
              layout crops around it via CSS object-position. */}
          <button
            type="button"
            className="adm-lb-frame"
            aria-label="Set the focal point"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setFocal({
                x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
                y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
              });
            }}
          >
            {item.full ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="adm-lb-img" src={item.full} alt={item.alt} />
            ) : null}
            <span
              aria-hidden
              className="adm-lb-focal"
              style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            />
          </button>

          <button
            type="button"
            className="adm-lb-btn adm-lb-nav adm-lb-next"
            onClick={() => onStep(1)}
            disabled={!hasNext}
            aria-label="Next image"
          >
            <ChevronRight size={22} strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        <div className="adm-lb-panel">
          <form id={saveFormId} action={save}>
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

            <p className="adm-muted" style={{ fontSize: "0.75rem", marginTop: 0 }}>
              Click the most important part of the picture to set the focal
              point. Crops keep it in frame.
            </p>
          </form>

          {/* Both actions on one row. Save submits the form above from outside
              it via `form=` — it can, because it is a plain button with no
              pending state to read. Delete cannot: ConfirmButton calls
              useFormStatus, which only reports from inside the form it belongs
              to, so its own form stays wrapped around it. */}
          <div className="adm-lb-actions">
            <button className="adm-btn" form={saveFormId}>
              Save
            </button>

            <form action={remove} onSubmit={onDeleteSubmit}>
              <input type="hidden" name="id" value={item.id} />
              <ConfirmButton confirmLabel="Yes, delete it">Delete image</ConfirmButton>
              {deleteError ? (
                /* Kept inline as well as in the toast: the API's 409 names every
                   service, project, article or person still using this image,
                   which is a list worth reading rather than watching fade. */
                <p className="adm-error">{deleteError}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
