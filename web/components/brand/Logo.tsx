/* ==========================================================================
   The Felmos mark, vectorised from the supplied artwork.

   The geometry below is a machine trace of logo.png at the repo root, not a
   redrawing. Every vertex was measured off that file's pixels and the result
   was rendered back and diffed against it: the silhouettes agree to within one
   pixel everywhere (every disagreeing pixel sits on an antialiased edge). An
   earlier version of this file was drawn by eye and had drifted badly — it
   carried a splayed single plinth and a short flat-topped left tower, neither
   of which is in the artwork, which actually has two mirrored navy wedges each
   with its own splayed foot.

   Kept as inline SVG rather than shipping the PNG for three reasons:

     - it is one colour system with the site. The masses are painted from
       --logo-mass / --color-signal / --color-accent-500, so if the brand ramp
       is ever retuned the logo moves with it instead of drifting out of step
       with the buttons. Those three tokens were sampled from this artwork to
       begin with (#143855 / #00a859 / #2d9dd5 in the file).
     - it survives dark mode. The navy wedges are near-black on paper and would
       disappear against the charcoal page; --logo-mass is re-pointed by the
       dark theme, and `tone="onDark"` lifts them explicitly.
     - it is sharp at 22px in the header and at 512px in a share card, and
       costs ~1kB inline rather than a network request in the LCP path.

   COORDINATES ARE THE ARTWORK'S OWN PIXELS. The viewBox is offset to the
   drawing's bounding box (x 10..332, y 18..444 of the 340x450 source) rather
   than normalised to zero, precisely so that anyone who re-measures logo.png
   gets numbers that can be compared against these directly.

   The mark is portrait — 322x426, about 3:4. `size` is therefore its HEIGHT
   and the width follows; the two are not interchangeable as they were when
   this was a square 64-grid.
   ========================================================================== */

const VB_W = 322;
const VB_H = 426;

/* The glazed tower's mullions: a vertical seam plus six floor lines that rake
   up to the right. Endpoints are the traced intersections with the tower's own
   outline — the top line stops early against the chamfer, the rest run to the
   right edge — which is why they are listed rather than generated from a
   slope. Held at the artwork's own hairline weight: they are meant to vanish
   into solid blue below roughly 40px, which is the correct degradation for a
   detail this fine rather than a loss. */
const MULLIONS =
  "M193.5 175.5V340M193.5 220.7 229.4 197.4M193.5 240.4 238.5 211.1" +
  "M193.5 260 238.5 230.8M193.5 279.7 238.5 250.5M193.5 299.4 238.5 270.1" +
  "M193.5 319 238.5 289.8";

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
      width={(size * VB_W) / VB_H}
      height={size}
      viewBox={`10 18 ${VB_W} ${VB_H}`}
      fill="none"
      role="presentation"
      aria-hidden
      focusable="false"
      className={className}
    >
      {/* The pylon. Full height of the mark, chamfered off its top left, and
          stepping in halfway down to a narrow shaft that carries on to the
          baseline. It is what the mark is *of*, and it is the only mass that
          touches both the top and the bottom of the box. */}
      <path d="M169.5 18 106.5 60V157L150 195V443.5H169.5Z" fill={green} />

      {/* Glazed tower. Chamfered top left, and cut away bottom right on the
          same rake as its mullions, leaving a narrow shaft that drops to the
          baseline alongside the pylon's. The transparent hairlines either side
          of that shaft are structural, not spacing — close them and the three
          masses merge into one silhouette. */}
      <path d="M173.5 163 238.5 203V309L193.5 340V443.5H173.5Z" fill={glass} />

      {/* Dropped in mono: at mask-icon sizes these fill the tower in rather
          than reading as glazing. */}
      {!isMono && (
        <path
          d={MULLIONS}
          stroke="var(--color-on-dark)"
          strokeWidth="1.2"
          opacity="0.95"
        />
      )}

      {/* The two navy wedges, left then right. Mirrored but not identical —
          the right one is both taller and steeper. Each is a raked mass on a
          splayed foot, and the two feet together read as the baseline the
          skyline is founded on, which is the business. They are drawn last so
          they pass in front of the towers' feet. */}
      <path d="M93.5 252 145.5 293V443.5H10L23 425.5H93.5Z" fill={dark} />
      <path d="M255.5 304 196.5 344V443.5H331.5L318 425.5H255.5Z" fill={dark} />
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
