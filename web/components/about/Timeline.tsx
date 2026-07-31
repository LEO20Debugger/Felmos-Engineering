import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { milestones } from "@/lib/content";

/**
 * Company history as an ordered list — it is a sequence, and a screen reader
 * should say so.
 *
 * Deliberately no drawn rail on a scroll timeline: `fx-draw` on `view()` is
 * `.pin-rail::after` almost verbatim, and this page already has enough
 * repetition to answer for. The static hairline plus the Reveal stagger tells
 * the story without spending the device a third time.
 */
export default function Timeline() {
  return (
    <section className="bg-surface" aria-label="Company history">
      <div className="wrap py-14 md:py-20">
        <SectionHead
          kicker="Our History"
          title="How The Practice Grew"
          lead="From a single discipline to five, on the same principle throughout."
        />

        <ol className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-9 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map((m, i) => (
            <Reveal as="li" key={m.year} delay={i % 4} className="relative">
              {/* The rule sits above each entry rather than between them, so
                  the row reads as a track at lg and stacks cleanly below. */}
              <span aria-hidden className="block h-px w-full bg-divider" />
              <span className="mt-4 block font-heading text-[clamp(26px,4vw,34px)] font-semibold leading-none text-link tabular-nums">
                {m.year}
              </span>
              <h3 className="m-0 mt-2.5 font-heading text-[16.5px] uppercase">{m.title}</h3>
              <p className="m-0 mt-1.5 max-w-[34ch] text-[14px] leading-[1.55] opacity-75">
                {m.line}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
