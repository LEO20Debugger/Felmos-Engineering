import "server-only";

import { services as staticServices, projects as staticProjects, team as staticTeam, testimonials as staticTestimonials } from "./content";
import { posts as staticPosts } from "./blog";
import type { Media } from "./media";

/**
 * The website's content, read from the API.
 *
 * Every fetch is tagged so a save in the dashboard can revalidate exactly the
 * pages it affects, and cached for an hour otherwise — the pages stay as fast
 * as the static build they replace, and the database is only touched when
 * something actually changed.
 *
 * Two safety properties, both deliberate:
 *
 *   CONTENT_SOURCE=static falls back to the original hardcoded arrays. This is
 *   the cutover switch: content types move over one at a time, and reverting is
 *   an environment variable rather than a deploy.
 *
 *   A failed fetch never fails the build. Vercel builds must not depend on
 *   Railway being up — a database outage would otherwise mean the site cannot
 *   be deployed at all. On error each fetcher returns the last known good data
 *   and logs loudly.
 */

const API_URL = process.env.API_URL;
const KEY = process.env.INTERNAL_API_KEY;

/** Set to "static" to serve the hardcoded arrays instead of the database. */
const useApi = process.env.CONTENT_SOURCE !== "static" && Boolean(API_URL && KEY);

async function get<T>(path: string, tags: string[], fallback: T): Promise<T> {
  if (!useApi) return fallback;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "x-internal-key": KEY as string },
      next: { tags, revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    /* Loud, because silently serving stale content forever is how a broken
       integration goes unnoticed for weeks. */
    console.error(
      `[cms] ${path} failed (${String(error)}) — serving the bundled snapshot. ` +
        `The site is up but content may be out of date.`
    );
    return fallback;
  }
}

/* ─────────────────────────────── types ─────────────────────────────── */

export type CmsService = {
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
  image: Media | null;
};

/**
 * Nullable almost throughout — see the note on `Project` in ./content.ts. The
 * API returns null, not "", for a fact it does not hold, and every render site
 * decides whether to show a field by asking whether it is there.
 */
export type CmsProject = {
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
  metric: { value: string; label: string } | null;
  services: string[];
  image: Media | null;
  /** The supporting photographs, in the order an editor arranged them. The
      hero above is separate and never repeated here. */
  gallery: Media[];
  /** When the row last changed. Feeds the sitemap's lastModified, so a crawler
      is told what actually moved rather than "everything, at build time". */
  updatedAt?: string;
};

export type CmsTeamMember = {
  id: number;
  slug: string;
  name: string;
  role: string;
  tag: string;
  bio: string;
  image: Media | null;
};

/**
 * A published client review.
 *
 * `name` rather than `author` because that is what the site's component has
 * always read, and the API aliases the column on the way out. The submitter's
 * email is deliberately absent from this type — the endpoint does not return
 * it, and it should stay impossible to render by accident.
 */
export type CmsReview = {
  id: number;
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
  /** 1–5, or null for a quote collected before ratings existed. */
  rating: number | null;
  projectId: number | null;
  publishedAt: string | null;
};

/** The site-wide average, or null when there are too few to be meaningful —
    the API decides which, so the badge and the section can never disagree. */
export type RatingSummary = { average: number; count: number };

export type CmsPostBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string; attribution?: string | null }
  | { kind: "list"; items: string[] };

export type CmsPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readMinutes: number | null;
  body: CmsPostBlock[];
  image: Media | null;
};

/* ────────────────────────────── fetchers ────────────────────────────── */

/* The static arrays double as the build-time fallback. They are already
   committed, already typed, and already exactly the content the site shipped
   with — a separate snapshot file would be a second copy to keep in step. */

export async function getServices(): Promise<CmsService[]> {
  const data = await get<{ services: CmsService[] }>(
    "/public/services",
    ["services"],
    { services: staticServices as unknown as CmsService[] }
  );
  return data.services;
}

