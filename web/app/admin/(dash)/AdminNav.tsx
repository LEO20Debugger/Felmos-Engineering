"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  Image as ImageIcon,
  Inbox,
  Newspaper,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Bottom tab bar on phones, sidebar from md up — see admin.css.
 *
 * Only the first five entries appear on the tab bar; the rest live behind
 * "More". A phone tab bar with nine targets is unusable, and the ones that get
 * cut are the ones reached occasionally rather than daily.
 */

const PRIMARY = [
  { href: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/projects", label: "Projects", icon: Briefcase },
  { href: "/admin/insights", label: "Insights", icon: Newspaper },
] as const;

const SECONDARY = [
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/testimonials", label: "Quotes", icon: Building2 },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings, ownerOnly: true },
] as const;

export function AdminNav({ role }: { role: "owner" | "editor" }) {
  const pathname = usePathname();

  const isCurrent = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const items = [
    ...PRIMARY,
    ...SECONDARY.filter((i) => !("ownerOnly" in i && i.ownerOnly) || role === "owner"),
  ];

  return (
    <nav className="adm-nav" aria-label="Dashboard">
      {items.map(({ href, label, icon: Icon, ...rest }, index) => (
        <Link
          key={href}
          href={href}
          aria-current={
            isCurrent(href, "exact" in rest ? rest.exact : false) ? "page" : undefined
          }
          /* Overflow items are hidden from the phone tab bar by CSS, not an
             inline style — an inline `display:none` would outrank the media
             query and hide them on desktop as well. */
          className={index >= 5 ? "adm-nav-overflow" : undefined}
        >
          <Icon size={20} aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
