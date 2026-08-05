import type { Metadata } from "next";

import PageHead from "@/components/ui/PageHead";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/Section";
import Stars from "@/components/ui/Stars";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewForm from "@/components/reviews/ReviewForm";
import CtaBand from "@/components/ui/CtaBand";
import { getReviews } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Client Reviews",
  description:
    "What developers, lenders and homeowners say about working with Felmos Engineering — and a place to leave your own review.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const { reviews, summary } = await getReviews();

  /* Structured data only when there is a real aggregate behind it. Google
     requires the reviews it describes to be visible on the page, and marking
     up a rating the page does not itself show is the kind of thing that gets a
     site's rich results turned off entirely. */
  const jsonLd = summary
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Felmos Engineering",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: summary.average,
          reviewCount: summary.count,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : null;

  return (
    <>
      <PageHead
        kicker="Client Reviews"
        title="What Our Clients Say"
        lead="Every review here was left by someone we've worked for. We read each one before it goes on the site, and we publish them as written."
      />

      {summary && (
        <section className="wrap pb-4" aria-label="Overall rating">
          <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-divider py-6">
            <Stars value={summary.average} size={24} />
            <span className="font-heading text-[26px] leading-none">
              {summary.average}
            </span>
            <span className="text-[14.5px] opacity-65">
              out of 5, from {summary.count} client review
              {summary.count === 1 ? "" : "s"}
            </span>
          </Reveal>
        </section>
      )}

      <section className="wrap py-10 md:py-14" aria-label="All reviews">
        {reviews.length > 0 ? (
          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <Reveal as="li" key={review.id} delay={i % 3}>
                <ReviewCard review={review} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal as="p" className="m-0 max-w-[46ch] text-[15.5px] leading-[1.6] opacity-70">
            No reviews here yet. If we've worked for you, yours would be the
            first — the form below takes a minute.
          </Reveal>
        )}
      </section>

      <section
        className="wrap py-10 md:py-14"
        aria-label="Leave a review"
        id="leave-a-review"
      >
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <Reveal>
            <ReviewForm />
          </Reveal>

          <Reveal delay={1}>
            <SectionHead
              kicker="Leave a Review"
              title="Worked With Us?"
              lead="Tell other developers, lenders and homeowners how it went. It takes a minute, and it helps the next person deciding who to trust with their site."
            />
            <div className="relative flex flex-col gap-4 p-6">
              <p className="m-0 text-[14.5px] leading-[1.65] opacity-80">
                Your name, role and company appear with your review. Your email
                address does not — we only use it to check that a review came
                from a real client.
              </p>
              <p className="m-0 text-[14.5px] leading-[1.65] opacity-80">
                Reviews are read before they go on the site. We publish them as
                written, including the critical ones.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Need structural testing?"
        lead="Book an inspection and get a certified engineer on site — with a report you can act on."
        cta="Book Your Inspection"
      />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
