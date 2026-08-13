import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * The About banner. Same full-bleed language as the projects and contact
 * banners — About was the last content page still opening on plain text.
 *
 * The strip carries all four figures, which is why this page no longer renders
 * <Stats/>: the numbers say more above the fold than they did as the fourth
 * full-width grid in a row, and keeping the count-up exclusive to the homepage
 * leaves About with no client components at all.
 */
export default function AboutHero({
  photo,
}: {
  /** Resolved by the page — the company's own site photography, or the stock
      fallback if it could not be matched. */
  photo: { src: string; alt: string; position: string };
}) {
  return (
    /* The stat strip wraps to 2x2 on a phone, which used to overflow a fixed
       52svh and be clipped. .banner treats the height as a floor, so the banner
       grows to hold it instead. */
    <section className="banner justify-start" style={{ "--banner-min": "48svh" } as React.CSSProperties}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        style={{ objectPosition: photo.position }}
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-accent-900/95 via-accent-900/60 to-accent-900/20"
      />

      <div className="banner-body wrap text-on-dark">
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
      </div>
    </section>
  );
}
