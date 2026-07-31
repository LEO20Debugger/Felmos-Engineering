import { api, mediaUrl, type AdminMedia } from "@/lib/admin/api";
import { MediaGrid } from "./MediaGrid";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const { media } = await api.get<{ media: AdminMedia[] }>("/admin/media");

  const missingAlt = media.filter((m) => m.alt.trim() === "").length;

  /* Thumbnails are requested at 360px, never the original. The API serves
     images straight off Railway with no CDN in front, so asking for a 2000px
     file to fill a 150px tile would be slow and billed as egress on every
     load of this page. */
  const items = media.map((m) => ({ ...m, thumb: mediaUrl(m, 360, 360) }));

  return (
    <>
      <h1 className="adm-h1">Media</h1>
      <p className="adm-muted" style={{ margin: "0.15rem 0 1rem" }}>
        {media.length} images · {media.filter((m) => m.kind === "remote").length}{" "}
        stock, {media.filter((m) => m.kind === "local").length} uploaded
      </p>

      <UploadForm />

      {missingAlt > 0 ? (
        <p className="adm-muted" style={{ marginBottom: "0.75rem" }}>
          {missingAlt} image{missingAlt === 1 ? " has" : "s have"} no
          description. Tap one to add it.
        </p>
      ) : null}

      <MediaGrid items={items} />
    </>
  );
}
