/* ==========================================================================
   The Felmos mark, rebuilt as geometry.

   The supplied artwork is a raster of a skyline: a navy tower, a tall green
   pylon, a glazed tower and a navy plinth. Redrawing it as a polygon set buys
   three things a PNG cannot:

     - it is one colour system with the site. The masses are painted from
       --color-signal / --color-accent-800 / --color-accent-900, so if the
       brand ramp is ever retuned the logo moves with it instead of drifting
       out of step with the buttons.
     - it survives dark mode. The plinth and the left tower are near-black on
       paper and would disappear against the charcoal page; `tone="onDark"`
       lifts exactly those two masses and leaves the green and the glass alone.
     - it is sharp at 22px in the header and at 512px in a share card, and
       costs ~1kB inline rather than a network request in the LCP path.

   Flat fills, no gradients. Partly because a logo should be flat, and partly
   because gradients need document-unique ids — which on this site would mean a
   hook, which would mean "use client" on a mark the server-rendered Footer
   needs. Nothing about the drawing is worth that.

   The geometry is a 64x64 grid with the baseline at y=54 and the plinth
   beneath it. Every vertex is on a whole or half unit — that is what keeps the
   verticals from going soft when the mark renders at 22px.
   ========================================================================== */

type Tone = "brand" | "onDark" | "mono";

export function LogoMark({
  size = 32,
  tone = "brand",
  className = "",
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  /* Three tones, and only one of them is a decision the caller has to make:
       brand  — follows the page. --logo-mass is re-pointed by the dark theme,
                so this is right on both grounds and is what you want almost
                everywhere.
       onDark — pinned light. For a mark sitting on an accent-900 band or a
                photo scrim, where the ground is dark in BOTH themes and the
                theme-following version would go navy-on-navy in daylight.
       mono   — inherits currentColor, for a mark inside a line of type or
                behind a mask, which cannot carry its own palette. */
  const isMono = tone === "mono";
  const dark = isMono
    ? "currentColor"
    : tone === "onDark"
      ? "var(--color-accent-300)"
      : "var(--logo-mass)";
  const green = isMono ? "currentColor" : "var(--color-signal)";
  const glass = isMono ? "currentColor" : "var(--color-accent-500)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="presentation"
      aria-hidden
      focusable="false"
      className={className}
    >
      {/* Navy tower, left. Flat-topped and short — it occupies only the bottom
          quarter, which is what lets the pylon read as towering over it. */}
      <path d="M14 54 V40 H23 V54 Z" fill={dark} />

      {/* The pylon. Narrow, reaching the very top, with a long diagonal down
          its upper left so it widens as it descends. It is what the mark is
          *of*, and it has to dominate — roughly four times the height of the
          navy tower it stands behind. */}
      <path d="M22 54 V13 L26 3 H33.5 V54 Z" fill={green} />

      {/* The reveal: a thin green column standing off the pylon, rising to the
          same line as the glazed tower. The white gaps either side of it are
          structural, not spacing — close them and the three masses merge into
          one silhouette. */}
      <path d="M35 54 V23 H37 V54 Z" fill={green} />

      {/* The glazed tower's return, drawn before the lit face so the face laps
          over it and the corner stays a hard edge. Deliberately stops short of
          the glass beside it: the stepped skyline is the point. */}
      <path d="M45.5 54 V30 H50 V54 Z" fill={dark} />

      {/* Glazed tower, lit face, chamfered top left. */}
      <path d="M38.5 54 V27 L41 24 H45.5 V54 Z" fill={glass} />

      {/* Glazing bars. Paper-toned so they read as gaps between panes in both
          themes. Dropped in mono — at mask-icon sizes they fill the tower in —
          and they vanish into solid blue below ~40px anyway, which is the
          correct degradation rather than a loss. */}
      {!isMono && (
        <g stroke="var(--color-on-dark)" strokeWidth="0.7" opacity="0.95">
          {[29, 32, 35, 38, 41, 44, 47, 50].map((y) => (
            <line key={y} x1="39" y1={y} x2="45" y2={y} />
          ))}
          <line x1="41" y1="26" x2="41" y2="53" />
          <line x1="43.2" y1="24" x2="43.2" y2="53" />
        </g>
      )}

      {/* The plinth. Thin, splayed, and wider than everything above it, so the
          skyline reads as founded on something — which is the business. Drawn
          last: it passes in front of the towers' feet. */}
      <path d="M6 58 L12 54 H52 L58 58 Z" fill={dark} />
    </svg>
  );
}

/**
 * The full lockup: mark plus the two-line wordmark, in the same stacked
 * arrangement as the supplied artwork.
 *
 * The wordmark is live text in the site's own condensed face rather than
 * outlined paths — it re-colours with the theme, it is selectable, and it stays
 * hinted at 8px where converted outlines go muddy. It is `aria-hidden` because
 * every caller wraps it in a link that already carries the accessible name;
 * without this a screen reader reads the company twice.
 */
export default function Logo({
  size = 34,
  tone = "brand",
  showText = true,
  className = "",
}: {
  size?: number;
  tone?: Tone;
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} tone={tone} className="flex-none" />
      {showText && (
        <span aria-hidden className="flex flex-col leading-none">
          <span className="font-heading text-[17px] font-semibold uppercase tracking-[0.15em] md:text-[18.5px]">
            Felmos
          </span>
          {/* Tracked out to sit flush under the word above it. The target is an
              optical match to FELMOS's width, not a round tracking value —
              hence the different value at md, where the word above grows. */}
          <span className="mt-[3px] font-heading text-[8px] font-medium uppercase tracking-[0.235em] opacity-65 md:text-[8.5px] md:tracking-[0.225em]">
            Engineering Ltd
          </span>
        </span>
      )}
    </span>
  );
}
