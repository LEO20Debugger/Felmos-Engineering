import type { Metadata } from "next";
import PageHead from "@/components/ui/PageHead";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import PostCard from "@/components/blog/PostCard";
import { getPosts } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Field notes on soil investigation, non-destructive testing, structural assessment and verification — written by the engineers who sign the reports.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  /* Already newest-first — the API orders by the editorial date, which is what
     the index is sorted on. */
  const [lead, ...rest] = await getPosts();

  return (
    <>
      <PageHead
        kicker="Insights"
        title="Field Notes"
        lead="What we find on site, why it matters, and how to read a report you did not write."
      />

      <section className="wrap pb-14 md:pb-20" aria-label="Articles">
        {/* The empty state is not defensive padding. Articles are written in
            the dashboard now, so a company that has published none yet — or
            has moved every draft back — lands here, and the route stays valid
            rather than rendering a headed page with nothing under it. */}
        {!lead ? (
          <Reveal as="p" className="m-0 max-w-[52ch] text-[15.5px] leading-[1.6] opacity-70">
            There is nothing published yet. Field notes from our engineers will
            appear here as they are written.
          </Reveal>
        ) : (
          <>
            <Reveal>
              <PostCard post={lead} feature />
            </Reveal>

            {rest.length > 0 && (
              <>
                <Reveal variant="line" className="rule my-10 md:my-14" />
                <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, i) => (
                    <Reveal as="li" key={post.slug} delay={i % 3}>
                      <PostCard post={post} />
                    </Reveal>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <CtaBand
        title="Have a structure you need looked at?"
        lead="Reading about it only goes so far. Book an inspection and get a certified engineer on site."
        cta="Book Your Inspection"
      />
    </>
  );
}
