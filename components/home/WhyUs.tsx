import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { differentiators } from "@/lib/content";

export default function WhyUs() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Why choose Felmos">
      <SectionHead kicker="Why Felmos" title="Engineering You Can Rely On" />

      <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-7 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map(({ icon: Icon, title, line }, i) => (
          <Reveal as="li" key={title} delay={i % 3} className="flex gap-3.5">
            <Icon size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-accent-700" />
            <div>
              <h3 className="m-0 font-heading text-[17px] uppercase">{title}</h3>
              <p className="m-0 mt-1 text-[14px] leading-[1.5] opacity-75">{line}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
