# Homepage banner photography

The banner runs four frames. Two of them are Felmos Engineering's own site
photography, supplied by the company, and live in this directory; the other two
are stock (`hero-piles`, `hero-subsoil` in `lib/images.ts`), standing in until
Felmos supplies a photograph of a pile test and of a second borehole. Nothing in
either set requires attribution, so `bannerCredits` in `lib/content.ts` derives
to an empty list and the footer's credit line renders nothing.

| Frame | File / source | Shows | Pixels | Headline it plays under |
| --- | --- | --- | --- | --- |
| 1 | `soil-investigation-rig.jpg` | Tripod rig boring a foundation hole | 1080×1075 | "What's Really Holding Up Your Building?" |
| 2 | `hero-piles` (Pexels) | Piling rig below high-rise blocks | 2000×1000 | "Sure the Piles Will Hold?" |
| 3 | `hero-subsoil` (Pexels) | Worker operating a large drilling rig | 2000×1000 | "Know What You're Building On?" |
| 4 | `concrete-testing-upv.jpg` | UPV transducers on a cracked column | 2560×1920 | "A Crack That Keeps Coming Back?" |

The pairing in that last column is the point of the set, and the order in
`heroFrames` is what holds it together: the frames and the `HEADLINES` array in
`components/home/Hero.tsx` are matched by index, so reordering one without the
other puts a headline over a photograph that contradicts it. Replacements should
be judged the same way — a frame has to illustrate its headline, not merely look
like construction work.

`compression-machine.jpg` (1080×810, a concrete cube crushed between the
platens) is still here but no longer in the rotation: it illustrated the "Need
Testing Equipment?" headline, which the four-slide set does not carry. Keep it —
it is Felmos's own and the obvious frame if an equipment slide returns.

## Framing

The banner is about 2.2:1 on a desktop and both local originals are squarer than
that, so `object-fit: cover` crops them top and bottom only — the horizontal
half of each `position` never bites above phone widths. The values in
`heroFrames` were picked against the visible band they actually produce at
1280px wide (23%–69% and 23%–84% of image height respectively), not by eye.

The two stock frames need no `position` and carry none: they are requested from
Pexels at 2000×1000, which is already the banner's shape, so `cover` has almost
nothing left to crop.

The rig is the tight one: barely half its height survives, and the top of the
mast is lost at any setting that also keeps the crew in frame. A slightly wider
original — or the same scene shot in landscape — would fix that.

## Resolution

Only the UPV frame is a camera original. The rig arrives at 1080px, well under
the 1920 ceiling in `next.config.ts`'s `deviceSizes`, so next/image serves it at
its native width and the browser stretches it the rest of the way across a
full-bleed banner. It is visibly softer than the UPV frame on a desktop display,
and it is the first frame and therefore the LCP element, so it is the one that
matters most.

**Ask the company for the camera original of the rig.** Phone photographs are
typically 3000–4000px, and the 1080px file here has the file size (130KB) of
something that has been through a messaging app. Drop the original in over the
top under the same name and nothing else needs to change. The same applies to
`compression-machine.jpg` (150KB) if that frame ever returns.

## What was here before

Two Wikimedia Commons photographs — Tafawa Balewa Square and the National
Stadium at Surulere, both CC BY-SA 4.0 — stood in while Felmos had no
full-resolution photography of its own. They were handsome and said nothing:
a landmark under "what's really holding up your building" illustrates the
building, not the testing. The files are still in this directory, unreferenced,
and can be deleted once nobody wants them back.
