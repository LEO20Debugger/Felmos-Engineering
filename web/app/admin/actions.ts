"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { api, ApiError } from "@/lib/admin/api";

/**
 * Server actions — every mutation the dashboard performs.
 *
 * These replace a client-side data layer entirely. A form posts here, the
 * action calls the API, then revalidatePath re-renders the affected page with
 * fresh data. No query cache, no optimistic state to reconcile, and no request
 * from the browser to anything except this origin.
 */

export type FormState = {
  ok: boolean;
  message?: string;
  /** Field name → message, straight from the API's zod validation. */
  errors?: Record<string, string>;
};

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

/* ─────────────────────────────── session ─────────────────────────────── */

export async function login(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  /* Called with fetch rather than the shared client because this is the one
     place that needs the *response* headers — the API's Set-Cookie has to be
     copied onto this origin's cookie jar. */
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      /* A hung API must not hold the sign-in request open indefinitely. */
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    /* An unreachable API would otherwise throw out of the action and render
       Next's generic "Application error" screen — which tells the person
       signing in nothing, and looks identical to the site being broken. The
       API restarting, or waking from sleep, both land here. */
    console.error("[admin] could not reach the API to sign in", error);
    return {
      ok: false,
      message:
        "Could not reach the server. It may be restarting — wait a moment and try again.",
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string>;
    };
    return {
      ok: false,
      message: body.message ?? "Email or password is incorrect.",
      errors: body.errors,
    };
  }

  const jar = await cookies();
  for (const header of response.headers.getSetCookie()) {
    /* Parse just enough to re-issue: name, value, and the attributes we set
       deliberately. The API already chose httpOnly/sameSite/maxAge; this
       mirrors them rather than inventing new ones. */
    const [pair, ...attributes] = header.split(";");
    const [name, ...valueParts] = (pair ?? "").split("=");
    if (!name) continue;

    const maxAge = attributes
      .map((a) => a.trim().toLowerCase())
      .find((a) => a.startsWith("max-age="))
      ?.slice(8);

    jar.set({
      name: name.trim(),
      value: valueParts.join("="),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(maxAge ? { maxAge: Number(maxAge) } : {}),
    });
  }

  /* Only redirect on success. redirect() throws to unwind, so it must not sit
     inside the try/catch of a failed login. */
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout").catch(() => undefined);

  const jar = await cookies();
  jar.delete("fe_at");
  jar.delete("fe_rt");
  redirect("/admin/login");
}

/* ─────────────────────────────── services ─────────────────────────────── */

/** Shared shape-building for create and update. */
function serviceFrom(formData: FormData) {
  const list = (field: string): string[] =>
    String(formData.get(field) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const imageId = String(formData.get("imageId") ?? "").trim();

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    num: String(formData.get("num") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    label: String(formData.get("label") ?? "").trim(),
    short: String(formData.get("short") ?? "").trim(),
    lead: String(formData.get("lead") ?? "").trim(),
    icon: String(formData.get("icon") ?? "Wrench"),
    imageId: imageId ? Number(imageId) : null,
    benefits: list("benefits"),
    clients: list("clients"),
    status: formData.get("status") === "published" ? "published" : "draft",
  };
}

/** Turn an ApiError into field errors the form can render. */
function toFormState(error: unknown): FormState {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message, errors: error.errors };
  }
  throw error;
}

