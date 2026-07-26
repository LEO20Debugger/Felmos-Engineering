import type { Metadata } from "next";
import PageHead from "@/components/ui/PageHead";
import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Stats from "@/components/home/Stats";
import CtaBand from "@/components/ui/CtaBand";
import { missionVision, team, trustReasons, values } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Felmos Engineering is a structural testing practice serving developers, homeowners, contractors and lenders with independently verified data.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHead
        kicker="About Felmos"
        title="Engineering Confidence Into Every Structure"
        lead="Independent structural data for the people who have to make the decision — developers, homeowners, contractors and lenders."
      />

      {/* Story — one paragraph and a photograph, not two columns of prose. */}
      <section className="wrap grid grid-cols-1 items-center gap-9 py-10 md:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <figure className="relative order-1 lg:order-2">
          <Photo
            src="about-story"
            alt="An engineer reviewing structural drawings on site"
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
        </div>
      </section>

      <Stats />

      {/* Mission & vision */}
      <section className="wrap py-10 md:py-14" aria-label="Mission and vision">
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2">
          {missionVision.map(({ icon: Icon, title, line }, i) => (
            <Reveal as="li" key={title} delay={i}>
              <div className="mark-lift relative flex h-full flex-col gap-3 p-7">
                <Icon size={28} strokeWidth={1.5} className="text-accent-700" />
                <h2 className="m-0 font-heading text-[20px] uppercase">{title}</h2>
                <p className="m-0 text-[14.5px] leading-[1.6] opacity-78">{line}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Values */}
      <section className="wrap py-10 md:py-14" aria-label="Core values">
        <SectionHead kicker="Core Values" title="Engineering Excellence" />
        <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, line }, i) => (
            <Reveal as="li" key={title} delay={i % 3}>
              <div className="mark-lift relative flex h-full flex-col gap-2 p-5">
                <Icon size={22} strokeWidth={1.5} className="text-accent-700" />
                <strong className="font-heading text-[16px] font-semibold uppercase">{title}</strong>
                <span className="text-[13.5px] leading-[1.5] opacity-75">{line}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Team */}
      <section className="wrap py-10 md:py-14" aria-label="Our team">
        <SectionHead kicker="Our Team" title="Meet Our Experts" />
        <ul className="m-0 grid list-none grid-cols-2 gap-5 p-0 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal as="li" key={m.name} delay={i % 4}>
              <figure className="group">
                <div className="relative">
                  <Photo
                    src={m.image}
                    alt={`${m.name}, ${m.role}`}
                    ratio="1/1"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <figcaption className="pt-4">
                  <strong className="block font-heading text-[16px] uppercase">{m.name}</strong>
                  <span className="mt-1 block text-[12.5px] opacity-65">{m.role}</span>
                  <span className="tag tag-accent mt-2.5">{m.tag}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Why trust us */}
      <section className="wrap py-10 pb-16 md:py-14" aria-label="Why clients trust Felmos">
        <SectionHead kicker="Why Clients Trust Felmos" title="Independent By Design" />
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-7 p-0 sm:grid-cols-2">
          {trustReasons.map(({ icon: Icon, title, line }, i) => (
            <Reveal as="li" key={title} delay={i % 2} className="flex gap-3.5">
              <Icon size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-accent-700" />
              <div>
                <h3 className="m-0 font-heading text-[17px] uppercase">{title}</h3>
                <p className="m-0 mt-1 text-[14px] leading-[1.5] opacity-75">{line}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <CtaBand
        title="Engineers who stand behind their findings"
        lead="Talk to our team about your project and move forward with confidence."
        cta="Request Consultation"
      />
    </>
  );
}
