import Link from "next/link";

import { api, type AdminReview } from "@/lib/admin/api";
import { DeleteReviewForm, ReviewForm } from "../ReviewForm";
import { projectOptions } from "../data";

export const metadata = { title: "Edit review" };

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ review }, projects] = await Promise.all([
    api.get<{ review: AdminReview }>(`/admin/reviews/${id}`),
    projectOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/reviews">← Reviews</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        {review.author}
      </h1>

      <ReviewForm review={review} projects={projects} />

      <div style={{ marginTop: "2rem" }}>
        {review.status === "published" ? (
          <p className="adm-muted" style={{ marginTop: 0 }}>
            <a href="/reviews" target="_blank" rel="noreferrer">
              View on site ↗
            </a>
          </p>
        ) : null}
        <DeleteReviewForm id={review.id} />
      </div>
    </>
  );
}
