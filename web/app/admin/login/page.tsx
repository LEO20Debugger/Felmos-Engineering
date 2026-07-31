import type { Metadata } from "next";

import "../admin.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Felmos Admin",
  /* Keep the whole dashboard out of search results. Without this the login
     page is a crawlable, indexable entry point advertising that an admin
     exists here. web/app/robots.ts disallows /admin as well; this covers
     crawlers that read the meta tag but not robots.txt. */
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="adm" style={{ display: "grid", placeItems: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        <h1 className="adm-h1" style={{ marginBottom: "0.25rem" }}>
          Felmos Admin
        </h1>
        <p className="adm-muted" style={{ marginBottom: "1.5rem" }}>
          Sign in to manage the website.
        </p>

        <div className="adm-card" style={{ padding: "1.25rem" }}>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
