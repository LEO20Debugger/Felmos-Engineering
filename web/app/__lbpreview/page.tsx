/* TEMPORARY harness for checking the media viewer without signing in.
   Delete this directory once the layout is confirmed. */
import "../admin/admin.css";
import { MediaGrid } from "../admin/(dash)/media/MediaGrid";

const shots = [
  "photo-1503387762-592deb58ef4e",
  "photo-1541888946425-d81bb19240f5",
  "photo-1487958449943-2429e8be8625",
  "photo-1518005020951-eccb494ad742",
  "photo-1479839672679-a46483c0e7c8",
  "photo-1449157291145-7efd050a4d0e",
];

export default function Page() {
  const items = shots.map((providerId, i) => ({
    id: i + 1,
    kind: "remote" as const,
    remoteUrl: null,
    provider: "unsplash" as const,
    providerId,
    storageKey: null,
    width: null,
    height: null,
    blurDataUrl: null,
    alt: i % 3 === 0 ? "" : `Sample image ${i + 1}`,
    focalX: 50,
    focalY: 50,
    title: `Sample ${i + 1}`,
    bytes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    thumb: `https://images.unsplash.com/${providerId}?auto=format&fit=crop&w=360&h=360&q=75`,
    full: `https://images.unsplash.com/${providerId}?auto=format&fit=crop&w=1600&h=1200&q=75`,
  }));

  return (
    <div className="adm-main" style={{ padding: "1rem" }}>
      <MediaGrid items={items} />
    </div>
  );
}
