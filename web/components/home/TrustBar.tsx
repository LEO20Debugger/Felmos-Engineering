import Reveal from "@/components/ui/Reveal";
import { trustPoints } from "@/lib/content";

export default function TrustBar() {
  return (
    <section className="wrap" aria-label="Why clients rely on us">
      <ul className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-6 border-y border-divider p-0 py-7 md:grid-cols-4">
        {trustPoints.map(({ icon: Icon, label }, i) => (
          <Reveal as="li" key={label} delay={i} className="flex items-center gap-3">
            <Icon size={24} strokeWidth={1.5} className="flex-none text-link" />
            <span className="text-[14px] font-medium leading-tight md:text-[14.5px]">{label}</span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
