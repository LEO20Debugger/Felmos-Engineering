"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Image as ImageIcon,
  Inbox,
  Newspaper,
  Settings,
  Star,
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
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings, ownerOnly: true },
] as const;

export function AdminNav({
  role,
  pendingReviews = 0,
}: {
  role: "owner" | "editor";
  /** Visitor submissions waiting on a decision. Counted on the server in the
      dashboard layout — this is a client component and cannot read the API. */
  pendingReviews?: number;
}) {
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
          {/* Reviews is the only item with a count, because it is the only one
              where something arrives without anybody here doing anything. The
              number is in the link text for screen readers rather than being a
              purely visual dot. */}
          {href === "/admin/reviews" && pendingReviews > 0 ? (
            <span className="adm-nav-badge">
              {pendingReviews > 99 ? "99+" : pendingReviews}
              <span className="adm-sr-only"> awaiting approval</span>
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
