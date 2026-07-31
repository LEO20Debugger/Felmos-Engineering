import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import type { CmsProject } from "@/lib/cms";

/**
 * The index: every project as a card, linking through to its own page.
 *
 * This replaced a dense typographic row list with a hover preview. That layout
 * was built for six case studies on a single scrolling page, where the row was
 * a jump menu to a dossier further down. With seventeen projects each holding
 * its own page and its own gallery, the row's job is now to sell the click, and
 * a photograph does that better than a line of type.
 *
 * Still a server component with no JavaScript — the card is a link and the
 * hover treatment is CSS.
 */
export default function ProjectIndex({ projects }: { projects: CmsProject[] }) {
  return (
    <section className="wrap py-12 md:py-16" aria-label="Project index">
      <SectionHead
        kicker="The Record"
        /* Counted, never written down. The old copy said "Six Representative
           Projects" and would have been wrong the moment a project was added
           from the dashboard. */
        title={`${projects.length} Projects On Record`}
        lead="Testing, investigation and assessment — for government, developers, universities, hotels and estate companies across Nigeria."
      />

      <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-9 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i % 3}>
            <Link href={`/projects/${p.slug}`} className="group block no-underline">
              <figure className="relative m-0">
                <Photo
                  src={p.image}
                  alt={p.image?.alt || p.title}
                  ratio="4/3"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={i < 3}
                />
                {p.category ? (
                  <span className="absolute left-4 top-4 tag tag-accent bg-bg/90">
                    {p.category}
                  </span>
                ) : null}
              </figure>

              <figcaption className="pt-4">
                <span className="flex items-baseline gap-3 font-mono text-[12px] tracking-[0.14em] text-link">
                  {p.num}
                  <span aria-hidden className="h-px w-8 self-center bg-accent/40" />
                </span>

                <span className="mt-2 flex items-start justify-between gap-3">
                  <strong className="font-heading text-[16.5px] uppercase leading-tight text-ink">
                    {p.title}
                  </strong>
                  <ArrowRight
                    size={17}
                    strokeWidth={1.5}
                    className="mt-0.5 flex-none text-link transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>

                {/* Location and year are joined from whatever exists — several
                    projects have one and not the other, and none of them
                    should show a stray separator. */}
                {p.location || p.year ? (
                  <span className="mt-1.5 block text-[13px] opacity-65">
                    {[p.location, p.year].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </figcaption>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
