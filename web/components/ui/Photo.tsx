import Image from "next/image";
import { images, type ImageKey } from "@/lib/images";
import { focalPosition, isMedia, mediaUrl, type Media } from "@/lib/media";

/**
 * Every content image on the site goes through here, so cropping, the loading
 * ground and the sizes hint are handled the same way everywhere.
 *
 * Photographs render in full colour — the design system's steel duotone wash
 * was removed by request.
 *
 * `src` takes either form:
 *
 *   ImageKey — a key into lib/images.ts, for the photographs that are still
 *              part of the design rather than the content: the hero frames,
 *              the process steps, the CTA texture.
 *
 *   Media    — a row from the database, for anything an editor controls. These
 *              carry a blur placeholder and a focal point, so they crop around
 *              the subject rather than the centre.
 *
 * Accepting both is what let the content types move over one at a time instead
 * of in a single change touching every page.
 */
export default function Photo({
  src,
  alt,
  ratio = "4/3",
  sizes = "100vw",
  priority = false,
  className = "",
  zoom = true,
  wipe = true,
}: {
  /** Nullable because a content row's image can be cleared in the dashboard;
      the frame renders as a neutral block rather than a broken image. */
  src: ImageKey | Media | null;
  alt: string;
  /** CSS aspect-ratio for the frame, e.g. "4/5", "3/2", "1/1". */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  zoom?: boolean;
  /** Opt out of the scroll-driven entry wipe. Needed where the frame sits in a
      very tall container — the wipe is keyed to the viewport, so it finishes
      long before the photo is anywhere near read. */
  wipe?: boolean;
}) {
  const frame = `photo-frame ${zoom ? "photo-zoom" : ""} ${wipe ? "" : "no-wipe"} ${className}`;

  if (!src) {
    return <div className={frame} style={{ aspectRatio: ratio }} aria-hidden />;
  }

  const media = isMedia(src) ? src : null;

  return (
    <div className={frame} style={{ aspectRatio: ratio }}>
      <Image
        /* 1600 is the widest crop any layout asks for; next/image then serves
           the right width per device from its own deviceSizes. */
        src={media ? mediaUrl(media, 1600) : images[src as ImageKey]}
        alt={alt}
        sizes={sizes}
        priority={priority}
        // The wrapper owns the box; the image fills it and is cropped by object-fit.
        fill
        style={{
          objectFit: "cover",
          /* Crop around whatever the editor marked as the subject. Static
             images keep the centred default. */
          ...(media ? { objectPosition: focalPosition(media) } : {}),
        }}
        {...(media?.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: media.blurDataUrl }
          : {})}
      />
    </div>
  );
}
