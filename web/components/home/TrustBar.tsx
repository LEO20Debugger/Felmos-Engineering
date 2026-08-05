import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import Stars from "@/components/ui/Stars";
import { getReviews } from "@/lib/cms";
import { trustPoints } from "@/lib/content";

/**
 * The thin strip under the banner: four reasons to keep reading.
 *
 * The last cell becomes the site's star rating once there are enough reviews
 * to quote one — a real number from real clients outranks any claim we write
 * about ourselves, and it is the first thing on the page a stranger can check.
 * Below that threshold the API returns no summary and the strip renders exactly
 * as it always has, so the layout never depends on the data being there.
 *
 * `getReviews()` is the same cached call the reviews section further down the
 * page makes — Next dedupes it, the way the hero and the projects teaser
 * already share one `getProjects()`.
 */
export default async function TrustBar() {
  const { summary } = await getReviews();

  /* Replaces the last point rather than becoming a fifth: the grid is 2×2 on
     mobile and 4-up from md, and a fifth cell orphans one on both. */
  const points = summary ? trustPoints.slice(0, -1) : trustPoints;

  return (
    <section className="wrap" aria-label="Why clients rely on us">
      <ul className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-6 border-y border-divider p-0 py-7 md:grid-cols-4">
        {points.map(({ icon: Icon, label }, i) => (
          <Reveal as="li" key={label} delay={i} className="flex items-center gap-3">
            <Icon size={24} strokeWidth={1.5} className="flex-none text-link" />
            <span className="text-[14px] font-medium leading-tight md:text-[14.5px]">{label}</span>
          </Reveal>
        ))}

        {summary && (
          <Reveal as="li" delay={points.length} className="flex items-center">
            <Link
              href="/reviews"
              className="flex items-center gap-3 no-underline text-ink"
            >
              <Stars value={summary.average} size={17} className="flex-none" />
              <span className="text-[14px] font-medium leading-tight md:text-[14.5px]">
                {summary.average} from {summary.count} reviews
              </span>
            </Link>
          </Reveal>
        )}
      </ul>
    </section>
  );
}
