import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PageHead from "@/components/ui/PageHead";
import ServicesNav from "@/components/services/ServicesNav";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import { getServices } from "@/lib/cms";
import { Icon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Integrity testing, concrete strength testing, pile testing, sub-soil investigation, piling works, structural drawings, project management and building repairs.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();

  /* Map to primitives here, on the server.
     `label` rather than the first two words of the title: with eight entries
     the sticky bar has to hold twice as many chips, and "Non-Destructive" /
     "Concrete Compressive" overflowed it. `label` is already the short form. */
  const navItems = services.map((s) => ({
    slug: s.slug,
    num: s.num,
    label: s.label,
  }));

  return (
    <>
      {/* This page keeps the plain PageHead on purpose. A photo banner, plus a
          sticky bar, plus eight photo blocks is photo overload — and the sticky
          bar is this page's above-the-fold signal instead. */}
      <PageHead
        kicker="Our Services"
        title="Structural Testing & Engineering Services"
        lead="From sub-soil investigation through to piling, drawings and repairs — testing that tells you what's there, and the engineering to act on it."
      />

      <ServicesNav items={navItems} />

      {services.map((s, idx) => {
        const flip = idx % 2 === 1;
        return (
          <section
            key={s.slug}
            id={s.slug}
            className="border-t border-divider first:border-t-0"
            aria-label={s.title}
          >
            {/* Grid areas rather than order utilities: on a phone the heading
                belongs above the photograph, but at lg it belongs at the top
                of the text column. DOM order is head -> media -> body at every
                width, so reading order and visual order can't diverge. */}
            <div
              className={`svc-block wrap gap-x-9 gap-y-6 py-12 md:py-16 lg:gap-x-16 ${
                flip ? "is-flipped" : ""
              }`}
            >
              <div className="svc-head">
                <Reveal className="mb-3 flex items-center gap-3">
                  <Icon
                    name={s.icon}
                    size={28}
                    strokeWidth={1.5}
                    aria-hidden
                    className="text-link"
                  />
                  <span className="font-mono text-[12px] tracking-[0.16em] text-link">
                    {s.num}
                  </span>
                </Reveal>

                <Reveal as="h2" delay={1} className="m-0 text-[clamp(23px,5.5vw,32px)] uppercase">
                  {s.title}
                </Reveal>

                {/* `short` was written for the homepage panels and went unused
                    here — it adds the typographic tier this page lacked. */}
                <Reveal
                  as="p"
                  delay={2}
                  className="m-0 mt-3 max-w-[26ch] font-heading text-[clamp(18px,3vw,23px)] uppercase leading-[1.15] text-link"
                >
                  {s.short}
                </Reveal>
              </div>

              <figure className="svc-media relative m-0">
                <Photo
                  src={s.image}
                  alt={s.title}
                  ratio="4/3"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </figure>

              <div className="svc-body lg:pt-6">
                <Reveal as="p" delay={2} className="mt-0 max-w-[50ch] text-[15.5px] leading-[1.65] opacity-80">
                  {s.lead}
                </Reveal>

                {/* variant="fade" is required: on the default fx-rise the
                    parent translates too and the ticks travel twice as far. */}
                <Reveal
                  as="ul"
                  variant="fade"
                  delay={3}
                  className="m-0 mb-5 mt-5 flex list-none flex-col gap-2.5 p-0"
                >
                  {s.benefits.map((b, j) => (
                    <li
                      key={b}
                      style={{ "--j": j } as React.CSSProperties}
                      className="stagger flex items-start gap-2.5 text-[14.5px] leading-[1.55] opacity-88"
                    >
                      <Check size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 flex-none text-link" />
                      {b}
                    </li>
                  ))}
                </Reveal>

                {/* Guarded: service 08 ships with an empty client list (see
                    lib/content.ts), and an unguarded empty flex row still laid
                    out its mb-6 — a stray 24px gap above the button. */}
                {s.clients.length > 0 && (
                  <Reveal delay={4} className="mb-6 flex flex-wrap gap-2">
                    {s.clients.map((c) => (
                      <span key={c} className="tag tag-accent">
                        {c}
                      </span>
                    ))}
                  </Reveal>
                )}

                <Reveal delay={5}>
                  <Link href="/contact" className="btn btn-primary w-full no-underline sm:w-auto">
                    Book this service
                    <ArrowRight size={18} strokeWidth={1.5} />
                  </Link>
                </Reveal>
              </div>
            </div>
          </section>
        );
      })}

      <CtaBand
        title="Not sure which service you need?"
        lead="Tell us about the project and we'll recommend the right testing or assessment."
        cta="Request Consultation"
      />
    </>
  );
}
