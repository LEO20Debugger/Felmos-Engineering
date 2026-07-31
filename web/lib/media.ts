/**
 * Images that come from the database.
 *
 * Two kinds, deliberately unified behind one function so no component has to
 * know where a photograph came from:
 *
 *   remote — the stock photographs the site launched with, still served by
 *            Unsplash and Pexels. The row keeps the provider and the photo id,
 *            so any crop can be rebuilt exactly as lib/images.ts always did.
 *            Nothing was downloaded during the migration, which is why the
 *            site renders identically to before.
 *
 *   local  — uploaded through the dashboard, stored on the API's volume and
 *            resized by it on request.
 *
 * `lib/images.ts` still exists and still serves the content that remains
 * hardcoded (the hero frames, the process steps, the CTA texture). It is the
 * static counterpart to this file, not a leftover.
 */

export type Media = {
  id: number;
  kind: "local" | "remote";
  remoteUrl: string | null;
  provider: "unsplash" | "pexels" | null;
  providerId: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  alt: string;
  focalX: number;
  focalY: number;
};

/**
 * A URL for this image at the requested crop.
 *
 * Mirrors imageAt() from lib/images.ts: both providers crop server-side from
 * query parameters, and the API's media endpoint accepts the same width and
 * height, so a layout can ask for the shape it needs instead of letterboxing a
 * fixed-size image.
 */
export function mediaUrl(image: Media, width: number, height?: number): string {
  if (image.kind === "remote" && image.providerId) {
    const h = height ?? Math.round(width * 0.75);

    return image.provider === "pexels"
      ? `https://images.pexels.com/photos/${image.providerId}/pexels-photo-${image.providerId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${h}`
      : `https://images.unsplash.com/photo-${image.providerId}?auto=format&fit=crop&w=${width}&h=${h}&q=80`;
  }

  /* Public origin, because this URL ends up in the browser's <img src>. */
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/media/${image.id}?w=${width}${height ? `&h=${height}` : ""}`;
}

/** CSS object-position from the focal point an editor set by clicking. */
export const focalPosition = (image: Media): string =>
  `${image.focalX}% ${image.focalY}%`;

/** Distinguishes a Media row from the ImageKey strings static content uses. */
export const isMedia = (value: unknown): value is Media =>
  typeof value === "object" && value !== null && "kind" in value;
