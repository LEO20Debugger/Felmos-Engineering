import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCta from "@/components/layout/MobileCta";
import { site } from "@/lib/site";
import "./globals.css";

/* next/font downloads these at build time and serves them from our own origin —
   no request to fonts.googleapis.com, no render-blocking stylesheet. */
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "structural testing",
    "soil investigation",
    "non-destructive testing",
    "building verification",
    "foundation assessment",
    "geotechnical engineering",
    "Lagos",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  /* Static markup can only key the browser chrome off the OS preference; an
     explicit override is applied at runtime by ThemeToggle, which rewrites
     these tags. Both are declared so the first paint is already right for a
     visitor who has never touched the toggle. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f3" },
    { media: "(prefers-color-scheme: dark)", color: "#17191a" },
  ],
  colorScheme: "light dark",
};

/* Runs synchronously as the first thing in <body>, before anything paints, so
   a dark-theme visitor never sees a white frame. Deliberately not a component
   and deliberately dependency-free: if the React bundle is slow, blocked or
   broken, the site is still in the right theme.

   try/catch because localStorage throws outright in Safari's private mode and
   under some cookie-blocking settings — the site should fall back to the OS
   preference there, not fail to render. */
const themeScript = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: site.phone,
  email: site.email,
  foundingDate: String(site.founded),
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
  openingHours: site.hoursStructured,
  areaServed: site.address.region,
  knowsAbout: [
    "Soil investigation",
    "Non-destructive structural testing",
    "Structural integrity assessment",
    "Building structural verification",
    "Foundation assessment",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning: the script below sets data-theme on this
       element before React hydrates, so the server's attribute list and the
       client's necessarily differ. It suppresses the warning for this element
       only, not for the tree beneath it. */
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-bg focus:px-4 focus:py-3 focus:outline focus:outline-2 focus:outline-accent"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MobileCta />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
