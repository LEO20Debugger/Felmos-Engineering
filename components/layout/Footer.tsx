import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { services } from "@/lib/content";

const socialIcon: Record<string, React.ComponentType<{ size?: number }>> = {
  linkedin: Linkedin,
  x: XIcon,
  instagram: Instagram,
};

/** lucide has no X/Twitter glyph — a 1.5-stroke cross drawn to match the set. */
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export default function Footer() {
  return (
    // Extra bottom padding on mobile so the fixed booking bar never covers the
    // final row of links.
    <footer className="border-t border-divider pb-28 pt-14 sm:pb-8 md:pt-16">
      <div className="wrap">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-9">
          <div>
            <h2 className="mb-3.5 font-heading text-[15px] uppercase tracking-[0.07em]">
              Felmos Engineering
            </h2>
            <p className="mb-4 max-w-[38ch] text-[14px] leading-[1.6] opacity-75">
              Structural testing and engineering services for developers, homeowners,
              contractors and financial institutions.
            </p>
            <div className="flex gap-2.5">
              {site.socials.map((s) => {
                const Icon = socialIcon[s.icon];
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="btn btn-secondary btn-icon text-ink no-underline"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="mb-3.5 font-heading text-[13px] uppercase tracking-[0.07em] opacity-70">
              Quick Links
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-ink no-underline hover:text-accent-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3.5 font-heading text-[13px] uppercase tracking-[0.07em] opacity-70">
              Services
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services#${s.slug}`}
                    className="text-[14px] text-ink no-underline hover:text-accent-700"
                  >
                    {s.title.replace(" & Testing", "").replace(" & Investigation", "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3.5 font-heading text-[13px] uppercase tracking-[0.07em] opacity-70">
              Contact
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px]">
              <li className="flex items-center gap-2">
                <Phone size={15} strokeWidth={1.5} className="flex-none text-accent-700" />
                <a href={site.phoneHref} className="text-ink no-underline hover:text-accent-700">
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} strokeWidth={1.5} className="flex-none text-accent-700" />
                <a href={site.emailHref} className="break-all text-ink no-underline hover:text-accent-700">
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} strokeWidth={1.5} className="flex-none text-accent-700" />
                <span className="opacity-80">{site.address.short}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-divider pt-5 text-[12.5px] opacity-60">
          <span>© {new Date().getFullYear()} Felmos Engineering. All rights reserved.</span>
          <span>Certified Structural Testing &amp; Engineering Services</span>
        </div>
      </div>
    </footer>
  );
}
