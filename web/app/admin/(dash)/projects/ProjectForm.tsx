"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminProject, AdminService } from "@/lib/admin/api";
import { ConfirmButton } from "../ConfirmButton";
import { GalleryPicker } from "../GalleryPicker";
import { ImagePicker, type PickerOption } from "../ImagePicker";
import { ServicePicker } from "../ServicePicker";
import { Toast } from "../Toast";
import {
  createProject,
  deleteProject,
  updateProject,
  type FormState,
} from "../../actions";

function SaveBar({ project }: { project?: AdminProject }) {
  const { pending } = useFormStatus();

  return (
    /* Sticky, so the save button is reachable without scrolling to the bottom
       of a long form on a phone. */
    <div className="adm-savebar">
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : project ? "Save changes" : "Create project"}
      </button>
      <a href="/admin/projects" className="adm-btn adm-btn-ghost">
        Cancel
      </a>
    </div>
  );
}

export function ProjectForm({
  project,
  services,
  images,
}: {
  project?: AdminProject;
  services: AdminService[];
  images: PickerOption[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    project ? updateProject : createProject,
    { ok: false }
  );

  /* Auto-fill the slug from the title while creating, and stop as soon as it
     is edited by hand. Never on an existing project: the slug is the project's
     public URL, so changing it has to be a deliberate act. */
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

  const err = (field: string) => state.errors?.[field];

  return (
    <form action={action} noValidate>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Title</span>
          <input
            className="adm-input"
            name="title"
            defaultValue={project?.title ?? ""}
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
            felmosengineering.com/projects/{slug || "…"}
            {project ? " — changing this breaks existing links." : ""}
          </span>
          {err("slug") ? <span className="adm-error">{err("slug")}</span> : null}
        </label>

        <div style={{ display: "grid", gap: "0 1rem", gridTemplateColumns: "6rem 1fr" }}>
          <label className="adm-field">
            <span>Number</span>
            <input
              className="adm-input"
              name="num"
              defaultValue={project?.num ?? ""}
              inputMode="numeric"
              maxLength={8}
            />
            {/* Says what it does, because it does two things at once: the API
                orders the index by this field, so it is the running order as
                well as the label on the card. */}
            <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
              Sets the order on /projects.
            </span>
          </label>

          <label className="adm-field">
            <span>Category</span>
            <input
              className="adm-input"
              name="category"
              defaultValue={project?.category ?? ""}
              maxLength={80}
              placeholder="Integrity Testing"
            />
            {err("category") ? (
              <span className="adm-error">{err("category")}</span>
            ) : null}
          </label>
        </div>
      </div>

      {/* ── the facts ── */}
      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <p className="adm-note adm-note-info" style={{ marginTop: 0 }}>
          Leave anything you don&rsquo;t know blank. The website shows only the
          facts that are filled in — an empty field is left out rather than
          printed as a gap.
        </p>

        <div
          style={{
            display: "grid",
            gap: "0 1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
          }}
        >
          <label className="adm-field">
            <span>Client</span>
            <input
              className="adm-input"
              name="client"
              defaultValue={project?.client ?? ""}
              maxLength={160}
            />
          </label>

          <label className="adm-field">
            <span>Location</span>
            <input
              className="adm-input"
              name="location"
              defaultValue={project?.location ?? ""}
              maxLength={160}
              placeholder="Lagos Island, Lagos"
            />
          </label>

          <label className="adm-field">
            <span>Year</span>
            <input
              className="adm-input"
              name="year"
              defaultValue={project?.year ?? ""}
              inputMode="numeric"
              maxLength={4}
              placeholder="2024"
            />
            {err("year") ? <span className="adm-error">{err("year")}</span> : null}
          </label>

          <label className="adm-field">
            <span>Duration</span>
            <input
              className="adm-input"
              name="duration"
              defaultValue={project?.duration ?? ""}
              maxLength={80}
              placeholder="6 weeks"
            />
          </label>
        </div>
      </div>

      {/* ── the story ── */}
      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>One-line summary</span>
          <textarea
            className="adm-textarea"
            name="scope"
            defaultValue={project?.scope ?? ""}
            maxLength={600}
            style={{ minHeight: "4rem" }}
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            Used on the index and the homepage, where there is no room for the
            full account.
          </span>
        </label>

        <label className="adm-field">
          <span>The account</span>
          <textarea
            className="adm-textarea"
            name="narrative"
            defaultValue={project?.narrative ?? ""}
            style={{ minHeight: "9rem" }}
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            What the work was, what was found, and how.
          </span>
        </label>

        <label className="adm-field">
          <span>Outcome</span>
          <textarea
            className="adm-textarea"
            name="result"
            defaultValue={project?.result ?? ""}
            maxLength={600}
            style={{ minHeight: "4rem" }}
          />
        </label>

        <div style={{ display: "grid", gap: "0 1rem", gridTemplateColumns: "8rem 1fr" }}>
          <label className="adm-field">
            <span>Headline figure</span>
            <input
              className="adm-input"
              name="metricValue"
              defaultValue={project?.metricValue ?? ""}
              maxLength={40}
              placeholder="23"
            />
          </label>

          <label className="adm-field">
            <span>What it counts</span>
            <input
              className="adm-input"
              name="metricLabel"
              defaultValue={project?.metricLabel ?? ""}
              maxLength={120}
              placeholder="Storeys verified"
            />
          </label>
        </div>
        <p className="adm-muted" style={{ marginTop: "-0.5rem", fontSize: "0.75rem" }}>
          Shown large beside the outcome. Leave both blank if there isn&rsquo;t a
          figure worth pulling out.
        </p>
      </div>

      {/* ── pictures and links ── */}
      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <ImagePicker
          name="imageId"
          current={project?.image ?? null}
          options={images}
        />

        <GalleryPicker
          name="gallery"
          current={project?.gallery ?? []}
          options={images}
        />
      </div>

      <div className="adm-card" style={{ padding: "1rem" }}>
        <ServicePicker services={services} selected={project?.serviceIds ?? []} />

        <label className="adm-field" style={{ marginBottom: 0, marginTop: "1rem" }}>
          <span>Visibility</span>
          <select
            className="adm-select"
            name="status"
            defaultValue={project?.status ?? "draft"}
          >
            <option value="draft">Draft — not on the website</option>
            <option value="published">Live — visible to everyone</option>
          </select>
        </label>
      </div>

      {/* Field-level problems stay inline beside their input; the toast
          carries the overall outcome. */}
      {!state.ok && state.message ? (
        <p className="adm-error" style={{ marginTop: "0.75rem" }}>
          {state.message}
        </p>
      ) : null}

      <Toast state={state} />
      <SaveBar project={project} />

      {project ? (
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
export function DeleteProjectForm({ id }: { id: number }) {
  return (
    <form action={deleteProject}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton confirmLabel="Yes, delete it">Delete project</ConfirmButton>
    </form>
  );
}
