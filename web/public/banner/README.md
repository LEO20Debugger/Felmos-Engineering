# Homepage banner photography

Two of the three frames in the homepage banner are photographs of buildings
Felmos Engineering actually tested, sourced from Wikimedia Commons because the
company's own photographs of these sites top out at 1280px — soft when stretched
across a full-bleed banner. The third frame is Felmos's own, and comes from the
project gallery rather than this directory.

**These files are licensed CC BY-SA 4.0, which obliges us to credit the
photographer visibly.** That credit is rendered in the site footer, driven by
`bannerCredits` in `lib/content.ts`. If you remove a frame from `heroFrames`, its
credit disappears with it automatically — but if you add a photograph here by
hand and wire it up some other way, the attribution is on you.

| File | Commons source | Photographer | Licence |
| --- | --- | --- | --- |
| `tafawa-balewa-square.jpg` | [Tafawa Balewa Square Image.jpg](https://commons.wikimedia.org/wiki/File:Tafawa_Balewa_Square_Image.jpg) | Sidhant Bendre | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `national-stadium-surulere.jpg` | [National Stadium, Surulere - 2024.jpg](https://commons.wikimedia.org/wiki/File:National_Stadium,_Surulere_-_2024.jpg) | Isaacayodele32 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

The stadium is the top-down aerial rather than the better-known elevation of the
main bowl ([also on Commons](https://commons.wikimedia.org/wiki/File:Main-bowl-national-stadium-surulere-lagos.jpg)).
The banner goes nearly square on a phone, and a narrow slice of the elevation is
an unreadable wall of terracing; a slice of the top-down still shows track,
pitch and stands. Checked by reproducing `object-fit: cover` at 375×714,
1280×704 and 2560×616 before choosing.

Both were downloaded at full resolution through `Special:FilePath` (direct
`upload.wikimedia.org/.../thumb/...` URLs are refused), then resized to 2400px
wide at q82 with sharp — 2400 being comfortably above the 1920 ceiling in
`next.config.ts`'s `deviceSizes`, so next/image never has to upscale.

Replace these the day Felmos supplies full-resolution originals of its own site
photography. The 1280px files in `api/seed/deck/` are almost certainly
downscales; if the camera originals still exist, every frame can be their own
work and this directory can go.
