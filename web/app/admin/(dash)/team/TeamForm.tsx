"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminTeamMember } from "@/lib/admin/api";
import { ConfirmButton } from "../ConfirmButton";
import { ImagePicker, type PickerOption } from "../ImagePicker";
import { Toast } from "../Toast";
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
  type FormState,
} from "../../actions";

function SaveBar({ member }: { member?: AdminTeamMember }) {
  const { pending } = useFormStatus();

  return (
    /* Sticky, so the save button is reachable without scrolling to the bottom
       of a long form on a phone. */
    <div className="adm-savebar">
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : member ? "Save changes" : "Add to team"}
      </button>
      <a href="/admin/team" className="adm-btn adm-btn-ghost">
        Cancel
      </a>
    </div>
  );
}

export function TeamForm({
  member,
  images,
}: {
  member?: AdminTeamMember;
  images: PickerOption[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    member ? updateTeamMember : createTeamMember,
    { ok: false }
  );

  /* Auto-fill the slug from the name while creating, and stop as soon as it is
     edited by hand. Never on an existing member: the slug is how an article's
     byline and the About anchor find this person, so changing it has to be a
     deliberate act. */
  const [slug, setSlug] = useState(member?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(member));

  const err = (field: string) => state.errors?.[field];

  return (
    <form action={action} noValidate>
      {member ? <input type="hidden" name="id" value={member.id} /> : null}

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Name</span>
          <input
            className="adm-input"
            name="name"
            defaultValue={member?.name ?? ""}
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
          {err("name") ? <span className="adm-error">{err("name")}</span> : null}
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
            felmosengineering.com/about#{slug || "…"}
            {member ? " — changing this breaks existing links." : ""}
          </span>
          {err("slug") ? <span className="adm-error">{err("slug")}</span> : null}
        </label>

        <label className="adm-field">
          <span>Role</span>
          <input
            className="adm-input"
            name="role"
            defaultValue={member?.role ?? ""}
            maxLength={160}
          />
          {err("role") ? <span className="adm-error">{err("role")}</span> : null}
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Qualifier</span>
          <input
            className="adm-input"
            name="tag"
            defaultValue={member?.tag ?? ""}
            maxLength={80}
          />
        </label>
        <p className="adm-muted" style={{ marginTop: "0.35rem", fontSize: "0.75rem" }}>
          Shown under the role on the team grid — a registration, a
          qualification, or the years of experience. Leave empty to show
          nothing.
        </p>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Biography</span>
          <textarea
            className="adm-textarea"
            name="bio"
            defaultValue={member?.bio ?? ""}
            maxLength={4000}
            style={{ minHeight: "9rem" }}
          />
          {err("bio") ? <span className="adm-error">{err("bio")}</span> : null}
        </label>
      </div>

      <div className="adm-card" style={{ padding: "1rem" }}>
        <ImagePicker
          name="imageId"
          current={member?.image ?? null}
          options={images}
        />

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Visibility</span>
          <select
            className="adm-select"
            name="status"
            defaultValue={member?.status ?? "draft"}
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
      <SaveBar member={member} />

      {member ? (
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--color-divider)" }}>
          <p className="adm-muted" style={{ marginTop: 0 }}>
            Deleting removes this person from the website. They can be restored
            from the &ldquo;Show deleted&rdquo; list.
          </p>
        </div>
      ) : null}
    </form>
  );
}

/** Separate form element — a nested <form> is invalid HTML, so delete cannot
    live inside the edit form above. */
export function DeleteTeamMemberForm({ id }: { id: number }) {
  return (
    <form action={deleteTeamMember}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton confirmLabel="Yes, delete them">
        Remove from team
      </ConfirmButton>
    </form>
  );
}
