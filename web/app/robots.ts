import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    /* /admin is the dashboard. It is behind a login, but without this the
       sign-in page itself is crawlable and indexable — which advertises where
       the admin is and puts it in search results. The admin routes also set
       robots meta tags, for crawlers that read those but not robots.txt. */
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
