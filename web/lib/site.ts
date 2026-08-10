/**
 * Single source of truth for business details.
 * Swap the real values here and they update across every page, the footer,
 * the contact card, the metadata and the JSON-LD.
 */
export const site = {
  name: "Felmos Engineering",
  shortName: "Felmos",
  tagline: "Structural Testing & Engineering Solutions You Can Trust",
  /* Kept near 160 characters — this is the meta description on every page that
     doesn't set its own, and search engines truncate past roughly that. The
     full company subhead (with the LASBCA CAP wording) is set in the hero. */
  description:
    "Indigenous civil engineering firm approved under the Lagos State Building Control Agency CAP. Testing for soil, concrete and structural safety and integrity.",
  url: "https://felmosengineering.com",

  phone: "+234 (0) 811 111 8122",
  phoneHref: "tel:+2348111118122",
  secondaryPhone: "+234 (0) 706 568 0305",
  secondaryPhoneHref: "tel:+2347065680305",
  email: "felmosengineering@gmail.com",
  emailHref: "mailto:felmosengineering@gmail.com",

  address: {
    street: "23 Odozi St, Opp. Dankaro Estate, Ojodu, Berger",
    locality: "Ikeja",
    region: "Lagos",
    postalCode: "101233",
    country: "NG",
    short: "Ojodu Berger, Ikeja, Lagos",
    full: "23 Odozi St, Opp. Dankaro Estate, Ojodu, Berger, Ikeja",
  },
  geo: { lat: 6.6245, lng: 3.368 },
  mapEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.3560%2C6.6155%2C3.3800%2C6.6335&layer=mapnik&marker=6.6245%2C3.3680",
  /* Google Maps by address query rather than by lat/lng: the coordinates below
     are neighbourhood-level, so a pin dropped on them would sit near the office
     but not on it. The query form lets Google resolve the street itself. */
  mapLink:
    "https://www.google.com/maps/search/?api=1&query=23%20Odozi%20Street%2C%20Ojodu%20Berger%2C%20Ikeja%2C%20Lagos%2C%20Nigeria",

  hours: "Mon–Fri 8:00–18:00 · Sat 9:00–13:00",
  hoursStructured: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],

  founded: 2016,

  socials: [
    { label: "LinkedIn", href: "#", icon: "linkedin" as const },
    { label: "X", href: "#", icon: "x" as const },
    { label: "Instagram", href: "#", icon: "instagram" as const },
  ],
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;
