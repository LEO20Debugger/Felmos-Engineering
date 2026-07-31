/**
 * Loads seed/deck-projects.json — the seventeen engagements transcribed from
 * the company's own presentation — into MySQL, photographs and all.
 *
 *   npm run import:deck
 *   npm run import:deck -- --company-slug=acme --publish
 *
 * Everything lands as a draft unless --publish is passed. That is deliberate:
 * this content came out of a slide deck rather than out of the dashboard, and
 * it should be read once by a person on the projects screen before it appears
 * on the website.
 *
 * Idempotent in both halves. Projects upsert on (company_id, slug), exactly as
 * the main seed does. Photographs are matched by `media.title`, which the
 * import sets to the source filename — a rerun re-uses the existing media row
 * rather than pushing eighty-seven images through sharp a second time and
 * leaving the originals orphaned. That matching is a select-then-insert rather
 * than a unique index, which is safe here only because this script is
 * single-threaded and run by hand.
 *
 * Photographs go through storeImage(), the same path an upload from the
 * dashboard takes, so they get the identical treatment: EXIF orientation
 * applied and GPS stripped, WebP variants at every width the site requests, and
 * a blur placeholder.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { and, eq, sql } from "drizzle-orm";

import { closeDb, getDb, type Db } from "./client";
import {
  companies,
  media,
  projectMedia,
  projectServices,
  projects,
  services,
} from "./schema";
import { storeImage } from "@/modules/media/media.storage";

/* ─────────────────────────── the deck document ─────────────────────────── */

type Photo = { file: string; alt: string };

type DeckProject = {
  slug: string;
  num: string;
  title: string;
  category: string | null;
  location: string | null;
  year: number | null;
  client: string | null;
  scope: string;
  narrative: string;
  serviceSlugs: string[];
  hero: string;
  heroAlt: string;
  gallery: Photo[];
};

type Deck = {
  projects: DeckProject[];
  /** Service slug -> a photograph from ./deck, replacing its stock image. */
  serviceImages?: Record<string, string>;
};

/* ───────────────────────────── arguments ───────────────────────────── */

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const publish = process.argv.includes("--publish");

/* ────────────────────────────── main ────────────────────────────── */

