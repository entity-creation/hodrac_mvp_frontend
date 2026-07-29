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
    },
    AUTH: {
        SAVED: "/saved",
        MYWISHLIST: "/my-wishlists",
    }
} as const;