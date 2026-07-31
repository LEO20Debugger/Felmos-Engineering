import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { imageAt } from "@/lib/images";
import { audiences, servicesFor } from "@/lib/content";

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
 * The service tags are derived, not authored: `servicesFor` reads the
 * `clients` each service already declares, so a row can never claim a
 * discipline the service itself doesn't list.
 */
export default function Audience() {
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
        <div className="lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-x-16">
          <div>
            <SectionHead
              kicker="Who We Serve"
              title="Find Yourself On This List"
              lead="Six kinds of client, each needing a different answer from the same eight services."
            />
            <Reveal delay={3} className="mb-8 hidden lg:block">
              <Link href="/contact" className="btn btn-secondary text-ink no-underline">
                {cta}
              </Link>
            </Reveal>
          </div>

          <ul className="m-0 list-none p-0">
            {audiences.map((a, i) => {
              const Icon = a.icon;
              const mine = servicesFor(a);
              return (
                <Reveal as="li" key={a.slug} delay={i % 3} className="idx-row aud-row">
                  {/* One link per row — the whole row is the target. The tags
                      stay plain text: an <a> inside an <a> is invalid and
                      behaves unpredictably in assistive tech. */}
                  <Link href={`/services#${a.primary}`}>
                    <Image
                      src={imageAt(a.image, 240, 160)}
                      alt=""
                      aria-hidden
                      width={120}
                      height={80}
                      sizes="96px"
                      className="aud-thumb"
                    />

                    <span className="min-w-0">
                      <span className="flex items-center gap-2.5">
                        <Icon
                          size={19}
                          strokeWidth={1.5}
                          aria-hidden
                          className="flex-none text-link"
                        />
                        <span className="font-heading text-[18px] uppercase leading-tight md:text-[21px]">
                          {a.label}
                        </span>
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
