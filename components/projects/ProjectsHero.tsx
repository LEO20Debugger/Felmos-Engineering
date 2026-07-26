import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { images } from "@/lib/images";
import { projects, stats } from "@/lib/content";

/**
 * The projects banner. Same full-bleed language as the homepage Hero and the
 * contact banner, with a reversed stat strip along the base — on the page that
 * exists to establish track record, the numbers belong above the fold.
 */
export default function ProjectsHero() {
  /* Read from the same source as the rest of the site rather than retyping the
     figures, so the banner can never drift from the Stats row. */
  const years = stats.find((s) => s.label === "Years in practice");
  const tested = stats.find((s) => s.label === "Projects tested");

  const strip = [
    tested && { value: `${tested.value}${tested.suffix}`, label: "Projects tested" },
    years && { value: `${years.value}${years.suffix}`, label: "Years in practice" },
    { value: String(projects.length).padStart(2, "0"), label: "Case studies below" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section className="relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden h-[52svh] lg:h-[50vh] lg:max-h-[480px]">
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

      {/* justify-end pins this block to the base, so the bottom padding is what
          keeps the stat strip off the banner's edge. */}
      <div className="wrap relative w-full pb-10 pt-24 text-bg md:pb-14">
        <Reveal
          as="span"
          className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-300"
        >
          Past Projects
        </Reveal>
        <Reveal
          as="h1"
          delay={1}
          className="m-0 max-w-[20ch] text-[clamp(30px,8vw,52px)] uppercase leading-[1.03] text-bg"
        >
          Structures We&rsquo;ve Verified
        </Reveal>
        <Reveal
          as="p"
          delay={2}
          className="mb-0 mt-4 max-w-[54ch] text-[15.5px] leading-[1.6] text-bg/85 md:text-[16.5px]"
        >
          A record of the testing, assessment and verification work behind buildings across
          the region — one engineer accountable on each.
        </Reveal>

        <Reveal
          as="dl"
          delay={3}
          className="m-0 mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-bg/20 pt-5"
        >
          {/* column-reverse puts the figure above its label visually while
              keeping dt-before-dd in the DOM, so the pair is announced once
              and in the right order. */}
          {strip.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-1.5 text-[11.5px] uppercase tracking-[0.08em] text-bg/65">
                {s.label}
              </dt>
              <dd className="m-0 font-heading text-[clamp(22px,4vw,30px)] font-semibold leading-none text-bg tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
