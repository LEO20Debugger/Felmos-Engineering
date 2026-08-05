import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import ServiceShowcase from "@/components/home/ServiceShowcase";
import Audience from "@/components/home/Audience";
import WhyUs from "@/components/home/WhyUs";
import Stats from "@/components/home/Stats";
import Reviews from "@/components/home/Reviews";
import TeamSlider from "@/components/home/TeamSlider";
import ProcessShowcase from "@/components/process/ProcessShowcase";
import Projects from "@/components/home/Projects";
import CtaBand from "@/components/ui/CtaBand";
import { getProjects } from "@/lib/cms";
import { heroFrames } from "@/lib/content";
import { images } from "@/lib/images";
import { focalPosition, mediaUrl } from "@/lib/media";

export default async function HomePage() {
  /* Resolve the banner here rather than in Hero, so the banner component takes
     finished frames and stays free of both the CMS and the image helpers.

     getProjects() is cached and the teaser below already calls it, so this is
     the same request rather than a second one — and the banner is still
     server-rendered, so its first frame remains the LCP element rather than
     appearing after hydration. */
  const gallery = (await getProjects()).flatMap((project) => [
    ...(project.image ? [project.image] : []),
    ...project.gallery,
  ]);

  const banner = heroFrames.map((frame) => {
    if (frame.source === "stock") {
      return { src: images[frame.image], alt: frame.alt, position: "center" };
    }

    /* Served straight off public/ — next/image optimises a local path exactly
       as it does a remote one, so this needs no next.config allowlist entry. */
    if (frame.source === "local") {
      return { src: frame.src, alt: frame.alt, position: frame.position ?? "center" };
    }

    const photo = gallery.find((image) => image.alt === frame.alt);

    return photo
      ? {
          /* Width only, so the API returns the whole photograph rather than a
             centre crop and object-position does the framing. */
          src: mediaUrl(photo, 1600),
          alt: photo.alt,
          position: focalPosition(photo),
        }
      : {
          src: images[frame.fallback],
          alt: frame.fallbackAlt,
          position: "center",
        };
  });

  return (
    <>
      <Hero frames={banner} />
      <TrustBar />
      <ServiceShowcase />
      <Audience />
      <WhyUs />
      <ProcessShowcase />
      <Projects />
      <Stats />
      <Reviews />
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
