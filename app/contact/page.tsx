import type { Metadata } from "next";
import { CalendarClock, Mail, MapPin, Phone } from "lucide-react";
import PageHead from "@/components/ui/PageHead";
import ContactForm from "@/components/contact/ContactForm";
import MapPanel from "@/components/contact/MapPanel";
import Faq from "@/components/contact/Faq";
import Reveal from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { faqs } from "@/lib/content";

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

const details = [
  { icon: Phone, label: "Phone", value: site.phone, href: site.phoneHref },
  { icon: Mail, label: "Email", value: site.email, href: site.emailHref },
  { icon: MapPin, label: "Office", value: site.address.full },
  { icon: CalendarClock, label: "Business Hours", value: site.hours },
];

export default function ContactPage() {
  return (
    <>
      <PageHead
        kicker="Get Started"
        title="Book a Structural Inspection"
        lead="Tell us about your project and preferred date — an engineer confirms scope and scheduling within one business day."
      />

      <section className="wrap pb-12" aria-label="Contact">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={1} className="flex flex-col gap-5">
            <div className="relative flex flex-col gap-4 p-6">
              {details.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={22} strokeWidth={1.5} className="mt-0.5 flex-none text-accent-700" />
                  <div className="min-w-0">
                    <strong className="block text-[13px] uppercase tracking-[0.05em]">{label}</strong>
                    {href ? (
                      <a href={href} className="block break-words text-[14px] text-ink no-underline hover:text-accent-700">
                        {value}
                      </a>
                    ) : (
                      <span className="block text-[14px] opacity-75">{value}</span>
                    )}
                  </div>
                </div>
              ))}
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
