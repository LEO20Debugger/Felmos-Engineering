import SectionHead from "@/components/ui/Section";
import ProcessCarousel from "./ProcessCarousel";
import ProcessTimeline from "./ProcessTimeline";

/**
 * "From Request to Recommendation" — the visual anchor of the site.
 * Two presentations of the same six stages: a swipeable carousel below lg,
 * a drawn timeline above it. Only one is ever mounted's worth of DOM visible;
 * both read from processSteps in lib/content.ts.
 */
export default function ProcessShowcase() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Our process">
      <SectionHead
        kicker="Our Process"
        title="From Request to Recommendation"
        lead="Six stages, one engineer accountable throughout."
      />
      <ProcessCarousel />
      <ProcessTimeline />
    </section>
  );
}
