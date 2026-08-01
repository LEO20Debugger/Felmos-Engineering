import Link from "next/link";

import { api, type AdminPost } from "@/lib/admin/api";
import { DeletePostForm, PostForm } from "../PostForm";
import { authorOptions, categoryOptions } from "../data";
import { pickerOptions } from "../../images";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ post }, images, authors, categories] = await Promise.all([
    api.get<{ post: AdminPost }>(`/admin/posts/${id}`),
    pickerOptions(),
    authorOptions(),
    categoryOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/insights">← Insights</Link>
      </p>

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
        <h1 className="adm-h1" style={{ margin: 0 }}>
          {post.title}
        </h1>
        {/* Only offered once the article is live — a draft has no page to
            look at, and the link would 404. */}
        {post.status === "published" ? (
          <a
            className="adm-btn adm-btn-ghost"
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            View on site
          </a>
        ) : null}
      </div>

      <PostForm
        post={post}
        images={images}
        authors={authors}
        categories={categories}
      />

      <div style={{ marginTop: "1rem" }}>
        <DeletePostForm id={post.id} />
      </div>
    </>
  );
}
