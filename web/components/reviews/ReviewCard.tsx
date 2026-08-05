import { Quote } from "lucide-react";

import Stars from "@/components/ui/Stars";
import type { CmsReview } from "@/lib/cms";

/**
 * One review, as shown on the homepage, on /reviews, and on a project dossier.
 *
 * Extracted the moment it had a third caller. The markup is the card the
 * homepage testimonials block already used — quote mark, blockquote, a footer
 * rule with the attribution — with the rating added above the quote.
 */
export default function ReviewCard({ review }: { review: CmsReview }) {
  /* Role and company read as one line: "Property Developer, Lagos Estates".
     Either may be missing, and a stray comma is the tell that a component was
     written assuming both. */
  const attribution = [review.role, review.company].filter(Boolean).join(", ");

  return (
    <figure className="mark-lift relative flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <Quote size={26} strokeWidth={1.5} className="text-accent-300" aria-hidden />
        {review.rating !== null && <Stars value={review.rating} />}
      </div>

      <blockquote className="m-0 flex-1 text-[15px] leading-[1.6] opacity-90">
        {review.quote}
      </blockquote>

      <figcaption className="flex flex-col gap-0.5 border-t border-divider pt-3.5">
        <strong className="text-[14px] font-semibold">{review.name}</strong>
        {attribution && (
          <span className="text-[12.5px] opacity-60">{attribution}</span>
        )}
      </figcaption>
    </figure>
  );
}
