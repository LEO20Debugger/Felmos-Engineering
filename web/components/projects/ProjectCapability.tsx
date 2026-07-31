import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { Icon } from "@/lib/icons";
import type { CmsProject, CmsService } from "@/lib/cms";

/**
 * Closes the loop between this page and /services: each discipline with a count
 * of how many of the projects above drew on it. Counting from the data rather
 * than hardcoding means the figures can't drift as projects are added.
 *
 * A discipline no project has used yet is dropped rather than shown as "0
 * projects above" — this section exists to evidence the record, and a zero
 * makes the opposite case.
 */
export default function ProjectCapability({
  projects,
  services,
}: {
  projects: CmsProject[];
  services: CmsService[];
}) {
  const counted = services
    .map((service) => ({
      ...service,
      used: projects.filter((p) => p.services.includes(service.slug)).length,
    }))
    .filter((service) => service.used > 0)
    .sort((a, b) => b.used - a.used);

  if (counted.length === 0) return null;

  return (
    <section className="wrap py-12 md:py-16" aria-label="Disciplines applied">
      <SectionHead
        kicker="Disciplines Applied"
        title="What The Work Draws On"
        lead={`Most projects call on more than one discipline — the record above spans ${counted.length}.`}
      />

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {counted.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i % 3}>
            <Link
              href={`/services#${s.slug}`}
              className="mark-lift group flex h-full flex-col gap-3 border border-divider p-5 no-underline"
              style={{ borderRadius: "var(--radius-control)" }}
            >
              <span className="flex items-center justify-between">
                <Icon name={s.icon} size={24} strokeWidth={1.5} className="text-link" />
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-link transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
        ))}
      </ul>
    </section>
  );
}
