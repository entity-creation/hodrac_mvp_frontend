// Small display helpers shared by cards, the landing page and detail pages.

const VIBE_EMOJI: Record<string, string> = {
  Anime: "⛩️",
  Food: "🍜",
  Luxury: "✨",
  Relaxation: "🧘",
  Nightlife: "🌙",
  Nature: "🌿",
  Culture: "🎭",
  Adventure: "🧗",
  Budget: "💸",
  Romance: "💑",
  Beach: "🏖️",
  History: "🏛️",
  Shopping: "🛍️",
};

export function vibeEmoji(tags: string[] = []): string {
  for (const tag of tags) {
    if (VIBE_EMOJI[tag]) return VIBE_EMOJI[tag];
  }
  return "🌏";
}

// Quiet placeholder tones for cards without a photo, picked deterministically
// from an id so a card keeps the same tone everywhere it appears.
const COLOURWAYS = [
  { bg: "bg-cream-deep", accent: "bg-ink", text: "text-ink", from: "#f1f0ec", to: "#e6e4df" },
  { bg: "bg-grape-100", accent: "bg-ink", text: "text-ink", from: "#eeece7", to: "#e2dfd8" },
  { bg: "bg-sky-100", accent: "bg-ink", text: "text-ink", from: "#eef0f1", to: "#dfe3e6" },
  { bg: "bg-sun-100", accent: "bg-ink", text: "text-ink", from: "#f7f3ea", to: "#ece3d0" },
] as const;

export type Colourway = (typeof COLOURWAYS)[number];

export function colourwayFor(id: string): Colourway {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return COLOURWAYS[Math.abs(hash) % COLOURWAYS.length];
}

// Prices: use `formatPrice` from useCurrency() (hooks/v2Hooks/useCurrency),
// which converts USD to the user's currency.

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
