import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import PostBody from "@/components/blog/PostBody";
import PostCard from "@/components/blog/PostCard";
import {
  formatDate,
  getPostBySlug,
  getPosts,
  getRelatedPosts,
  getTeam,
  postReadMinutes,
} from "@/lib/cms";
import { isMedia, mediaUrl } from "@/lib/media";
import { site } from "@/lib/site";

/* Every published post is prerendered at build time. dynamicParams is left at
   its default — true — deliberately now that articles are written in the
   dashboard: one published after the last deploy renders on demand and is then
   cached, instead of 404ing until someone redeploys the site. */
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

/** The open-graph image at the size the crawlers want, or nothing.
    `isMedia` rather than a null check: the bundled snapshot carries an image
    key rather than a media row, and passing one of those to mediaUrl would
    produce a URL that resolves to nothing. */
const ogImage = (image: unknown): string[] =>
  isMedia(image) ? [mediaUrl(image, 1200, 630)] : [];

/* Next 15: params is a Promise in both of these and in the page itself. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const images = ogImage(post.image);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  /* The byline is stored on the article itself, so it survives the author
     leaving the team page. The team is consulted only for their role, and
     rendering degrades to the name alone when there is no match — a missing
     role is not worth a 500. */
  const [team, related] = await Promise.all([
    getTeam(),
    getRelatedPosts(post),
  ]);
  const author = team.find((m) => m.name === post.author);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: ogImage(post.image),
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${site.url}/blog/${post.slug}` },
    articleSection: post.category,
  };

  return (
    <>
      <article>
        <header className="wrap pb-8 pt-10 md:pb-10 md:pt-14">
          <Reveal>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.08em] text-link no-underline"
            >
              <ArrowLeft size={15} strokeWidth={1.75} />
              All insights
            </Link>
          </Reveal>

          <Reveal as="span" delay={1} className="kicker mb-2.5 mt-5 block">
            {post.category}
          </Reveal>

          <Reveal
            as="h1"
            delay={2}
            /* Narrower measure than the page allows: a headline set to the full
               1440px wrap runs past the point where the eye can find the next
               line without effort. */
            className="m-0 max-w-[20ch] text-[clamp(30px,7vw,50px)] uppercase leading-[1.05]"
          >
            {post.title}
          </Reveal>

          <Reveal
            as="p"
            delay={3}
            className="mb-0 mt-4 max-w-[56ch] text-[16px] leading-[1.62] opacity-80 md:text-[17.5px]"
          >
            {post.excerpt}
          </Reveal>

          <Reveal delay={4} className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
            <span className="font-heading uppercase tracking-[0.06em]">{post.author}</span>
            {author && <span className="opacity-65">{author.role}</span>}
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <time dateTime={post.date} className="opacity-65">
              {formatDate(post.date)}
            </time>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="opacity-65">{postReadMinutes(post)} min read</span>
          </Reveal>
        </header>

        <div className="wrap">
          <Reveal>
            <Photo
              src={post.image}
              alt=""
              ratio="16/9"
              sizes="(max-width: 1440px) 100vw, 1440px"
              priority
              zoom={false}
              /* The frame is tall and the entry wipe is keyed to the viewport,
                 so it would finish before the photograph is anywhere near read. */
              wipe={false}
            />
          </Reveal>
        </div>

        <div className="wrap py-12 md:py-16">
          <PostBody body={post.body} />
        </div>
      </article>

      {related.length > 0 && (
        /* Plain ground, not the surface band it used to be: PostCard is now a
           surface-filled panel, and a surface card on a surface band is
           invisible. The band was only there to separate this from the article
           above it, and a rule does that job without competing with the cards. */
        <section className="border-t border-divider" aria-label="More insights">
          <div className="wrap py-14 md:py-20">
            <Reveal as="h2" className="m-0 font-heading text-[clamp(22px,4vw,30px)] uppercase">
              Keep reading
            </Reveal>
            <Reveal variant="line" delay={1} className="rule mb-9 mt-6" />
            <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={i % 3}>
                  <PostCard post={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        title="Need this looked at properly?"
        lead="Book an inspection and get a certified engineer on site — with a report you can act on."
        cta="Book Your Inspection"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
