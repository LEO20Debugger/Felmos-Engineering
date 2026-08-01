import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProjectDossier from "@/components/projects/ProjectDossier";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ProjectPager from "@/components/projects/ProjectPager";
import CtaBand from "@/components/ui/CtaBand";
import { getProjectBySlug, getProjects, getServices } from "@/lib/cms";
import { mediaUrl } from "@/lib/media";

/**
 * A project's own page.
 *
 * These used to be anchors on one long /projects scroll. Seventeen full-height
 * dossiers on a single route is a page nobody reaches the bottom of, and it
 * gave search engines one URL to rank for seventeen distinct pieces of work —
 * so each is now its own document, with its own title, description and image.
 */

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: "Project not found" };

  /* The one-line summary if there is one, then the opening of the account —
     never a generic fallback, which reads worse in a search result than a
     truncated real sentence. */
  const description =
    project.scope ?? project.narrative?.slice(0, 155) ?? undefined;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      type: "article",
      ...(project.image
        ? { images: [{ url: mediaUrl(project.image, 1200, 630) }] }
        : {}),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [projects, services] = await Promise.all([getProjects(), getServices()]);

  const index = projects.findIndex((entry) => entry.slug === slug);
  const project = index === -1 ? undefined : projects[index];

  /* A slug that no longer exists is a 404, not an empty page. Projects can be
     unpublished from the dashboard, and generateStaticParams only froze the set
     that was live at build. */
  if (!project) notFound();

  /* Neighbours in the order /projects lists, wrapping at both ends. Suppressed
     when this is the only project — a pager whose two halves both point back at
     the page you are on is noise. */
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      {/* Up to the index on the left, along the set on the right. One row, so
          both ways out of this page are found in the same glance. */}
      <div className="wrap flex items-center justify-between gap-4 pt-8">
        <nav aria-label="Breadcrumb">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.08em] no-underline opacity-65 hover:opacity-100"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            <span className="max-sm:hidden">All projects</span>
            <span className="sm:hidden">All</span>
          </Link>
        </nav>

        {projects.length > 1 && (
          <nav aria-label="More projects">
            <ProjectPager previous={previous} next={next} />
          </nav>
        )}
      </div>

      <ProjectDossier project={project} services={services} />
      <ProjectGallery images={project.gallery} />

      <CtaBand
        title="Need this done on your building?"
        lead="Tell us what you're building or verifying, and get a certified engineer on it."
        cta="Book Your Inspection"
      />
    </>
  );
}