export async function createService(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  let id: number;
  try {
    const result = await api.post<{ id: number }>(
      "/admin/services",
      serviceFrom(formData)
    );
    id = result.id;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/services");
  redirect(`/admin/services/${id}`);
}

export async function updateService(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/services/${id}`, serviceFrom(formData));
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteService(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.del(`/admin/services/${id}`);
  revalidatePath("/admin/services");
  redirect("/admin/services?deleted=1");
}

export async function restoreService(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.post(`/admin/services/${id}/restore`);
  revalidatePath("/admin/services");
}

/**
 * Publish, unpublish, delete or restore several services at once.
 *
 * One request rather than one per row: the API applies the whole batch and
 * revalidates the site once, so seventeen services going live rebuilds the
 * homepage, the services page and the contact form a single time.
 */
export async function bulkServices(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((n) => Number.isInteger(n) && n > 0);

  const action = String(formData.get("action") ?? "");

  if (ids.length === 0) return { ok: false, message: "Nothing selected." };

  let affected: number;
  try {
    const result = await api.post<{ affected: number }>(
      "/admin/services/bulk",
      { ids, action }
    );
    affected = result.affected;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/services");

  const noun = affected === 1 ? "service" : "services";
  const verb = {
    publish: "published",
    draft: "moved to draft",
    delete: "deleted",
    restore: "restored",
  }[action] ?? "updated";

  return { ok: true, message: `${affected} ${noun} ${verb}.` };
}

export async function reorderServices(ids: number[]): Promise<void> {
  await api.patch("/admin/services/reorder", { ids });
  revalidatePath("/admin/services");
}

/* ─────────────────────────────── projects ─────────────────────────────── */

/**
 * Shared shape-building for create and update.
 *
 * Optional text fields are sent as typed rather than coerced to "" — the API
 * trims and nulls them, and the site treats null as "we don't have this fact"
 * rather than "this fact is blank".
 */
function projectFrom(formData: FormData) {
  const text = (field: string) => String(formData.get(field) ?? "").trim();

  /* Both collections come back as ordered id lists. The gallery arrives as one
     comma-separated hidden input because its order is the thing being edited;
     services arrive as repeated checkbox values. */
  const ids = (raw: string): number[] =>
    raw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

  const imageId = text("imageId");

  return {
    slug: text("slug"),
    num: text("num"),
    title: text("title"),
    category: text("category"),
    location: text("location"),
    year: text("year"),
    client: text("client"),
    duration: text("duration"),
    scope: text("scope"),
    narrative: text("narrative"),
    result: text("result"),
    metricValue: text("metricValue"),
    metricLabel: text("metricLabel"),
    imageId: imageId ? Number(imageId) : null,
    status: formData.get("status") === "published" ? "published" : "draft",
    serviceIds: formData
      .getAll("serviceIds")
      .map((value) => Number(value))
      .filter((n) => Number.isInteger(n) && n > 0),
    gallery: ids(text("gallery")),
  };
}

export async function createProject(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  let id: number;
  try {
    const result = await api.post<{ id: number }>(
      "/admin/projects",
      projectFrom(formData)
    );
    id = result.id;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${id}`);
}

export async function updateProject(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/projects/${id}`, projectFrom(formData));
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.del(`/admin/projects/${id}`);
  revalidatePath("/admin/projects");
  redirect("/admin/projects?deleted=1");
}

export async function restoreProject(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.post(`/admin/projects/${id}/restore`);
  revalidatePath("/admin/projects");
}

/**
 * Publish, unpublish, delete or restore several projects at once.
 *
 * One request rather than one per row: the API applies the whole batch and
 * revalidates the site once, so seventeen projects going live rebuilds the
 * projects pages a single time.
 */
export async function bulkProjects(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((n) => Number.isInteger(n) && n > 0);

  const action = String(formData.get("action") ?? "");

  if (ids.length === 0) return { ok: false, message: "Nothing selected." };

  let affected: number;
  try {
    const result = await api.post<{ affected: number }>(
      "/admin/projects/bulk",
      { ids, action }
    );
    affected = result.affected;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/projects");

  const noun = affected === 1 ? "project" : "projects";
  const verb = {
    publish: "published",
    draft: "moved to draft",
    delete: "deleted",
    restore: "restored",
  }[action] ?? "updated";

  return { ok: true, message: `${affected} ${noun} ${verb}.` };
}

export async function reorderProjects(ids: number[]): Promise<void> {
  await api.patch("/admin/projects/reorder", { ids });
  revalidatePath("/admin/projects");
}

/* ───────────────────────────────── team ──────────────────────────────── */

/**
 * Shared shape-building for create and update.
 *
 * Optional text fields go up as null when blank rather than "" — the About
 * grid omits a missing role or qualifier instead of rendering an empty line,
 * and that distinction has to survive the round trip.
 */
function memberFrom(formData: FormData) {
  const text = (field: string): string | null => {
    const value = String(formData.get(field) ?? "").trim();
    return value === "" ? null : value;
  };

  const imageId = String(formData.get("imageId") ?? "").trim();

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    role: text("role"),
    tag: text("tag"),
    bio: text("bio"),
    imageId: imageId ? Number(imageId) : null,
    status: formData.get("status") === "published" ? "published" : "draft",
  };
}

export async function createTeamMember(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  let id: number;
  try {
    const result = await api.post<{ id: number }>(
      "/admin/team",
      memberFrom(formData)
    );
    id = result.id;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/team");
  redirect(`/admin/team/${id}`);
}

export async function updateTeamMember(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/team/${id}`, memberFrom(formData));
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteTeamMember(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.del(`/admin/team/${id}`);
  revalidatePath("/admin/team");
  redirect("/admin/team?deleted=1");
}

