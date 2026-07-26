/**
 * Single source of truth for business details.
 * Swap the real values here and they update across every page, the footer,
 * the contact card, the metadata and the JSON-LD.
 */
export const site = {
  name: "Felmos Engineering",
  shortName: "Felmos",
  tagline: "Structural Testing & Engineering Solutions You Can Trust",
  description:
    "Certified structural testing, soil investigation and building verification for developers, homeowners, contractors and lenders.",
  url: "https://felmosengineering.com",

  phone: "+1 (555) 014-2887",
  phoneHref: "tel:+15550142887",
  email: "info@felmosengineering.com",
  emailHref: "mailto:info@felmosengineering.com",

  address: {
    street: "25 Odozi St, Ojodu",
    locality: "Ikeja",
    region: "Lagos",
    postalCode: "101233",
    country: "NG",
    short: "Ojodu, Ikeja, Lagos",
    full: "25 Odozi St, Ojodu, Ikeja 101233, Lagos",
  },
  geo: { lat: 6.6245, lng: 3.368 },
  mapEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=3.3560%2C6.6155%2C3.3800%2C6.6335&layer=mapnik&marker=6.6245%2C3.3680",
  mapLink: "https://www.openstreetmap.org/?mlat=6.6245&mlon=3.3680#map=16/6.6245/3.3680",

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
  { label: "Contact", href: "/contact" },
] as const;