export async function getProjects(): Promise<CmsProject[]> {
  const data = await get<{ projects: CmsProject[] }>(
    "/public/projects",
    ["projects"],
    { projects: staticProjects as unknown as CmsProject[] }
  );

  /* Guarantee the two collections exist before anything renders.
     The bundled snapshot has no gallery — the photographs live on the media
     volume, not in lib/content.ts — and an API deployed before galleries
     existed would not send one either. Both cases used to reach the gallery
     component as `undefined.length` and take the whole page down, which is a
     poor way for a fallback to behave. */
  return data.projects.map((project) => ({
    ...project,
    services: project.services ?? [],
    gallery: project.gallery ?? [],
  }));
}

export async function getProjectBySlug(
  slug: string
): Promise<CmsProject | undefined> {
  /* Off the same cached list rather than a per-slug endpoint. Seventeen
     projects is one small response the whole site already holds, and a second
     route would mean a second cache tag to keep in step. */
  const all = await getProjects();
  return all.find((project) => project.slug === slug);
}

export async function getTeam(): Promise<CmsTeamMember[]> {
  const data = await get<{ team: CmsTeamMember[] }>(
    "/public/team",
    ["team"],
    { team: staticTeam as unknown as CmsTeamMember[] }
  );
  return data.team;
}

/**
 * Published reviews, plus the site-wide average.
 *
 * Both in one call because both are rendered on the homepage — the section and
 * the star badge in the trust bar — and Next's request cache dedupes the two
 * components asking for it, the same way the hero and the projects section
 * already share one `getProjects()`.
 *
 * The bundled snapshot has no ratings: those quotes predate the feature, and
 * inventing star counts for them would put numbers on the site that nobody
 * ever gave us. `summary` is null in the fallback for the same reason.
 */
export async function getReviews(): Promise<{
  reviews: CmsReview[];
  summary: RatingSummary | null;
}> {
  return get<{ reviews: CmsReview[]; summary: RatingSummary | null }>(
    "/public/reviews",
    ["reviews"],
    {
      reviews: staticTestimonials.map((t, index) => ({
        id: -(index + 1),
        quote: t.quote,
        name: t.name,
        role: t.role,
        company: null,
        rating: null,
        projectId: null,
        publishedAt: null,
      })),
      summary: null,
    }
  );
}

/** The reviews attached to one project, for its dossier page. Filtered off the
    same cached list rather than a per-project endpoint — the `getProjectBySlug`
    precedent above, and for the same reason: one small response the page
    already holds beats a second route and a second cache tag. */
export async function getReviewsForProject(
  projectId: number
): Promise<CmsReview[]> {
  const { reviews } = await getReviews();
  return reviews.filter((review) => review.projectId === projectId);
}

export async function getPosts(): Promise<CmsPost[]> {
  const data = await get<{ posts: CmsPost[] }>(
    "/public/posts",
    ["posts"],
    { posts: staticPosts as unknown as CmsPost[] }
  );
  return data.posts;
}

export async function getPostBySlug(slug: string): Promise<CmsPost | undefined> {
  const all = await getPosts();
  return all.find((post) => post.slug === slug);
}

/**
 * Reading time for a post.
 *
 * The API computes this on save and stores it, so the figure normally arrives
 * with the row. The fallback is for the bundled snapshot, which predates the
 * column — 200 wpm and a floor of one minute, the same rule the API applies.
 */
export function postReadMinutes(post: CmsPost): number {
  if (post.readMinutes) return post.readMinutes;

  const words = (post.body ?? []).reduce((count, block) => {
    const text = block.kind === "list" ? block.items.join(" ") : block.text;
    return count + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);

  return Math.max(1, Math.round(words / 200));
}

/**
 * A post's date, formatted.
 *
 * Stable across server and client: toLocaleDateString with no explicit locale
 * resolves to the runtime's, which differs between the two and produces a
 * hydration mismatch on any date rendered in markup.
 */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Up to `count` other posts, newest first — replaces relatedPosts(). */
export async function getRelatedPosts(
  post: CmsPost,
  count = 3
): Promise<CmsPost[]> {
  const all = await getPosts();
  const others = all.filter((p) => p.slug !== post.slug);

  /* Same category first, then anything else, so a thin category still fills
     the rail rather than leaving a ragged row. */
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);

  return [...sameCategory, ...rest].slice(0, count);
}
