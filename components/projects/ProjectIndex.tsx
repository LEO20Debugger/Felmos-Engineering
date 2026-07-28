import Image from "next/image";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { imageAt } from "@/lib/images";
import { projects } from "@/lib/content";

/**
 * The index: every project as one dense typographic row, doubling as the jump
 * menu for the dossiers below.
 *
 * The hover preview is pure CSS (`.idx-row:hover .idx-peek` in globals.css), so
 * this stays a server component with no JavaScript at all. Below lg the preview
 * is never rendered as anything visible and the rows simply read as a list.
 */
export default function ProjectIndex() {
  return (
    <section className="wrap py-12 md:py-16" aria-label="Project index">
      <SectionHead
        kicker="The Record"
        title="Six Representative Projects"
        /* Deliberately doesn't count the disciplines. The six case studies were
           written against the old five-service list and now span six of eight,
           so "all N disciplines" would be false whichever N we wrote. */
        lead="Testing, investigation and remedial engineering — for developers, lenders, government and private clients."
      />

      <ol className="idx-list m-0 list-none p-0">
        {projects.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i % 3} className="idx-row">
            <a href={`#${p.slug}`}>
              <span className="font-mono text-[12px] tracking-[0.14em] text-link">
                {p.num}
              </span>

              <span className="font-heading text-[clamp(17px,2.6vw,25px)] uppercase leading-tight">
                {p.title}
              </span>

              {/* Category and year sit on their own row below sm, where the
                  four-column grid would crush the title. */}
              <span className="col-start-2 text-[12.5px] uppercase tracking-[0.06em] opacity-55 sm:col-start-auto">
                {p.category}
              </span>

              <span className="hidden font-mono text-[13px] opacity-55 sm:block">{p.year}</span>
            </a>

            {/* Decoration only — the row text already carries every fact. */}
            <Image
              aria-hidden
              alt=""
              src={imageAt(p.image, 360, 240)}
              width={180}
              height={120}
              sizes="180px"
              className="idx-peek"
            />
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
