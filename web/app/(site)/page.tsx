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
import { getProjects } from "@/lib/cms";
import { heroPhotos } from "@/lib/content";
import type { Media } from "@/lib/media";

export default async function HomePage() {
  /* The banner photographs come out of the project galleries. getProjects() is
     cached and the teaser below already calls it, so this is the same request
     rather than a second one — and the banner is still server-rendered, so the
     first frame remains the LCP element rather than appearing after hydration. */
  const gallery = (await getProjects()).flatMap((project) => [
    ...(project.image ? [project.image] : []),
    ...project.gallery,
  ]);

  const banner = heroPhotos
    .map((alt) => gallery.find((image) => image.alt === alt))
    .filter((image): image is Media => Boolean(image));

  return (
    <>
      <Hero photos={banner} />
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
