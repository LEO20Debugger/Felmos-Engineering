import { Plus } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { faqs } from "@/lib/content";

/** Native <details> — accessible, keyboard-operable and zero JavaScript. */
export default function Faq() {
  return (
    <section className="wrap py-12 pb-16 md:py-16" aria-label="Frequently asked questions">
      <SectionHead kicker="FAQs" title="Common Questions" />
      <div>
        {faqs.map((f, i) => (
          <Reveal key={f.q} delay={i % 3}>
            <details className="group border-b border-divider">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="m-0 font-heading text-[17px] uppercase leading-tight transition-colors group-open:text-link">
                  {f.q}
                </h3>
                <Plus
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden
                  className="mt-0.5 flex-none text-link transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <p className="m-0 max-w-[62ch] pb-5 text-[14.5px] leading-[1.6] opacity-78">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
