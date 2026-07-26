import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { projects } from "@/lib/content";

/**
 * Homepage teaser — the first three projects, in the same photo-card language
 * as the full /projects index, closing with a link through to the rest.
 */
export default function Projects() {
  const featured = projects.slice(0, 3);

  return (
    <section className="wrap py-14 md:py-20" aria-label="Past projects">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <SectionHead
            kicker="Past Projects"
            title="Structures We've Verified"
            lead="A sample of the developers, lenders and homeowners we've delivered certainty for."
          />
        </div>
        <Reveal delay={2} className="mb-8 hidden md:mb-10 lg:block">
          <Link href="/projects" className="btn btn-secondary text-ink no-underline">
            All projects
            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i}>
            <Link href={`/projects#${p.slug}`} className="group block no-underline">
              <figure className="relative m-0">
                <Photo
                  src={p.image}
                  alt={p.title}
                  ratio="4/3"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="absolute left-4 top-4 tag tag-accent bg-bg/90">{p.category}</span>
              </figure>
              <figcaption className="pt-4">
                <span className="flex items-center justify-between gap-3">
                  <strong className="font-heading text-[16.5px] uppercase leading-tight text-ink">
                    {p.title}
                  </strong>
                  <ArrowRight
                    size={17}
                    strokeWidth={1.5}
                    className="flex-none text-link transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
                <span className="mt-1.5 block text-[13px] opacity-65">
                  {p.location} · {p.year}
                </span>
              </figcaption>
            </Link>
          </Reveal>
        ))}
      </ul>

      {/* Mobile "see more" — under the grid, where the thumb lands next. */}
      <Reveal delay={3} className="mt-8 lg:hidden">
        <Link href="/projects" className="btn btn-secondary btn-block text-ink no-underline">
          All projects
          <ArrowRight size={17} strokeWidth={1.5} />
        </Link>
      </Reveal>
    </section>
  );
}
