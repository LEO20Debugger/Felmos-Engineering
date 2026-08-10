import Image from "next/image";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { imageAt } from "@/lib/images";
import { differentiators } from "@/lib/content";

/**
 * Evidence, not adjectives — and an asymmetric bento so it stops being the
 * second identical icon grid in a row.
 *
 * At lg the spans total 2+1+1+2+2+2 = 10 across a 4-column grid... which is
 * why the first cell also spans two rows: 4 + 1 + 1 + 2 + 2 + 2 = 12 = 4x3.
 * That means DOM order alone lays the grid out — no explicit line numbers and
 * no `order-*`, so the visual order and the reading order cannot drift apart.
 *
 * The figures are deliberately NOT count-ups. Only one is even an integer,
 * a single counting number among static ones reads as a bug, and counting is
 * the Stats row's one device three sections below.
 */
const CELL: Record<string, string> = {
  "certified-engineers": "sm:col-span-2 lg:col-span-2 lg:row-span-2",
  "fast-turnaround": "",
  "modern-equipment": "",
  "code-compliant": "sm:col-span-2 lg:col-span-2",
  "accurate-reports": "sm:col-span-2 lg:col-span-2",
  "real-support": "sm:col-span-2 lg:col-span-2",
};

const SHELL =
  "flex flex-col rounded-[var(--radius-control)] bg-surface p-5 md:p-6";

export default function WhyUs() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Why choose Felmos">
      <SectionHead
        kicker="Why Felmos"
        title="Proof, Not Promises"
        lead="Six things we can show you evidence for."
      />

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(180px,auto)]">
        {differentiators.map((d, i) => {
          const Icon = d.icon;
          const span = CELL[d.key] ?? "";
          const lead = i === 0;

          /* The lead cell: the page's focal point for this section. An
             accent-900 *card* is within the house rule that reserves the one
             full-bleed accent-900 field for CtaBand — ServiceShowcase's
             mobile "See all services" tile is the same device.

             With an image it keeps that accent-900 identity: the picture is a
             scanned certificate on white paper, so it sits under the same
             gradient the photo cells use, only carried further up the card —
             legible as a document at the top, solid accent-900 by the time it
             reaches the figure. The icon is dropped in that case; a small
             award mark over a certificate is the same claim twice, and
             accent-300 on white paper would not carry contrast anyway. */
          if (lead) {
            return (
              <Reveal
                as="li"
                key={d.key}
                delay={0}
                className={`relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-control)] bg-accent-900 p-6 text-on-dark md:p-8 ${span}`}
              >
                {d.image && (
                  <>
                    <Image
                      src={imageAt(d.image, 1200, 850)}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover object-top"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-accent-900 from-45% via-accent-900/85 to-accent-900/25"
                    />
                  </>
                )}

                {d.image ? (
                  <span aria-hidden />
                ) : (
                  <Icon size={28} strokeWidth={1.5} aria-hidden className="text-accent-300" />
                )}

                <div className="relative mt-8">
                  {d.figure && (
                    <span className="block font-heading text-[clamp(46px,8vw,76px)] font-semibold leading-none tabular-nums">
                      {d.figure}
                    </span>
                  )}
                  <h3 className="m-0 mt-3 font-heading text-[19px] uppercase text-on-dark">{d.title}</h3>
                  <p className="m-0 mt-2 max-w-[34ch] text-[14.5px] leading-[1.55] text-on-dark/75">
                    {d.proof}
                  </p>
                </div>
              </Reveal>
            );
          }

          /* The photograph. Deliberately not <Photo>: that sets aspect-ratio
             on the frame, which fights a grid row sized by its siblings and
             would blow the auto-row height. next/image + fill inside a
             relative cell is what ServiceShowcase does. */
          if (d.image) {
            return (
              <Reveal
                as="li"
                key={d.key}
                delay={i % 3}
                className={`relative min-h-[220px] overflow-hidden rounded-[var(--radius-control)] ${span}`}
              >
                <Image
                  src={imageAt(d.image, 1200, 700)}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                {/* Same gradient recipe as the service panels, so the reversed
                    type contrast is already validated on this site. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-accent-900 via-accent-900/55 to-accent-900/10"
                />
                <span className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <h3 className="m-0 font-heading text-[19px] uppercase text-on-dark">{d.title}</h3>
                  <p className="m-0 mt-1.5 max-w-[38ch] text-[14px] leading-[1.5] text-on-dark/85">
                    {d.proof}
                  </p>
                </span>
              </Reveal>
            );
          }

          /* Everything else: figure if it has one, icon if it doesn't. */
          return (
            <Reveal as="li" key={d.key} delay={i % 3} className={`${SHELL} ${span}`}>
              {d.figure ? (
                <span className="font-heading text-[clamp(30px,4.5vw,42px)] font-semibold leading-none text-link tabular-nums">
                  {d.figure}
                </span>
              ) : (
                <Icon size={24} strokeWidth={1.5} aria-hidden className="text-link" />
              )}

              <h3 className="m-0 mt-3 font-heading text-[16.5px] uppercase">{d.title}</h3>

              {d.figureLabel && (
                <span className="mt-1 text-[12.5px] uppercase tracking-[0.06em] opacity-60">
                  {d.figureLabel}
                </span>
              )}

              <p className="m-0 mt-2 max-w-[46ch] text-[14px] leading-[1.55] opacity-75">
                {d.proof}
              </p>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
