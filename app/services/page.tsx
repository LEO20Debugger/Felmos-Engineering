import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PageHead from "@/components/ui/PageHead";
import ServicesNav from "@/components/services/ServicesNav";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Soil investigation, non-destructive testing, structural integrity assessment, building verification and foundation assessment — by certified engineers.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  /* Map to primitives here, on the server. Passing a Service across the
     boundary would send `icon` — a function — and throw. */
  const navItems = services.map((s) => ({
    slug: s.slug,
    num: s.num,
    label: s.title.split(" ").slice(0, 2).join(" "),
  }));

  return (
    <>
      {/* This page keeps the plain PageHead on purpose. A photo banner, plus a
          sticky bar, plus five photo blocks is photo overload — and the sticky
          bar is this page's above-the-fold signal instead. */}
      <PageHead
        kicker="Our Services"
        title="Structural Testing & Engineering Services"
        lead="From soil investigation to final building verification — delivered by certified engineers on calibrated equipment."
      />

      <ServicesNav items={navItems} />

      {services.map((s, idx) => {
        const Icon = s.icon;
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
                  <Icon size={28} strokeWidth={1.5} aria-hidden className="text-accent-700" />
                  <span className="font-mono text-[12px] tracking-[0.16em] text-accent-700">
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
                  className="m-0 mt-3 max-w-[26ch] font-heading text-[clamp(18px,3vw,23px)] uppercase leading-[1.15] text-accent-700"
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
                      <Check size={18} strokeWidth={1.5} aria-hidden className="mt-0.5 flex-none text-accent-700" />
                      {b}
                    </li>
                  ))}
                </Reveal>

                <Reveal delay={4} className="mb-6 flex flex-wrap gap-2">
                  {s.clients.map((c) => (
                    <span key={c} className="tag tag-accent">
                      {c}
                    </span>
                  ))}
                </Reveal>

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
