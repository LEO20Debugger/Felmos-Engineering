import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Photo from "@/components/ui/Photo";
import type { CmsProject, CmsService } from "@/lib/cms";

/**
 * One project's record, on its own page.
 *
 * This is what the scroll-and-pin dossier list became. That component held all
 * six case studies at once, cross-fading a pinned photo column as each crossed
 * the middle of the screen — a good answer for six and an unreadable one for
 * seventeen. Now each project has a page, so the layout is a straight read and
 * carries no JavaScript at all.
 *
 * Everything below the title is conditional. The company's record supplies a
 * client and a year for about half of these engagements and a duration or an
 * outcome figure for none of them, so each block asks whether it has content
 * before it renders. A missing fact leaves no trace rather than an empty cell.
 */
export default function ProjectDossier({
  project,
  services,
}: {
  project: CmsProject;
  services: CmsService[];
}) {
  const facts = [
    ["Client", project.client],
    ["Location", project.location],
    ["Year", project.year ? String(project.year) : null],
    ["Duration", project.duration],
  ].filter((pair): pair is [string, string] => Boolean(pair[1]));

  return (
    <article className="wrap py-10 md:py-14">
      <div className="grid grid-cols-1 items-start gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="lg:order-2">
          <figure className="m-0 lg:sticky lg:top-28">
            <Photo
              src={project.image}
              alt={project.image?.alt || project.title}
              ratio="4/3"
              sizes="(max-width: 1024px) 100vw, 42vw"
              priority
              wipe={false}
            />
          </figure>
        </div>

        <div className="lg:order-1">
          <span className="flex items-center gap-3 font-mono text-[12px] tracking-[0.14em] text-link">
            {project.num}
            {project.category ? (
              <>
                <span aria-hidden className="h-px w-8 bg-accent/40" />
                {project.category}
              </>
            ) : null}
          </span>

          <h1 className="m-0 mt-3 text-[clamp(26px,5vw,42px)] uppercase leading-[1.05]">
            {project.title}
          </h1>

          {facts.length > 0 ? (
            <dl className="m-0 mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-divider py-5 sm:grid-cols-4">
              {facts.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[11px] uppercase tracking-[0.1em] opacity-55">
                    {key}
                  </dt>
                  <dd className="m-0 mt-1 font-heading text-[15px] uppercase">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {project.narrative ? (
            <p className="mt-6 max-w-[58ch] text-[15.5px] leading-[1.68] opacity-85">
              {project.narrative}
            </p>
          ) : null}

          {project.metric?.value ? (
            <p className="m-0 mt-7 flex items-baseline gap-3.5 border-l-2 border-accent pl-4">
              <span className="font-heading text-[clamp(28px,4vw,40px)] font-semibold leading-none text-link tabular-nums">
                {project.metric.value}
              </span>
              <span className="text-[13px] uppercase tracking-[0.06em] opacity-70">
                {project.metric.label}
              </span>
            </p>
          ) : null}

          {project.result ? (
            <p className="mt-4 max-w-[52ch] text-[14.5px] leading-[1.6] opacity-90">
              {project.result}
            </p>
          ) : null}

          {project.services.length > 0 ? (
            <ul className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0">
              {project.services.map((slug) => {
                const service = services.find((s) => s.slug === slug);
                if (!service) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/services#${slug}`}
                      className="tag tag-outline mark-lift gap-1 no-underline"
                    >
                      {service.label}
                      <ArrowUpRight size={13} strokeWidth={1.5} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
