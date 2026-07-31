"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminService } from "@/lib/admin/api";
import { ImagePicker, type PickerOption } from "../ImagePicker";
import {
  createService,
  deleteService,
  updateService,
  type FormState,
} from "../../actions";

function SaveBar({ service }: { service?: AdminService }) {
  const { pending } = useFormStatus();

  return (
    /* Sticky, so the save button is reachable without scrolling to the bottom
       of a long form on a phone. */
    <div className="adm-savebar">
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : service ? "Save changes" : "Create service"}
      </button>
      <a href="/admin/services" className="adm-btn adm-btn-ghost">
        Cancel
      </a>
    </div>
  );
}

export function ServiceForm({
  service,
  icons,
  images,
}: {
  service?: AdminService;
  icons: string[];
  images: PickerOption[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    service ? updateService : createService,
    { ok: false }
  );

  /* Auto-fill the slug from the title while creating, and stop as soon as it
     is edited by hand. Never on an existing service: changing a slug changes a
     public URL, so it has to be a deliberate act. */
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(service));

  const err = (field: string) => state.errors?.[field];

  return (
    <form action={action} noValidate>
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Title</span>
          <input
            className="adm-input"
            name="title"
            defaultValue={service?.title ?? ""}
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
          {err("title") ? <span className="adm-error">{err("title")}</span> : null}
        </label>

        <label className="adm-field">
          <span>URL slug</span>
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
            felmosengineering.com/services#{slug || "…"}
            {service ? " — changing this breaks existing links." : ""}
          </span>
          {err("slug") ? <span className="adm-error">{err("slug")}</span> : null}
        </label>

        <div style={{ display: "grid", gap: "0 1rem", gridTemplateColumns: "6rem 1fr" }}>
          <label className="adm-field">
            <span>Number</span>
            <input
              className="adm-input"
              name="num"
              defaultValue={service?.num ?? ""}
              inputMode="numeric"
              maxLength={8}
            />
          </label>

          <label className="adm-field">
            <span>Short label</span>
            <input
              className="adm-input"
              name="label"
              defaultValue={service?.label ?? ""}
              maxLength={80}
            />
          </label>
        </div>
        <p className="adm-muted" style={{ marginTop: "-0.5rem", fontSize: "0.75rem" }}>
          The short label is used where the full title won&rsquo;t fit — one or
          two words.
        </p>

        <label className="adm-field">
          <span>Icon</span>
          <select className="adm-select" name="icon" defaultValue={service?.icon ?? "Wrench"}>
            {icons.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          {err("icon") ? <span className="adm-error">{err("icon")}</span> : null}
        </label>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>One-line summary</span>
          <textarea
            className="adm-textarea"
            name="short"
            defaultValue={service?.short ?? ""}
            maxLength={400}
            style={{ minHeight: "4rem" }}
          />
        </label>

        <label className="adm-field">
          <span>Full description</span>
          <textarea
            className="adm-textarea"
            name="lead"
            defaultValue={service?.lead ?? ""}
            style={{ minHeight: "9rem" }}
          />
        </label>

        <label className="adm-field">
          <span>Benefits</span>
          <textarea
            className="adm-textarea"
            name="benefits"
            defaultValue={(service?.benefits ?? []).join("\n")}
            placeholder="One per line"
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            One per line.
          </span>
        </label>

        <label className="adm-field">
          <span>Typical clients</span>
          <textarea
            className="adm-textarea"
            name="clients"
            defaultValue={(service?.clients ?? []).join("\n")}
            placeholder="One per line"
            style={{ minHeight: "4.5rem" }}
          />
        </label>
      </div>

      <div className="adm-card" style={{ padding: "1rem" }}>
        <ImagePicker
          name="imageId"
          current={service?.image ?? null}
          options={images}
        />

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Visibility</span>
          <select
            className="adm-select"
            name="status"
            defaultValue={service?.status ?? "draft"}
          >
            <option value="draft">Draft — not on the website</option>
            <option value="published">Live — visible to everyone</option>
          </select>
        </label>
      </div>

      {state.message ? (
        <p
          role="status"
          className={state.ok ? "adm-muted" : "adm-error"}
          style={{ marginTop: "0.75rem" }}
        >
          {state.message}
        </p>
      ) : null}

      <SaveBar service={service} />

      {service ? (
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-divider)" }}>
          <p className="adm-muted" style={{ marginTop: 0 }}>
            Deleting removes this from the website. It can be restored from the
            &ldquo;Show deleted&rdquo; list.
          </p>
        </div>
      ) : null}
    </form>
  );
}

/** Separate form element — a nested <form> is invalid HTML, so delete cannot
    live inside the edit form above. */
export function DeleteServiceForm({ id }: { id: number }) {
  return (
    <form action={deleteService}>
      <input type="hidden" name="id" value={id} />
      <button className="adm-btn adm-btn-danger">Delete service</button>
    </form>
  );
}
