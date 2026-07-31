import Link from "next/link";

import { api, type AdminService } from "@/lib/admin/api";
import { ProjectForm } from "../ProjectForm";
import { pickerOptions } from "../../images";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const [{ services }, images] = await Promise.all([
    api.get<{ services: AdminService[] }>("/admin/services"),
    pickerOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/projects">← Projects</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        New project
      </h1>

      <ProjectForm services={services} images={images} />
    </>
  );
}
