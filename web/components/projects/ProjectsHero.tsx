import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { stats } from "@/lib/content";

/**
 * The projects banner. Same full-bleed language as the homepage Hero and the
 * contact banner, with a reversed stat strip along the base — on the page that
 * exists to establish track record, the numbers belong above the fold.
 */
export default function ProjectsHero({ count }: { count: number }) {
  /* Read from the same source as the rest of the site rather than retyping the
     figures, so the banner can never drift from the Stats row. Keyed on `key`,
     not `label` — the strip filters out misses, so a label rename used to drop
     a cell silently. */
  const years = stats.find((s) => s.key === "years");
  const tested = stats.find((s) => s.key === "projects");

  const strip = [
    tested && { value: `${tested.value}${tested.suffix}`, label: "Projects tested" },
    years && { value: `${years.value}${years.suffix}`, label: "Years in practice" },
    /* Passed in rather than read from lib/content: the projects come from the
       database now, and a hardcoded count would contradict the grid below it
       the first time one was published. */
    { value: String(count).padStart(2, "0"), label: "Projects on record" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section className="banner" style={{ "--banner-min": "48svh" } as React.CSSProperties}>
      <Image
        src={images["projects-hero"]}
        alt="A high-rise structure under construction, seen from below"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-accent-900/95 via-accent-900/60 to-accent-900/20"
      />

      {/* .banner pins this block to the base, so --banner-foot is what keeps
          the stat strip off the banner's edge. */}
      <div className="banner-body wrap text-on-dark">
        <Reveal
          as="span"
          className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300"
        >
          Past Projects
        </Reveal>
        <Reveal
          as="h1"
          delay={1}
          className="m-0 max-w-[20ch] text-[clamp(30px,8vw,52px)] uppercase leading-[1.03] text-on-dark"
        >
          Structures We&rsquo;ve Verified
        </Reveal>
        <Reveal
          as="p"
          delay={2}
          className="mb-0 mt-4 max-w-[54ch] text-[15.5px] leading-[1.6] text-on-dark/85 md:text-[16.5px]"
        >
          A record of the testing, assessment and verification work behind buildings across
          the region — one engineer accountable on each.
        </Reveal>

        <Reveal
          as="dl"
          delay={3}
          className="m-0 mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-on-dark/20 pt-5"
        >
          {/* column-reverse puts the figure above its label visually while
              keeping dt-before-dd in the DOM, so the pair is announced once
              and in the right order. */}
          {strip.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-1.5 text-[11.5px] uppercase tracking-[0.08em] text-on-dark/65">
                {s.label}
              </dt>
              <dd className="m-0 font-heading text-[clamp(22px,4vw,30px)] font-semibold leading-none text-on-dark tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
