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
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

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

export async function reorderServices(ids: number[]): Promise<void> {
  await api.patch("/admin/services/reorder", { ids });
  revalidatePath("/admin/services");
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
