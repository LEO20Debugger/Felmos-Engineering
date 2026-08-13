import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";

/* Three headlines — one per slide — that crossfade in sync with the
   background photographs on the same 21s clock. Each headline maps to
   the slide that shares its index, and the photographs in `heroFrames`
   (lib/content.ts) were chosen to illustrate the headline they land under:
   a drilling rig under the foundation question, a UPV test on a cracked
   column under structural testing, the compression machine under equipment.
   Reordering either array alone breaks all three pairings. */
const HEADLINES = [
  // Slide 1
  ["What's", "Really", "Holding", "Up", "Your", "Building?"],
  // Slide 2
  ["Need", "Structural", "Testing?"],
  // Slide 3
  ["Need", "Testing", "Equipment?"],
];

/* The subhead that belongs to each headline, by the same index. Written to one
   shape on purpose — name the thing in threes, say what we do about it, end on
   what the client walks away with — so the block reads as one voice changing
   subject rather than three different adverts.

   Nothing here claims a capability the rest of the site does not already carry:
   the instruments named in slide 3 are the ones in `instruments`
   (lib/content.ts), and the non-destructive language in slide 2 is the
   `integrity-testing` service. Keep it that way — a banner is the last place to
   introduce a promise nobody has signed off. */
const SUBHEADS = [
  "The soil beneath it, the concrete inside it, and the structural integrity holding it together. We test all three, and give you the engineering report to prove it — so you can build, lend or buy with confidence.",
  "Cracks you cannot account for, a floor that moves, a building someone has asked you to sign for. We test the concrete where it stands — ultrasonically, without cutting into it — and put what we find in writing.",
  "A Schmidt hammer for the quick read, ultrasonics for what is happening inside, cube crushing for the figure that settles it. The instruments are ours and so is the engineer reading them.",
];

/* The banner's three layers, in the order they play. Stacked in this same order
   in the DOM, which is what puts each one above the last — the crossfade depends
   on that, so do not reorder these without reading .hero-slide in globals.css. */
const SLIDES = ["hero-slide", "hero-slide-2", "hero-slide-3"] as const;

/** A frame, already resolved to a URL by the page. */
export type HeroBannerFrame = { src: string; alt: string; position: string };

/**
 * Full-bleed banner hero: the photograph spans the viewport and the copy sits
 * on it, rather than the two sharing a split.
 *
 * Three photographs cycle on a 21s loop with a slow push in on each. The whole
 * thing is CSS on one shared clock — no state, no effect, no client boundary —
 * so this stays a server component and the first frame is still painted as the
 * LCP element rather than being faded in by script after hydration.
 */
