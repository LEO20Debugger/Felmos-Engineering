import Link from "next/link";

import { api, type AdminProject, type AdminService } from "@/lib/admin/api";
import { DeleteProjectForm, ProjectForm } from "../ProjectForm";
import { pickerOptions } from "../../images";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* All three in one round trip. The service list is needed in full rather
     than as the project's own slugs — the picker has to offer every discipline,
     not only the ones already ticked. */
  const [{ project }, { services }, images] = await Promise.all([
    api.get<{ project: AdminProject }>(`/admin/projects/${id}`),
    api.get<{ services: AdminService[] }>("/admin/services"),
    pickerOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/projects">← Projects</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        {project.title}
      </h1>

      <ProjectForm project={project} services={services} images={images} />

      <div style={{ marginTop: "1rem" }}>
        <DeleteProjectForm id={project.id} />
      </div>
    </>
  );
}
