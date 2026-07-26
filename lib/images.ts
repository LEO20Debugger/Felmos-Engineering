/**
 * Live Unsplash photography, one entry per image slot.
 *
 * These are hot-linked from images.unsplash.com, but they are NOT fetched by the
 * visitor's browser: next/image proxies them through /_next/image, which resizes,
 * re-encodes to AVIF/WebP and caches them on our own origin. So the page still
 * makes only same-origin image requests, and swapping a photo is a one-line edit.
 *
 * Each photo was checked to resolve and reviewed visually before being assigned.
 * To change one, drop a different Unsplash photo id in — the id is the segment
 * after `photo-` in any images.unsplash.com URL.
 *
 * Licensing: the Unsplash License permits commercial use without attribution.
 * The team portraits are stock people, not Felmos staff — replace those four
 * with real photographs before this goes live.
 */

/** id + the crop the layout asks for by default. */
const SOURCES = {
  // hero — full-bleed banner: tower cranes over a building going up, with open
  // sky on the left for the headline to sit in.
  hero: { id: "1565008447742-97f6f38c985c", w: 2000, h: 1000 },

  "about-story": { id: "1503387762-592deb58ef4e", w: 1400, h: 1050 }, // hands over drawings

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

  // team — placeholder people, see note above
  "team-1": { id: "1472099645785-5658abf4ff4e", w: 900, h: 900 },
  "team-2": { id: "1573497019940-1c28c88b4f3e", w: 900, h: 900 },
  "team-3": { id: "1507003211169-0a1dd7228f2d", w: 900, h: 900 },
  "team-4": { id: "1580489944761-15a19d654956", w: 900, h: 900 },

  "cta-texture": { id: "1486406146926-c627a92ad1ab", w: 1920, h: 1080 },
} as const;

export type ImageKey = keyof typeof SOURCES;

const url = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Default crop for each slot. */
export const images = Object.fromEntries(
  Object.entries(SOURCES).map(([key, s]) => [key, url(s.id, s.w, s.h)])
) as Record<ImageKey, string>;

/**
 * The same photograph at a different aspect ratio — used where a layout needs a
 * portrait crop of an image that is landscape everywhere else (the service
 * panels), so the subject is framed rather than centre-cropped out.
 */
export const imageAt = (key: ImageKey, w: number, h: number) => url(SOURCES[key].id, w, h);
