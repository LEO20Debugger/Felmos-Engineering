import Link from "next/link";

import { api, mediaUrl, type AdminService } from "@/lib/admin/api";
import { ServiceList } from "./ServiceList";

export const metadata = { title: "Services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const showDeleted = deleted === "1";

  const { services } = await api.get<{ services: AdminService[] }>(
    `/admin/services${showDeleted ? "?deleted=1" : ""}`
  );

  const live = services.filter((s) => !s.isDeleted);
  const drafts = live.filter((s) => s.status !== "published").length;

  /* Thumbnails are resolved here rather than in the list, so the client
     component never needs the media helpers or the API's base URL. */
  const rows = services.map((service) => ({
    ...service,
    thumb: mediaUrl(service.image, 96, 96),
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
          <h1 className="adm-h1">Services</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            {live.filter((s) => s.status === "published").length} on the website
            {drafts > 0 ? `, ${drafts} in draft` : ""}
          </p>
        </div>
        <Link href="/admin/services/new" className="adm-btn">
          Add service
        </Link>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <Link
          href={showDeleted ? "/admin/services" : "/admin/services?deleted=1"}
          className="adm-muted"
        >
          {showDeleted ? "← Hide deleted" : "Show deleted"}
        </Link>
      </div>

      <ServiceList services={rows} showDeleted={showDeleted} />
    </>
  );
}
