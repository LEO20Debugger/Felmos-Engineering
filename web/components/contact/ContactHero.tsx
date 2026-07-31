import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";

/**
 * Contact's page banner — the same full-bleed-photo-with-scrim language as the
 * homepage Hero, at a fraction of the height. Every other inner page opens
 * with the plain PageHead; Contact gets the photo treatment because it's the
 * conversion page and can carry the extra visual weight.
 */
export default function ContactHero() {
  return (
    <section
      className="banner"
      style={
        {
          "--banner-min": "36svh",
          "--banner-h": "42vh",
          "--banner-max": "440px",
          "--banner-min-lg": "320px",
        } as React.CSSProperties
      }
    >
      <Image
        src={images["contact-hero"]}
        alt="An engineer and a client shaking hands on a construction site"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-full bg-gradient-to-t from-accent-900/95 via-accent-900/55 to-accent-900/10"
      />

      <div className="banner-body wrap text-on-dark">
        <Reveal as="span" className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Get Started
        </Reveal>
        <Reveal as="h1" delay={1} className="m-0 max-w-[24ch] text-[clamp(28px,7vw,44px)] uppercase leading-[1.05] text-on-dark">
          Book a Structural Inspection
        </Reveal>
        <Reveal
          as="p"
          delay={2}
          className="mb-0 mt-3.5 max-w-[52ch] text-[15px] leading-[1.6] text-on-dark/85 md:text-[16px]"
        >
          Tell us about your project and preferred date — an engineer confirms scope and
          scheduling within one business day.
        </Reveal>
      </div>
    </section>
  );
}
