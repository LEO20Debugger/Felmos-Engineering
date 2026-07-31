/**
 * The same deck import, run against a deployed API over HTTP.
 *
 *   OWNER_EMAIL=you@example.com OWNER_PASSWORD='…' npm run import:deck:remote
 *   … npm run import:deck:remote -- --publish
 *
 * Why this exists as a second script rather than a flag on the first one:
 * import-deck.ts writes bytes with storeImage(), straight onto the media volume
 * mounted next to it. That is the right thing locally and impossible remotely —
 * the volume lives on Railway, and the photographs are gitignored, so a deploy
 * never carries them. This one uploads through POST /admin/media instead, which
 * is the same endpoint the dashboard's upload form posts to, so the images get
 * the identical processing on the far side.
 *
 * It speaks only HTTP. No DATABASE_URL, no direct connection to production —
 * everything goes through the same authenticated endpoints a person using the
 * dashboard would hit, which means it cannot do anything an editor could not do
 * by hand.
 *
 * Credentials come from the environment and are never written anywhere. The
 * session is refreshed when it expires: the access cookie lasts fifteen minutes
 * and uploading eighty-seven photographs can outlast that.
 *
 * Idempotent on the same terms as the local import. Photographs are matched on
 * media.title, which POST /admin/media sets from the uploaded filename; projects
 * are matched on slug and PATCHed rather than duplicated.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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
  serviceImages?: Record<string, string>;
};

type AdminMedia = { id: number; alt: string; title: string | null };
type AdminService = { id: number; slug: string };
type AdminProject = { id: number; slug: string; status: string };

/* ───────────────────────────── arguments ───────────────────────────── */

const publish = process.argv.includes("--publish");

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. This script needs a dashboard owner's credentials:\n` +
        `  API_URL=https://…/v1 OWNER_EMAIL=… OWNER_PASSWORD=… npm run import:deck:remote`
    );
  }
  return value;
}

/* ──────────────────────────── the session ──────────────────────────── */

/**
 * A minimal cookie jar.
 *
 * Node's fetch does not keep cookies between calls, and the API authenticates
 * with httpOnly cookies exactly as a browser session does. Storing name=value
 * and nothing else is enough here: one origin, one session, no expiry logic —
 * a 401 is what triggers the refresh, not a clock.
 */
class Session {
  private cookies = new Map<string, string>();

  constructor(
    private readonly base: string,
    private readonly email: string,
    private readonly password: string
  ) {}

