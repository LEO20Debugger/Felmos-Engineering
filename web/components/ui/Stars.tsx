import { Star } from "lucide-react";

/**
 * A star rating, read-only.
 *
 * Fractions matter here: the aggregate is 4.8, not 5, and rounding it to five
 * filled stars would overstate the site's own rating on the most prominent
 * badge it has. So this draws five outlines and lays a filled copy over them,
 * clipped to the exact proportion — which also means a 4.8 and a 4.6 look
 * different, rather than both becoming "five stars".
 *
 * The icons are hidden from assistive tech and the whole group carries one
 * label. Five separate "star" announcements is not a rating.
 */
export default function Stars({
  value,
  size = 15,
  label,
  className = "",
}: {
  /** 0–5. Values outside the range are clamped rather than rejected — this is
      a display component, and a bad number should not take a page down. */
  value: number;
  size?: number;
  /** Overrides the default "4.8 out of 5" announcement. */
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;

  /* Trailing zero trimmed: "5" reads better than "5.0", and the average is
     already rounded to one place by the API. */
  const spoken = label ?? `${Number(clamped.toFixed(1))} out of 5`;

  const row = (filled: boolean) => (
    <span className="flex" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={filled ? "text-link" : "text-divider"}
          fill={filled ? "currentColor" : "none"}
        />
      ))}
    </span>
  );

  return (
    <span
      role="img"
      aria-label={spoken}
      className={`relative inline-flex flex-none align-middle ${className}`}
    >
      {row(false)}
      {/* The filled copy, clipped to the rating. `overflow-hidden` on a sized
          wrapper rather than a CSS mask — masks are still uneven across
          browsers and this needs no fallback. */}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${percent}%` }}
        aria-hidden
      >
        {row(true)}
      </span>
    </span>
  );
}
