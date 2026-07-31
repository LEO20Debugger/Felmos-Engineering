import Link from "next/link";

import { api, type AdminService } from "@/lib/admin/api";
import { DeleteServiceForm, ServiceForm } from "../ServiceForm";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* Both in one round trip. The icon list is small and rarely changes, but it
     comes from the API rather than a local constant so the allowlist has a
     single source of truth — the web app and the API can't drift into
     disagreeing about which icons exist. */
  const [{ service }, { icons }] = await Promise.all([
    api.get<{ service: AdminService }>(`/admin/services/${id}`),
    api.get<{ icons: string[] }>("/meta/icons"),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/services">← Services</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        {service.title}
      </h1>

      <ServiceForm service={service} icons={icons} />

      <div style={{ marginTop: "1rem" }}>
        <DeleteServiceForm id={service.id} />
      </div>
    </>
  );
}
