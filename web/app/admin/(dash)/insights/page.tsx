import Link from "next/link";

import { api, mediaUrl, type AdminPost } from "@/lib/admin/api";
import { PostList } from "./PostList";

export const metadata = { title: "Insights" };

/** Explicit locale and timezone, like the site's own formatDate: left to the
    runtime, this resolves differently on the server and the client and the
    dates in the list flicker on hydration. */
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const showDeleted = deleted === "1";

  const { posts } = await api.get<{ posts: AdminPost[] }>(
    `/admin/posts${showDeleted ? "?deleted=1" : ""}`
  );

  const live = posts.filter((p) => !p.isDeleted);
  const drafts = live.filter((p) => p.status !== "published").length;

  /* Thumbnails and dates are resolved here rather than in the list, so the
     client component never needs the media helpers or a date formatter. */
  const rows = posts.map((post) => ({
    ...post,
    thumb: mediaUrl(post.image, 96, 96),
    dateLabel: formatDate(post.date),
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
          <h1 className="adm-h1">Insights</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            {live.filter((p) => p.status === "published").length} on the website
            {drafts > 0 ? `, ${drafts} in draft` : ""}
          </p>
        </div>
        <Link href="/admin/insights/new" className="adm-btn">
          Write article
        </Link>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <Link
          href={showDeleted ? "/admin/insights" : "/admin/insights?deleted=1"}
          className="adm-muted"
        >
          {showDeleted ? "← Hide deleted" : "Show deleted"}
        </Link>
      </div>

      <PostList posts={rows} showDeleted={showDeleted} />
    </>
  );
}
