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
  themeColor: "#f2f2f3",
  colorScheme: "light",
};

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
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
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