export async function restoreTeamMember(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.post(`/admin/team/${id}/restore`);
  revalidatePath("/admin/team");
}

/**
 * Publish, unpublish, delete or restore several people at once.
 *
 * One request rather than one per row: the API applies the whole batch and
 * revalidates the site once, so four people going live rebuilds the About page
 * a single time.
 */
export async function bulkTeam(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((n) => Number.isInteger(n) && n > 0);

  const action = String(formData.get("action") ?? "");

  if (ids.length === 0) return { ok: false, message: "Nothing selected." };

  let affected: number;
  try {
    const result = await api.post<{ affected: number }>("/admin/team/bulk", {
      ids,
      action,
    });
    affected = result.affected;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/team");

  const noun = affected === 1 ? "person" : "people";
  const verb = {
    publish: "published",
    draft: "moved to draft",
    delete: "deleted",
    restore: "restored",
  }[action] ?? "updated";

  return { ok: true, message: `${affected} ${noun} ${verb}.` };
}

export async function reorderTeam(ids: number[]): Promise<void> {
  await api.patch("/admin/team/reorder", { ids });
  revalidatePath("/admin/team");
}

/* ─────────────────────────────── insights ─────────────────────────────── */

/**
 * Shared shape-building for create and update.
 *
 * The body arrives as one hidden JSON field rather than as a set of named
 * inputs. Blocks are added, removed and reordered in the browser, so the form
 * has no fixed field list to name — and encoding the structure into input names
 * (`body.3.items.1`) would mean reassembling an array from a flat FormData on
 * every save, which is the same JSON round trip with more ways to go wrong.
 */
function postFrom(formData: FormData) {
  const text = (field: string): string | null => {
    const value = String(formData.get(field) ?? "").trim();
    return value === "" ? null : value;
  };

  const imageId = String(formData.get("imageId") ?? "").trim();
  const authorTeamId = String(formData.get("authorTeamId") ?? "").trim();

  /* A body that will not parse means the editor's blocks never reached the
     server intact. Saving an empty article over a written one would be worse
     than failing, so this returns null and the caller reports it — an empty
     array is only ever sent when the field genuinely was empty. */
  const raw = String(formData.get("body") ?? "").trim();
  let body: unknown[] | null = [];
  if (raw !== "") {
    try {
      const parsed: unknown = JSON.parse(raw);
      body = Array.isArray(parsed) ? parsed : null;
    } catch {
      body = null;
    }
  }

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    excerpt: text("excerpt"),
    date: String(formData.get("date") ?? "").trim(),
    authorTeamId: authorTeamId ? Number(authorTeamId) : null,
    authorName: String(formData.get("authorName") ?? "").trim(),
    category: text("category"),
    imageId: imageId ? Number(imageId) : null,
    body,
    status: formData.get("status") === "published" ? "published" : "draft",
  };
}

