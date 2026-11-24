import { slugify } from "./slugify";

export const ROUTES = {
    PUBLIC: {
        HOME: "/",
        CONTACTUS: "/contact-us",
        EXPLOREWISHLIST: "/explore/wishlists",
        EXPLOREDESTINATION: "/explore/destinations",
        WISHLISTBASEROUTE: "/wishlists",
        DESTINATIONBASEROUTE: "/destinations",
        ABOUT: "/about",
        SEARCH: "/search",
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        BROWSETRIPS: "/browse-trip",
        PARTNERS: "/partners",
        TERMS: "/terms",
        PRIVACY: "/privacy",
        BLOG: "/blog",
    },
    AUTH: {
        SAVED: "/saved",
        MYWISHLIST: "/my-wishlists",
        CREATETRIPS: "/create-trip",
        TRIPHUB: "/trip-hub",
        TRIPTHREAD: "/trip-thread",
        ACCOUNT: "/account",
    },
    // Hodrac Host. Backend emails link to /host, /host/trips/{id} and
    // /payments/{reference}, so keep those paths stable.
    HOST: {
        HOME: "/host",                    // pitch for visitors, dashboard for hosts
        ONBOARDING: "/host/onboarding",
        TRIPS: "/host/trips",
        DASHBOARD: "/host/dashboard",     // all trips: money, who owes
        NEW_TRIP: "/host/trips/new",
        REPORTS: "/host/reports",
        PAYMENT_CALLBACK: "/trips/payment/callback",
    },
} as const;

export const tripPath = (tripId: string) => `/trips/${tripId}`;
export const tripPayPath = (tripId: string) => `/trips/${tripId}/pay`;
export const hostManifestPath = (tripId: string) => `/host/trips/${tripId}`;
export const hostEditTripPath = (tripId: string) => `/host/trips/${tripId}/edit`;
export const receiptPath = (reference: string) => `/payments/${encodeURIComponent(reference)}`;

// Blog. Posts are /blog/<slug>; "tags" and "sitemap" can never be slugs, and
// tag pages live one level deeper so they can't clash with a post.
export const blogPath = (slug: string) => `/blog/${slug}`;
export const blogTagPath = (key: string) => `/blog/tag/${encodeURIComponent(key)}`;

// Deep links used across the app.
// Canonical detail URLs: always include the slug so each item has one URL.
export const wishlistPath = (id: string, name?: string | null) => {
    const slug = name ? slugify(name) : "";
    return slug ? `/wishlists/${id}/${slug}` : `/wishlists/${id}`;
};

export const destinationPath = (id: string, name?: string | null) => {
    const slug = name ? slugify(name) : "";
    return slug ? `/destinations/${id}/${slug}` : `/destinations/${id}`;
};

export const tripsForPlacePath = (place: { destinationId?: string; wishlistId?: string; name?: string }) => {
    const q = new URLSearchParams();
    if (place.destinationId) q.set("destinationId", place.destinationId);
    if (place.wishlistId) q.set("wishlistId", place.wishlistId);
    if (place.name) q.set("place", place.name);
    return `${ROUTES.PUBLIC.BROWSETRIPS}?${q.toString()}`;
};

export const createTripForPlacePath = (place: { destinationId?: string; wishlistId?: string }) => {
    const q = new URLSearchParams();
    if (place.destinationId) q.set("destinationId", place.destinationId);
    if (place.wishlistId) q.set("wishlistId", place.wishlistId);
    const qs = q.toString();
    return qs ? `${ROUTES.AUTH.CREATETRIPS}?${qs}` : ROUTES.AUTH.CREATETRIPS;
};
