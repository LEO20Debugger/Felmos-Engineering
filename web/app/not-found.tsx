import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * The global 404, for URLs that match no route at all.
 *
 * It renders the header and footer itself rather than inheriting them: this
 * file sits at the root, outside the (site) route group that owns the site
 * chrome, because Next only consults a root-level not-found for completely
 * unmatched paths. Without these two imports an unknown URL would render as a
 * bare block of text on an empty page.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="wrap flex min-h-[58vh] flex-col items-start justify-center py-16">
          <span className="kicker mb-3 block">Error 404</span>
          <h1 className="m-0 text-[clamp(30px,8vw,48px)] uppercase leading-[1.05]">
            This drawing isn&apos;t on file
          </h1>
          <p className="mb-8 mt-4 max-w-[46ch] text-[16px] leading-[1.6] opacity-80">
            The page you were looking for doesn&apos;t exist. Head back to the start, or tell us
            what you need tested.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/" className="btn btn-primary no-underline">
              Back to home
              <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
            <Link href="/contact" className="btn btn-secondary text-ink no-underline">
              Book an inspection
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
