import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { site } from "@/lib/site";

/* Split per word because each word animates in on its own delay. This is the
   supplied headline verbatim; "&" is its own token so it never ends a line
   alone, and the clamp below was widened to 20ch to hold nine words without
   the last one dropping to a line of its own. */
const HEADLINE = [
  "Structural",
  "Testing",
  "&",
  "Engineering",
  "Solutions",
  "You",
  "Can",
  "Trust",
];

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

        {/* Sized down from clamp(36px,10vw,76px)/16ch: the headline went from
            five words to eight, and at the old scale it set four full-width
            lines and pushed the lead and both buttons off a laptop viewport. */}
        <h1 className="m-0 max-w-[18ch] text-[clamp(32px,7.6vw,62px)] uppercase leading-[1.03] tracking-[0.005em] text-on-dark lg:max-w-[21ch]">
          {HEADLINE.map((word, i) => (
            <span key={word + i}>
              <Reveal as="span" delay={i} className="inline-block">
                {word}
              </Reveal>{" "}
            </span>
          ))}
        </h1>

        {/* The supplied subhead runs to three sentences. The first one — the
            LASBCA accreditation — is a credential rather than a description, so
            it is set below as its own line where it reads as a fact being
            stated; the two sentences that describe the work stay here. */}
        <Reveal
          as="p"
          delay={5}
          className="mb-6 mt-5 max-w-[52ch] text-[15.5px] leading-[1.6] text-on-dark/85 md:text-[17px]"
        >
          We specialise in comprehensive testing for soil, concrete, and structural
          safety and integrity. Our engineering reports provide the trusted data you
          need to confidently build, lend or buy.
        </Reveal>

        <Reveal
          as="p"
          delay={6}
          className="mb-8 flex max-w-[52ch] items-start gap-2.5 text-[13.5px] leading-[1.55] text-on-dark/75"
        >
          <BadgeCheck size={18} strokeWidth={1.5} aria-hidden className="mt-px flex-none text-accent-300" />
          <span>
            An indigenous civil engineering firm approved under the Lagos State Building
            Control Agency&rsquo;s Certified Accreditors Programme (CAP).
          </span>
        </Reveal>

        <Reveal delay={7} className="flex flex-col gap-3 sm:flex-row">
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
