import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import type { Media } from "@/lib/media";

/**
 * The supporting photographs from a project.
 *
 * Site photography is the one thing a testing company has that a competitor's
 * copy cannot claim — a page that says work was done reads differently from one
 * that shows an engineer holding a meter against a beam. So these are given
 * real size rather than being tucked into a thumbnail strip.
 *
 * No lightbox. Each photograph is already served at a width the layout asked
 * for, a lightbox would mean a client component and a focus trap, and the
 * things worth looking closely at here are conditions, not detail.
 *
 * Alt text comes from the media row. It is written once, when the image is
 * uploaded or imported, and edited on the media page — never regenerated here
 * from the project's title, which would describe every photograph identically.
 */
export default function ProjectGallery({ images }: { images: Media[] }) {
  if (images.length === 0) return null;

  return (
    <section className="wrap pb-14 md:pb-20" aria-label="Photographs from site">
      <SectionHead
        kicker="On Site"
        title="Photographs From The Work"
        lead={`${images.length} ${images.length === 1 ? "photograph" : "photographs"} taken during the survey.`}
      />

      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, i) => (
          <Reveal as="li" key={image.id} delay={i % 3}>
            <figure className="m-0">
              <Photo
                src={image}
                alt={image.alt}
                ratio="4/3"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                zoom={false}
              />
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