  private absorb(response: Response): void {
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const index = (pair ?? "").indexOf("=");
      if (index > 0) {
        this.cookies.set(
          (pair as string).slice(0, index).trim(),
          (pair as string).slice(index + 1)
        );
      }
    }
  }

  private header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  async login(): Promise<void> {
    const response = await fetch(`${this.base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!response.ok) {
      throw new Error(
        `Sign-in failed (${response.status}). Check OWNER_EMAIL and ` +
          `OWNER_PASSWORD, and that the account is an owner on this API.`
      );
    }
    this.absorb(response);
  }

  /** One request, retried once through a refresh if the access cookie aged out. */
  async send(
    path: string,
    init: RequestInit = {},
    retry = true
  ): Promise<Response> {
    const response = await fetch(`${this.base}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), cookie: this.header() },
    });
    this.absorb(response);

    if (response.status === 401 && retry) {
      const refreshed = await fetch(`${this.base}/auth/refresh`, {
        method: "POST",
        headers: { cookie: this.header() },
      });

      /* A refresh token has its own lifetime, and a long import can outlast
         that too. Falling back to a full sign-in keeps the run going rather
         than failing eighty photographs in. */
      if (refreshed.ok) this.absorb(refreshed);
      else await this.login();

      return this.send(path, init, false);
    }

    return response;
  }

  async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.send(path, init);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`${init.method ?? "GET"} ${path} → ${response.status}: ${text.slice(0, 400)}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.json<T>(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.json<T>(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

/* ────────────────────────────── main ────────────────────────────── */

async function main(): Promise<void> {
  /* Trailing slashes are the classic way to turn every request into a 404. */
  const base = env("API_URL").replace(/\/+$/, "");
  const session = new Session(base, env("OWNER_EMAIL"), env("OWNER_PASSWORD"));

  const seedDir = join(__dirname, "..", "..", "seed");
  const deck = JSON.parse(
    readFileSync(join(seedDir, "deck-projects.json"), "utf8")
  ) as Deck;
  const photoDir = join(seedDir, "deck");

  if (!existsSync(photoDir)) {
    throw new Error(
      `No photographs at ${photoDir}. They are gitignored, so run\n` +
        `  python seed/extract-deck.py seed/deck\n` +
        `from the api directory first, with the presentation unpacked beside it.`
    );
  }

  const wanted = [
    ...new Set(
      deck.projects.flatMap((p) => [p.hero, ...p.gallery.map((g) => g.file)])
    ),
  ];

  const absent = wanted.filter((f) => !existsSync(join(photoDir, f)));
  if (absent.length > 0) {
    throw new Error(
      `${absent.length} photograph(s) named in deck-projects.json are missing ` +
        `from ${photoDir}:\n  ${absent.join("\n  ")}`
    );
  }

  console.info(`[remote] ${base}`);
  await session.login();
  console.info(`[remote] signed in as ${process.env["OWNER_EMAIL"]}`);

  /* ── services, for the slug -> id map ── */

  const { services } = await session.json<{ services: AdminService[] }>(
    "/admin/services"
  );
  const serviceIds = new Map(services.map((s) => [s.slug, s.id]));

  for (const project of deck.projects) {
    for (const slug of project.serviceSlugs) {
      if (!serviceIds.has(slug)) {
        throw new Error(
          `Project "${project.slug}" references service "${slug}", which does ` +
            `not exist on this API. Seed the services before importing.`
        );
      }
    }
  }

  /* ── photographs ── */

  /* One listing up front rather than a search per file: eighty-seven lookups
     against a remote API is eighty-seven round trips to learn what one response
     already contains. */
  const { media } = await session.json<{ media: AdminMedia[] }>("/admin/media");
  const byTitle = new Map(
    media.filter((m) => m.title).map((m) => [m.title as string, m])
  );

  const uploaded = new Map<string, number>();
  let fresh = 0;

  async function imageFor(file: string, alt: string): Promise<number> {
    const cached = uploaded.get(file);
    if (cached) return cached;

    const existing = byTitle.get(file);
    if (existing) {
      /* Already there. Keep the bytes, but let a corrected description in the
         manifest reach the row. */
      if (existing.alt !== alt) await session.patch(`/admin/media/${existing.id}`, { alt });
      uploaded.set(file, existing.id);
      return existing.id;
    }

    const body = new FormData();
    body.append(
      "file",
      new Blob([new Uint8Array(readFileSync(join(photoDir, file)))]),
      file
    );

    const { id } = await session.json<{ id: number }>(
      `/admin/media?alt=${encodeURIComponent(alt)}`,
      { method: "POST", body }
    );

    uploaded.set(file, id);
    fresh += 1;
    process.stdout.write(".");
    return id;
  }

  /* ── projects ── */

  const { projects: before } = await session.json<{ projects: AdminProject[] }>(
    "/admin/projects?deleted=1"
  );
  const existingBySlug = new Map(before.map((p) => [p.slug, p]));

  let order = 0;
  for (const project of deck.projects) {
    const imageId = await imageFor(project.hero, project.heroAlt);
    const gallery: number[] = [];
    for (const photo of project.gallery) {
      gallery.push(await imageFor(photo.file, photo.alt));
    }

    const existing = existingBySlug.get(project.slug);

    const payload = {
      slug: project.slug,
      num: project.num,
      title: project.title,
      category: project.category,
      location: project.location,
      year: project.year,
      client: project.client,
      scope: project.scope,
      narrative: project.narrative,
      imageId,
      gallery,
      serviceIds: project.serviceSlugs.map((s) => serviceIds.get(s) as number),
      /* Never demote something already published from the dashboard: a rerun
         that silently took the site's projects offline would be a nasty
         surprise, and re-publishing is a click while noticing is not. */
      status:
        publish || existing?.status === "published"
          ? ("published" as const)
          : ("draft" as const),
    };

    if (existing) {
      await session.patch(`/admin/projects/${existing.id}`, payload);
    } else {
      await session.post("/admin/projects", payload);
    }

    console.info(
      `\n[remote] ${project.num} ${project.title} — ` +
        `${project.gallery.length} photographs, ${project.serviceSlugs.length} services`
    );
    order += 1;
  }

  /* ── service images ── */

  for (const [slug, file] of Object.entries(deck.serviceImages ?? {})) {
    const id = serviceIds.get(slug);
    const imageId = uploaded.get(file);
    if (!id || !imageId) continue;

    await session.patch(`/admin/services/${id}`, { imageId });
    console.info(`[remote] service "${slug}" -> ${file}`);
  }

  console.info(
    `\n[remote] done. ${order} projects, ${wanted.length} photographs ` +
      `(${fresh} newly uploaded, ${wanted.length - fresh} already present).`
  );

  if (!publish) {
    console.info(
      `[remote] New projects are drafts — review them at /admin/projects and ` +
        `publish what should go live.`
    );
  }
}

main().catch((error) => {
  console.error("\n[remote] import failed", error);
  process.exit(1);
});
