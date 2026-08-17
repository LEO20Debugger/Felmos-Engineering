import type { Metadata } from "next";
import ProjectsHero from "@/components/projects/ProjectsHero";
import ProjectIndex from "@/components/projects/ProjectIndex";
import ProjectCapability from "@/components/projects/ProjectCapability";
import ProjectEquipment from "@/components/projects/ProjectEquipment";
import CtaBand from "@/components/ui/CtaBand";
import { getProjects, getServices } from "@/lib/cms";
import { instrumentPhotos } from "@/lib/content";
import type { Media } from "@/lib/media";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A record of structural testing, verification and assessment work delivered for government bodies, developers, universities, hotels and estate companies across Nigeria.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  /* One round trip each, both cached and tagged — the dossiers moved to their
     own routes, so this page is now purely an index. */
  const [projects, services] = await Promise.all([getProjects(), getServices()]);

  /* Pick the instrument photographs out of the galleries already loaded above,
     so the equipment section costs no extra request. Ordered by the list in
     lib/content.ts rather than by where they happen to sit in the galleries. */
  const gallery = projects.flatMap((project) => project.gallery);
  const equipmentPhotos = instrumentPhotos
    .map((alt) => gallery.find((image) => image.alt === alt))
    .filter((image): image is Media => Boolean(image));

  /* The banner now shows the company's own work rather than a stock crane:
     the first published project that carries a photograph, in the order the
     index renders them, with its gallery as the fallback for a project whose
     cover has not been set. Still nullable — ProjectsHero keeps the stock
     frame for the case where nothing has been uploaded yet. */
  const heroImage =
    projects.map((p) => p.image ?? p.gallery[0]).find(Boolean) ?? null;

  return (
    <>
      <ProjectsHero count={projects.length} image={heroImage} />
      <ProjectIndex projects={projects} />
      <ProjectCapability projects={projects} services={services} />
      <ProjectEquipment photos={equipmentPhotos} />

      <CtaBand
        title="Your project could be next"
        lead="Tell us what you're building or verifying, and get a certified engineer on it."
        cta="Book Your Inspection"
      />
    </>
  );
}
