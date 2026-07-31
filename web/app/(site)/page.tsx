import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import ServiceShowcase from "@/components/home/ServiceShowcase";
import Audience from "@/components/home/Audience";
import WhyUs from "@/components/home/WhyUs";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import TeamSlider from "@/components/home/TeamSlider";
import ProcessShowcase from "@/components/process/ProcessShowcase";
import Projects from "@/components/home/Projects";
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
      <Projects />
      <Stats />
      <Testimonials />
      {/* Last thing before the CTA, deliberately: the page closes on the people
          who would turn up, then asks for the booking. It also lands on the
          surface band between two plain-ground sections and the accent-900
          CtaBand, so the alternation holds. */}
      <TeamSlider />
      <CtaBand
        title="Need structural testing?"
        lead="Book an inspection and get a certified engineer on site — with a report you can act on."
        cta="Book Your Inspection"
      />
    </>
  );
}
