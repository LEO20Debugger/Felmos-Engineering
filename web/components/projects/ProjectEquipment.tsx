import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { instruments } from "@/lib/content";
import type { Media } from "@/lib/media";

/**
 * The instruments behind the record above.
 *
 * Sits on /projects rather than /services because it answers a question the
 * project list raises and the service list doesn't: a reader who has just
 * scrolled seventeen buildings that were never cut into wants to know how that
 * was possible. On /services it would be equipment trivia; here it is the
 * evidence for "non-destructive".
 *
 * The photographs are Felmos's own — engineers holding these instruments on
 * real sites. See the note on `instruments` in lib/content.ts for why the
 * manufacturers' product images are not used.
 *
 * `photos` may arrive empty (see `instrumentPhotos`), in which case the list
 * stands on its own across the full width rather than leaving a gap.
 */
export default function ProjectEquipment({ photos }: { photos: Media[] }) {
  const hasPhotos = photos.length > 0;

  return (
    <section className="bg-surface" aria-label="Testing equipment">
      <div className="wrap py-12 md:py-16">
        <SectionHead
          kicker="The Instruments"
          title="What The Testing Runs On"
          lead="Every survey above was carried out without cutting into the structure. This is the equipment that makes that possible — each reading taken through the finished face."
        />

        <div
          className={
            hasPhotos
              ? "grid grid-cols-1 items-start gap-x-12 gap-y-9 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
              : ""
          }
        >
          {hasPhotos ? (
            /* The lead photograph gets the space; the other two sit under it as
               a pair. One large image reads as evidence, three equal thumbnails
               read as a gallery — and the gallery on each project page is
               already doing that job. */
            <div className="flex flex-col gap-3">
              <Reveal>
                <Photo
                  src={photos[0] as Media}
                  alt={(photos[0] as Media).alt}
                  ratio="4/3"
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  zoom={false}
                />
              </Reveal>

              {photos.length > 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.slice(1, 3).map((photo, i) => (
                    <Reveal key={photo.id} delay={i + 1}>
                      <Photo
                        src={photo}
                        alt={photo.alt}
                        ratio="1/1"
                        sizes="(max-width: 1024px) 50vw, 19vw"
                        zoom={false}
                      />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <ul
            className={`m-0 grid list-none grid-cols-1 gap-x-6 gap-y-7 p-0 ${
              hasPhotos ? "sm:grid-cols-2 lg:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {instruments.map((instrument, i) => {
              const Icon = instrument.icon;

              return (
                <Reveal as="li" key={instrument.name} delay={i % 3}>
                  <div className="flex gap-4">
                    {/* The icon sits in its own circle, which is what keeps it
                        legible on the surface band in both themes. */}
                    <span
                      aria-hidden
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-divider bg-bg text-link"
                    >
                      <Icon size={21} strokeWidth={1.5} />
                    </span>

                    <div className="min-w-0">
                      <strong className="font-heading text-[15.5px] uppercase leading-tight text-ink">
                        {instrument.name}
                      </strong>
                      <p className="m-0 mt-1.5 text-[14px] leading-[1.6] opacity-70">
                        {instrument.measures}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
