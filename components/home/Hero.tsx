import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { site } from "@/lib/site";

const HEADLINE = ["Structural", "certainty,", "before", "you", "commit."];

/* The three frames of the banner, in the order they play. Stacked in this same
   order in the DOM, which is what puts each one above the last — the crossfade
   depends on that, so do not reorder these without reading .hero-slide in
   globals.css. */
const FRAMES = [
  {
    src: images.hero,
    /* Corrected: this photograph is the skyline, not people. The previous alt
       described engineers walking a concrete deck, which is not in the frame —
       a screen reader was being told about a different picture entirely. */
    alt: "Tower cranes standing over a glass-clad high-rise under construction",
    className: "hero-slide",
  },
  {
    src: images["hero-2"],
    alt: "A site engineer sighting through a levelling instrument mounted on a tripod",
    className: "hero-slide-2",
  },
  {
    src: images["hero-3"],
    alt: "Two high-rise blocks under construction, a tower crane rising beside the left one",
    className: "hero-slide-3",
  },
];

/**
 * Full-bleed banner hero: the photograph spans the viewport and the copy sits
 * on it, rather than the two sharing a split.
 *
 * Three photographs cycle on a 21s loop with a slow push in on each. The whole
 * thing is CSS on one shared clock — no state, no effect, no client boundary —
 * so this stays a server component and the first frame is still painted as the
 * LCP element rather than being faded in by script after hydration.
 */
export default function Hero() {
  return (
    <section
      className="banner items-end"
      style={
        {
          /* Taller than the inner pages: this is the one banner that carries
             the full headline, lead and both calls to action. */
          "--banner-min": "64svh",
          "--banner-h": "88vh",
          "--banner-max": "880px",
          "--banner-min-lg": "560px",
          "--banner-air": "clamp(24px, 6vh, 56px)",
          "--banner-foot": "clamp(32px, 6vh, 72px)",
        } as React.CSSProperties
      }
    >
      {FRAMES.map((f, i) => (
        <Image
          key={f.src}
          src={f.src}
          alt={f.alt}
          fill
          /* Only the first frame competes for the LCP. The other two are wanted
             within seconds but must not be fetched ahead of it, so they load
             eagerly at low priority rather than lazily — a lazy image that is
             already in the viewport starts downloading at the same moment
             anyway, but without the priority hint to deprioritise it. */
          priority={i === 0}
          loading={i === 0 ? undefined : "eager"}
          fetchPriority={i === 0 ? undefined : "low"}
          sizes="100vw"
          className={`${f.className} -z-20 object-cover`}
        />
      ))}

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

      <div className="banner-body wrap text-on-dark">
        <Reveal as="span" className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Structural Testing &amp; Engineering
        </Reveal>

        <h1 className="m-0 max-w-[16ch] text-[clamp(36px,10vw,76px)] uppercase leading-[1.02] tracking-[0.005em] text-on-dark lg:max-w-[18ch]">
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
          className="mb-9 mt-5 max-w-[48ch] text-[16px] leading-[1.6] text-on-dark/85 md:text-[18px]"
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
        className="scroll-cue absolute bottom-5 left-1/2 hidden h-10 w-px -translate-x-1/2 bg-on-dark/40 lg:block"
      />
    </section>
  );
}
