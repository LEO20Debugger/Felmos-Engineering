import Link from "next/link";

import { PostForm } from "../PostForm";
import { authorOptions, categoryOptions } from "../data";
import { pickerOptions } from "../../images";

export const metadata = { title: "New article" };

export default async function NewPostPage() {
  const [images, authors, categories] = await Promise.all([
    pickerOptions(),
    authorOptions(),
    categoryOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/insights">← Insights</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        Write article
      </h1>

      <PostForm images={images} authors={authors} categories={categories} />
    </>
  );
}
