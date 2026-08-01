import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { CmsProject } from "@/lib/cms";

/**
 * Previous / next across the project set, sitting on the breadcrumb row.
 *
 * Once each dossier became its own document, the only way out of one was the
 * breadcrumb back to /projects and a scroll to find the next card. This walks
 * the same order the index lists, so somebody reading through the work can keep
 * reading without going back to the shelf each time.
 *
 * Kept to arrows and a title at the top of the page rather than the picture
 * cards a footer pager would use: this sits above the work it is pointing away
 * from, so it has to stay out of the dossier's way.
 *
 * The set wraps: the last project's "next" is the first. Seventeen entries with
 * no ranking between them, and a dead end at either edge is a worse answer than
 * a loop for a reader who arrived in the middle from search.
 */

type Neighbour = Pick<CmsProject, "slug" | "title">;

export default function ProjectPager({
  previous,
  next,
}: {
  previous: Neighbour;
  next: Neighbour;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <PagerLink project={previous} direction="previous" />
      <span className="h-4 w-px bg-divider" aria-hidden />
      <PagerLink project={next} direction="next" />
    </div>
  );
}

function PagerLink({
  project,
  direction,
}: {
  project: Neighbour;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="inline-flex max-w-[9rem] items-center gap-1.5 text-[13px] uppercase tracking-[0.08em] no-underline opacity-65 hover:opacity-100 focus-visible:opacity-100 md:max-w-[16rem]"
      /* The visible word is only "Prev"/"Next" on a narrow screen, which tells
         a screen reader nothing about where it goes. */
      aria-label={`${isNext ? "Next" : "Previous"} project: ${project.title}`}
    >
      {!isNext && <Arrow size={15} strokeWidth={1.5} aria-hidden />}

      {/* The title where there is room for it, the direction where there is
          not — two truncated titles side by side on a phone read as neither. */}
      <span className="truncate max-sm:hidden">{project.title}</span>
      <span className="sm:hidden">{isNext ? "Next" : "Prev"}</span>

      {isNext && <Arrow size={15} strokeWidth={1.5} aria-hidden />}
    </Link>
  );
}
