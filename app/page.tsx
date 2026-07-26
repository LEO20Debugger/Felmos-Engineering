import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import ServiceShowcase from "@/components/home/ServiceShowcase";
import Audience from "@/components/home/Audience";
import WhyUs from "@/components/home/WhyUs";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import ProcessShowcase from "@/components/process/ProcessShowcase";
import CtaBand from "@/components/ui/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServiceShowcase />
      <Audience />
      <WhyUs />
      <ProcessShowcase />
      <Stats />
      <Testimonials />
      <CtaBand
        title="Need structural testing?"
        lead="Book an inspection and get a certified engineer on site — with a report you can act on."
        cta="Book Your Inspection"
      />
    </>
  );
}
