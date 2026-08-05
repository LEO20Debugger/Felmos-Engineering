import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getPosts, getProjects } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [projects, posts] = await Promise.all([getProjects(), getPosts()]);

  return [
    { url: site.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    /* Each project is its own document since the dossiers left the single
       scrolling page — seventeen indexable URLs where there was one. Each
       carries its own updatedAt for the same reason the posts below carry
       their publication date. */
    ...projects.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${site.url}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    /* Weekly: this page changes whenever a review is approved, which is more
       often than anything else here except the blog index. */
    { url: `${site.url}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    /* The index changes whenever a post is added; the posts themselves do not,
       so each carries its own publication date as lastModified rather than the
       build time. A crawler told every URL changed today learns nothing. */
    { url: `${site.url}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
