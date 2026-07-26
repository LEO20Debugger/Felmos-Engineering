import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { audiences } from "@/lib/content";

export default function Audience() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Who we serve">
      <SectionHead kicker="Who We Serve" title="Built for Every Stakeholder" />

      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-6">
        {audiences.map(({ icon: Icon, label }, i) => (
          <Reveal as="li" key={label} delay={i}>
            <div className="mark-lift relative flex h-full flex-col items-center gap-3 px-3 py-6 text-center">
              <Icon size={26} strokeWidth={1.5} className="text-accent-700" />
              <span className="font-heading text-[13.5px] font-semibold uppercase leading-tight tracking-[0.01em]">
                {label}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
