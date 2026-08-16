/**
 * Live stock photography, one entry per image slot.
 *
 * These are hot-linked from images.unsplash.com and images.pexels.com, but they
 * are NOT fetched by the visitor's browser: next/image proxies them through
 * /_next/image, which resizes, re-encodes to AVIF/WebP and caches them on our
 * own origin. So the page still makes only same-origin image requests, and
 * swapping a photo is a one-line edit here.
 *
 * Two providers, because they identify photos differently:
 *   - Unsplash (the default) — `id` is the segment after `photo-` in any
 *     images.unsplash.com URL, e.g. "1565008447742-97f6f38c985c".
 *   - Pexels (`from: "pexels"`) — `id` is the numeric photo id, the digits in
 *     any pexels.com/photo/... URL, e.g. "8482824".
 * Both hosts must stay allowlisted in next.config.ts or next/image rejects them.
 *
 * Licensing: the Unsplash and Pexels licences both permit commercial use
 * without attribution.
 *
 * The team portraits are stock people, not Felmos staff, and the six project
 * photographs illustrate fictional case studies — replace both sets with real
 * photography before this goes live.
 */

type Provider = "unsplash" | "pexels" | "local";

/** id + the crop the layout asks for by default, + which host serves it.
 *
 *  Exported so scripts/export-content.ts can read the provider and id directly
 *  when seeding the database, rather than regexing them back out of a built
 *  URL. Nothing in the app should import this — use `images` or `imageAt()`. */
