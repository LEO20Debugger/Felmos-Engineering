import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { whoWeAre, hsePolicy } from "@/lib/content";
import {
  Award,
  Clock,
  Cpu,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Replaces "Our History" on the About Page with "WHO WE ARE" and
 * "Health, Safety & Environment (HSE) Policy".
 */
export default function Timeline() {
  const whoWeAreIcons = [Award, MapPin, Clock, Users, Cpu];

  return (
    <section className="bg-surface" aria-label="Who We Are and HSE Policy">
      <div className="wrap py-14 md:py-20 flex flex-col gap-16 md:gap-20">
        {/* ── WHO WE ARE ── */}
        <div>
          <SectionHead
            kicker="Who We Are"
            title="Approved Excellence & Field Proven Standards"
            lead="Our core operational credentials and capabilities across Nigeria."
          />

          <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {whoWeAre.map((item, i) => {
              const Icon = whoWeAreIcons[i % whoWeAreIcons.length];
              return (
                <Reveal
                  as="li"
                  key={item}
                  delay={i % 3}
                  className="flex items-start gap-4 rounded-[var(--radius-control)] bg-bg border border-divider/70 p-5 md:p-6"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-surface text-link">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="mt-0.5 text-[15px] font-medium leading-[1.5] text-ink">
                    {item}
                  </span>
                </Reveal>
              );
            })}
          </ul>
        </div>

        {/* ── HEALTH, SAFETY & ENVIRONMENT (HSE) POLICY ── */}
        <div>
          <SectionHead
            kicker="Health, Safety & Environment (HSE) Policy"
            title="Incident-Free Workplaces & Safety Commitments"
            lead={hsePolicy.statement}
          />

          {/* 4 Zero / Safety Targets */}
          <div className="mt-8">
            <h3 className="m-0 font-heading text-[12px] uppercase tracking-[0.14em] opacity-60">
              Primary HSE Target Principles
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hsePolicy.targets.map((target, i) => (
                <Reveal
                  as="div"
                  key={target}
                  delay={i % 4}
                  className="flex flex-col justify-between rounded-[var(--radius-control)] border border-divider bg-bg p-5 md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-bold tracking-[0.16em] text-link">
                      TARGET 0{i + 1}
                    </span>
                    <ShieldCheck size={20} strokeWidth={1.5} className="text-link opacity-80" />
                  </div>
                  <h4 className="m-0 mt-4 font-heading text-[17px] uppercase leading-snug text-ink">
                    {target}
                  </h4>
                </Reveal>
              ))}
            </div>
          </div>

          {/* 7 Commitments: How We Work To Achieve This */}
          <div className="mt-12 md:mt-16">
            <Reveal variant="line" className="rule mb-8" />
            <h3 className="m-0 font-heading text-[14px] uppercase tracking-[0.12em] text-ink">
              We work to achieve this by:
            </h3>

            <ol className="m-0 mt-6 grid list-none grid-cols-1 gap-y-4 p-0 md:grid-cols-2 md:gap-x-10">
              {hsePolicy.commitments.map((commitment, i) => (
                <Reveal
                  as="li"
                  key={commitment}
                  delay={i % 2}
                  /* Only `last:` — an earlier `md:[&:nth-last-child(2)]`
                     assumed the final two items share a row, which holds only
                     for an even count. With seven, item 6 sits beside item 5
                     and lost its rule while 5 kept one, leaving that row
                     underlined on one side. */
                  className="flex items-start gap-4 border-b border-divider/60 pb-4 last:border-b-0"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-link/10 font-mono text-[12px] font-bold text-link">
                    {i + 1}
                  </span>
                  <span className="mt-0.5 text-[14.5px] leading-[1.6] text-ink opacity-90">
                    {commitment}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
