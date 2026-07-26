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

type Provider = "unsplash" | "pexels";

/** id + the crop the layout asks for by default, + which host serves it. */
const SOURCES = {
  // hero — full-bleed banner: tower cranes over a building going up, with open
  // sky on the left for the headline to sit in.
  hero: { id: "1565008447742-97f6f38c985c", w: 2000, h: 1000 },

  "about-story": { id: "1581092580497-e0d23cbdf1dc", w: 1400, h: 1050 }, // structural engineer performing inspection on site
  "about-hero": { id: "1216589", w: 2000, h: 1000, from: "pexels" }, // structural construction site under open sky

  "svc-soil": { id: "1517089152318-42ec560349c0", w: 1400, h: 1050 }, // earthworks
  "svc-ndt": { id: "1621905251189-08b45d6a269e", w: 1400, h: 1050 }, // taking a reading
  "svc-integrity": { id: "1487958449943-2429e8be8625", w: 1400, h: 1050 }, // facade from below
  "svc-verify": { id: "1503387837-b154d5074bd2", w: 1400, h: 1050 }, // drawings, scale rule
  "svc-foundation": { id: "1504307651254-35680f356dfd", w: 1400, h: 1050 }, // rebar, formwork

  "process-1": { id: "1454165804606-c3d57bc86b40", w: 1200, h: 800 }, // submitting the request
  "process-2": { id: "1531834685032-c34bf0d84c77", w: 1200, h: 800 }, // crew on a structure
  "process-3": { id: "1579154204601-01588f351e67", w: 1200, h: 800 }, // testing laboratory
  "process-4": { id: "1581094288338-2314dddb7ece", w: 1200, h: 800 }, // working the drawings
  "process-5": { id: "1581092160562-40aa08e78837", w: 1200, h: 800 }, // the written report
  "process-6": { id: "1600880292089-90a7e086ee0c", w: 1200, h: 800 }, // recommendations

  /* team — placeholder people, see note above.
     4:5 rather than square: at 1:1 these read as avatars, at 4:5 as
     commissioned portraits. `differentiators.real-support` re-crops team-1
     through imageAt() independently, so it is unaffected by this ratio. */
  "team-1": { id: "1472099645785-5658abf4ff4e", w: 900, h: 1125 },
  "team-2": { id: "1573497019940-1c28c88b4f3e", w: 900, h: 1125 },
  "team-3": { id: "1507003211169-0a1dd7228f2d", w: 900, h: 1125 },
  "team-4": { id: "1580489944761-15a19d654956", w: 900, h: 1125 },

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
  s.from === "pexels"
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
