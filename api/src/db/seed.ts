/**
 * Loads seed/seed.json — the frozen copy of the site's hardcoded content —
 * into MySQL.
 *
 *   npm run seed                    (defaults to the felmos company)
 *   npm run seed -- --company-slug=acme --company-name="Acme Ltd"
 *
 * Idempotent: every table is upserted on (company_id, slug), so re-running
 * updates rows rather than duplicating them. That matters because this will be
 * run more than once — against a fresh local database, against Railway, and
 * again after any correction to the source content.
 *
 * The company flag is what makes this reusable for a second business later:
 * seeding another tenant is a rerun with a different slug, not a rewrite.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { and, eq, sql } from "drizzle-orm";

import { closeDb, getDb, type Db } from "./client";
import {
  companies,
  leads,
  mailRecipients,
  media,
  posts,
  projectServices,
  projects,
  services,
  siteSettings,
  team,
  testimonials,
} from "./schema";
import { isIconName } from "@/common/icon-allowlist";

/* ─────────────────────────── the seed document ─────────────────────────── */

type Seed = {
  generatedAt: string;
  company: { slug: string; name: string; legalName: string; webUrl: string };
  settings: Record<string, unknown>;
  mailRecipients: { email: string; name: string; role: "to"; sortOrder: number }[];
  media: {
    key: string;
    kind: "remote";
    remoteUrl: string;
    provider: "unsplash" | "pexels";
    providerId: string;
    width: number;
    height: number;
    alt: string;
  }[];
  services: {
    slug: string;
    num: string;
    title: string;
    label: string;
    short: string;
    lead: string;
    icon: string;
    imageKey: string;
    benefits: string[];
    clients: string[];
  }[];
  projects: {
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
    metricValue: string;
    metricLabel: string;
    serviceSlugs: string[];
    imageKey: string;
  }[];
  team: {
    slug: string;
    name: string;
    role: string;
    tag: string;
    bio: string;
    imageKey: string;
  }[];
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    authorName: string;
    authorSlug: string;
    category: string;
    imageKey: string;
    body: unknown[];
  }[];
  testimonials: {
    slug: string;
    quote: string;
    author: string;
    role: string;
    sortOrder: number;
  }[];
};

/* ───────────────────────────── arguments ───────────────────────────── */

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

/* ────────────────────────────── helpers ────────────────────────────── */

