import "server-only";

import { cookies } from "next/headers";

/**
 * Server-side client for the dashboard.
 *
 * Everything the admin does runs through here, on the server — no component
 * ever calls the API from the browser. That is a deliberate shape and it buys
 * several things at once:
 *
 *   - The API's origin and its internal key never reach the client.
 *   - No CORS, no preflight, no client-side token handling.
 *   - No data-fetching library, no cache to invalidate by hand: a server
 *     action mutates and calls revalidatePath, and the page re-renders with
 *     fresh data. That is the whole state management story.
 *   - Far fewer database round trips than client-side fetching with polling,
 *     which matters when the database is billed per instance-hour.
 *
 * The session cookie is forwarded rather than re-derived: the browser holds
 * httpOnly cookies for felmosengineering.com, this runs on the same origin, so
 * it can read them with `cookies()` and pass them straight through.
 */

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field-level messages from the API's zod validation, when present. */
    readonly errors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Next cache tags, for the public-content fetchers in Phase 5. Admin reads
      are always uncached — an editor must never see a stale draft. */
  tags?: string[];
  revalidate?: number | false;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const jar = await cookies();

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      /* Forward the whole jar rather than picking out cookies by name: the
         refresh cookie has to reach /auth/refresh, and hard-coding names here
         would silently break if they ever change. */
      cookie: jar.toString(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    ...(options.tags
      ? { next: { tags: options.tags, revalidate: options.revalidate ?? 3600 } }
      : { cache: "no-store" }),
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload["message"] === "string"
        ? payload["message"]
        : `Request failed (${response.status}).`,
      payload["errors"] as Record<string, string> | undefined
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/* ─────────────────────────────── types ─────────────────────────────── */

export type AdminImage = {
  id: number;
  kind: "local" | "remote";
  remoteUrl: string | null;
  provider: "unsplash" | "pexels" | null;
  providerId: string | null;
  storageKey: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  alt: string;
  focalX: number;
  focalY: number;
};

export type AdminService = {
  id: number;
  slug: string;
  num: string;
  title: string;
  label: string;
  short: string;
  lead: string | null;
  icon: string;
  benefits: string[];
  clients: string[];
  status: "draft" | "published";
  sortOrder: number;
  isDeleted: number;
  updatedAt: string;
  image: AdminImage | null;
};

/**
 * A project as the dashboard sees it.
 *
 * Most fields are nullable, and that is the point: the company's own project
 * record supplies a title, a location and a description, and rarely a client
 * name, a duration or an outcome figure. The site omits what is missing rather
 * than rendering an empty cell, so "not recorded" has to survive the round trip
 * as null instead of collapsing to "".
 */
export type AdminProject = {
  id: number;
  slug: string;
  num: string;
  title: string;
  category: string | null;
  location: string | null;
  year: number | null;
  client: string | null;
  duration: string | null;
  scope: string | null;
  narrative: string | null;
  result: string | null;
  metricValue: string | null;
  metricLabel: string | null;
  status: "draft" | "published";
  sortOrder: number;
  isDeleted: number;
  updatedAt: string;
  image: AdminImage | null;
  /** Service slugs, for display. */
  services: string[];
  /** Service ids, for the picker. */
  serviceIds: number[];
  gallery: (AdminImage & { caption: string | null })[];
};

/**
 * A team member as the dashboard sees it.
 *
 * Everything but the name is nullable: the About grid omits a missing role or
 * qualifier rather than rendering an empty line, so "not recorded" has to
 * survive the round trip as null instead of collapsing to "".
 */
export type AdminTeamMember = {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  tag: string | null;
  bio: string | null;
  status: "draft" | "published";
  sortOrder: number;
  isDeleted: number;
  updatedAt: string;
  image: AdminImage | null;
};

export type AdminMedia = AdminImage & {
  title: string | null;
  bytes: number | null;
  createdAt: string;
};

export type AdminSiteSettings = {
  id: number;
  companyId: number;
  name: string;
  shortName: string | null;
  tagline: string | null;
  description: string | null;
  url: string | null;
  phone: string | null;
  phoneHref: string | null;
  secondaryPhone: string | null;
  secondaryPhoneHref: string | null;
  email: string | null;
  emailHref: string | null;
  addressStreet: string | null;
  addressLocality: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  addressShort: string | null;
  addressFull: string | null;
  geoLat: string | null;
  geoLng: string | null;
  mapEmbed: string | null;
  mapLink: string | null;
  hours: string | null;
  hoursStructured: string[];
  founded: number | null;
  socials: { label: string; href: string; icon: string }[];
  updatedAt: string;
};

export type AdminMailRecipient = {
  id: number;
  companyId: number;
  email: string;
  name: string | null;
  role: "to" | "cc" | "bcc";
  active: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminSettingsPayload = {
  settings: AdminSiteSettings | null;
  mailRecipients: AdminMailRecipient[];
};

/**
 * Build a URL for a media row at a given size.
 *
 * Mirrors the crop logic the site has always used: the stock providers do the
 * cropping server-side via URL parameters, and the API's own media endpoint
 * exposes the same capability, so both kinds of image can be requested at
 * whatever size a layout needs rather than being scaled in the browser.
 */
export function mediaUrl(
  image: AdminImage | null,
  width: number,
  height?: number
): string | null {
  if (!image) return null;

  if (image.kind === "remote" && image.providerId) {
    const h = height ?? Math.round(width * 0.75);
    return image.provider === "pexels"
      ? `https://images.pexels.com/photos/${image.providerId}/pexels-photo-${image.providerId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${h}`
      : `https://images.unsplash.com/photo-${image.providerId}?auto=format&fit=crop&w=${width}&h=${h}&q=75`;
  }

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/media/${image.id}?w=${width}${height ? `&h=${height}` : ""}`;
}

export type SessionUser = {
  id: number;
  companyId: number;
  email: string;
  name: string;
  role: "owner" | "editor";
};

/** The signed-in user, or null. Never throws — callers redirect on null. */
export async function currentUser(): Promise<SessionUser | null> {
  try {
    const { user } = await api.get<{ user: SessionUser }>("/auth/me");
    return user;
  } catch {
    return null;
  }
}
