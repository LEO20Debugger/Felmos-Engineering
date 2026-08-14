"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { focalPosition, mediaUrl, type Media } from "@/lib/media";
import type { CmsTeamMember } from "@/lib/cms";

/**
 * The team, as a stage rather than a grid.
 *
 * /about already carries the full four-up grid. Repeating it on the homepage
 * would be the third identical card grid on one page, so this is the other
 * treatment: one portrait at a time, crossfading, with the detail beside it.
 * It reads as a practice introducing its people rather than as a staff
 * directory, which is the difference the homepage needs.
 *
 * All portraits are mounted and stacked; only opacity moves. Swapping a
 * single <Image src> would re-request on every advance and flash the empty
 * frame between them — stacking images at one modest crop is cheaper than
 * that, and it makes the crossfade a pure compositor operation.
 *
 * Data is fetched by the async server wrapper below and passed in as a prop,
 * so admin-dashboard changes are reflected without a redeploy.
 */

const ADVANCE_MS = 5600;

function TeamSliderClient({
  team,
  linkHref = "/about",
  linkLabel = "Meet the practice",
  showLink = true,
}: {
  team: CmsTeamMember[];
  linkHref?: string;
  linkLabel?: string;
  showLink?: boolean;
}) {
  const [active, setActive] = useState(0);
  /* Once the visitor takes over, autoplay never resumes. A carousel that
     restarts itself after an interaction fights the person using it. */
  const [engaged, setEngaged] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => setEngaged(true), []);

  const go = useCallback(
    (next: number) => {
      setActive(() => (next + team.length) % team.length);
    },
    [team.length]
  );

  useEffect(() => {
    if (engaged) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      /* A background tab should not be advancing a slideshow nobody is
         watching — it just burns a paint every 5.6s. */
      if (document.hidden) return;
      setActive((n) => (n + 1) % team.length);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [engaged, team.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    stop();
    go(active + (e.key === "ArrowRight" ? 1 : -1));
  };

  const member = team[active];

  return (
    <section className="bg-surface" aria-label="Our team">
      <div className="wrap py-14 md:py-20">
        <SectionHead
          kicker="Our Team"
          title="The Engineers Behind the Scenes"
          lead="Named, reachable, and accountable for the findings they sign."
        />

        <Reveal
          /* The portrait column is deliberately narrow. This is the homepage
             teaser, not /about's team page — at 340px the 4:5 portrait ran to
             425px tall and became the tallest thing in the section, which made
             a supporting block read as the main event. */
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,250px)_minmax(0,1fr)] lg:gap-12"
          onPointerDown={stop}
        >
          {/* ---------------------------- stage ---------------------------- */}
          <div
            ref={stageRef}
            /* Capped on mobile too. In the single-column stacking a full-width
               4:5 portrait is ~420px tall on a phone — most of a screen spent
               on one face before the name is even visible. From md the grid
               track owns the width, so the cap is lifted.

               photo-frame  — scroll-driven wipe entry + bg placeholder + radius
               photo-zoom-deep — hover scale; uses the deep variant because
               Next.js fill wraps <img> in a span, so > img won't reach it. */
            className="photo-frame photo-zoom-deep relative aspect-[4/5] w-full max-w-[230px] md:max-w-none"
          >
            {team.map((m, i) => (
              <Portrait key={m.id} image={m.image} active={i === active} />
            ))}

            {/* Position in the set, over the photograph's foot. The scrim is
                what makes it legible against an unknown portrait rather than
                relying on the image happening to be dark there. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent-900/85 to-transparent p-4 pt-12">
              <span className="font-mono text-[12px] tracking-[0.14em] text-on-dark/90 tabular-nums">
                {String(active + 1).padStart(2, "0")}
                <span className="opacity-50">
                  {" "}
                  / {String(team.length).padStart(2, "0")}
                </span>
              </span>
            </div>
          </div>

          {/* ---------------------------- detail --------------------------- */}
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label="Our engineers"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {/* Keyed on `active`, so React remounts the block and the entry
                animation replays on every advance. The global reduced-motion
                block flattens it to a cut. */}
            <div
              key={member.id}
              className="animate-[fx-rise_0.55s_var(--ease-out-quint)_both]"
            >
              <h3 className="m-0 font-heading text-[clamp(24px,4vw,34px)] uppercase leading-[1.05]">
                {member.name}
              </h3>
              <p className="m-0 mt-2 text-[15px] opacity-70">{member.role}</p>
              {/* Outline rather than filled: a credential, not a category. */}
              {member.tag && (
                <span className="tag tag-outline mt-3.5">{member.tag}</span>
              )}
              {member.bio && (
                <p className="m-0 mt-4 max-w-[46ch] text-[15.5px] leading-[1.6] opacity-80">
                  {member.bio}
                </p>
              )}
            </div>

            {/* ------------------------- controls ------------------------- */}
            <div className="mt-8 flex items-center gap-4">
              <div
                className="flex gap-2.5"
                role="tablist"
                aria-label="Choose an engineer"
              >
                {team.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`${m.name}, ${m.role}`}
                    onClick={() => {
                      stop();
                      setActive(i);
                    }}
                    /* The visible thumbnail is 44px; the button is 44px too, so
                       the tap target and the graphic are the same box. */
                    className={`relative h-11 w-11 overflow-hidden rounded-[var(--radius-md)] transition-[opacity,transform] duration-300 ease-[var(--ease-out-quint)] ${
                      i === active
                        ? "opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-surface"
                        : "opacity-55 hover:opacity-85"
                    }`}
                  >
                    {m.image ? (
                      <Image
                        src={mediaUrl(m.image, 120, 120)}
                        alt=""
                        aria-hidden
                        fill
                        sizes="44px"
                        style={{ objectPosition: focalPosition(m.image) }}
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-surface" aria-hidden />
                    )}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    go(active - 1);
                  }}
                  aria-label="Previous engineer"
                  className="btn btn-secondary btn-icon"
                >
                  <ArrowLeft size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    go(active + 1);
                  }}
                  aria-label="Next engineer"
                  className="btn btn-secondary btn-icon"
                >
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* The arrows wrap rather than disable at the ends — a loop that
                dead-ends reads as broken — so there is no disabled state to
                announce. This is the only running commentary a screen reader
                gets, and it is enough. */}
            <p aria-live="polite" className="sr-only">
              {member.name}, {member.role}. {active + 1} of {team.length}.
            </p>

            {showLink && (
              <Link
                href={linkHref}
                className="mt-7 inline-flex items-center gap-1.5 font-heading text-[13.5px] font-semibold uppercase tracking-[0.06em] text-link no-underline"
              >
                {linkLabel}
                <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── portrait layer ─────────────────────────────────────────────────────── */

/** One portrait in the crossfade stack. All are mounted; only opacity moves. */
function Portrait({
  image,
  active,
}: {
  image: Media | null;
  active: boolean;
}) {
  const cls = `object-cover transition-opacity duration-700 ease-[var(--ease-out-quint)] ${
    active ? "opacity-100" : "opacity-0"
  }`;

  if (!image) {
    /* No portrait uploaded yet — neutral placeholder keeps the frame intact. */
    return (
      <span
        className={`absolute inset-0 bg-surface ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={mediaUrl(image, 500, 625)}
      /* Decorative: the panel beside this names the person and states the
         role, so alt text here would have a screen reader announce all
         members' names on every page load. */
      alt=""
      aria-hidden
      fill
      /* Matches the capped widths in the stage container. Left at 100vw this
         would fetch every portrait at twice the pixels the slot can show —
         and all are downloaded eagerly for the crossfade, so the waste
         multiplies with the team size. */
      sizes="(max-width: 768px) 230px, 250px"
      style={{ objectPosition: focalPosition(image) }}
      className={cls}
    />
  );
}

/* ─── server wrapper ─────────────────────────────────────────────────────── */

import { getTeam } from "@/lib/cms";

/**
 * Fetches the published team from the CMS and passes it to the client
 * carousel. The page remains a server component; data is available at
 * first render rather than after a client-side fetch.
 *
 * Renders nothing when no published members exist — an empty slider with
 * nav arrows pointing nowhere is worse than no slider.
 */
export default async function TeamSlider({
  linkHref,
  linkLabel,
  showLink,
}: {
  linkHref?: string;
  linkLabel?: string;
  showLink?: boolean;
} = {}) {
  const team = await getTeam();
  if (team.length === 0) return null;
  return (
    <TeamSliderClient
      team={team}
      linkHref={linkHref}
      linkLabel={linkLabel}
      showLink={showLink}
    />
  );
}
