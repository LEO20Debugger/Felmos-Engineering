import type { Metadata } from "next";
import ProjectsHero from "@/components/projects/ProjectsHero";
import ProjectIndex from "@/components/projects/ProjectIndex";
import ProjectDossiers from "@/components/projects/ProjectDossiers";
import ProjectCapability from "@/components/projects/ProjectCapability";
import CtaBand from "@/components/ui/CtaBand";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A record of structural testing, verification and assessment work delivered for developers, lenders, homeowners and government projects.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <ProjectsHero />
      <ProjectIndex />
      <ProjectDossiers />
      <ProjectCapability />

      <CtaBand
        title="Your project could be next"
        lead="Tell us what you're building or verifying, and get a certified engineer on it."
        cta="Book Your Inspection"
      />
    </>
  );
}
