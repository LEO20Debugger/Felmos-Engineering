import Link from "next/link";

import { ReviewForm } from "../ReviewForm";
import { projectOptions } from "../data";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  const projects = await projectOptions();

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/reviews">← Reviews</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "0.25rem" }}>
        Add review
      </h1>
      <p className="adm-muted" style={{ margin: "0 0 1rem" }}>
        For feedback that came in by email or phone. Reviews left on the website
        arrive on their own and appear in the pending list.
      </p>

      <ReviewForm projects={projects} />
    </>
  );
}
