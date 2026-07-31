import Link from "next/link";

import { api, type AdminService } from "@/lib/admin/api";
import { restoreService } from "../../actions";

export const metadata = { title: "Services" };

/** Build a small preview URL for a media row. Mirrors the crop logic in
    lib/images.ts so remote (stock) images render at thumbnail size rather than
    downloading a 2000px original into a 48px box. */
function thumb(image: AdminService["image"]): string | null {
  if (!image) return null;

  if (image.kind === "remote" && image.providerId) {
    return image.provider === "pexels"
      ? `https://images.pexels.com/photos/${image.providerId}/pexels-photo-${image.providerId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=96&h=96`
      : `https://images.unsplash.com/photo-${image.providerId}?auto=format&fit=crop&w=96&h=96&q=70`;
  }

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/media/${image.id}?w=96&h=96`;
}

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
            {services.filter((s) => !s.isDeleted).length} on the website
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

      <div className="adm-card">
        {services.length === 0 ? (
          <p className="adm-muted" style={{ padding: "1.5rem", textAlign: "center" }}>
            No services yet.
          </p>
        ) : (
          services.map((service) => {
            const src = thumb(service.image);

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
                    {service.title}
                  </strong>
                  <span className="adm-muted">/{service.slug}</span>
                </span>

                <span
                  className={`adm-pill ${
                    service.isDeleted
                      ? "adm-pill-gone"
                      : service.status === "published"
                        ? "adm-pill-live"
                        : "adm-pill-draft"
                  }`}
                >
                  {service.isDeleted
                    ? "Deleted"
                    : service.status === "published"
                      ? "Live"
                      : "Draft"}
                </span>
              </>
            );

            /* A deleted row isn't a link — its edit page would only offer
               changes that can't be saved. Restore is the one action. */
            return service.isDeleted ? (
              <div key={service.id} className="adm-row">
                {body}
                <form action={restoreService}>
                  <input type="hidden" name="id" value={service.id} />
                  <button className="adm-btn adm-btn-ghost" style={{ minHeight: "2.25rem" }}>
                    Restore
                  </button>
                </form>
              </div>
            ) : (
              <Link
                key={service.id}
                href={`/admin/services/${service.id}`}
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
