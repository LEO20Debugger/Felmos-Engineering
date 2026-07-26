"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { site } from "@/lib/site";

/**
 * The OpenStreetMap embed is the single heaviest thing on the page and almost
 * nobody uses it, so it stays behind a poster until asked for — no third-party
 * request on first paint.
 */
export default function MapPanel() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative aspect-[16/11] w-full">
      {loaded ? (
        <iframe
          title="Felmos Engineering office location"
          src={site.mapEmbed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0 [filter:grayscale(.3)_contrast(1.05)]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-accent-900 text-on-dark transition-colors hover:bg-accent-800"
        >
          <MapPin size={30} strokeWidth={1.5} />
          <span className="font-heading text-[16px] uppercase tracking-[0.04em]">
            {site.address.short}
          </span>
          <span className="text-[12.5px] opacity-75">Tap to load the map</span>
        </button>
      )}
      <a
        href={site.mapLink}
        target="_blank"
        rel="noreferrer noopener"
        className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 bg-bg px-2.5 py-1.5 text-[12px] text-ink no-underline hover:text-link"
      >
        Directions
        <ExternalLink size={13} strokeWidth={1.5} />
      </a>
    </div>
  );
}