async function main(): Promise<void> {
  const db = getDb();

  const seedDir = join(__dirname, "..", "..", "seed");
  const deck = JSON.parse(
    readFileSync(join(seedDir, "deck-projects.json"), "utf8")
  ) as Deck;
  const photoDir = join(seedDir, "deck");

  if (!existsSync(photoDir)) {
    throw new Error(
      `No photographs at ${photoDir}. They are gitignored — 35 MB of ` +
        `originals — so a fresh clone has to re-extract them from the ` +
        `presentation before this can run.`
    );
  }

  /* Fail before writing anything if a photograph named in the manifest is not
     on disk. A half-imported project with three of its five pictures is much
     harder to notice than a script that refused to start. */
  const wanted = deck.projects.flatMap((p) => [
    p.hero,
    ...p.gallery.map((g) => g.file),
  ]);

  /* Every service image must also be a project photograph. Sharing the rows is
     the point — it keeps one copy of the bytes and one alt text — so a filename
     here that no project claims is a typo, not a new image to import. */
  for (const [slug, file] of Object.entries(deck.serviceImages ?? {})) {
    if (!wanted.includes(file)) {
      throw new Error(
        `serviceImages["${slug}"] names "${file}", which no project uses. ` +
          `Service images have to be photographs the projects already import.`
      );
    }
  }
  const absent = wanted.filter((f) => !existsSync(join(photoDir, f)));
  if (absent.length > 0) {
    throw new Error(
      `${absent.length} photograph(s) named in deck-projects.json are missing ` +
        `from ${photoDir}:\n  ${absent.join("\n  ")}`
    );
  }

  const companySlug = arg("company-slug", "felmos");
  const [companyRow] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);

  const companyId = companyRow?.id;
  if (!companyId) {
    throw new Error(
      `Company "${companySlug}" does not exist. Run \`npm run seed\` first.`
    );
  }

  /* Resolve the service slugs up front. An unknown one is fatal rather than a
     warning: a dropped link empties a row on the live site with nothing
     reporting it, which is the failure the main seed learned to catch too. */
  const serviceRows = await db
    .select({ id: services.id, slug: services.slug })
    .from(services)
    .where(and(eq(services.companyId, companyId), eq(services.isDeleted, 0)));

  const serviceIds = new Map(serviceRows.map((s) => [s.slug, s.id]));
  for (const project of deck.projects) {
    for (const slug of project.serviceSlugs) {
      if (!serviceIds.has(slug)) {
        throw new Error(
          `Project "${project.slug}" references service "${slug}", which is ` +
            `not in the database. Run \`npm run seed\` first, or fix the ` +
            `reference in seed/deck-projects.json.`
        );
      }
    }
  }

  console.info(
    `[deck] importing ${deck.projects.length} projects and ${wanted.length} ` +
      `photographs into company "${companySlug}" as ` +
      `${publish ? "PUBLISHED" : "drafts"}`
  );

  /* ── photographs ── */

  const uploaded = new Map<string, number>();

  async function imageFor(file: string, alt: string): Promise<number> {
    const cached = uploaded.get(file);
    if (cached) return cached;

    const [existing] = await db
      .select({ id: media.id })
      .from(media)
      .where(
        and(
          eq(media.companyId, companyId!),
          eq(media.title, file),
          eq(media.isDeleted, 0)
        )
      )
      .limit(1);

    if (existing) {
      /* Already imported. Keep the bytes, but let a corrected description in
         the manifest reach the row — alt text is the thing most likely to be
         revised after someone reads it back on the site. */
      await db.update(media).set({ alt }).where(eq(media.id, existing.id));
      uploaded.set(file, existing.id);
      return existing.id;
    }

    const stored = await storeImage(readFileSync(join(photoDir, file)), companyId!);

    const [result] = await db.insert(media).values({
      companyId: companyId!,
      kind: "local",
      storageKey: stored.storageKey,
      mime: stored.mime,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes,
      blurDataUrl: stored.blurDataUrl,
      alt,
      title: file,
    } as never);

    const id = (result as unknown as { insertId: number }).insertId;
    uploaded.set(file, id);
    process.stdout.write(".");
    return id;
  }

  /* ── projects ── */

  let order = 0;
  for (const project of deck.projects) {
    const heroId = await imageFor(project.hero, project.heroAlt);
    const galleryIds: number[] = [];
    for (const photo of project.gallery) {
      galleryIds.push(await imageFor(photo.file, photo.alt));
    }

    const values = {
      companyId,
      slug: project.slug,
      num: project.num,
      title: project.title,
      category: project.category,
      location: project.location,
      year: project.year,
      client: project.client,
      scope: project.scope,
      narrative: project.narrative,
      imageId: heroId,
      sortOrder: order,
      status: publish ? ("published" as const) : ("draft" as const),
      ...(publish ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
    };

    await db
      .insert(projects)
      .values(values as never)
      .onDuplicateKeyUpdate({
        set: Object.fromEntries(
          Object.entries(values).filter(
            /* Never overwrite identity on a rerun — and never demote a project
               someone has already published from the dashboard. */
            ([k]) => !["companyId", "slug", "status", "publishedAt"].includes(k)
          )
        ) as never,
      });

    const [row] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.companyId, companyId), eq(projects.slug, project.slug))
      )
      .limit(1);

    const projectId = row?.id;
    if (!projectId) {
      throw new Error(`Upsert of project "${project.slug}" did not yield an id.`);
    }

    /* Both joins replaced wholesale — simpler than diffing, and the sets are
       tiny. The same thing seed.ts does for project_services. */
    await db
      .delete(projectServices)
      .where(
        and(
          eq(projectServices.companyId, companyId),
          eq(projectServices.projectId, projectId)
        )
      );

    for (const [index, slug] of project.serviceSlugs.entries()) {
      await db.insert(projectServices).values({
        companyId,
        projectId,
        serviceId: serviceIds.get(slug) as number,
        sortOrder: index,
      });
    }

    await db
      .delete(projectMedia)
      .where(
        and(
          eq(projectMedia.companyId, companyId),
          eq(projectMedia.projectId, projectId)
        )
      );

    for (const [index, mediaId] of galleryIds.entries()) {
      await db
        .insert(projectMedia)
        .values({ companyId, projectId, mediaId, sortOrder: index });
    }

    console.info(
      `\n[deck] ${project.num} ${project.title} — ` +
        `${galleryIds.length + 1} photographs, ` +
        `${project.serviceSlugs.length} services`
    );
    order += 1;
  }

  /* ── service images ──
     Done after the projects, so every photograph is already on the volume and
     has a media row to point at. */
  for (const [slug, file] of Object.entries(deck.serviceImages ?? {})) {
    const mediaId = uploaded.get(file);
    if (!mediaId) continue;

    const [service] = await db
      .select({ id: services.id })
      .from(services)
      .where(
        and(
          eq(services.companyId, companyId),
          eq(services.slug, slug),
          eq(services.isDeleted, 0)
        )
      )
      .limit(1);

    if (!service) {
      console.warn(
        `[deck] serviceImages names "${slug}", which is not a service in this ` +
          `company — skipped.`
      );
      continue;
    }

    await db
      .update(services)
      .set({ imageId: mediaId })
      .where(eq(services.id, service.id));

    console.info(`[deck] service "${slug}" -> ${file}`);
  }

  await warnAboutStragglers(db, companyId);

  console.info(
    `\n[deck] done. ${deck.projects.length} projects, ${uploaded.size} images.` +
      (publish
        ? ""
        : `\n[deck] Everything is a draft — review it at /admin/projects and ` +
          `publish what should go live.`)
  );
}

/**
 * Point out projects already in the database that the deck knows nothing about.
 *
 * The six that shipped with the site are placeholders by their own admission,
 * and leaving them beside seventeen real engagements is the one outcome nobody
 * wants. This doesn't delete them — that is an editor's decision, and the
 * dashboard has a delete button.
 */
async function warnAboutStragglers(db: Db, companyId: number): Promise<void> {
  const deckSlugs = new Set(
    (
      JSON.parse(
        readFileSync(join(__dirname, "..", "..", "seed", "deck-projects.json"), "utf8")
      ) as Deck
    ).projects.map((p) => p.slug)
  );

  const rows = await db
    .select({ slug: projects.slug, title: projects.title, status: projects.status })
    .from(projects)
    .where(and(eq(projects.companyId, companyId), eq(projects.isDeleted, 0)));

  const others = rows.filter((r) => !deckSlugs.has(r.slug));
  if (others.length === 0) return;

  console.warn(
    `\n[deck] ${others.length} project(s) in the database did not come from ` +
      `the presentation:\n` +
      others.map((o) => `       ${o.status.padEnd(9)} ${o.title}`).join("\n") +
      `\n       Delete them from /admin/projects if they are the placeholder ` +
      `case studies the site shipped with.`
  );
}

main()
  .then(() => closeDb())
  .catch(async (error) => {
    console.error("[deck] import failed", error);
    await closeDb();
    process.exit(1);
  });
