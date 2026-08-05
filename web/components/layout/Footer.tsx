import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { bannerCredits } from "@/lib/content";
import { getServices } from "@/lib/cms";
import Logo from "@/components/brand/Logo";

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

export default async function Footer() {
  const services = await getServices();

  return (
    // Extra bottom padding on mobile so the fixed booking bar never covers the
    // final row of links.
    <footer className="border-t border-divider pb-28 pt-14 sm:pb-8 md:pt-16">
      <div className="wrap">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-9">
          <div>
            {/* The footer is where the lockup gets to be a size it deserves —
                the header's 30px is a constraint of the bar, not a preference. */}
            <h2 className="mb-4">
              <Logo size={42} />
              <span className="sr-only">Felmos Engineering</span>
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
                  <Link href={l.href} className="text-[14px] text-ink no-underline hover:text-link">
                    {l.label}
                  </Link>
                </li>
              ))}
              {/* Appended here rather than added to `navLinks`, which also
                  drives the header — /reviews is worth a footer link and a
                  homepage section, but not a seventh item in the top nav. */}
              <li>
                <Link href="/reviews" className="text-[14px] text-ink no-underline hover:text-link">
                  Reviews
                </Link>
              </li>
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
                    className="text-[14px] text-ink no-underline hover:text-link"
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
                <Phone size={15} strokeWidth={1.5} className="flex-none text-link" />
                <div className="flex flex-col gap-0.5">
                  <a href={site.phoneHref} className="text-ink no-underline hover:text-link">
                    {site.phone}
                  </a>
                  <a href={site.secondaryPhoneHref} className="text-ink no-underline hover:text-link">
                    {site.secondaryPhone}
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} strokeWidth={1.5} className="flex-none text-link" />
                <a href={site.emailHref} className="break-all text-ink no-underline hover:text-link">
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} strokeWidth={1.5} className="flex-none text-link" />
                <span className="opacity-80">{site.address.short}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-divider pt-5 text-[12.5px] opacity-60">
          <span>© {new Date().getFullYear()} Felmos Engineering. All rights reserved.</span>
          <span>Certified Structural Testing &amp; Engineering Services</span>
        </div>

        {/* Not a nicety — the banner photographs of Tafawa Balewa Square and the
            National Stadium are CC BY-SA, and naming the photographer is a
            condition of using them. It lives here rather than on the banner
            because the three frames crossfade on a pure-CSS clock: nothing on
            the page knows which photograph is showing, so a per-frame credit
            would mean making the hero a client component. Renders nothing at
            all once every frame is Felmos's own photography. */}
        {bannerCredits.length > 0 && (
          <p className="mt-2.5 text-[11.5px] leading-[1.6] opacity-45">
            Banner photography:{" "}
            {bannerCredits.map((credit, i) => (
              <span key={credit.sourceUrl}>
                {i > 0 && " · "}
                <a
                  href={credit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit underline decoration-current/30 underline-offset-2 hover:decoration-current"
                >
                  {credit.subject}
                </a>{" "}
                by {credit.author} (
                <a
                  href={credit.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit underline decoration-current/30 underline-offset-2 hover:decoration-current"
                >
                  {credit.license}
                </a>
                )
              </span>
            ))}
          </p>
        )}
      </div>
    </footer>
  );
}
