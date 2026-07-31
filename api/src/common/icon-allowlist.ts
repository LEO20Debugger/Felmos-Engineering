/**
 * The lucide-react icons an editor may choose from.
 *
 * An allowlist rather than "any lucide name" for two reasons:
 *
 *   1. The web app resolves these through an explicitly enumerated map
 *      (web/lib/icons.ts). It cannot do a dynamic `Lucide[name]` lookup —
 *      that defeats Next's optimizePackageImports and pulls all ~1,500 icons
 *      into the client bundle. So the set has to be finite and known, and this
 *      is where it is declared.
 *
 *   2. A name that doesn't exist in the map renders a fallback glyph. Better to
 *      reject it at the API boundary, where the editor gets told, than to ship
 *      a question mark to the public site.
 *
 * The first block is every icon the current hardcoded content uses — those are
 * load-bearing and must not be removed without migrating the rows that
 * reference them. The rest widen the choice for new content.
 *
 * Adding an icon means adding it in BOTH places: here, and in the map in
 * web/lib/icons.ts. The dashboard's picker reads this list from
 * GET /v1/meta/icons, so it needs no third edit.
 */

export const ICON_NAMES = [
  /* ── in use by the seeded content ── */
  "Award",
  "Building2",
  "CalendarCheck",
  "ClipboardCheck",
  "Clock",
  "Compass",
  "Eye",
  "FileCheck2",
  "FileText",
  "FlaskConical",
  "Gauge",
  "Handshake",
  "HardHat",
  "Headset",
  "Home",
  "Landmark",
  "Layers",
  "LineChart",
  "Mountain",
  "Ruler",
  "Scale",
  "Search",
  "ShieldCheck",
  "Target",
  "Users",
  "Waves",

  /* ── available for new content ── */
  "Activity",
  "AlertTriangle",
  "Anchor",
  "Axe",
  "BarChart3",
  "Beaker",
  "Blocks",
  "Bolt",
  "Box",
  "Brain",
  "Briefcase",
  "Brush",
  "Calculator",
  "Camera",
  "CheckCircle2",
  "CircuitBoard",
  "Cog",
  "Construction",
  /* No "Crane" — lucide-react has no such export, and an allowlist entry the
     web app cannot resolve would let an editor pick an icon that renders as
     the fallback glyph on the live site. */
  "Crosshair",
  "Database",
  "Drill",
  "Droplets",
  "Factory",
  "Flame",
  "Fuel",
  "Grid3x3",
  "Hammer",
  "Lightbulb",
  "MapPin",
  "Microscope",
  "Move3d",
  "Package",
  "PencilRuler",
  "Percent",
  "PieChart",
  "Pickaxe",
  "Plug",
  "Radar",
  "Recycle",
  "Route",
  "Sparkles",
  "Split",
  "Stamp",
  "Thermometer",
  "TrafficCone",
  "TrendingUp",
  "Truck",
  "Warehouse",
  "Wrench",
  "Zap",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const ICON_SET: ReadonlySet<string> = new Set(ICON_NAMES);

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && ICON_SET.has(value);
}

/** Rendered when a stored name somehow isn't in the list — a stale row after
    an icon is retired, most likely. Chosen to look deliberate rather than
    broken. */
export const FALLBACK_ICON: IconName = "Wrench";
