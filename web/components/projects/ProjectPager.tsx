import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Photo from "@/components/ui/Photo";
import type { CmsProject } from "@/lib/cms";

/**
 * Previous / next across the project set.
 *
 * Once each dossier became its own document, the only way out of one was the
 * breadcrumb back to /projects and a scroll to find the next card. This walks
 * the same order the index lists, so somebody reading through the work can keep
 * reading without going back to the shelf each time.
 *
 * The set wraps: the last project's "next" is the first. Seventeen entries with
 * no ranking between them, and a dead end at either edge is a worse answer than
 * a loop for a reader who arrived in the middle from search.
 */

type Neighbour = Pick<CmsProject, "slug" | "num" | "title" | "image">;

export default function ProjectPager({
  previous,
  next,
}: {
  previous: Neighbour;
  next: Neighbour;
}) {
  return (
    <nav
      className="wrap border-t border-divider py-10 md:py-14"
      aria-label="More projects"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <PagerLink project={previous} direction="previous" />
        <PagerLink project={next} direction="next" />
      </div>
    </nav>
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
      /* The whole card is the target, so the label and the thumbnail are not two
         separate stops for a keyboard or a screen reader. */
      className="group flex items-center gap-4 rounded-[2px] border border-divider p-3 no-underline transition-colors hover:border-accent-700 focus-visible:border-accent-700 sm:p-4"
      aria-label={`${isNext ? "Next" : "Previous"} project: ${project.title}`}
    >
      <div
        className={`flex min-w-0 flex-1 flex-col gap-1 ${isNext ? "sm:order-2 sm:text-right" : ""}`}
      >
        <span
          className={`flex items-center gap-1.5 text-[12px] uppercase tracking-[0.1em] opacity-60 ${isNext ? "sm:justify-end" : ""}`}
        >
          {!isNext && <Arrow size={14} strokeWidth={1.5} aria-hidden />}
          {isNext ? "Next project" : "Previous project"}
          {isNext && <Arrow size={14} strokeWidth={1.5} aria-hidden />}
        </span>

        {/* Truncated rather than wrapped: two cards side by side stay the same
            height whatever the titles are. */}
        <span className="truncate text-[15.5px] leading-[1.35] group-hover:text-accent-700">
          {project.title}
        </span>

        <span className="text-[12px] uppercase tracking-[0.08em] opacity-50">
          {project.num}
        </span>
      </div>

      {/* Only when there is a photograph. Photo renders a neutral block for a
          cleared image, which is right inside a gallery and wrong here — it
          would read as a thumbnail that failed to load. */}
      {project.image && (
        <div
          className={`w-[84px] shrink-0 sm:w-[104px] ${isNext ? "sm:order-1" : ""}`}
        >
          <Photo
            src={project.image}
            alt=""
            ratio="4/3"
            sizes="104px"
            zoom={false}
            wipe={false}
          />
        </div>
      )}
    </Link>
  );
}
