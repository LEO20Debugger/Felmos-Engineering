import { Quote } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { testimonials } from "@/lib/content";

export default function Testimonials() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Client feedback">
      <SectionHead kicker="Client Feedback" title="What Clients Say" />

      {/* Scroll-snaps on mobile, settles into a three-up grid from md. */}
      <ul className="no-scrollbar -mx-[var(--gutter)] m-0 flex list-none snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] py-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {testimonials.map((t, i) => (
          <Reveal
            as="li"
            key={t.name}
            delay={i}
            className="w-[86%] flex-none snap-center sm:w-[60%] md:w-auto"
          >
            <figure className="mark-lift relative flex h-full flex-col gap-4 p-6">
              <Quote size={26} strokeWidth={1.5} className="text-accent-300" aria-hidden />
              <blockquote className="m-0 flex-1 text-[15px] leading-[1.6] opacity-90">
                {t.quote}
              </blockquote>
              <figcaption className="flex flex-col gap-0.5 border-t border-divider pt-3.5">
                <strong className="text-[14px] font-semibold">{t.name}</strong>
                <span className="text-[12.5px] opacity-60">{t.role}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
