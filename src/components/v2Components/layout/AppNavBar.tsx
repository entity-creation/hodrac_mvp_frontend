import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { ROUTES } from "../../../utils/v2Utils/routes";

interface NavBarProps {
  onForYouClick?: () => void;
}

export default function AppNavBar({ onForYouClick }: NavBarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const [scrolled,     setScrolled]    = useState(false);
  const [mobileOpen,   setMobileOpen]  = useState(false);
  const [searchOpen,   setSearchOpen]  = useState(false);
  const [searchQuery,  setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100); }, [searchOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path)
      ? "text-gray-300 font-semibold"
      : "text-gray-200 hover:text-gray-300";

  const NAV_LINKS = [
    { label: "For You",      action: onForYouClick ?? (() => {}) },
    { label: "Wishlists",    action: () => navigate(ROUTES.PUBLIC.EXPLOREWISHLIST) },
    { label: "Destinations", action: () => navigate(ROUTES.PUBLIC.EXPLOREDESTINATION) },
    { label: "How It Works", action: () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }) },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-black/5" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={() => navigate(ROUTES.PUBLIC.HOME)}
            className="text-xl font-black tracking-tight text-gray-200 hover:opacity-70 transition-opacity shrink-0"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Hodrac
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={link.action}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  link.label === "For You"
                    ? "bg-gray-900 text-white hover:bg-gray-700"
                    : `${isActive(
                        link.label === "Wishlists" ? "/explore/wishlists" :
                        link.label === "Destinations" ? "/explore/destinations" : ""
                      )} hover:bg-gray-100 rounded-full px-4 py-2`
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-0! w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-200 transition-colors"
              aria-label="Search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {isAuthenticated ? (
              <>
                {/* Saved */}
                <button
                  onClick={() => navigate(ROUTES.AUTH.SAVED)}
                  className="p-2! hidden md:flex w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center text-gray-200 transition-colors"
                  aria-label="Saved"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>

                {/* User avatar menu */}
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName}</p>
                          <p className="text-xs text-gray-700 truncate">{user?.email}</p>
                        </div>
                        {[
                          { label: "My Wishlists", icon: "🗺️", path: "/my-wishlists" },
                          { label: "Saved",        icon: "❤️", path: "/saved" },
                        ].map(item => (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setUserMenuOpen(false); }}
                            className="mt-2! w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <span>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={async () => { await logout(); navigate(ROUTES.PUBLIC.HOME); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <span>🚪</span>
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate(ROUTES.PUBLIC.REGISTER)}
                  className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
            >
              <div className="w-5 flex flex-col gap-1.5">
                <span className={`block h-0.5 bg-gray-200 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 bg-gray-200 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-gray-200 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden ${mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => { link.action(); setMobileOpen(false); }}
                className="text-left px-3 py-3 text-sm font-medium text-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
              >
                {link.label}
              </button>
            ))}

            <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate(ROUTES.AUTH.MYWISHLIST)} className="text-left px-3 py-3 text-sm font-medium text-gray-200 hover:bg-gray-50 rounded-xl">
                    🗺️ My Wishlists
                  </button>
                  <button onClick={() => navigate(ROUTES.AUTH.SAVED)} className="text-left px-3 py-3 text-sm font-medium text-gray-200 hover:bg-gray-50 rounded-xl">
                    ❤️ Saved
                  </button>
                  <button onClick={async () => { await logout(); navigate(ROUTES.PUBLIC.HOME); }} className="text-left px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl">
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(ROUTES.PUBLIC.LOGIN)} className="w-full text-sm font-semibold text-gray-400 bg-gray-100 py-3 rounded-xl">
                    Sign In
                  </button>
                  <button onClick={() => navigate(ROUTES.PUBLIC.REGISTER)} className="w-full text-sm font-semibold text-white bg-gray-900 py-3 rounded-xl">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-5"
            onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
                <svg className="p-0! text-gray-300 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search destinations, wishlists, or travel styles..."
                  className="flex-1 text-gray-300 bg-transparent outline-none text-base placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors text-xs"
                >
                  ✕
                </button>
              </form>

              {/* Quick links */}
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick explore</p>
                <div className="flex flex-wrap gap-2">
                  {["Japan for Anime Fans", "Couple Trips", "Budget Food Tours", "Luxury Escapes"].map(s => (
                    <button
                      key={s}
                      onClick={() => { navigate(`${ROUTES.PUBLIC.SEARCH}?q=${encodeURIComponent(s)}`); setSearchOpen(false); }}
                      className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
