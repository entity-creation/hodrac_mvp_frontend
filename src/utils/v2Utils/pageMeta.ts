// Titles and descriptions for the indexable static pages. Used by App.tsx at
// runtime and by scripts/prerender.ts at build time, so both stay in sync.
// An empty title means the home page title.
export const STATIC_PAGE_META = {
  "/": {
    title: "",
    description: "Discover trips matched to how you like to travel. Ready-made itineraries, destinations and travel buddies on Hodrac.",
  },
  "/explore/wishlists": {
    title: "Explore trip itineraries",
    description: "Browse ready-made trip itineraries by budget, length and travel style, and save the ones that suit you.",
  },
  "/explore/destinations": {
    title: "Explore destinations",
    description: "Find places to visit with local tips, typical daily costs, safety notes and the best time to go.",
  },
  "/browse-trip": {
    title: "Find travel buddies",
    description: "Browse upcoming trips posted by other travellers and ask to join one that fits your plans.",
  },
  "/partners": {
    title: "Partner with Hodrac",
    description: "Reach travellers who are actively planning trips. Learn how travel businesses partner with Hodrac.",
  },
  "/contact-us": {
    title: "Contact us",
    description: "Questions, feedback or partnership enquiries? Get in touch with the Hodrac team.",
  },
  "/about": {
    title: "About",
    description: "Hodrac makes travel easier, smarter and more enjoyable for anyone who wants to explore the world.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms for using Hodrac, operated by Ionva Limited.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Hodrac collects, uses and protects your personal data, and the choices you have.",
  },
} as const;

export type StaticPagePath = keyof typeof STATIC_PAGE_META;

export const HOME_TITLE = "Hodrac, your portal to the world";

export const DEFAULT_DESCRIPTION =
  "Making travel easier, smarter, and more enjoyable for anyone who wants to explore the world.";

// "<title> · Hodrac", or the home title when there's no page title.
export const fullTitle = (title?: string) => (title ? `${title} · Hodrac` : HOME_TITLE);

// Fallback description for a destination without an overview.
export const destinationFallbackDescription = (name: string, location?: string | null) =>
  `${[name, location].filter(Boolean).join(", ")}. Tips, costs and itineraries on Hodrac.`;
