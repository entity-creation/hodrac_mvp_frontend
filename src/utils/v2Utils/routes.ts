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
    },
    AUTH: {
        SAVED: "/saved",
        MYWISHLIST: "/my-wishlists",
        CREATETRIPS: "/create-trip",
        TRIPHUB: "/trip-hub",
        TRIPTHREAD: "/trip-thread",
        ACCOUNT: "/account",
    }
} as const;

// Deep links used across the app.
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
