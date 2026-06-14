export const ROUTES = {
    PUBLIC: {
        HOME: "/",
        CONTACTUS: "/contact_us",
        EXPLOREWISHLIST: "/explore/wishlists",
        EXPLOREDESTINATION: "/explore/destinations",
        WISHLISTBASEROUTE: "/wishlists",
        DESTINATIONBASEROUTE: "/destinations",
        ABOUT: "/about_us",
        SEARCH: "/search",
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
    },
    AUTH: {
        SAVED: "/saved",
        MYWISHLIST: "/my-wishlists",
    }
} as const;