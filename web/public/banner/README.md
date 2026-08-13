# Homepage banner photography

All three frames of the homepage banner are Felmos Engineering's own site
photography, supplied by the company. Nothing here requires attribution, so
`bannerCredits` in `lib/content.ts` derives to an empty list and the footer's
credit line renders nothing.

| File | Shows | Pixels | Headline it plays under |
| --- | --- | --- | --- |
| `soil-investigation-rig.jpg` | Tripod rig boring a foundation hole | 1080×1075 | "What's Really Holding Up Your Building?" |
| `concrete-testing-upv.jpg` | UPV transducers on a cracked column | 2560×1920 | "Need Structural Testing?" |
| `compression-machine.jpg` | Concrete cube crushed in the machine | 1080×810 | "Need Testing Equipment?" |

The pairing in that last column is the point of the set, and the order in
`heroFrames` is what holds it together: the frames and the `HEADLINES` array in
`components/home/Hero.tsx` are matched by index, so reordering one without the
other puts a headline over a photograph that contradicts it. Replacements should
be judged the same way — a frame has to illustrate its headline, not merely look
like construction work.

## Framing

The banner is about 2.2:1 on a desktop and all three originals are squarer than
that, so `object-fit: cover` crops them top and bottom only — the horizontal
half of each `position` never bites above phone widths. The values in
`heroFrames` were picked against the visible band they actually produce at
1280px wide (23%–69%, 23%–84%, 24%–84% of image height respectively), not by
eye.

The rig is the tight one: barely half its height survives, and the top of the
mast is lost at any setting that also keeps the crew in frame. A slightly wider
original — or the same scene shot in landscape — would fix that.

## Resolution

Only the UPV frame is a camera original. The other two arrive at 1080px, well
under the 1920 ceiling in `next.config.ts`'s `deviceSizes`, so next/image serves
them at their native width and the browser stretches them the rest of the way
across a full-bleed banner. They are visibly softer than the UPV frame on a
desktop display; the rig is the first frame and therefore the LCP element, so it
is the one that matters most.

**Ask the company for the camera originals of the rig and the compression
machine.** Phone photographs are typically 3000–4000px, and the 1080px files
here have the file size (130KB and 150KB) of something that has been through a
messaging app. Drop the originals in over the top under the same names and
nothing else needs to change.

## What was here before

Two Wikimedia Commons photographs — Tafawa Balewa Square and the National
Stadium at Surulere, both CC BY-SA 4.0 — stood in while Felmos had no
full-resolution photography of its own. They were handsome and said nothing:
a landmark under "what's really holding up your building" illustrates the
building, not the testing. The files are still in this directory, unreferenced,
and can be deleted once nobody wants them back.
