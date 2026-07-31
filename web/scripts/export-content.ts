/**
 * Freezes the hardcoded content layer into a plain JSON document the API can
 * seed from.
 *
 *   npx tsx scripts/export-content.ts        (run from web/)
 *   → ../api/seed/seed.json
 *
 * Why a two-step export rather than seeding straight from the API:
 *
 * The content lives in TypeScript modules that import React components from
 * lucide-react and a type from ./images. The API cannot read those — it would
 * need lucide-react as a dependency, this project's tsconfig and path aliases,
 * and a way to turn a component reference back into something storable. Run
 * from inside web/, all of that resolves natively: the icons are real imported
 * components and `ImageKey` is type-only, so it disappears at runtime.
 *
 * The output is pure data. api/src/db/seed.ts reads it with no knowledge of
 * React, Next or this project's build setup, and the file is committed so the
 * seed is reproducible without re-running this.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { LucideIcon } from "lucide-react";

import { projects, services, team, testimonials } from "../lib/content";
import { posts } from "../lib/blog";
import { SOURCES, images, type ImageKey } from "../lib/images";
import { site } from "../lib/site";

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "api",
  "seed",
  "seed.json"
);

/* ────────────────────────────── icons ────────────────────────────── */

/**
 * Recover the lucide export name from an imported component.
 *
 * lucide-react builds every icon through createLucideIcon(), which sets
 * displayName to the PascalCase name — so `Waves` carries "Waves". That is the
 * whole trick, and it is worth asserting rather than trusting: if a future
 * version stops setting displayName, this must fail the export loudly instead
 * of writing empty icon names into the database and shipping fallback glyphs
 * to the public site.
 */
function iconName(icon: LucideIcon, context: string): string {
  const name = (icon as { displayName?: string }).displayName;

  if (typeof name !== "string" || name.length === 0) {
    throw new Error(
      `Could not read an icon name for ${context}. lucide-react's ` +
        `createLucideIcon no longer sets displayName — the export needs a new ` +
        `way to identify icons (compare identity against \`import * as Lucide\`).`
    );
  }
  return name;
}

/* ────────────────────────────── media ────────────────────────────── */

/**
 * Every current photograph is a hot-linked Unsplash or Pexels URL, so each
 * becomes a `remote` media row rather than a download.
 *
 * Keeping the provider and id (not just the finished URL) is what lets the API
 * rebuild any crop later, exactly as imageAt() does today — otherwise the
 * portrait service panels would end up stretching a landscape image.
 *
 * The upshot is that the site renders byte-identically on the day the database
 * goes live. Adopting these into local files is a separate, optional step, run
 * when real site photography replaces the stock.
 */
type MediaSeed = {
  key: ImageKey;
  kind: "remote";
  remoteUrl: string;
  provider: "unsplash" | "pexels";
  providerId: string;
  width: number;
  height: number;
  alt: string;
};

function exportMedia(): MediaSeed[] {
  return (Object.keys(SOURCES) as ImageKey[]).map((key) => {
    const source = SOURCES[key];
    return {
      key,
      kind: "remote",
      remoteUrl: images[key],
      provider: "from" in source ? source.from : "unsplash",
      providerId: source.id,
      width: source.w,
      height: source.h,
      /* Deliberately empty. The current components pass their own alt text at
         each call site, so there is no per-image alt to carry over — and
         inventing one here would be worse than leaving the gap visible. The
         dashboard requires alt before an image can be attached, which is what
         will actually get these filled in. */
      alt: "",
    };
  });
}

/* ───────────────────────────── helpers ───────────────────────────── */

/** team and testimonials have no slugs today — the database needs stable ones. */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** `Post.body` blocks are already the shape the database stores. */
const exportPosts = () =>
  posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    /* The compile-time TeamName union becomes an FK plus a denormalised
       string. The seed resolves the FK by matching this name against the
       seeded team rows. */
    authorName: post.author,
    authorSlug: slugify(post.author),
    category: post.category,
    imageKey: post.image,
    body: post.body,
  }));

function main(): void {
  const seed = {
    /* Stamped so a stale seed.json is obvious rather than silently reapplied. */
    generatedAt: new Date().toISOString(),
    source: "web/lib/{content,blog,images,site}.ts",

    company: {
      slug: "felmos",
      name: site.name,
      legalName: site.name,
      webUrl: site.url,
    },

    settings: {
      name: site.name,
      shortName: site.shortName,
      tagline: site.tagline,
      description: site.description,
      url: site.url,
      phone: site.phone,
      phoneHref: site.phoneHref,
      secondaryPhone: site.secondaryPhone,
      secondaryPhoneHref: site.secondaryPhoneHref,
      email: site.email,
      emailHref: site.emailHref,
      addressStreet: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressPostalCode: site.address.postalCode,
      addressCountry: site.address.country,
      addressShort: site.address.short,
      addressFull: site.address.full,
      geoLat: String(site.geo.lat),
      geoLng: String(site.geo.lng),
      mapEmbed: site.mapEmbed,
      mapLink: site.mapLink,
      hours: site.hours,
      hoursStructured: [...site.hoursStructured],
      founded: site.founded,
      socials: site.socials.map((s) => ({ ...s })),
    },

    /* The inspection recipient the contact route was always meant to use.
       Seeded as the single `to` so mail works the moment Resend is wired,
       then edited in the dashboard. */
    mailRecipients: [
      { email: site.email, name: site.name, role: "to" as const, sortOrder: 0 },
    ],

    media: exportMedia(),

    services: services.map((s) => ({
      slug: s.slug,
      num: s.num,
      title: s.title,
      label: s.label,
      short: s.short,
      lead: s.lead,
      icon: iconName(s.icon, `service "${s.slug}"`),
      imageKey: s.image,
      benefits: [...s.benefits],
      clients: [...s.clients],
    })),

    projects: projects.map((p) => ({
      slug: p.slug,
      num: p.num,
      title: p.title,
      category: p.category,
      location: p.location,
      /* String in the source ("2025"), smallint in the database. Parsed here so
         a non-numeric year fails the export rather than silently becoming
         NULL during the load. */
      year: (() => {
        const n = Number.parseInt(p.year, 10);
        if (!Number.isInteger(n)) {
          throw new Error(`Project "${p.slug}" has a non-numeric year: ${p.year}`);
        }
        return n;
      })(),
      client: p.client,
      duration: p.duration,
      scope: p.scope,
      narrative: p.narrative,
      result: p.result,
      metricValue: p.metric.value,
      metricLabel: p.metric.label,
      /* Service slugs; the seed resolves them to ids and fails if one is
         unknown — the database replacement for the dev-only invariant that
         currently guards this join in lib/content.ts. */
      serviceSlugs: [...p.services],
      imageKey: p.image,
    })),

    team: team.map((member) => ({
      slug: slugify(member.name),
      name: member.name,
      role: member.role,
      tag: member.tag,
      bio: member.bio,
      imageKey: member.image,
    })),

    posts: exportPosts(),

    testimonials: testimonials.map((t, index) => ({
      /* No natural slug — the author's name is the only stable handle, and it
         is unique across the three current entries. */
      slug: slugify(t.name),
      quote: t.quote,
      author: t.name,
      role: t.role,
      sortOrder: index,
    })),
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

  console.info(
    `[export] wrote ${OUT}\n` +
      `         ${seed.services.length} services · ${seed.projects.length} projects · ` +
      `${seed.posts.length} posts · ${seed.team.length} team · ` +
      `${seed.testimonials.length} testimonials · ${seed.media.length} media`
  );
}

main();
