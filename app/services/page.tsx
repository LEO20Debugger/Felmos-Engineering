import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PageHead from "@/components/ui/PageHead";
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
  return (
    <>
      <PageHead
        kicker="Our Services"
        title="Structural Testing & Engineering Services"
        lead="From soil investigation to final building verification — delivered by certified engineers on calibrated equipment."
      />

      {/* Jump bar — five services is a lot to scroll on a phone. */}
      <nav className="wrap pb-6" aria-label="Services">
        <ul className="no-scrollbar -mx-[var(--gutter)] m-0 flex list-none gap-2 overflow-x-auto px-[var(--gutter)] py-1">
          {services.map((s) => (
            <li key={s.slug} className="flex-none">
              <a
                href={`#${s.slug}`}
                className="btn btn-secondary whitespace-nowrap text-[13.5px] text-ink no-underline"
              >
                <span className="font-mono text-[11px] text-accent-700">{s.num}</span>
                {s.title.split(" ").slice(0, 2).join(" ")}
              </a>
            </li>
          ))}
        </ul>
      </nav>

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
            <div
              className={`wrap grid grid-cols-1 items-center gap-9 py-12 md:py-16 lg:gap-16 ${
                flip
                  ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
                  : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
              }`}
            >
              <figure
                className={`relative order-1 ${flip ? "lg:order-1" : "lg:order-2"}`}
              >
                <Photo
                  src={s.image}
                  alt={s.title}
                  ratio="4/3"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </figure>

              <div className={`order-2 ${flip ? "lg:order-2" : "lg:order-1"}`}>
                <Reveal className="mb-3 flex items-center gap-3">
                  <Icon size={28} strokeWidth={1.5} className="text-accent-700" />
                  <span className="font-mono text-[12px] tracking-[0.16em] text-accent-700">
                    {s.num}
                  </span>
                </Reveal>

                <Reveal as="h2" delay={1} className="m-0 text-[clamp(23px,5.5vw,32px)] uppercase">
                  {s.title}
                </Reveal>

                <Reveal as="p" delay={2} className="mt-3.5 max-w-[50ch] text-[15.5px] leading-[1.65] opacity-80">
                  {s.lead}
                </Reveal>

                <Reveal as="ul" delay={3} className="m-0 mb-5 mt-5 flex list-none flex-col gap-2.5 p-0">
                  {s.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[14.5px] leading-[1.55] opacity-88">
                      <Check size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-accent-700" />
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
