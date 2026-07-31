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

export type CmsProject = {
  id: number;
  slug: string;
  num: string;
  title: string;
  category: string;
  location: string;
  year: number;
  client: string;
  duration: string;
  scope: string;
  narrative: string;
  result: string;
  metric: { value: string; label: string };
  services: string[];
  image: Media | null;
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

export type CmsTestimonial = {
  id: number;
  quote: string;
  name: string;
  role: string;
};

export type CmsPostBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string }
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
  return data.projects;
}

export async function getTeam(): Promise<CmsTeamMember[]> {
  const data = await get<{ team: CmsTeamMember[] }>(
    "/public/team",
    ["team"],
    { team: staticTeam as unknown as CmsTeamMember[] }
  );
  return data.team;
}

export async function getTestimonials(): Promise<CmsTestimonial[]> {
  const data = await get<{ testimonials: CmsTestimonial[] }>(
    "/public/testimonials",
    ["testimonials"],
    { testimonials: staticTestimonials as unknown as CmsTestimonial[] }
  );
  return data.testimonials;
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
