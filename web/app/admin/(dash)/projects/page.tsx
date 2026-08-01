import Link from "next/link";

import { api, mediaUrl, type AdminProject } from "@/lib/admin/api";
import { ProjectList } from "./ProjectList";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const showDeleted = deleted === "1";

  const { projects } = await api.get<{ projects: AdminProject[] }>(
    `/admin/projects${showDeleted ? "?deleted=1" : ""}`
  );

  const live = projects.filter((p) => !p.isDeleted);
  const drafts = live.filter((p) => p.status !== "published").length;

  /* Thumbnails are resolved here rather than in the list, so the client
     component never needs the media helpers or the API's base URL. */
  const rows = projects.map((project) => ({
    ...project,
    thumb: mediaUrl(project.image, 96, 96),
  }));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="adm-h1">Projects</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            {live.filter((p) => p.status === "published").length} on the website
            {drafts > 0 ? `, ${drafts} in draft` : ""}
          </p>
        </div>
        <Link href="/admin/projects/new" className="adm-btn">
          Add project
        </Link>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <Link
          href={showDeleted ? "/admin/projects" : "/admin/projects?deleted=1"}
          className="adm-muted"
        >
          {showDeleted ? "← Hide deleted" : "Show deleted"}
        </Link>
      </div>

      <ProjectList projects={rows} showDeleted={showDeleted} />
    </>
  );
}
