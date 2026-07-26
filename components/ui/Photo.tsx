import Image from "next/image";
import { images, type ImageKey } from "@/lib/images";

/**
 * Every content image on the site goes through here, so cropping, the loading
 * ground and the sizes hint are handled the same way everywhere.
 *
 * Photographs render in full colour — the design system's steel duotone wash
 * was removed by request.
 */
export default function Photo({
  src,
  alt,
  ratio = "4/3",
  sizes = "100vw",
  priority = false,
  className = "",
  zoom = true,
}: {
  src: ImageKey;
  alt: string;
  /** CSS aspect-ratio for the frame, e.g. "4/5", "3/2", "1/1". */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  zoom?: boolean;
}) {
  return (
    <div
      className={`photo-frame ${zoom ? "photo-zoom" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={images[src]}
        alt={alt}
        sizes={sizes}
        priority={priority}
        // The wrapper owns the box; the image fills it and is cropped by object-fit.
        fill
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
