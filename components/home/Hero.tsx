import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { site } from "@/lib/site";

const HEADLINE = ["Structural", "certainty,", "before", "you", "commit."];

/**
 * Full-bleed banner hero: the photograph spans the viewport and the copy sits
 * on it, rather than the two sharing a split.
 *
 * The image is the LCP element, so it is `priority` and unanimated on entry —
 * only a slow settle, which starts from a scale rather than an opacity so the
 * pixels are painted immediately.
 */
export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden h-[86svh] lg:h-[88vh] lg:max-h-[880px]">
      <Image
        src={images.hero}
        alt="Engineers walking a reinforced concrete deck on a live construction site"
        fill
        priority
        sizes="100vw"
        className="hero-media -z-20 object-cover"
      />

      {/* Two scrims: one across for legibility on wide screens, one up from the
          base so the copy always has a dark footing on tall phone screens. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-900/90 via-accent-900/60 to-accent-900/20"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-accent-900/95 to-transparent"
      />

      <div className="wrap relative w-full pb-14 pt-28 text-bg md:pb-20 lg:pb-24">
        <Reveal as="span" className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Structural Testing &amp; Engineering
        </Reveal>

        <h1 className="m-0 max-w-[16ch] text-[clamp(36px,10vw,76px)] uppercase leading-[1.02] tracking-[0.005em] text-bg lg:max-w-[18ch]">
          {HEADLINE.map((word, i) => (
            <span key={word + i}>
              <Reveal as="span" delay={i} className="inline-block">
                {word}
              </Reveal>{" "}
            </span>
          ))}
        </h1>

        <Reveal
          as="p"
          delay={5}
          className="mb-9 mt-5 max-w-[48ch] text-[16px] leading-[1.6] text-bg/85 md:text-[18px]"
        >
          Certified engineers test the soil, the concrete and the structure — and give
          you a report you can build, lend or buy on.
        </Reveal>

        <Reveal delay={6} className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="btn btn-primary no-underline sm:px-8">
            Book Inspection
            <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
          <a href={site.phoneHref} className="btn btn-light no-underline sm:px-8">
            <Phone size={17} strokeWidth={1.5} />
            Talk to an engineer
          </a>
        </Reveal>
      </div>

      {/* Quiet cue that there is more below the fold. */}
      <span
        aria-hidden
        className="scroll-cue absolute bottom-5 left-1/2 hidden h-10 w-px -translate-x-1/2 bg-bg/40 lg:block"
      />
    </section>
  );
}
