"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { navLinks, site } from "@/lib/site";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* Condense the bar and draw its hairline once the page has moved. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Any navigation closes the drawer. */
  useEffect(() => setOpen(false), [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  /* While open: lock the page, trap focus, and honour Escape. */
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open, close]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-b border-divider bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur-md"
          : "border-b border-transparent bg-bg"
      }`}
    >
      <div className="wrap flex items-center gap-6" style={{ height: "var(--header-h)" }}>
        <Link
          href="/"
          className="font-heading text-[18px] font-semibold uppercase tracking-[0.01em] text-ink no-underline md:text-[19px]"
        >
          Felmos <span className="text-accent-700">Engineering</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="mr-auto hidden lg:flex lg:gap-7" aria-label="Primary">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative py-1.5 font-body text-[14.5px] font-medium no-underline transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                isActive(l.href)
                  ? "text-accent-700 after:scale-x-100"
                  : "text-ink hover:text-accent-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          <a href={site.phoneHref} className="btn btn-secondary text-ink no-underline">
            <Phone size={16} strokeWidth={1.5} />
            {site.phone}
          </a>
          <Link href="/contact" className="btn btn-primary no-underline">
            Book Inspection
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="btn btn-secondary btn-icon ml-auto lg:hidden"
        >
          {/* The open drawer covers this bar and carries its own close button. */}
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Reading-progress hairline. Driven entirely by CSS scroll-timeline —
          no scroll listener, no re-renders. */}
      <div className="scroll-progress" aria-hidden />

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="fixed inset-0 z-[60] flex flex-col bg-bg lg:hidden"
      >
        <div
          className="wrap flex items-center justify-between border-b border-divider"
          style={{ height: "var(--header-h)" }}
        >
          <span className="font-heading text-[18px] font-semibold uppercase">
            Felmos <span className="text-accent-700">Engineering</span>
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="btn btn-secondary btn-icon"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="wrap flex-1 overflow-y-auto py-4" aria-label="Mobile">
          <ul className="m-0 list-none p-0">
            {navLinks.map((l, i) => (
              <li key={l.href} className="border-b border-divider">
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  style={{ animationDelay: `${60 + i * 55}ms` }}
                  className={`block py-5 font-heading text-[26px] font-semibold uppercase no-underline ${
                    open ? "animate-[fx-rise_0.5s_var(--ease-out-quint)_both]" : ""
                  } ${isActive(l.href) ? "text-accent-700" : "text-ink"}`}
                >
                  <span className="mr-3 align-middle font-mono text-[12px] tracking-widest text-accent-700 opacity-70">
                    0{i + 1}
                  </span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="wrap flex flex-col gap-2.5 border-t border-divider py-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <Link href="/contact" className="btn btn-primary btn-block no-underline">
            Book Inspection
          </Link>
          <a href={site.phoneHref} className="btn btn-secondary btn-block text-ink no-underline">
            <Phone size={16} strokeWidth={1.5} />
            {site.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
