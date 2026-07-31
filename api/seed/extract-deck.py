"""
Pull the project photographs out of FELMOS PRESENTATION.pptx.

    python -c "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall('unpacked')" "FELMOS PRESENTATION.pptx"
    python extract-deck.py deck
    cd .. && npm run import:deck

Committed even though its output is gitignored: the 35 MB of originals do not
belong in git, so this is what lets anyone reproduce them from the source deck.

Three things it does that a bulk unzip of ppt/media would not:

  - Reading order. The relationship file lists pictures in whatever order
    PowerPoint wrote them; the shape geometry says where they actually sit, so
    photographs come out in the order a reader sees them.
  - Deduplication by content hash. Several projects repeat one photograph
    across a slide pair.
  - Logo rejection. Anything occupying less than MIN_AREA of the slide is
    branding rather than site photography.

What it does NOT do is decide what is publishable. It extracts report title
pages, structural drawings and location screenshots along with everything
else — those carry client reference numbers and laboratory stamps. The
selection lives in deck-projects.json, which names each photograph it wants;
the import script reads that, never this directory listing.
"""

import hashlib
import json
import os
import re
import sys
from xml.etree import ElementTree as ET

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
EMU = 914400

UNPACKED = "unpacked"
MEDIA = os.path.join(UNPACKED, "ppt", "media")

# slug -> slides carrying its photographs
GROUPS = [
    ("tafawa-balewa-square", [2, 3]),
    ("st-nicholas-house", [4, 5]),
    ("eko-electricity-distribution", [6]),
    ("iddo-modern-market", [7]),
    ("british-canadian-university", [8, 9]),
    ("wemabod-marina", [10, 11]),
    ("barracuda-beach-resort", [12, 13]),
    ("lagos-state-college-of-nursing", [14, 15]),
    ("teju-industrial-clinic", [16]),
    ("agl-property-marina", [17]),
    ("high-point-properties", [18, 19]),
    ("bua-group-office-tower", [20, 21]),
    ("gr-estate-development", [22, 23]),
    ("holy-rosary-auditorium", [24, 25]),
    ("citadel-hotel-uromi", [26]),
    ("national-stadium-surulere", [27]),
    ("dynamic-load-testing", [28]),
    # Not projects — equipment and the company slide. Imported unattached.
    ("_equipment", [30]),
]

# Slide-area in square inches below which a picture is a logo, not a photograph.
MIN_AREA = 1.2


def pictures(slide: int):
    rels = {
        r.get("Id"): os.path.basename(r.get("Target"))
        for r in ET.parse(
            os.path.join(UNPACKED, "ppt", "slides", "_rels", f"slide{slide}.xml.rels")
        ).getroot()
    }
    root = ET.parse(os.path.join(UNPACKED, "ppt", "slides", f"slide{slide}.xml")).getroot()

    out = []
    for pic in root.iter(P + "pic"):
        blip = pic.find(".//" + A + "blip")
        xfrm = pic.find(".//" + A + "xfrm")
        if blip is None or xfrm is None:
            continue
        name = rels.get(blip.get(R + "embed"))
        if not name:
            continue

        off, ext = xfrm.find(A + "off"), xfrm.find(A + "ext")
        x, y = int(off.get("x")) / EMU, int(off.get("y")) / EMU
        w, h = int(ext.get("cx")) / EMU, int(ext.get("cy")) / EMU
        if w * h < MIN_AREA:
            continue
        out.append((name, x, y))

    # Reading order: banded by vertical position, then left to right. The half-inch
    # band keeps a row of photos whose tops differ slightly on the same line.
    out.sort(key=lambda p: (round(p[2] * 2), p[1]))
    return [p[0] for p in out]


def main() -> None:
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "deck"
    os.makedirs(out_dir, exist_ok=True)

    manifest = {}
    for slug, slides in GROUPS:
        seen: dict[str, str] = {}
        files: list[str] = []

        for slide in slides:
            for name in pictures(slide):
                raw = open(os.path.join(MEDIA, name), "rb").read()
                digest = hashlib.sha256(raw).hexdigest()

                # The deck repeats a photograph across a slide pair for several
                # projects — one copy each.
                if digest in seen:
                    continue

                ext = os.path.splitext(name)[1].lower()
                ext = ".jpg" if ext in (".jpeg", ".jpg") else ext
                target = f"{slug}-{len(files) + 1:02d}{ext}"
                open(os.path.join(out_dir, target), "wb").write(raw)

                seen[digest] = target
                files.append(target)

        manifest[slug] = files
        print(f"{slug:34s} {len(files)} photographs")

    json.dump(manifest, open(os.path.join(out_dir, "_files.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
