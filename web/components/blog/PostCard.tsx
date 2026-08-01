import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Photo from "@/components/ui/Photo";
import { formatDate, postReadMinutes, type CmsPost } from "@/lib/cms";

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
  post: CmsPost;
  feature?: boolean;
  sizes?: string;
}) {
  const minutes = postReadMinutes(post);
  /* Two shapes for the same three facts.
     The feature panel is wide enough to run them on one line. A grid card is
     not: "Testing Methods · 27 May 2026 · 2 min read" needs ~330px inside a
     307px column, so it wrapped on some cards and not others, and the titles
     below started 23px apart across a row. Setting the category on its own
     line makes the block exactly two lines for EVERY post regardless of how
     long the category is — aligned by construction rather than by hoping the
     text stays short. It also reads better: the category is the coloured
     label, the date and length are the quiet pair. */
  const meta = feature ? (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] uppercase tracking-[0.08em] opacity-65">
      <span className="text-link opacity-100">{post.category}</span>
      <span aria-hidden>·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span>{minutes} min read</span>
    </div>
  ) : (
    <div className="text-[12px] uppercase tracking-[0.08em]">
      <span className="block truncate text-link">{post.category}</span>
      <span className="mt-1 block opacity-65">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden> · </span>
        {minutes} min read
      </span>
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
      /* h-full on the grid variant: the <li> wrappers already stretch to the
         tallest in their row, but the panel inside them did not, so a short
         post left a gap of page showing under its own card. */
      className={`group relative mark-lift overflow-hidden rounded-[var(--radius-control)] bg-surface ${
        feature ? "grid lg:grid-cols-2" : "flex h-full flex-col"
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
            : /* grow is what makes the mt-auto below do anything. Without it
                 this block is content-sized, the panel's spare height collects
                 underneath it, and "Read" floats mid-card with a ragged gap
                 beneath — 47px on some cards against 24px on others. */
              "flex grow flex-col p-5 md:p-6"
        }
      >
        {meta}
        {/* Clamped to two lines, and reserving two lines whether it needs them
            or not. The clamp is what stops a long title setting the height of
            everything beside it; the min-height is what makes the excerpts
            start on the same line across a row, which is the difference between
            a grid and three cards that happen to be adjacent.
            2.2em = 2 lines at leading-[1.1]. */}
        <h3
          className={`m-0 mt-2.5 font-heading uppercase leading-[1.1] ${
            feature
              ? "text-[clamp(24px,3.4vw,34px)]"
              : "line-clamp-2 min-h-[2.2em] text-[19px]"
          }`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="text-ink no-underline transition-colors after:absolute after:inset-0 group-hover:text-link"
          >
            {post.title}
          </Link>
        </h3>
        {/* Three lines then an ellipsis. The excerpt is a hook, not the
            article — the post page carries the whole thing. */}
        <p
          className={`m-0 mt-3 leading-[1.6] opacity-75 ${
            feature ? "max-w-[52ch] text-[15.5px]" : "line-clamp-3 text-[14px]"
          }`}
        >
          {post.excerpt}
        </p>

        {/* mt-auto, not mt-4: now that the panels stretch to a common height,
            a fixed margin leaves this floating wherever the copy happened to
            end and the row's baselines scatter. Pushed to the foot instead, so
            "Read" lands on the same line in every card. `feature` keeps the
            fixed margin — it is a single panel with nothing to align to. */}
        <span
          className={`inline-flex items-center gap-1.5 self-start font-heading text-[13.5px] font-semibold uppercase tracking-[0.06em] text-link ${
            feature ? "mt-4" : "mt-auto pt-4"
          }`}
        >
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
