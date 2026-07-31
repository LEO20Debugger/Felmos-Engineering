import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

/*
 * Only what is genuinely global lives here: the html/body elements, the fonts,
 * and the theme script that has to run before first paint.
 *
 * The site's header, footer, mobile CTA and business JSON-LD moved to
 * app/(site)/layout.tsx when /admin was added, so the dashboard no longer
 * renders inside the marketing chrome.
 */

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
    { media: "(prefers-color-scheme: light)", color: "#f1f3f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14181b" },
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
        {children}
      </body>
    </html>
  );
}
