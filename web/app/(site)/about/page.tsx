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
import { getProjects } from "@/lib/cms";
import { aboutHeroPhoto, companyGoals, companyIntro, coreValues, missionVision, philosophy } from "@/lib/content";
import { images } from "@/lib/images";
import { focalPosition, mediaUrl } from "@/lib/media";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Felmos Engineering Limited is an indigenous Nigerian practice in quality control and assurance of construction materials, structural stability and integrity of existing structures, and other civil engineering services.",
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

export default async function AboutPage() {
  /* The banner photograph comes out of the project galleries, matched on its
     alt text. Resolved here so AboutHero stays free of the CMS, and falling
     back to the stock frame if the project is unpublished or its description
     was edited in the dashboard. */
  const gallery = (await getProjects()).flatMap((project) => [
    ...(project.image ? [project.image] : []),
    ...project.gallery,
  ]);

  const found = gallery.find((image) => image.alt === aboutHeroPhoto.alt);
  const photo = found
    ? {
        src: mediaUrl(found, 1600),
        alt: found.alt,
        position: focalPosition(found),
      }
    : {
        src: images[aboutHeroPhoto.fallback],
        alt: "Felmos structural engineering construction project site under open sky",
        position: "center",
      };

  return (
    <>
      <AboutHero photo={photo} />

      {/* Who we are, with mission and vision folded in underneath as statements
          rather than as a third card grid. The goals strip closes the same
          section rather than opening its own — it is the second half of one
          piece of company copy, and splitting it out would put two
          default-ground sections back to back before the Timeline band. */}
      <section className="wrap py-10 md:py-14">
        <div className="grid grid-cols-1 items-center gap-9 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
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
              Introduction
            </Reveal>
            <Reveal as="h2" delay={1} className="m-0 text-[clamp(24px,5.5vw,34px)] uppercase">
              Built on precision, grown on trust
            </Reveal>
            <Reveal as="p" delay={2} className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] opacity-80">
              {companyIntro}
            </Reveal>

            <Reveal variant="line" delay={3} className="rule mt-8" />

            {/* Term/definition, not headings — these are statements of intent.

                Stacked rather than the two-up they used to be: the mission is
                now Felmos's full formal statement and at half this column it
                set six lines against the vision's three. Full measure, and the
                mission takes the larger size — it is the statement the company
                is held to, and it carried a whole section of its own before
                this became its only home. */}
            <dl className="m-0 mt-8 flex flex-col gap-7">
              {missionVision.map(({ title, line }, i) => (
                <Reveal as="div" key={title} delay={i} className="m-0">
                  <dt className="flex items-baseline gap-3">
                    <span className="font-mono text-[12px] tracking-[0.16em] text-link">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-heading text-[17px] uppercase">{title}</span>
                  </dt>
                  <dd
                    className={`m-0 mt-2 max-w-[52ch] ${
                      i === 0
                        ? "font-heading text-[clamp(16.5px,2.4vw,19px)] leading-[1.45] opacity-95"
                        : "text-[14.5px] leading-[1.6] opacity-78"
                    }`}
                  >
                    {line}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>

        {/* How the goals are actually met — icon-led, because this is the one
            place on the page where the four items are means rather than claims,
            and the numerals are already doing work in two grids above and below. */}
        <div className="mt-14 md:mt-20">
          <Reveal variant="line" className="rule" />
          <h3 className="mt-8 font-heading text-[11px] uppercase tracking-[0.14em] opacity-55">
            How those goals are met
          </h3>
          <ul className="m-0 mt-6 grid list-none grid-cols-1 gap-x-10 gap-y-7 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {companyGoals.map(({ icon: Icon, title, line }, i) => (
              <Reveal as="li" key={title} delay={i % 4} className="flex gap-3.5">
                <Icon size={22} strokeWidth={1.5} aria-hidden className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <span className="block font-heading text-[15px] uppercase">{title}</span>
                  <span className="mt-1.5 block text-[13.5px] leading-[1.55] opacity-75">{line}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Timeline />

      {/* Values — one statement, not a list. The nine names are set inline
          exactly where the company's own sentence puts them, picked out in the
          heading face so they still register as a set at a glance.

          This replaced a nine-cell grid. The grid needed a line of copy under
          each name to justify itself, and that copy was ours rather than
          Felmos's — nine definitions invented to fill a layout. Setting the
          sentence as a sentence needs none of them. */}
      <section className="wrap py-10 md:py-14" aria-label="Core values and philosophy">
        <SectionHead kicker="Our Core Value" title="Engineering Excellence" />

        <Reveal
          as="p"
          className="m-0 max-w-[46ch] text-[clamp(17px,2.6vw,21px)] leading-[1.6] lg:max-w-[64ch]"
        >
          <span className="opacity-80">{coreValues.opening} </span>
          {coreValues.names.map((name, i) => (
            <span key={name}>
              {i > 0 && (
                <span className="opacity-80">
                  {i === coreValues.names.length - 1 ? ", and " : ", "}
                </span>
              )}
              {/* Body face, not font-heading: the heading face is condensed and
                  only settles in caps — in mixed case, inline, it reads as a
                  different typeface dropped mid-sentence. Weight and colour do
                  the picking-out on their own. */}
              <span className="font-semibold text-link">{name}</span>
            </span>
          ))}
          <span className="opacity-80">. {coreValues.closing}</span>
        </Reveal>

        {/* Philosophy — set as a statement, not a tenth tile. It shares this
            section with the values because it is the same idea stated as
            conduct, and because the next band is already on the surface ground. */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:mt-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <Reveal as="span" className="kicker mb-2.5 block">
              Company Philosophy
            </Reveal>
            <Reveal
              as="p"
              delay={1}
              className="m-0 max-w-[34ch] border-l-2 border-link pl-5 font-heading text-[clamp(19px,3.6vw,25px)] leading-[1.35] lg:max-w-[38ch]"
            >
              {philosophy.statement}
            </Reveal>
          </div>

          <ul className="m-0 flex list-none flex-wrap content-center gap-2 p-0 lg:gap-2.5">
            {philosophy.pillars.map((pillar, i) => (
              <Reveal as="li" key={pillar} delay={i % 3}>
                <span className="block rounded-full bg-surface px-4 py-2 text-[13px] uppercase tracking-[0.06em]">
                  {pillar}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
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
                <Icon size={22} strokeWidth={1.5} aria-hidden className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-[0.1em] opacity-55">{label}</dt>
                  <dd className="m-0 mt-1 text-[14.5px] leading-[1.55]">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink no-underline hover:text-link"
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
