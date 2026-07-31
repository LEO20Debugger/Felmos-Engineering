import type { LucideProps } from "lucide-react";
import {
  Activity, AlertTriangle, Anchor, Award, Axe, BarChart3, Beaker, Blocks,
  Bolt, Box, Brain, Briefcase, Brush, Building2, Calculator, CalendarCheck,
  Camera, CheckCircle2, CircuitBoard, ClipboardCheck, Clock, Cog, Compass,
  Construction, Crosshair, Database, Drill, Droplets, Eye, Factory,
  FileCheck2, FileText, Flame, FlaskConical, Fuel, Gauge, Grid3x3, Hammer,
  Handshake, HardHat, Headset, Home, Landmark, Layers, Lightbulb, LineChart,
  MapPin, Microscope, Mountain, Move3d, Package, PencilRuler, Percent,
  Pickaxe, PieChart, Plug, Radar, Recycle, Route, Ruler, Scale, Search,
  ShieldCheck, Sparkles, Split, Stamp, Target, Thermometer, TrafficCone,
  TrendingUp, Truck, Users, Warehouse, Waves, Wrench, Zap,
} from "lucide-react";

/**
 * Icon names to components.
 *
 * Two reasons this map exists rather than the icons being passed around
 * directly, as they were when the content lived in a TypeScript array:
 *
 *   1. A React component cannot cross the server/client boundary as a prop —
 *      function components aren't serializable. Several of the components that
 *      render these are client components (the service showcase, the process
 *      timeline, the contact form's service list), so the data has to carry a
 *      string and the resolution has to happen on the client side of the line.
 *
 *   2. It has to be enumerated explicitly. `Lucide[name]` would be shorter and
 *      would defeat Next's optimizePackageImports, pulling all ~1,500 icons
 *      into the bundle instead of the ~75 actually used. Do not "simplify"
 *      this into a dynamic lookup.
 *
 * Adding an icon means adding it here AND to ICON_NAMES in the API's
 * common/icon-allowlist.ts — the API rejects any name it doesn't know, so the
 * two lists have to agree.
 */
const ICONS = {
  Activity, AlertTriangle, Anchor, Award, Axe, BarChart3, Beaker, Blocks,
  Bolt, Box, Brain, Briefcase, Brush, Building2, Calculator, CalendarCheck,
  Camera, CheckCircle2, CircuitBoard, ClipboardCheck, Clock, Cog, Compass,
  Construction, Crosshair, Database, Drill, Droplets, Eye, Factory,
  FileCheck2, FileText, Flame, FlaskConical, Fuel, Gauge, Grid3x3, Hammer,
  Handshake, HardHat, Headset, Home, Landmark, Layers, Lightbulb, LineChart,
  MapPin, Microscope, Mountain, Move3d, Package, PencilRuler, Percent,
  Pickaxe, PieChart, Plug, Radar, Recycle, Route, Ruler, Scale, Search,
  ShieldCheck, Sparkles, Split, Stamp, Target, Thermometer, TrafficCone,
  TrendingUp, Truck, Users, Warehouse, Waves, Wrench, Zap,
} as const;

export type IconName = keyof typeof ICONS;

export const isIconName = (value: string): value is IconName =>
  value in ICONS;

/**
 * Render an icon by name.
 *
 * Falls back to a neutral glyph rather than throwing: an unknown name means a
 * row referencing an icon that has since been retired, and a missing icon
 * should not blank out a whole page of the live site.
 */
export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Component = ICONS[name as IconName] ?? Wrench;
  return <Component {...props} />;
}
