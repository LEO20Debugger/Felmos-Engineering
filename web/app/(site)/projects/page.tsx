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

  return (
    <>
      <ProjectsHero count={projects.length} />
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
