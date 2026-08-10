import type { Metadata } from "next";
import { CalendarClock, Mail, MapPin, Phone } from "lucide-react";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import MapPanel from "@/components/contact/MapPanel";
import Faq from "@/components/contact/Faq";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { faqs } from "@/lib/content";
import { getServices } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Book an Inspection",
  description:
    "Book a structural inspection with Felmos Engineering. Tell us about your project and an engineer will confirm scope and scheduling within one business day.",
  alternates: { canonical: "/contact" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function ContactPage() {
  /* Fetched here rather than inside the form: ContactForm is a client
     component and cannot read the database. */
  const services = await getServices();

  return (
    <>
      <ContactHero />

      <section className="wrap pb-12 pt-10 md:pt-14" aria-label="Contact">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <Reveal>
            <ContactForm serviceTitles={services.map((s) => s.title)} />
          </Reveal>

          <Reveal delay={1} className="flex flex-col gap-5">
            <div className="relative flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <Phone size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <strong className="block text-[13px] uppercase tracking-[0.05em]">Phone</strong>
                  <div className="flex flex-col gap-0.5">
                    <a href={site.phoneHref} className="block break-words text-[14px] text-ink no-underline hover:text-link">
                      {site.phone}
                    </a>
                    <a href={site.secondaryPhoneHref} className="block break-words text-[14px] text-ink no-underline hover:text-link">
                      {site.secondaryPhone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <strong className="block text-[13px] uppercase tracking-[0.05em]">Email</strong>
                  <a href={site.emailHref} className="block break-words text-[14px] text-ink no-underline hover:text-link">
                    {site.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <strong className="block text-[13px] uppercase tracking-[0.05em]">Office</strong>
                  <a
                    href={site.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-words text-[14px] text-ink no-underline hover:text-link"
                  >
                    {site.address.full}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-link" />
                <div className="min-w-0">
                  <strong className="block text-[13px] uppercase tracking-[0.05em]">Business Hours</strong>
                  <span className="block text-[14px] opacity-75">{site.hours}</span>
                </div>
              </div>
            </div>

            <MapPanel />
          </Reveal>
        </div>
      </section>

      <Faq />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