/** Reading time, computed once at seed rather than on every request. */
function readMinutes(body: unknown[]): number {
  const words = JSON.stringify(body).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Upsert on the natural key and return the row's id.
 *
 * Deliberately not `ON DUPLICATE KEY UPDATE ... RETURNING` — MySQL has no
 * RETURNING, and `insertId` is unreliable after a duplicate-key update. A
 * select afterwards is one extra round trip on a script that runs occasionally,
 * and it always gives the right id.
 */
async function upsert<T extends Record<string, unknown>>(
  db: Db,
  table: Parameters<Db["insert"]>[0],
  slugColumn: { name: string },
  values: T,
  companyId: number,
  slug: string
): Promise<number> {
  const t = table as unknown as Record<string, never>;

  await db
    .insert(table)
    .values(values as never)
    .onDuplicateKeyUpdate({
      set: Object.fromEntries(
        Object.entries(values).filter(
          /* Never overwrite identity or provenance on a rerun. */
          ([k]) => !["companyId", "slug", "createdAt", "createdBy"].includes(k)
        )
      ) as never,
    });

  const [row] = await db
    .select({ id: t["id"] as never })
    .from(table as never)
    .where(
      and(
        eq(t["companyId"] as never, companyId),
        eq(t[slugColumn.name] as never, slug)
      )
    )
    .limit(1);

  const id = (row as { id: number } | undefined)?.id;
  if (typeof id !== "number") {
    throw new Error(`Upsert of "${slug}" did not yield an id.`);
  }
  return id;
}

/* ──────────────────────────────── main ──────────────────────────────── */

async function main(): Promise<void> {
  const db = getDb();

  const seedPath = join(__dirname, "..", "..", "seed", "seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Seed;

  const companySlug = arg("company-slug", seed.company.slug);
  const companyName = arg("company-name", seed.company.name);

  console.info(
    `[seed] loading ${seedPath}\n` +
      `       generated ${seed.generatedAt}\n` +
      `       into company "${companySlug}"`
  );

  /* Fail before writing anything if an icon is not in the allowlist. The web
     app resolves icons through an explicitly enumerated map, so a name outside
     it renders a fallback glyph on the public site — better caught here than
     discovered visually. */
  for (const s of seed.services) {
    if (!isIconName(s.icon)) {
      throw new Error(
        `Service "${s.slug}" uses icon "${s.icon}", which is not in the ` +
          `allowlist (api/src/common/icon-allowlist.ts). Add it there and to ` +
          `web/lib/icons.ts, or pick another.`
      );
    }
  }

  /* ── company ── */
  await db
    .insert(companies)
    .values({
      slug: companySlug,
      name: companyName,
      legalName: seed.company.legalName,
      webUrl: seed.company.webUrl,
      allowedOrigins: [seed.company.webUrl],
      status: "active",
    })
    .onDuplicateKeyUpdate({ set: { name: companyName } });

  const [companyRow] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);

  const companyId = companyRow?.id;
  if (!companyId) throw new Error(`Could not resolve company "${companySlug}".`);

  /* ── media ──
     Seeded as `remote` rows: the provider and id are kept so the API can
     rebuild any crop, which is what makes the site render identically to the
     hardcoded version on day one. `key` doubles as the slug so a rerun matches
     the same row. */
  const mediaIds = new Map<string, number>();
  for (const m of seed.media) {
    const id = await upsert(
      db,
      media,
      { name: "storageKey" },
      {
        companyId,
        storageKey: m.key,
        kind: "remote",
        remoteUrl: m.remoteUrl,
        provider: m.provider,
        providerId: m.providerId,
        width: m.width,
        height: m.height,
        alt: m.alt,
      },
      companyId,
      m.key
    );
    mediaIds.set(m.key, id);
  }

  const imageId = (key: string): number | null => mediaIds.get(key) ?? null;

  /* ── settings & mail routing ── */
  await db
    .insert(siteSettings)
    .values({ companyId, ...seed.settings } as never)
    .onDuplicateKeyUpdate({ set: seed.settings as never });

  for (const r of seed.mailRecipients) {
    await db
      .insert(mailRecipients)
      .values({
        companyId,
        email: r.email,
        name: r.name,
        role: r.role,
        sortOrder: r.sortOrder,
        active: 1,
      })
      .onDuplicateKeyUpdate({ set: { name: r.name, role: r.role } });
  }

  /* ── content ──
     Everything seeds as published: this is the site's current live content, and
     loading it as drafts would empty the public pages the moment the web app
     starts reading from the database. */
  const published = { status: "published" as const, publishedAt: nowStamp() };

  const serviceIds = new Map<string, number>();
  for (const [index, s] of seed.services.entries()) {
    const id = await upsert(
      db,
      services,
      { name: "slug" },
      {
        companyId,
        slug: s.slug,
        num: s.num,
        title: s.title,
        label: s.label,
        short: s.short,
        lead: s.lead,
        icon: s.icon,
        imageId: imageId(s.imageKey),
        benefits: s.benefits,
        clients: s.clients,
        sortOrder: index,
        ...published,
      },
      companyId,
      s.slug
    );
    serviceIds.set(s.slug, id);
  }

  const teamIds = new Map<string, number>();
  for (const [index, member] of seed.team.entries()) {
    const id = await upsert(
      db,
      team,
      { name: "slug" },
      {
        companyId,
        slug: member.slug,
        name: member.name,
        role: member.role,
        tag: member.tag,
        bio: member.bio,
        imageId: imageId(member.imageKey),
        sortOrder: index,
        ...published,
      },
      companyId,
      member.slug
    );
    teamIds.set(member.slug, id);
  }

  for (const [index, p] of seed.projects.entries()) {
    const projectId = await upsert(
      db,
      projects,
      { name: "slug" },
      {
        companyId,
        slug: p.slug,
        num: p.num,
        title: p.title,
        category: p.category,
        location: p.location,
        year: p.year,
        client: p.client,
        duration: p.duration,
        scope: p.scope,
        narrative: p.narrative,
        result: p.result,
        metricValue: p.metricValue,
        metricLabel: p.metricLabel,
        imageId: imageId(p.imageKey),
        sortOrder: index,
        ...published,
      },
      companyId,
      p.slug
    );

    /* Replace the join wholesale — simpler than diffing, and the set is tiny.
       An unknown slug is fatal: this is the constraint that used to be a
       dev-only console warning in lib/content.ts, and silently dropping the
       link would empty a row on the live site with nothing reporting it. */
    await db
      .delete(projectServices)
      .where(
        and(
          eq(projectServices.companyId, companyId),
          eq(projectServices.projectId, projectId)
        )
      );

    for (const [order, slug] of p.serviceSlugs.entries()) {
      const serviceId = serviceIds.get(slug);
      if (!serviceId) {
        throw new Error(
          `Project "${p.slug}" references service "${slug}", which is not in ` +
            `the seed. Fix the reference in web/lib/content.ts and re-export.`
        );
      }
      await db
        .insert(projectServices)
        .values({ companyId, projectId, serviceId, sortOrder: order });
    }
  }

  for (const [index, post] of seed.posts.entries()) {
    await upsert(
      db,
      posts,
      { name: "slug" },
      {
        companyId,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        date: post.date,
        /* The byline keeps working even if the author later leaves the team
           page — the FK may go null, the printed name does not. */
        authorTeamId: teamIds.get(post.authorSlug) ?? null,
        authorName: post.authorName,
        category: post.category,
        imageId: imageId(post.imageKey),
        body: post.body,
        readMinutes: readMinutes(post.body),
        sortOrder: index,
        ...published,
      },
      companyId,
      post.slug
    );
  }

  for (const t of seed.testimonials) {
    await upsert(
      db,
      testimonials,
      { name: "slug" },
      {
        companyId,
        slug: t.slug,
        quote: t.quote,
        author: t.author,
        role: t.role,
        sortOrder: t.sortOrder,
        ...published,
      },
      companyId,
      t.slug
    );
  }

  /* ── report ── */
  const counts = await db
    .select({
      services: sql<number>`(SELECT COUNT(*) FROM services WHERE company_id = ${companyId} AND is_deleted = 0)`,
      projects: sql<number>`(SELECT COUNT(*) FROM projects WHERE company_id = ${companyId} AND is_deleted = 0)`,
      posts: sql<number>`(SELECT COUNT(*) FROM posts WHERE company_id = ${companyId} AND is_deleted = 0)`,
      team: sql<number>`(SELECT COUNT(*) FROM team WHERE company_id = ${companyId} AND is_deleted = 0)`,
      testimonials: sql<number>`(SELECT COUNT(*) FROM testimonials WHERE company_id = ${companyId} AND is_deleted = 0)`,
      media: sql<number>`(SELECT COUNT(*) FROM media WHERE company_id = ${companyId} AND is_deleted = 0)`,
      leads: sql<number>`(SELECT COUNT(*) FROM ${leads} WHERE company_id = ${companyId} AND is_deleted = 0)`,
    })
    .from(sql`(SELECT 1) AS one`);

  console.info(`[seed] company #${companyId} now holds:`, counts[0]);
  console.info(
    "[seed] done. Next: `npm run create-owner` to make a dashboard login."
  );
}

/** MySQL datetime(3) literal for "now", in UTC. */
function nowStamp(): string {
  return new Date().toISOString().slice(0, 23).replace("T", " ");
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("[seed] FAILED", error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
