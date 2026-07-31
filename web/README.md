# Felmos Engineering

Marketing site for a structural testing and engineering practice, built from the
Claude Design project _Felmos Engineering website design_ and its **Industry**
design system.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · zero animation libraries.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What's where

```
app/
  layout.tsx           fonts, metadata, JSON-LD, header/footer/CTA chrome
  page.tsx             home
  about/ services/ contact/
  api/contact/route.ts validated POST endpoint for the booking form
  globals.css          the Industry design system, ported
components/
  layout/              Header (mobile drawer), Footer, MobileCta
  ui/                  Blueprint, Photo, Reveal, Section, PageHead, CtaBand
  home/                Hero, TrustBar, ServiceGrid, Audience, WhyUs, Stats, Testimonials
  process/             ProcessShowcase + ProcessCarousel + ProcessTimeline
  contact/             ContactForm, MapPanel, Faq
lib/
  site.ts              business details - phone, email, address, hours, socials
  content.ts           all page copy: services, process steps, team, FAQs...
  images.ts            every photograph on the site, one URL per slot
```

**All copy lives in `lib/content.ts` and all business details in `lib/site.ts`.**
Edit those two files rather than the components.

## The design system

`app/globals.css` is a port of the Industry token sheet: steel-blue `#5980a6`
on paper `#f2f2f3`, Barlow Condensed over Barlow, square corners, Lucide icons
at stroke-width 1.5.

Tokens are declared once inside Tailwind's `@theme`, so `--color-accent-700` and
`text-accent-700` are the same value. The ported component classes (`.btn`,
`.photo-frame`, `.input`, `.card`, `.tag`) sit in `@layer components` so
ordinary Tailwind utilities still win a conflict. Never hard-code a hex, font
name or radius that a token already carries.

**Two deliberate departures from Industry**, both requested:

- **No blueprint frames.** Industry puts a hairline border and four `+`
  registration marks on every card and figure. Those were removed — cards and
  images are unframed, and depth comes from a soft lift on hover instead.
  Buttons and form inputs keep their outlines so they stay visible and hittable.
- **No duotone.** Industry washes every photograph in the steel accent.
  Photographs now render in full colour.

The accent still carries the brand through type, icons, rules and the closing
CTA band.

## Imagery

All 19 photographs live in one file: **`lib/images.ts`**. Each is a live Unsplash
URL keyed by slot (`hero`, `svc-soil`, `process-3`, `team-1`…).

They are hot-linked, but the visitor's browser never talks to Unsplash:
`next/image` proxies each one through `/_next/image`, resizes it, re-encodes to
AVIF/WebP and caches it on our origin for 30 days. So the page still makes only
same-origin requests, and image weight is whatever the layout actually needs.

To change a photo, swap the id — the segment after `photo-` in any
images.unsplash.com URL:

```ts
hero: U("1531834685032-c34bf0d84c77", 1200, 1500),
//        ^ replace this
```

To use your own photography instead, put the files in `public/images/` and
change the entry to `"/images/hero.jpg"`; `Photo` takes any string source.

The Unsplash License allows commercial use without attribution.

> **The four team portraits are stock people, not Felmos staff.** Replace
> `team-1`…`team-4` with real photographs of the actual team before launch —
> presenting strangers as your named engineers is misleading, and they haven't
> consented to it.

## The process section

`components/process/` is the visual centrepiece — the six stages from request to
recommendation. It renders two ways from one `processSteps` array:

- **below `lg`** — a native CSS scroll-snap carousel: real swipe, numbered
  progress rail, arrows, arrow-key support, autoplay that stops permanently the
  moment the visitor touches it.
- **`lg` and up** — a rail that draws itself on first view, with a large panel
  for the selected stage.

## Motion

CSS keyframes plus a small `IntersectionObserver` in `components/ui/Reveal.tsx`.
No framer-motion, no carousel library.

Reveal animations only hide their content under `html.js` (set by an inline
script in the root layout), so a blocked or broken bundle degrades to plain
visible content rather than a blank page. Everything is gated by
`prefers-reduced-motion`.

## Contact form

`components/contact/ContactForm.tsx` validates client-side and posts to
`app/api/contact/route.ts`, which re-validates and currently just logs. Email
delivery is deliberately not wired up — drop Resend/SendGrid/a CRM webhook into
the marked spot in the route handler. There's an off-screen honeypot field for
bots.

## Before going live

- Replace the placeholder phone number and confirm the address in `lib/site.ts`.
- Set the real domain in `site.url` (drives canonicals, OG tags and the sitemap).
- Wire up email delivery in `app/api/contact/route.ts`.
- Point the footer social links at real profiles.
- Replace the four team portraits with real staff photographs (see **Imagery**).