export const SOURCES = {
  // hero — first frame of the full-bleed banner slideshow: tower cranes over a
  // glass-clad tower going up, with open sky on the left for the headline.
  hero: { id: "1565008447742-97f6f38c985c", w: 2000, h: 1000 },

  /* The other two frames of the homepage banner's slideshow. Each was loaded at
     the banner crop and looked at before being used here, so the alt text in
     Hero.tsx describes the actual photograph.

     hero-3 is the same photograph as `proj-1`, by request. Note that it
     therefore appears twice on the homepage — the banner cycles it, and the
     Projects teaser below renders projects.slice(0, 3), of which proj-1 is the
     first. Reordering `projects` in lib/content.ts so proj-1 falls outside the
     top three would separate them without changing either picture. */
  "hero-2": { id: "1545186070-de624ed19875", w: 2000, h: 1000 }, // engineer sighting through a levelling instrument
  "hero-3": { id: "5612890", w: 2000, h: 1000, from: "pexels" }, // two high-rise blocks under construction

  /* Banner crops of two of the service photographs below, for the pile-testing
     and sub-soil slides of the homepage slideshow. Same Pexels ids as
     `svc-pile-testing` and `svc-subsoil` — deliberately the same picture in
     both places, since a slide and its service page describing the same work
     should not show two different jobs — but requested at the banner's 2:1
     rather than the service grid's 4:3, so the provider crops for this shape
     instead of next/image throwing away the top and bottom of a 4:3 frame. */
  "hero-piles": { id: "29470001", w: 2000, h: 1000, from: "pexels" }, // piling rig working below high-rise blocks
  "hero-subsoil": { id: "15391048", w: 2000, h: 1000, from: "pexels" }, // worker operating a large drilling rig

  /* Felmos's own photography, supplied by the company — not stock. The About
     page is where a visitor asks who these people actually are, so both slots
     show the real team: the crew on a job for the banner, and the office
     working over instruments and a drawing for the story figure.

     4:3 camera originals at 2560x1920. w/h below are inert for a local source
     (`url()` returns the path unchanged and next/image does the resizing), and
     are recorded as the true pixel dimensions rather than a crop nobody
     performs. */
  "about-story": { id: "about/team-in-office.jpg", w: 2560, h: 1920, from: "local" },
  "about-hero": { id: "about/team-on-site.jpg", w: 2560, h: 1920, from: "local" },

  /* services — one per entry in `services`, keyed by that service's slug so a
     renamed service can't quietly keep a photograph of something else. All from
     Pexels, whose photo pages carry descriptions, so each was picked against a
     read description of the subject; the comment on each line is that photo's
     own description, abbreviated. Each was checked to return 200 at all three
     crops the layouts ask for (1400x1050 on /services, 900x1200 for the
     portrait showcase panel, 800x800 for the mobile tile).

     One compromise worth knowing about: svc-concrete-strength. Pexels has no
     photograph of a cube crush or a compression rig — the searches return
     chemistry labs and sugar cubes. The instrument-against-concrete shot below
     is the closest honest stand-in and reads as concrete being measured rather
     than concrete being poured. Replace it first if real site photography
     arrives. */
  "svc-integrity-testing": { id: "8961159", w: 1400, h: 1050, from: "pexels" }, // worker inspecting a bridge structure
  "svc-concrete-strength": { id: "31945566", w: 1400, h: 1050, from: "pexels" }, // digital instrument taking a reading off concrete
  "svc-pile-testing": { id: "29470001", w: 1400, h: 1050, from: "pexels" }, // piling rig working below high-rise blocks
  "svc-subsoil": { id: "15391048", w: 1400, h: 1050, from: "pexels" }, // worker operating a large drilling rig
  "svc-piling-works": { id: "37432684", w: 1400, h: 1050, from: "pexels" }, // concrete foundation blocks with starter bars
  "svc-drawings": { id: "4134179", w: 1400, h: 1050, from: "pexels" }, // structural drawings with a scale rule
  "svc-project-management": { id: "9405431", w: 1400, h: 1050, from: "pexels" }, // engineering team over drawings on site
  "svc-building-repairs": { id: "27134625", w: 1400, h: 1050, from: "pexels" }, // worker repairing a building facade from scaffolding

  /* audiences — the six rows of the "Find Yourself On This List" section, one
     key each. Three of these rows used to borrow the svc-* photograph of the
     service they link to; they don't any more, because the section describes
     the CLIENT'S SITUATION rather than the service — "what the crack actually
     means" wants a crack, not the foundation blocks it once showed — and
     because the services grid renders those same frames further down the same
     page, so each appeared twice on the homepage.

     Portrait, and much larger than the rest of the registry, because these are
     no longer thumbnails: Audience.tsx renders the row's photograph at ~430px
     wide in the section's left column, crossfading as the cursor moves down
     the list. The small inline picture the rows still carry below lg re-crops
     these through imageAt(), which is what that helper is for.

     Two consequences of the size worth keeping in mind when swapping one:
     a frame has to survive a 4:5 crop (a wide landscape centre-cropped to
     portrait loses its subject), and composition and light now show, where at
     the old 96x64 nothing did.

     They also have to stay distinct from EACH OTHER, harder here than in a
     static list: two frames from the same shoot two rows apart read as no
     change at all when the crossfade runs between them. Hence a group, a
     close-up, a lone figure, and three subject-only frames. Stock libraries
     cluster, so this is a real risk rather than a theoretical one — the
     obvious lender candidate was another frame of the developer shoot.

     People shown are Black/Nigerian, matching process-* and team-*. Where
     Pexels had no strong Black subject for a line, the row shows the thing
     itself rather than the wrong person — which is why three of the six have
     no people in them at all.

     Every id here was downloaded at this crop and looked at, not picked off
     its description, and that mattered: the first pick for the architect row
     turned out to be a hand-drawn cottage sketch rather than a drawing set,
     and the whole 82936xx inspector series the lender row used to draw from —
     including the frame that shipped here before — is one shoot with one South
     Asian model, so no id in it satisfies the line above. Read descriptions
     will not tell you either of those things.

     Known compromise: aud-developers carries another firm's branding on the
     hard hats and vests. It is illegible at the rendered size and it is the
     only strongly West African team-over-drawings frame on Pexels, so it
     stays — but it is the first to replace when real Felmos site photography
     arrives. It is no longer the resting frame: `audiences` leads with
     Government Projects, whose flyover has no branding in it at all, so the
     branded frame is now only seen by someone who hovers that row. */
  "aud-developers": { id: "37198875", w: 800, h: 1000, from: "pexels" }, // West African team in hard hats and hi-vis around a site render and drawing set
  "aud-homeowners": { id: "5561369", w: 800, h: 1000, from: "pexels" }, // stepped structural crack running through a painted blockwork wall
  "aud-banks": { id: "8488032", w: 800, h: 1000, from: "pexels" }, // Black engineer in hard hat and hi-vis writing findings onto a form
  "aud-architects": { id: "4792483", w: 800, h: 1000, from: "pexels" }, // dimensioned floor plan and drawing pens on a wooden desk
  "aud-construction": { id: "38520003", w: 800, h: 1000, from: "pexels" }, // reinforcement steel cages standing on site before a pour
  "aud-government": { id: "11310491", w: 800, h: 1000, from: "pexels" }, // underside of a concrete flyover — piers, girders, traffic below

  "process-1": { id: "process/process-1.jpg", w: 1200, h: 800, from: "local" }, // client meeting & submitting request (Nigerian/African)
  "process-2": { id: "process/process-2.jpg", w: 1200, h: 800, from: "local" }, // Nigerian site engineer conducting inspection
  "process-3": { id: "process/process-3.jpg", w: 1200, h: 800, from: "local" }, // African laboratory technician testing materials
  "process-4": { id: "process/process-4.jpg", w: 1024, h: 768, from: "local" }, // Felmos engineering team analyzing CAD drawings and testing apparatus
  "process-5": { id: "process/process-5.jpg", w: 1200, h: 800, from: "local" }, // detailed engineering report review
  "process-6": { id: "process/process-6.jpg", w: 1200, h: 800, from: "local" }, // senior engineer presenting recommendations

  /* team — Nigerian/African professional portraits (local assets in public/team/).
     4:5 rather than square: at 1:1 these read as avatars, at 4:5 as
     commissioned portraits. `differentiators.real-support` re-crops team-1
     through imageAt() independently, so it is unaffected by this ratio.
     Source: AI-generated, replace with real staff photography before launch. */
  "team-1": { id: "team/team-1.jpg", w: 900, h: 1125, from: "local" },
  "team-2": { id: "team/team-2.jpg", w: 900, h: 1125, from: "local" },
  "team-3": { id: "team/team-3.jpg", w: 900, h: 1125, from: "local" },
  "team-4": { id: "team/team-4.jpg", w: 900, h: 1125, from: "local" },

  /* The real LSMTL certificate of registration, rendered from the 2024 PDF.
     Landscape and mostly white paper, so it is only ever shown under the
     accent-900 gradient in WhyUs — never as a bare photograph. */
  "cert-lsmtl": { id: "certificates/lsmtl-2024.jpg", w: 1988, h: 1406, from: "local" },

  "cta-texture": { id: "1486406146926-c627a92ad1ab", w: 1920, h: 1080 },

  // contact — banner: two people shaking hands over a deal/agreement.
  "contact-hero": { id: "1521791136064-7986c2920216", w: 2000, h: 900 },

  /* projects — sourced from Pexels, whose photo pages carry descriptions, so
     each of these was picked against a read description of the subject rather
     than chosen blind. Each was then loaded at all three crops the page asks
     for (landscape 1400x1050, portrait 1000x1250 for the pinned column, and the
     360x240 index thumbnail) and confirmed to return the exact dimensions.

     The comment on each line is that photo's own description, abbreviated. */
  "projects-hero": { id: "13057675", w: 2000, h: 1000, from: "pexels" }, // tower cranes, low angle against blue sky
  "proj-1": { id: "5612890", w: 1400, h: 1050, from: "pexels" }, // two high-rises under construction, cranes
  "proj-2": { id: "36606405", w: 1400, h: 1050, from: "pexels" }, // excavator, foundations laid and rebar
  "proj-3": { id: "8961700", w: 1400, h: 1050, from: "pexels" }, // worker inspecting a brick wall indoors
  "proj-4": { id: "8482824", w: 1400, h: 1050, from: "pexels" }, // engineer using a spirit level on a wall
  "proj-5": { id: "14840752", w: 1400, h: 1050, from: "pexels" }, // drilling machine working on soil, close up
  "proj-6": { id: "8482551", w: 1400, h: 1050, from: "pexels" }, // engineer reviewing floor plans on site
} as const;

export type ImageKey = keyof typeof SOURCES;

/** What every SOURCES entry looks like once the `as const` is widened. */
type Source = { id: string; w: number; h: number; from?: Provider };

/**
 * Build a crop URL. Both providers take width/height and crop server-side, so
 * next/image is always handed an already-correctly-framed source rather than
 * something it has to letterbox.
 */
const url = (s: Source, w: number, h: number) =>
  s.from === "local"
    ? `/${s.id}`
    : s.from === "pexels"
    ? `https://images.pexels.com/photos/${s.id}/pexels-photo-${s.id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`
    : `https://images.unsplash.com/photo-${s.id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Default crop for each slot. */
export const images = Object.fromEntries(
  Object.entries(SOURCES).map(([key, s]) => [key, url(s, s.w, s.h)])
) as Record<ImageKey, string>;

/**
 * The same photograph at a different aspect ratio — used where a layout needs a
 * portrait crop of an image that is landscape everywhere else (the service
 * panels), so the subject is framed rather than centre-cropped out.
 */
export const imageAt = (key: ImageKey, w: number, h: number) => url(SOURCES[key], w, h);
