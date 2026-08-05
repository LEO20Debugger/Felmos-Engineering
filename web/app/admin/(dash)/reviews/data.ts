import "server-only";

import { api, type AdminProject } from "@/lib/admin/api";

export type ProjectOption = { id: number; title: string };

/**
 * The projects a review can be attached to.
 *
 * Read off the projects endpoint the dashboard already has, following the
 * `authorOptions` precedent in ../insights/data.ts — a dedicated endpoint
 * would be a second definition of the same list to keep in step.
 *
 * Drafts are included: a project can be written up before it goes live, and a
 * review of it should be linkable in the meantime. Deleted ones are not.
 */
export async function projectOptions(): Promise<ProjectOption[]> {
  const { projects } = await api.get<{ projects: AdminProject[] }>(
    "/admin/projects"
  );

  return projects
    .filter((project) => !project.isDeleted)
    .map((project) => ({ id: project.id, title: project.title }));
}
