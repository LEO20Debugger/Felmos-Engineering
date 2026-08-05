import Link from "next/link";
import { ArrowRight } from "lucide-react";

import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import Stars from "@/components/ui/Stars";
import ReviewCard from "@/components/reviews/ReviewCard";
import { getReviews } from "@/lib/cms";

/**
 * Homepage reviews — the three most recent approved reviews, with the site's
 * aggregate rating above them.
 *
 * Sits where the hardcoded testimonials block used to, between the numbers and
 * the team: the page has just made a claim about itself, and this is somebody
 * else saying it.
 *
 * Renders nothing at all when there is nothing to show. An empty "What Clients
 * Say" with three blank cards is worse than the section not existing.
 */
export default async function Reviews() {
  const { reviews, summary } = await getReviews();
  if (reviews.length === 0) return null;

  const featured = reviews.slice(0, 3);

  return (
    <section className="wrap py-14 md:py-20" aria-label="Client reviews">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <SectionHead kicker="Client Feedback" title="What Clients Say" />
        </div>
        <Reveal delay={2} className="mb-8 hidden md:mb-10 lg:block">
          <Link href="/reviews" className="btn btn-secondary text-ink no-underline">
            All reviews
            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>

      {summary && (
        <Reveal className="-mt-3 mb-8 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Stars value={summary.average} size={18} />
          <span className="text-[15px] font-semibold">
            {summary.average} out of 5
          </span>
          <span className="text-[13.5px] opacity-60">
            from {summary.count} client review{summary.count === 1 ? "" : "s"}
          </span>
        </Reveal>
      )}

      {/* Scroll-snaps on mobile, settles into a three-up grid from md. */}
      <ul className="no-scrollbar -mx-[var(--gutter)] m-0 flex list-none snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] py-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {featured.map((review, i) => (
          <Reveal
            as="li"
            key={review.id}
            delay={i}
            className="w-[86%] flex-none snap-center sm:w-[60%] md:w-auto"
          >
            <ReviewCard review={review} />
          </Reveal>
        ))}
      </ul>

      <Reveal delay={3} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/reviews" className="btn btn-secondary text-ink no-underline lg:hidden">
          All reviews
          <ArrowRight size={17} strokeWidth={1.5} />
        </Link>
        <Link href="/reviews#leave-a-review" className="btn btn-secondary text-ink no-underline">
          Leave a review
        </Link>
      </Reveal>
    </section>
  );
}