/** The one failure that is this file's own rather than the API's. */
const BODY_UNREADABLE: FormState = {
  ok: false,
  message:
    "The article body could not be read, so nothing was saved. Reload the page and try again — your text is still on screen until you do.",
};

export async function createPost(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const payload = postFrom(formData);
  if (!payload.body) return BODY_UNREADABLE;

  let id: number;
  try {
    const result = await api.post<{ id: number }>("/admin/posts", payload);
    id = result.id;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/insights");
  redirect(`/admin/insights/${id}`);
}

export async function updatePost(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  const payload = postFrom(formData);
  if (!payload.body) return BODY_UNREADABLE;

  try {
    await api.patch(`/admin/posts/${id}`, payload);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/insights");
  revalidatePath(`/admin/insights/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deletePost(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.del(`/admin/posts/${id}`);
  revalidatePath("/admin/insights");
  redirect("/admin/insights?deleted=1");
}

export async function restorePost(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.post(`/admin/posts/${id}/restore`);
  revalidatePath("/admin/insights");
}

/**
 * Publish, unpublish, delete or restore several articles at once.
 *
 * One request rather than one per row: the API applies the whole batch and
 * revalidates the site once, so five articles going live rebuilds the blog
 * index a single time.
 */
export async function bulkPosts(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((n) => Number.isInteger(n) && n > 0);

  const action = String(formData.get("action") ?? "");

  if (ids.length === 0) return { ok: false, message: "Nothing selected." };

  let affected: number;
  try {
    const result = await api.post<{ affected: number }>("/admin/posts/bulk", {
      ids,
      action,
    });
    affected = result.affected;
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/insights");

  const noun = affected === 1 ? "article" : "articles";
  const verb = {
    publish: "published",
    draft: "moved to draft",
    delete: "deleted",
    restore: "restored",
  }[action] ?? "updated";

  return { ok: true, message: `${affected} ${noun} ${verb}.` };
}

/* ──────────────────────────────── leads ──────────────────────────────── */

export async function updateLead(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/leads/${id}`, {
      status: String(formData.get("status") ?? "new"),
      internalNotes: String(formData.get("internalNotes") ?? ""),
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Saved." };
}

/** Manual retry for a notification that failed or was never configured. */
export async function resendLead(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await api.post(`/admin/leads/${Number(formData.get("id"))}/resend`);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/leads");
  return { ok: true, message: "Sent." };
}

/* ──────────────────────────────── media ──────────────────────────────── */

/**
 * Upload an image.
 *
 * Unlike the other actions this forwards the raw multipart body rather than
 * re-encoding it as JSON — the file is already a Blob in the FormData, and
 * rebuilding it would mean base64 in memory for no gain. `fetch` sets the
 * multipart boundary itself, so no content-type header is set here.
 */
export async function uploadMedia(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image first." };
  }

  if (!alt) {
    /* Enforced here rather than only on the model. Alt text describes the
       image to screen readers and to search engines, and it is never added
       retroactively — the moment of upload is the only time anyone knows what
       the picture shows. */
    return {
      ok: false,
      message: "Describe the image before uploading.",
      errors: { alt: "Required." },
    };
  }

  const body = new FormData();
  body.append("file", file);

  const jar = await cookies();
  const response = await fetch(
    `${API_URL}/admin/media?alt=${encodeURIComponent(alt)}`,
    {
      method: "POST",
      headers: { cookie: jar.toString() },
      body,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    return { ok: false, message: payload.message ?? "Upload failed." };
  }

  revalidatePath("/admin/media");
  return { ok: true, message: `Uploaded ${file.name}.` };
}

export async function updateMedia(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));

  try {
    await api.patch(`/admin/media/${id}`, {
      alt: String(formData.get("alt") ?? ""),
      focalX: Number(formData.get("focalX") ?? 50),
      focalY: Number(formData.get("focalY") ?? 50),
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/media");
  return { ok: true, message: "Saved." };
}

/**
 * Delete several images, skipping any still in use.
 *
 * Reports the partial result rather than treating a blocked image as failure —
 * "18 deleted, 2 still in use" is the answer, and the reasons name exactly what
 * is holding them.
 */
export async function bulkDeleteMedia(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const ids = formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) return { ok: false, message: "Nothing selected." };

  let result: { deleted: number; blocked: { id: number; reason: string }[] };
  try {
    result = await api.post<{
      deleted: number;
      blocked: { id: number; reason: string }[];
    }>("/admin/media/bulk-delete", { ids });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/media");

  const { deleted, blocked } = result;
  const noun = (n: number) => (n === 1 ? "image" : "images");

  if (blocked.length === 0) {
    return { ok: true, message: `${deleted} ${noun(deleted)} deleted.` };
  }

  /* Deduplicated: twenty images blocked by the same project should say so
     once, not twenty times. */
  const reasons = [...new Set(blocked.map((b) => b.reason))];

  return {
    /* Not ok — something the editor asked for did not happen, and the toast
       needs to stay up long enough to read the reason. */
    ok: false,
    message:
      `${deleted} ${noun(deleted)} deleted. ` +
      `${blocked.length} still in use — ${reasons.join(" ")}`,
  };
}

export async function deleteMedia(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await api.del(`/admin/media/${Number(formData.get("id"))}`);
  } catch (error) {
    /* A 409 here lists exactly what still uses the image, which is the useful
       part — surface it rather than a generic failure. */
    return toFormState(error);
  }

  revalidatePath("/admin/media");
  return { ok: true, message: "Deleted." };
}

/* ─────────────────────────────── settings ─────────────────────────────── */

export async function updateSiteSettings(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const text = (key: string): string | null => {
    const val = String(formData.get(key) ?? "").trim();
    return val === "" ? null : val;
  };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, message: "Company name is required.", errors: { name: "Required." } };
  }

  const foundedRaw = text("founded");
  const founded = foundedRaw ? Number(foundedRaw) : null;

  const hoursStructured = String(formData.get("hoursStructured") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    name,
    shortName: text("shortName"),
    tagline: text("tagline"),
    description: text("description"),
    url: text("url"),
    phone: text("phone"),
    phoneHref: text("phoneHref"),
    secondaryPhone: text("secondaryPhone"),
    secondaryPhoneHref: text("secondaryPhoneHref"),
    email: text("email"),
    emailHref: text("emailHref"),
    addressStreet: text("addressStreet"),
    addressLocality: text("addressLocality"),
    addressRegion: text("addressRegion"),
    addressPostalCode: text("addressPostalCode"),
    addressCountry: text("addressCountry"),
    addressShort: text("addressShort"),
    addressFull: text("addressFull"),
    geoLat: text("geoLat"),
    geoLng: text("geoLng"),
    hours: text("hours"),
    hoursStructured,
    founded: Number.isInteger(founded) && (founded ?? 0) > 0 ? founded : null,
  };

  try {
    await api.patch("/admin/settings", payload);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved." };
}

export async function createMailRecipient(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "to");

  if (!email) {
    return { ok: false, message: "Email address is required.", errors: { email: "Required." } };
  }

  try {
    await api.post("/admin/settings/mail-recipients", { email, name, role, active: true });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: `Added ${email} to recipients.` };
}

export async function updateMailRecipient(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const id = Number(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "to");
  const active = formData.get("active") === "1" || formData.get("active") === "true";

  try {
    await api.patch(`/admin/settings/mail-recipients/${id}`, { email, name, role, active });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/admin/settings");
  return { ok: true, message: "Recipient updated." };
}

export async function deleteMailRecipient(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  await api.del(`/admin/settings/mail-recipients/${id}`);
  revalidatePath("/admin/settings");
}
