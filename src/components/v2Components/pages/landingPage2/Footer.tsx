import { useState } from "react";
import { Link } from "react-router-dom";
import { FaTiktok } from "react-icons/fa";
import { ArrowRight, Briefcase } from "lucide-react";
import { ROUTES } from "../../../../utils/v2Utils/routes";
import { authApi } from "../../../../dataStore/v2Api/client";

const LINK_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Wishlists", path: ROUTES.PUBLIC.EXPLOREWISHLIST },
      { label: "Destinations", path: ROUTES.PUBLIC.EXPLOREDESTINATION },
      { label: "Trips with others", path: ROUTES.PUBLIC.BROWSETRIPS },
    ],
  },
  {
    title: "Hodrac",
    links: [
      { label: "About", path: ROUTES.PUBLIC.ABOUT },
      { label: "Contact", path: ROUTES.PUBLIC.CONTACTUS },
      { label: "For business", path: ROUTES.PUBLIC.PARTNERS },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.newsletter(email);
      setJoined(true);
      setEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-ink text-white px-5 md:px-8 pt-16 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        {/* Business strip */}
        <Link
          to={ROUTES.PUBLIC.PARTNERS}
          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-white/10 py-8 mb-14"
        >
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-display font-light text-2xl">Travel agency or tour operator?</p>
              <p className="text-sm text-white/60">Reach travellers while they are still deciding where to go.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 font-medium text-sm">
            Partner with us <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <p className="font-display text-4xl font-light mb-3">
              Hodrac
            </p>
            <p className="text-white/60 text-sm max-w-xs mb-6 leading-relaxed">
              For people who want to travel but don't know where yet. Find a trip that fits you, then find people to go with.
            </p>

            {joined ? (
              <p className="text-sm text-mint-300 font-medium">🎉 You're in! We'll be in touch.</p>
            ) : (
              <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get trip ideas by email"
                  aria-label="Email address"
                  className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/15 text-white placeholder-white/40 text-sm outline-none focus:border-brand-400 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-full bg-white text-ink text-sm font-medium hover:bg-cream transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {loading ? "Joining…" : "Join"}
                </button>
              </form>
            )}
          </div>

          {LINK_GROUPS.map(group => (
            <nav key={group.title} className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">{group.title}</p>
              {group.links.map(link => (
                <Link key={link.label} to={link.path} className="text-sm text-white/75 hover:text-white transition-colors w-fit">
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Hodrac. All rights reserved.</p>
          <a
            href="https://www.tiktok.com/@hodrac"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hodrac on TikTok"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <FaTiktok size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
