"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The page's only client component.
 *
 * Note the prop type: primitives only. `Service.icon` is a LucideIcon — a
 * function — and passing a Service straight from the server page would throw
 * "Functions cannot be passed directly to Client Components". The page maps to
 * this shape on the server instead.
 */
export type NavItem = { slug: string; num: string; label: string };

export default function ServicesNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const trackRef = useRef<HTMLUListElement>(null);

  /* Scroll-spy. Deliberately NOT ProjectDossiers' "-45% 0px -45%" centre band:
     that geometry relies on its dossiers each being taller than the band. These
     sections are ~700-900px and at lg are often shorter than the viewport, so a
     centre band can match two at once or none at all.

     Instead the root is clipped to just under the sticky bar at the top and 55%
     up from the bottom, and the TOPMOST still-intersecting section wins — which
     is what "the one you're reading" means when several are on screen. */
  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    /* How much of the band each section currently fills, not merely whether it
       touches it. Adjacent sections always overlap the band edge by a few
       pixels during a scroll, and "topmost that touches" would hand the bar to
       a 9px sliver of the section you have just finished reading. */
    const covered = new Map<string, number>();
    let io: IntersectionObserver | null = null;

    const build = () => {
      io?.disconnect();
      /* --header-h flips 60 -> 72 at lg, so read it rather than hardcode it. */
      const headerH =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
          10
        ) || 60;
      const barH = trackRef.current?.offsetHeight ?? 56;

      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            covered.set(e.target.id, e.isIntersecting ? e.intersectionRect.height : 0);
          }
          /* Most of the band wins. Ties go to the earlier section because
             `items` is in DOM order and `>` keeps the incumbent. */
          let best = "";
          let most = 0;
          for (const i of items) {
            const h = covered.get(i.slug) ?? 0;
            if (h > most) {
              most = h;
              best = i.slug;
            }
          }
          /* Scrolled clear of every section (the CTA band, say): keep the last
             choice lit rather than clearing, so the bar is never blank. */
          if (best) setActive(best);
        },
        /* Several thresholds so the callback re-fires as a section grows and
           shrinks within the band, not only as it enters and leaves it —
           without them the coverage figures would go stale mid-scroll. */
        {
          rootMargin: `-${headerH + barH + 8}px 0px -55% 0px`,
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );
      sections.forEach((s) => io!.observe(s));
    };

    build();
    /* Only one breakpoint changes --header-h, so a matchMedia listener is far
       cheaper than a resize handler and fires exactly when it matters. */
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener("change", build);
    return () => {
      mq.removeEventListener("change", build);
      io?.disconnect();
    };
  }, [items]);

  /* Keep the active chip visible on the mobile track.

     scrollIntoView is wrong here — even with block:"nearest" it can scroll the
     PAGE while the user is scrolling it, which fights them. Scroll the track
     itself, on its own axis, and only when there is something to fix. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollWidth <= track.clientWidth) return; // no overflow, nothing to do

    const chip = track.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!chip) return;

    const left = chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2;
    if (Math.abs(track.scrollLeft - left) < 8) return; // already centred; kills jitter

    /* The global reduced-motion CSS block cannot reach a JS-set behavior, so
       this is guarded explicitly — same discipline as Stats and ProcessTimeline. */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  return (
    <div className="svc-nav">
      {/* Distinct from the Header's "Primary", so a landmark list doesn't show
          two identically-named navigations. */}
      <nav className="wrap" aria-label="Services on this page">
        <ul
          ref={trackRef}
          className="no-scrollbar -mx-[var(--gutter)] m-0 flex list-none gap-2 overflow-x-auto px-[var(--gutter)] py-2"
        >
          {items.map((s) => {
            const on = s.slug === active;
            return (
              <li key={s.slug} className="flex-none">
                {/* A real anchor: native tab order, native Enter, works with JS
                    off. No roving tabindex — that would turn a list of links
                    into a custom widget for nothing. */}
                <a
                  href={`#${s.slug}`}
                  data-slug={s.slug}
                  aria-current={on ? "true" : undefined}
                  className={`btn whitespace-nowrap text-[13.5px] no-underline ${
                    on ? "btn-primary" : "btn-secondary text-ink"
                  }`}
                >
                  <span className={`font-mono text-[11px] ${on ? "text-on-dark/70" : "text-link"}`}>
                    {s.num}
                  </span>
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
