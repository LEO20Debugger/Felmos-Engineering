import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Photo from "@/components/ui/Photo";
import { formatDate, readMinutes, type Post } from "@/lib/blog";

/**
 * One post, as a card.
 *
 * `feature` is the lead treatment on the index: the same card laid side by side
 * at lg with a larger photograph and the excerpt promoted. It is a variant
 * rather than a second component because everything except the layout is
 * identical, and two components would drift.
 *
 * The whole card is one link. An overlay anchor (`after:absolute after:inset-0`)
 * rather than wrapping the markup, so the heading stays the accessible name and
 * the photo, meta and arrow are not read out as part of it.
 */
export default function PostCard({
  post,
  feature = false,
  sizes,
}: {
  post: Post;
  feature?: boolean;
  sizes?: string;
}) {
  const meta = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] uppercase tracking-[0.08em] opacity-65">
      <span className="text-link opacity-100">{post.category}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span>{readMinutes(post)} min read</span>
    </div>
  );

  /* A filled panel, not a bare stack.

     These were transparent and unpadded, which is the site's house style for
     cards — but .mark-lift draws a shadow on hover, and a shadow around a
     transparent box invents a panel edge that the copy was then flush against.
     Either the shadow goes or the panel becomes real; a real panel is the
     better card for an index, and WhyUs already establishes the idiom on this
     site (bg-surface, radius-control, p-5 md:p-6).

     overflow-hidden + rounded on the panel, with the photograph's own radius
     zeroed, is what lets the image run full-bleed to the panel edge while the
     text stays inset. Without the override the photo keeps radius-control and
     its bottom corners cut into the fill. */
  return (
    <article
      className={`group relative mark-lift overflow-hidden rounded-[var(--radius-control)] bg-surface ${
        feature ? "grid lg:grid-cols-2" : "flex flex-col"
      }`}
    >
      <Photo
        src={post.image}
        alt=""
        ratio={feature ? "16/10" : "3/2"}
        className={`rounded-none ${feature ? "lg:h-full" : ""}`}
        sizes={sizes ?? (feature ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw")}
      />

      <div
        className={
          feature
            ? "flex flex-col justify-center p-6 md:p-8 lg:p-10"
            : "flex flex-col p-5 md:p-6"
        }
      >
        {meta}
        <h3
          className={`m-0 mt-2.5 font-heading uppercase leading-[1.1] ${
            feature ? "text-[clamp(24px,3.4vw,34px)]" : "text-[19px]"
          }`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="text-ink no-underline transition-colors after:absolute after:inset-0 group-hover:text-link"
          >
            {post.title}
          </Link>
        </h3>
        <p
          className={`m-0 mt-3 leading-[1.6] opacity-75 ${
            feature ? "max-w-[52ch] text-[15.5px]" : "text-[14px]"
          }`}
        >
          {post.excerpt}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 font-heading text-[13.5px] font-semibold uppercase tracking-[0.06em] text-link">
          Read
          <ArrowRight
            size={15}
            strokeWidth={1.75}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </article>
  );
}
