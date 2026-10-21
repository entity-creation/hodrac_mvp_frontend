import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Heart, Menu, X, Sparkles, Map, Compass, Users, PlusCircle,
  LogOut, Briefcase, Luggage, ArrowRight, Settings, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { usePersonalization } from "../../../hooks/v2Hooks/usePersonalization";
import { ROUTES } from "../../../utils/v2Utils/routes";
import { loginPath, registerPath } from "../../../utils/v2Utils/authRedirect";
import { buttonClasses } from "../ui";
import NotificationBell from "./NotificationBell";
import { CurrencyButton } from "./CountryPicker";
import { useAdminStatus } from "../../../admin/useAdmin";

const NAV_LINKS = [
  { label: "Wishlists", to: ROUTES.PUBLIC.EXPLOREWISHLIST, icon: Map },
  { label: "Destinations", to: ROUTES.PUBLIC.EXPLOREDESTINATION, icon: Compass },
  { label: "Trips", to: ROUTES.PUBLIC.BROWSETRIPS, icon: Users },
];

const QUICK_SEARCHES = ["Japan for anime fans", "Couple trips", "Budget food tours", "Beach escapes"];

export default function AppNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isAdmin } = useAdminStatus();
  const { openQuiz } = usePersonalization();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === "/";
  const here = location.pathname + location.search;
  // Over the landing hero the bar starts transparent; everywhere else it's solid.
  const solid = scrolled || !isLanding || mobileOpen;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); setSearchOpen(false); }, [location.pathname]);

  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100); }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const runSearch = (q: string) => {
    if (!q.trim()) return;
    navigate(`${ROUTES.PUBLIC.SEARCH}?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.PUBLIC.HOME);
  };

  const USER_LINKS = [
    { label: "My trips", to: ROUTES.AUTH.TRIPHUB, icon: Luggage },
    { label: "My wishlists", to: ROUTES.AUTH.MYWISHLIST, icon: Map },
    { label: "Saved", to: ROUTES.AUTH.SAVED, icon: Heart },
    { label: "Plan a trip", to: ROUTES.AUTH.CREATETRIPS, icon: PlusCircle },
    { label: "Account settings", to: ROUTES.AUTH.ACCOUNT, icon: Settings },
    ...(isAdmin ? [{ label: "Admin dashboard", to: "/admin", icon: ShieldCheck }] : []),
  ];

  const iconBtn =
    "w-10 h-10 rounded-full flex items-center justify-center border border-line bg-white text-ink hover:bg-cream-deep transition-colors";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? "bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/60 shadow-[0_8px_24px_-18px_rgb(20_20_20/0.25)]" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={ROUTES.PUBLIC.HOME} className="font-display text-2xl font-light tracking-tight text-ink shrink-0">
            Hodrac
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={openQuiz}
              className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              For you
            </button>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    isActive ? "bg-ink text-white" : "text-ink hover:bg-ink/5"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <CurrencyButton className="hidden sm:inline-flex" />

            <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search">
              <Search className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <>
                <NotificationBell enabled={isAuthenticated} />

                <div className="relative hidden lg:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    aria-label="Account menu"
                    aria-expanded={userMenuOpen}
                    className="w-10 h-10 rounded-full bg-ink text-white text-sm font-medium flex items-center justify-center hover:bg-ink-soft transition-colors"
                  >
                    {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        className="absolute right-0 top-13 w-60 bg-white rounded-3xl border border-line shadow-pop-lg py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-line">
                          <p className="text-sm font-semibold text-ink truncate">{user?.displayName}</p>
                          <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                        </div>
                        {USER_LINKS.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t border-line mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to={loginPath(here)} className="text-sm font-medium text-ink hover:text-brand-600 px-3 py-2 transition-colors">
                  Sign in
                </Link>
                <Link to={registerPath(here)} className={buttonClasses("primary", "sm")}>
                  Join free
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className={`lg:hidden ${iconBtn}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden bg-cream border-t border-line"
            >
              <div className="px-5 py-5 flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <button
                  onClick={() => { setMobileOpen(false); openQuiz(); }}
                  className="flex items-center justify-between px-4 py-4 rounded-xl bg-white border border-line text-ink font-medium"
                >
                  <span className="flex items-center gap-3"><Sparkles className="w-5 h-5" strokeWidth={1.5} /> Find my trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {NAV_LINKS.map(link => (
                  <Link key={link.to} to={link.to} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink font-medium hover:bg-white">
                    <link.icon className="w-5 h-5" /> {link.label}
                  </Link>
                ))}

                <div className="border-t border-line my-2" />

                {isAuthenticated ? (
                  <>
                    {USER_LINKS.map(item => (
                      <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink font-semibold hover:bg-white">
                        <item.icon className="w-5 h-5" /> {item.label}
                      </Link>
                    ))}
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 font-semibold hover:bg-red-50 text-left">
                      <LogOut className="w-5 h-5" /> Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={loginPath(here)} className={buttonClasses("outline", "md")}>Sign in</Link>
                    <Link to={registerPath(here)} className={buttonClasses("primary", "md")}>Join free</Link>
                  </div>
                )}

                <div className="sm:hidden px-4 pt-2">
                  <CurrencyButton />
                </div>

                <Link to={ROUTES.PUBLIC.PARTNERS} className="flex items-center gap-3 px-4 py-3 mt-2 rounded-2xl text-ink-soft text-sm font-semibold hover:bg-white">
                  <Briefcase className="w-4 h-4" /> Hodrac for business
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-ink/25 backdrop-blur-md flex items-start justify-center pt-24 px-5"
            onMouseDown={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="w-full max-w-xl bg-white/85 backdrop-blur-2xl rounded-2xl border border-white/70 shadow-pop-lg overflow-hidden"
            >
              <form onSubmit={e => { e.preventDefault(); runSearch(searchQuery); }} className="flex items-center gap-3 p-4">
                <Search className="w-5 h-5 text-ink-muted shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Try “Japan”, “beach”, or “food trip”…"
                  aria-label="Search"
                  className="flex-1 text-ink bg-transparent outline-none text-base placeholder:text-ink-muted"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-ink hover:bg-cream-deep transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              <div className="px-4 pb-4 border-t border-line pt-3">
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">Need ideas?</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SEARCHES.map(s => (
                    <button
                      key={s}
                      onClick={() => runSearch(s)}
                      className="px-3 py-1.5 bg-cream border border-line rounded-full text-xs font-semibold text-ink hover:border-ink transition-colors"
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
