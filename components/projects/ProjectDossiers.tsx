"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Photo from "@/components/ui/Photo";
import { imageAt } from "@/lib/images";
import { projects, services } from "@/lib/content";

/**
 * The centrepiece: a media column that pins beside the dossiers and cross-fades
 * as each one crosses the middle of the screen.
 *
 * There is exactly ONE list here, shared by every width — the pinned column is
 * a sibling of it, not a second copy. That matters: the `id={p.slug}` anchors
 * live on these list items, and a desktop/mobile component split (as the
 * process section uses) would duplicate every one of them and break the
 * `/projects#slug` links coming from the homepage teaser.
 *
 * Motion budget: one IntersectionObserver setting one integer. The pin is
 * `position: sticky` and the crossfade is a CSS transition, which means the
 * global prefers-reduced-motion block reduces it to a hard cut for free — no
 * matchMedia guard needed, unlike the JS-driven transforms elsewhere.
 */
export default function ProjectDossiers() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-idx]"));

    /* The negative margins collapse the viewport to a narrow band across its
       middle, so "intersecting" means "this dossier is the one crossing the
       centre line". Exactly one qualifies at a time because every dossier is
       at least 78svh tall — don't lower that without widening the band. */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-idx")));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = projects[active];

  return (
    <section className="wrap pb-14 md:pb-20" aria-label="Project record">
      <div className="grid grid-cols-1 items-start gap-x-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ───────────── pinned media column (lg + scripting only) ───────────── */}
        <div className="pin-col">
          <div className="pin-stage">
            {projects.map((p, i) => (
              <Image
                key={p.slug}
                src={imageAt(p.image, 1000, 1250)}
                /* Only the visible photograph is described; the rest are inert,
                   so a screen reader hears one image per project, not six. */
                alt={i === active ? p.title : ""}
                aria-hidden={i !== active}
                fill
                priority={i === 0}
                /* 0px below lg means phones never download any of these. */
                sizes="(max-width: 1024px) 0px, 42vw"
                className="pin-img object-cover"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}

            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent-900/80 via-accent-900/15 to-transparent"
            />

            {/* Changing the key remounts this, which replays the keyframe —
                the same trick ProcessTimeline uses to cross-fade its panel. */}
            <span
              key={`cap-${active}`}
              className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-6 animate-[fx-fade_0.55s_var(--ease-out-quint)_both]"
            >
              <span className="font-mono text-[12px] tracking-[0.16em] text-bg/70">
                {current.num} / {String(projects.length).padStart(2, "0")}
              </span>
              <span className="font-heading text-[19px] uppercase leading-tight text-bg">
                {current.location} · {current.year}
              </span>
              <span className="text-[13px] uppercase tracking-[0.06em] text-bg/70">
                {current.category}
              </span>
            </span>
          </div>

          <div aria-hidden className="pin-rail">
            {projects.map((p, i) => (
              <span key={p.slug} data-on={i <= active} />
            ))}
          </div>
        </div>

        {/* ───────────── the dossiers — sole owner of the #slug anchors ───────────── */}
        <ol ref={listRef} className="m-0 list-none p-0">
          {projects.map((p, i) => (
            <li
              key={p.slug}
              id={p.slug}
              data-idx={i}
              /* Header clearance comes from the global `scroll-padding-top` on
                 <html>, as everywhere else on the site — no scroll-margin here
                 or the two would stack. */
              className="flex min-h-[78svh] flex-col justify-center border-t border-divider py-12 first:border-t-0 lg:py-16"
            >
              <article aria-labelledby={`${p.slug}-h`}>
                {/* Carries the photography on phones, and on desktop whenever
                    the pinned column can't run. `.dossier-media` hides itself
                    only once the stage has genuinely taken over. */}
                <figure className="dossier-media mb-6">
                  <Photo
                    src={p.image}
                    alt={p.title}
                    ratio="4/3"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    wipe={false}
                  />
                </figure>

                <span className="flex items-center gap-3 font-mono text-[12px] tracking-[0.14em] text-accent-700">
                  {p.num}
                  <span aria-hidden className="h-px w-8 bg-accent/40" />
                  {p.category}
                </span>

                <h2
                  id={`${p.slug}-h`}
                  className="m-0 mt-3 text-[clamp(23px,4vw,35px)] uppercase leading-[1.05]"
                >
                  {p.title}
                </h2>

                <dl className="m-0 mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-divider py-5 sm:grid-cols-4">
                  {[
                    ["Client", p.client],
                    ["Location", p.location],
                    ["Year", p.year],
                    ["Duration", p.duration],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-[0.1em] opacity-55">{k}</dt>
                      <dd className="m-0 mt-1 font-heading text-[15px] uppercase">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-5 max-w-[54ch] text-[15px] leading-[1.68] opacity-80">
                  {p.narrative}
                </p>

                <p className="m-0 mt-7 flex items-baseline gap-3.5 border-l-2 border-accent pl-4">
                  <span className="font-heading text-[clamp(28px,4vw,40px)] font-semibold leading-none text-accent-700 tabular-nums">
                    {p.metric.value}
                  </span>
                  <span className="text-[13px] uppercase tracking-[0.06em] opacity-70">
                    {p.metric.label}
                  </span>
                </p>

                <p className="mt-4 max-w-[50ch] text-[14.5px] leading-[1.6] opacity-90">
                  {p.result}
                </p>

                <ul className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0">
                  {p.services.map((slug) => {
                    const s = services.find((x) => x.slug === slug);
                    if (!s) return null;
                    return (
                      <li key={slug}>
                        <Link
                          href={`/services#${slug}`}
                          className="tag tag-outline mark-lift gap-1 no-underline"
                        >
                          {s.label}
                          <ArrowUpRight size={13} strokeWidth={1.5} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
