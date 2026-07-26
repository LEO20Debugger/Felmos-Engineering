import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { stats } from "@/lib/content";

/**
 * The About banner. Same full-bleed language as the projects and contact
 * banners — About was the last content page still opening on plain text.
 *
 * The strip carries all four figures, which is why this page no longer renders
 * <Stats/>: the numbers say more above the fold than they did as the fourth
 * full-width grid in a row, and keeping the count-up exclusive to the homepage
 * leaves About with no client components at all.
 */
export default function AboutHero() {
  return (
    <section className="relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden h-[52svh] lg:h-[50vh] lg:max-h-[480px]">
      <Image
        src={images["about-hero"]}
        alt="Felmos structural engineering construction project site under open sky"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-accent-900/95 via-accent-900/60 to-accent-900/20"
      />

      <div className="wrap relative w-full pb-10 pt-24 text-on-dark md:pb-14">
        <Reveal
          as="span"
          className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300"
        >
          About Felmos
        </Reveal>
        <Reveal
          as="h1"
          delay={1}
          className="m-0 max-w-[20ch] text-[clamp(30px,8vw,52px)] uppercase leading-[1.03] text-on-dark"
        >
          Engineering Confidence Into Every Structure
        </Reveal>
        <Reveal
          as="p"
          delay={2}
          className="mb-0 mt-4 max-w-[54ch] text-[15.5px] leading-[1.6] text-on-dark/85 md:text-[16.5px]"
        >
          Independent structural data for the people who have to make the decision —
          developers, homeowners, contractors and lenders.
        </Reveal>

        {/* Four cells wrap to 2x2 on a phone, which is the right shape there —
            don't force them into a single row. */}
        <Reveal
          as="dl"
          delay={3}
          className="m-0 mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-on-dark/20 pt-5"
        >
          {stats.map((s) => (
            <div key={s.key}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="m-0 font-heading text-[clamp(22px,4vw,30px)] font-semibold leading-none text-on-dark tabular-nums">
                {s.value}
                {s.suffix}
              </dd>
              <span className="mt-1.5 block text-[11.5px] uppercase tracking-[0.08em] text-on-dark/65">
                {s.label}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
