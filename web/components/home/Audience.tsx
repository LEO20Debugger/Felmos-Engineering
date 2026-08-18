import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { imageAt } from "@/lib/images";
import { audiences, servicesFor } from "@/lib/content";
import { getServices } from "@/lib/cms";

/**
 * "Is this for me?" — so every audience stays visible at once. A tabbed or
 * expanding treatment would turn self-identification into a click, and would
 * also make this the page's third click-to-reveal section (ServiceShowcase
 * sits one above, ProcessTimeline two below).
 *
 * The rows borrow `.idx-row` from the projects index, which is otherwise
 * unused on this page — a different layout language from the icon grids
 * around it, for no new CSS beyond the track sizing in `.aud-row`.
 *
 * From lg the photographs leave the rows and stack in the left column, which
 * the heading and CTA left empty for the whole height of the list; the row
 * under the cursor raises its own. That is a hover PREVIEW, not a disclosure —
 * all six labels and their `need` lines stay on the page at all times, so the
 * no-click-to-reveal argument above still holds. It also buys the photography
 * ~430px instead of the 96px thumbnail it had, which is the difference between
 * decoration and a picture that can carry a client's situation.
 *
 * The reveal is CSS `:has()` on `.aud-grid`, not React state, so this stays a
 * server component — the same trade ServiceShowcase makes for its expanding
 * panels. Below lg there is no hover, so each row keeps a small inline
 * thumbnail instead (which is also new: the old one was `display: none` on
 * phones, so mobile saw no photography here at all).
 *
 * The service tags are derived, not authored: `servicesFor` reads the
 * `clients` each service already declares, so a row can never claim a
 * discipline the service itself doesn't list.
 */
export default async function Audience() {
  /* Counted rather than written down: the lead used to say "eight services",
     which went stale the moment one was added from the dashboard. Same cached
     request ServiceShowcase makes one section above. */
  const serviceCount = (await getServices()).length;

  const cta = (
    <>
      Not listed? Tell us the project
      <ArrowRight size={17} strokeWidth={1.5} />
    </>
  );

  return (
    /* Full-bleed the way CtaBand does it: the ground goes on the section,
       which is already viewport-wide, and .wrap stays inside. No negative
       margins — `100vw` would include the scrollbar gutter, and `overflow-x:
       hidden` on body would then hide the overflow rather than the mistake. */
    <section className="bg-surface" aria-label="Who we serve">
      <div className="wrap py-14 md:py-20">
        {/* .aud-grid is the `:has()` anchor: the photographs sit in the left
            column and the rows in the right, so no sibling combinator can
            reach from one to the other. */}
        <div className="aud-grid lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-x-16">
          <div>
            <SectionHead
              kicker="Who We Serve"
              title="Find Yourself On This List"
              lead={`You are our ideal client if you fall into any of these groups — each needing a different answer from the same ${serviceCount} services.`}
            />
            <Reveal delay={3} className="mb-8 hidden lg:block">
              <Link href="/contact" className="btn btn-secondary text-ink no-underline">
                {cta}
              </Link>
            </Reveal>

            {/* The preview stack, in `audiences` order — .aud-photo:nth-child(n)
                is matched against .aud-row:nth-child(n), so this must not be
                reordered or filtered independently of the list below.
                Decorative: every one of these is captioned by the row label
                sitting beside it. */}
            <Reveal delay={4} className="aud-photos hidden lg:block">
              <span className="aud-frame">
                {audiences.map((a, i) => (
                  <Image
                    key={a.slug}
                    src={imageAt(a.image, 860, 1080)}
                    alt=""
                    aria-hidden
                    width={860}
                    height={1080}
                    sizes="430px"
                    /* Six 430px portraits in one section, all below the fold.
                       Only the resting frame is worth fetching eagerly. */
                    loading={i === 0 ? undefined : "lazy"}
                    className="aud-photo"
                  />
                ))}
              </span>
            </Reveal>
          </div>

          <ul className="m-0 list-none p-0">
            {audiences.map((a, i) => {
              const mine = servicesFor(a);
              return (
                <Reveal as="li" key={a.slug} delay={i % 3} className="idx-row aud-row">
                  {/* One link per row — the whole row is the target. The tags
                      stay plain text: an <a> inside an <a> is invalid and
                      behaves unpredictably in assistive tech. */}
                  <Link href={`/services#${a.primary}`}>
                    {/* Sub-lg stand-in for the preview column, which needs a
                        cursor. Same key, re-cropped by imageAt(). */}
                    <Image
                      src={imageAt(a.image, 216, 288)}
                      alt=""
                      aria-hidden
                      width={216}
                      height={288}
                      sizes="72px"
                      className="aud-thumb"
                    />

                    <span className="min-w-0">
                      <span className="font-heading block text-[20px] uppercase leading-tight md:text-[24px]">
                        {a.label}
                      </span>
                      <span className="mt-1.5 block max-w-[44ch] text-[13.5px] leading-[1.5] opacity-70">
                        {a.need}
                      </span>
                    </span>

                    {/* Between one and four tags depending on the audience, so
                        this wraps rather than assuming a fixed count. */}
                    <span className="hidden max-w-[34ch] flex-wrap justify-end gap-1.5 md:flex">
                      {mine.map((s) => (
                        <span key={s.slug} className="tag tag-outline">
                          {s.label}
                        </span>
                      ))}
                    </span>

                    <ArrowRight
                      size={17}
                      strokeWidth={1.5}
                      aria-hidden
                      className="hidden flex-none self-center text-link md:block"
                    />
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>

        <Reveal delay={3} className="mt-8 lg:hidden">
          <Link href="/contact" className="btn btn-secondary btn-block text-ink no-underline">
            {cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
