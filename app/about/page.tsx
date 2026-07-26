import type { Metadata } from "next";
import { CalendarClock, Compass, MapPin } from "lucide-react";
import AboutHero from "@/components/about/AboutHero";
import Timeline from "@/components/about/Timeline";
import TeamGrid from "@/components/about/TeamGrid";
import Standards from "@/components/about/Standards";
import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import { missionVision, values } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Felmos Engineering is a structural testing practice serving developers, homeowners, contractors and lenders with independently verified data.",
  alternates: { canonical: "/about" },
};

/* Grounds alternate so no two adjacent sections read the same way, and the
   band sections take the larger padding — the difference in rhythm is part of
   what makes a band read as a band rather than as a stray colour. */
const officeFacts = [
  { icon: MapPin, label: "Office", value: site.address.full, href: site.mapLink },
  { icon: CalendarClock, label: "Hours", value: site.hours },
  {
    icon: Compass,
    label: "Coverage",
    // Hedged wording lifted verbatim from the contact FAQ — don't firm this up
    // without knowing the actual service radius.
    value: "Projects across the metro region and surrounding areas.",
  },
];

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      {/* Story, with mission and vision folded in underneath as statements
          rather than as a third card grid. */}
      <section className="wrap grid grid-cols-1 items-center gap-9 py-10 md:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <figure className="relative order-1 m-0 lg:order-2">
          <Photo
            src="about-story"
            alt="Felmos engineer conducting structural site verification and inspection"
            ratio="4/3"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </figure>

        <div className="order-2 lg:order-1">
          <Reveal as="span" className="kicker mb-2.5 block">
            Our Story
          </Reveal>
          <Reveal as="h2" delay={1} className="m-0 text-[clamp(24px,5.5vw,34px)] uppercase">
            Built on precision, grown on trust
          </Reveal>
          <Reveal as="p" delay={2} className="mt-4 max-w-[50ch] text-[15.5px] leading-[1.65] opacity-80">
            Felmos was founded to close a gap: reliable, independently verified structural
            data delivered on the timeline construction actually runs on. Today our engineers
            inspect foundations, test concrete and verify buildings across residential,
            commercial and institutional projects.
          </Reveal>

          <Reveal variant="line" delay={3} className="rule mt-8" />

          {/* Term/definition, not headings — these are statements of intent. */}
          <dl className="m-0 mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {missionVision.map(({ title, line }, i) => (
              <Reveal as="div" key={title} delay={i} className="m-0">
                <dt className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] tracking-[0.16em] text-accent-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-heading text-[17px] uppercase">{title}</span>
                </dt>
                <dd className="m-0 mt-2 max-w-[42ch] text-[14.5px] leading-[1.6] opacity-78">
                  {line}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <Timeline />

      {/* Values — surface tiles on the default ground, so the card has a shape
          before you hover it. Numeral instead of an icon: this page had three
          icon grids and now has none. */}
      <section className="wrap py-10 md:py-14" aria-label="Core values">
        <SectionHead kicker="Core Values" title="Engineering Excellence" />
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-3">
          {values.map(({ title, line }, i) => (
            <Reveal as="li" key={title} delay={i % 3}>
              <div className="mark-lift flex h-full flex-col rounded-[var(--radius-control)] bg-surface p-5 md:p-6">
                <span className="font-mono text-[12px] tracking-[0.16em] text-accent-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 mt-3 font-heading text-[16px] uppercase">{title}</h3>
                <span className="mt-1.5 text-[13.5px] leading-[1.5] opacity-75">{line}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <TeamGrid />

      <Standards />

      {/* Office & coverage — the site.ts facts this page never used. No map
          embed: /contact owns that, and duplicating it would add this page's
          only client component for something nobody came here for. */}
      <section className="bg-surface" aria-label="Office and coverage">
        <div className="wrap py-14 md:py-20">
          <SectionHead kicker="Where We Are" title="Lagos, And The Region Around It" />
          <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-7 p-0 sm:grid-cols-3">
            {officeFacts.map(({ icon: Icon, label, value, href }) => (
              <Reveal as="div" key={label} className="flex gap-3.5">
                <Icon size={22} strokeWidth={1.5} aria-hidden className="mt-0.5 flex-none text-accent-700" />
                <div className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.1em] opacity-55">{label}</dt>
                  <dd className="m-0 mt-1 text-[14.5px] leading-[1.55]">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink no-underline hover:text-accent-700"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand
        title="Engineers who stand behind their findings"
        lead="Talk to our team about your project and move forward with confidence."
        cta="Request Consultation"
      />
    </>
  );
}
