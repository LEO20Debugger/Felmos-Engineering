import Link from "next/link";

import { api, mediaUrl, type AdminProject } from "@/lib/admin/api";
import { restoreProject } from "../../actions";

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

      <div className="adm-card">
        {projects.length === 0 ? (
          <p className="adm-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
            No projects yet.
          </p>
        ) : (
          projects.map((project) => {
            const src = mediaUrl(project.image, 96, 96);

            const body = (
              <>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="adm-thumb" src={src} alt="" width={48} height={48} />
                ) : (
                  <span className="adm-thumb" aria-hidden />
                )}

                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.title}
                  </strong>
                  <span className="adm-muted">
                    {[
                      project.location,
                      project.year ? String(project.year) : null,
                      /* The photograph count is the thing most likely to be
                         wrong after an import, and the only way to see it
                         without opening every project. */
                      project.gallery.length > 0
                        ? `${project.gallery.length} photo${project.gallery.length === 1 ? "" : "s"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || `/${project.slug}`}
                  </span>
                </span>

                <span
                  className={`adm-pill ${
                    project.isDeleted
                      ? "adm-pill-gone"
                      : project.status === "published"
                        ? "adm-pill-live"
                        : "adm-pill-draft"
                  }`}
                >
                  {project.isDeleted
                    ? "Deleted"
                    : project.status === "published"
                      ? "Live"
                      : "Draft"}
                </span>
              </>
            );

            /* A deleted row isn't a link — its edit page would only offer
               changes that can't be saved. Restore is the one action. */
            return project.isDeleted ? (
              <div key={project.id} className="adm-row">
                {body}
                <form action={restoreProject}>
                  <input type="hidden" name="id" value={project.id} />
                  <button className="adm-btn adm-btn-ghost" style={{ minHeight: "2.25rem" }}>
                    Restore
                  </button>
                </form>
              </div>
            ) : (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="adm-row"
              >
                {body}
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
