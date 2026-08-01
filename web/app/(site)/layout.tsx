import AttributionCapture from "@/components/layout/AttributionCapture";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCta from "@/components/layout/MobileCta";
import { site } from "@/lib/site";

/**
 * The public website's chrome.
 *
 * This lives in a route group rather than the root layout so that /admin can
 * exist in the same app without inheriting it. Before the split, the dashboard
 * rendered inside the marketing header, footer and sticky "Book inspection"
 * bar, and every admin page carried the business's ProfessionalService JSON-LD
 * — describing the login screen to search engines as a professional service.
 *
 * `(site)` is a route group, so it contributes nothing to the URL: /about is
 * still /about.
 */

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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-bg focus:px-4 focus:py-3 focus:outline focus:outline-2 focus:outline-accent"
      >
        Skip to content
      </a>
      <AttributionCapture />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
