"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { AdminPost } from "@/lib/admin/api";
import { BlockEditor } from "./BlockEditor";
import { ConfirmButton } from "../ConfirmButton";
import { ImagePicker, type PickerOption } from "../ImagePicker";
import { Toast } from "../Toast";
import { createPost, deletePost, updatePost, type FormState } from "../../actions";

/** The byline options, as the page hands them over. */
export type AuthorOption = { id: number; name: string; role: string | null };

function SaveBar({ post }: { post?: AdminPost }) {
  const { pending } = useFormStatus();

  return (
    /* Sticky, so the save button is reachable without scrolling to the bottom
       of what is by far the longest form in the dashboard. */
    <div className="adm-savebar">
      <button className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : post ? "Save changes" : "Create article"}
      </button>
      <a href="/admin/insights" className="adm-btn adm-btn-ghost">
        Cancel
      </a>
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export function PostForm({
  post,
  images,
  authors,
  categories,
}: {
  post?: AdminPost;
  images: PickerOption[];
  authors: AuthorOption[];
  /** Categories already in use, offered as suggestions rather than as a fixed
      list — a new one is a legitimate editorial decision, but three spellings
      of the same one is not, and free text alone produces exactly that. */
  categories: string[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    post ? updatePost : createPost,
    { ok: false }
  );

  /* Auto-fill the slug from the title while writing, and stop as soon as it is
     edited by hand. Never on an existing article: the slug is the article's
     public URL, so changing it breaks every link anyone has shared. */
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));

  /* The byline is a link to a team member and a printed name, kept in step here
     rather than derived on render: picking someone fills the name, and the name
     can then be corrected without breaking the link. Removing someone from the
     team page later leaves the byline they published under intact. */
  const [authorTeamId, setAuthorTeamId] = useState<string>(
    post?.authorTeamId ? String(post.authorTeamId) : ""
  );
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");

  const err = (field: string) => state.errors?.[field];

  /* Body errors come back keyed by position — "body.2.text" — which no input on
     this form is named after. Surfaced as one message rather than silently
     dropped, since the block it names is on screen. */
  const bodyError = Object.entries(state.errors ?? {}).find(([key]) =>
    key.startsWith("body")
  )?.[1];

  return (
    <form action={action} noValidate>
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Title</span>
          <input
            className="adm-input"
            name="title"
            defaultValue={post?.title ?? ""}
            maxLength={220}
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
            felmosengineering.com/blog/{slug || "…"}
            {post ? " — changing this breaks existing links." : ""}
          </span>
          {err("slug") ? <span className="adm-error">{err("slug")}</span> : null}
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Excerpt</span>
          <textarea
            className="adm-textarea"
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            maxLength={600}
            style={{ minHeight: "5rem" }}
          />
          {err("excerpt") ? (
            <span className="adm-error">{err("excerpt")}</span>
          ) : null}
        </label>
        <p className="adm-muted" style={{ marginTop: "0.35rem", fontSize: "0.75rem" }}>
          One or two sentences. It appears on the index card, in the related
          rail, and as the page description in search results — so it has to
          stand on its own, away from the title.
        </p>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Byline</span>
          <select
            className="adm-select"
            name="authorTeamId"
            value={authorTeamId}
            onChange={(event) => {
              const value = event.target.value;
              setAuthorTeamId(value);
              const chosen = authors.find((a) => String(a.id) === value);
              if (chosen) setAuthorName(chosen.name);
            }}
          >
            <option value="">Not on the team page</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
                {author.role ? ` — ${author.role}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Name as printed</span>
          <input
            className="adm-input"
            name="authorName"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            maxLength={120}
            required
          />
          {err("authorName") ? (
            <span className="adm-error">{err("authorName")}</span>
          ) : null}
        </label>
        <p className="adm-muted" style={{ marginTop: "0.35rem", fontSize: "0.75rem" }}>
          Stored on the article itself, so the byline survives someone leaving
          the team page.
        </p>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <label className="adm-field">
          <span>Date</span>
          <input
            className="adm-input"
            name="date"
            type="date"
            defaultValue={post?.date ?? today()}
            required
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            The date printed on the article, and what the index sorts on.
            Backdating is fine.
          </span>
          {err("date") ? <span className="adm-error">{err("date")}</span> : null}
        </label>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Category</span>
          <input
            className="adm-input"
            name="category"
            defaultValue={post?.category ?? ""}
            maxLength={80}
            list="post-categories"
          />
          <datalist id="post-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          {err("category") ? (
            <span className="adm-error">{err("category")}</span>
          ) : null}
        </label>
        <p className="adm-muted" style={{ marginTop: "0.35rem", fontSize: "0.75rem" }}>
          Shown above the title, and used to pick the related articles at the
          foot of the page.
        </p>
      </div>

      <div className="adm-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <BlockEditor name="body" initial={post?.body ?? []} />
        {bodyError ? (
          <p className="adm-error" style={{ marginTop: "0.6rem" }}>
            {bodyError}
          </p>
        ) : null}
      </div>

      <div className="adm-card" style={{ padding: "1rem" }}>
        <ImagePicker name="imageId" current={post?.image ?? null} options={images} />

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Visibility</span>
          <select
            className="adm-select"
            name="status"
            defaultValue={post?.status ?? "draft"}
          >
            <option value="draft">Draft — not on the website</option>
            <option value="published">Live — visible to everyone</option>
          </select>
        </label>
      </div>

      {/* Field-level problems stay inline beside their input; the toast carries
          the overall outcome. */}
      {!state.ok && state.message ? (
        <p className="adm-error" style={{ marginTop: "0.75rem" }}>
          {state.message}
        </p>
      ) : null}

      <Toast state={state} />
      <SaveBar post={post} />
    </form>
  );
}

/** Separate form element — a nested <form> is invalid HTML, so delete cannot
    live inside the edit form above. */
export function DeletePostForm({ id }: { id: number }) {
  return (
    <form action={deletePost}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton confirmLabel="Yes, delete it">
        Delete article
      </ConfirmButton>
    </form>
  );
}