export default function Hero({ frames }: { frames: HeroBannerFrame[] }) {
  /* justify-start overrides .banner's bottom anchoring, for this banner only.
     Bottom-anchored copy in a viewport-proportional banner means every pixel
     the banner is taller than the copy becomes empty band under the navbar —
     115px at 1280x800, and worse the taller the display, because the copy is a
     fixed height and the banner is not. Anchoring to the top makes that gap
     --banner-air at every size and lets the surplus fall below the copy, where
     it is photograph rather than nothing. The inner pages keep the bottom
     anchoring: their copy is short and the effect there is deliberate. */
  return (
    <section
      className="banner justify-start"
      style={
        {
          /* Taller than the inner pages: this is the one banner that carries
             the full headline, lead and both calls to action.

             Trimmed from 88vh/880px. The copy is bottom-anchored, so every
             pixel of banner beyond what the copy needs becomes empty band
             between the navbar and the kicker — at 88vh on a 1280x800 display
             that was 115px of nothing. These values leave the photograph
             dominant while letting the headline start near the top of it. */
          "--banner-min": "64svh",
          "--banner-h": "80vh",
          "--banner-max": "760px",
          "--banner-min-lg": "560px",
          "--banner-air": "clamp(20px, 4vh, 40px)",
          "--banner-foot": "clamp(32px, 6vh, 72px)",
        } as React.CSSProperties
      }
    >
      {frames.map((f, i) => (
        <Image
          key={f.src}
          src={f.src}
          alt={f.alt}
          fill
          style={{ objectPosition: f.position }}
          /* Only the first frame competes for the LCP. The other two are wanted
             within seconds but must not be fetched ahead of it, so they load
             eagerly at low priority rather than lazily — a lazy image that is
             already in the viewport starts downloading at the same moment
             anyway, but without the priority hint to deprioritise it. */
          priority={i === 0}
          loading={i === 0 ? undefined : "eager"}
          fetchPriority={i === 0 ? undefined : "low"}
          sizes="100vw"
          className={`${SLIDES[i]} -z-20 object-cover`}
        />
      ))}

      {/* Two scrims: one across for legibility on wide screens, one up from the
          base so the copy always has a dark footing on tall phone screens.

          Neutral black rather than the accent-900 navy the other banners use.
          These frames are photographs of real buildings — Tafawa Balewa Square's
          grey concrete, the stadium's red track — and a navy scrim tints all of
          it the same blue, which is the one thing a scrim over documentary
          photography should not do. Black darkens without recolouring. The
          opacities are a step up from the navy's to hold the same contrast:
          black at 90% is no darker than #142838 at 90%, but it stops carrying
          the colour that was doing part of the work. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/20"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/90 to-transparent"
      />

      <div className="banner-body wrap text-on-dark">
        <Reveal as="span" className="mb-4 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Structural Testing &amp; Engineering
        </Reveal>

        {/* Three headline layers stacked, exactly one visible at a time. Unlike
            the photographs, no layer here is a permanent floor: text is
            see-through, so a headline left painted underneath the others shows
            through them as a smear. Every layer fades — see .hero-headline-*
            in globals.css, which carries the timing. */}
        <div className="relative">
          {HEADLINES.map((words, slideIdx) => (
            <h1
              key={slideIdx}
              aria-hidden={slideIdx !== 0}
              className={[
                `hero-copy-${slideIdx + 1}`,
                "m-0 max-w-[18ch] text-[clamp(32px,7.6vw,62px)] uppercase leading-[1.03] tracking-[0.005em] text-on-dark lg:max-w-[21ch]",
                /* Layer 1 stays in flow so it sets the block's height; the
                   other two are lifted out of it and pinned over the top. */
                slideIdx === 0 ? "" : "absolute inset-0",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {words.map((word, i) => (
                <span key={word + i}>
                  <Reveal as="span" delay={slideIdx === 0 ? i : 0} className="inline-block">
                    {word}
                  </Reveal>{" "}
                </span>
              ))}
            </h1>
          ))}
        </div>

        {/* The subheads change with the headline above them, on the same clock.

            Stacked with grid rather than the absolute positioning the headlines
            use, because these are the element the rest of the banner sits on:
            a grid cell is as tall as its tallest occupant, so the accreditation
            line and the buttons below hold still while the copy swaps, whatever
            length a future edit makes any one of the three. The headlines can
            afford `absolute` — slide 1 is the longest by two lines and nothing
            below it moves.

            The LASBCA accreditation is deliberately NOT part of this rotation.
            It is a credential rather than a description of the work, it is true
            on all three slides, and a line that says the same thing three times
            while everything around it changes just reads as broken. */}
        <div className="relative mb-6 mt-5 grid">
          {SUBHEADS.map((text, slideIdx) => (
            <p
              key={slideIdx}
              aria-hidden={slideIdx !== 0}
              className={`hero-copy-${slideIdx + 1} col-start-1 row-start-1 m-0 max-w-[52ch] text-[15.5px] leading-[1.6] text-on-dark/85 md:text-[17px]`}
            >
              <Reveal as="span" delay={5} className="block">
                {text}
              </Reveal>
            </p>
          ))}
        </div>

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
