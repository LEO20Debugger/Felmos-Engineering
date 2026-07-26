import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { projects, services } from "@/lib/content";

/**
 * Closes the loop between this page and /services: each discipline with a count
 * of how many of the projects above drew on it. Counting from the data rather
 * than hardcoding means the figures can't drift as projects are added.
 */
export default function ProjectCapability() {
  const counted = services.map((s) => ({
    ...s,
    used: projects.filter((p) => p.services.includes(s.slug)).length,
  }));

  return (
    <section className="wrap py-12 md:py-16" aria-label="Disciplines applied">
      <SectionHead
        kicker="Disciplines Applied"
        title="What The Work Draws On"
        lead="Most projects call on more than one discipline — the record above spans all five."
      />

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {counted.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal as="li" key={s.slug} delay={i % 3}>
              <Link
                href={`/services#${s.slug}`}
                className="mark-lift group flex h-full flex-col gap-3 border border-divider p-5 no-underline"
                style={{ borderRadius: "var(--radius-control)" }}
              >
                <span className="flex items-center justify-between">
                  <Icon size={24} strokeWidth={1.5} className="text-accent-700" />
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-accent-700 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>

                <strong className="font-heading text-[16px] uppercase leading-tight text-ink">
                  {s.title}
                </strong>

                <span className="mt-auto text-[13px] uppercase tracking-[0.06em] opacity-60">
                  {s.used} {s.used === 1 ? "project" : "projects"} above
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
