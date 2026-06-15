import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { UserDto } from "../../../../types";
import { useAuth } from "../../../../hooks/v2Hooks/useAuth";
import { ROUTES } from "../../../../utils/v2Utils/routes";

interface NavBarProps {
  onForYouClick: () => void;
  isAuthenticated: boolean;
  user: UserDto | null;
}

export default function NavBar({ onForYouClick, isAuthenticated, user }: NavBarProps) {
  const navigate      = useNavigate();
  const { logout }    = useAuth();
  const [scrolled,     setScrolled]    = useState(false);
  const [mobileOpen,   setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { label: "For You",      action: onForYouClick },
    { label: "Wishlists",    action: () => navigate(ROUTES.PUBLIC.EXPLOREWISHLIST) },
    { label: "Destinations", action: () => navigate(ROUTES.PUBLIC.EXPLOREDESTINATION) },
    { label: "How It Works", action: () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }) },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate(ROUTES.PUBLIC.HOME)}
          className="text-xl font-black tracking-tight text-gray-200 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Hodrac
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={link.action}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                link.label === "For You"
                  ? "bg-gray-900 text-white hover:bg-gray-700"
                  : "text-gray-300 hover:text-gray-200 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Saved trips */}
              <button
                onClick={() => navigate(ROUTES.AUTH.SAVED)}
                className="p-0! flex items-center gap-1.5 text-sm text-gray-300 hover:text-gray-200 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Saved Trips
              </button>

              {/* User avatar + dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  {user.displayName?.charAt(0).toUpperCase() ?? "U"}
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
                        <p className="text-sm font-semibold text-gray-300 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-200 truncate">{user.email}</p>
                      </div>
                      {[
                        { label: "My Wishlists", icon: "🗺️", path: "/my-wishlists" },
                        { label: "Saved",        icon: "❤️", path: "/saved" },
                      ].map(item => (
                        <button
                          key={item.path}
                          onClick={() => { navigate(item.path); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <span>{item.icon}</span>{item.label}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={async () => { await logout(); navigate(ROUTES.PUBLIC.HOME); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
                className="text-sm font-medium text-gray-400 hover:text-gray-300 px-3 py-2 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate(ROUTES.PUBLIC.REGISTER)}
                className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-full transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>

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

      {/* Mobile menu */}
      <div className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden ${mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 py-4 flex flex-col gap-1">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => { link.action(); setMobileOpen(false); }}
              className="text-left px-3 py-3 text-sm font-medium text-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              {link.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <button onClick={() => { navigate(ROUTES.AUTH.MYWISHLIST); setMobileOpen(false); }} className="text-left px-3 py-3 text-sm font-medium text-gray-300 hover:bg-gray-50 rounded-xl">🗺️ My Wishlists</button>
                <button onClick={() => { navigate(ROUTES.AUTH.SAVED); setMobileOpen(false); }} className="text-left px-3 py-3 text-sm font-medium text-gray-300 hover:bg-gray-50 rounded-xl">❤️ Saved Trips</button>
                <button onClick={async () => { await logout(); navigate(ROUTES.PUBLIC.HOME); }} className="text-left px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl">🚪 Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate(ROUTES.PUBLIC.LOGIN)} className="w-full text-sm font-semibold text-gray-400 bg-gray-100 py-3 rounded-xl">Sign In</button>
                <button onClick={() => navigate(ROUTES.PUBLIC.REGISTER)} className="w-full text-sm font-semibold text-white bg-gray-900 py-3 rounded-xl">Get Started</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
