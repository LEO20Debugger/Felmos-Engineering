"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { site } from "@/lib/site";

/**
 * A persistent booking bar on mobile / floating button on desktop.
 * Hidden on /contact (where the form already is) and until the visitor has
 * scrolled past the hero, so it never covers the first screen.
 */
export default function MobileCta() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/contact")) return null;

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-divider bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md transition-all duration-500 md:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <a
        href={site.phoneHref}
        tabIndex={shown ? 0 : -1}
        className="btn btn-secondary flex-none bg-bg text-ink no-underline"
        aria-label={`Call ${site.phone}`}
      >
        <Phone size={18} strokeWidth={1.5} />
      </a>
      <Link
        href="/contact"
        tabIndex={shown ? 0 : -1}
        className="btn btn-primary flex-1 no-underline shadow-lg"
      >
        <CalendarCheck size={18} strokeWidth={1.5} />
        Book Inspection
      </Link>
    </div>
  );
}
