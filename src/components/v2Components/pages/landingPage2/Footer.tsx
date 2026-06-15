import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TbBrandLinkedinFilled } from "react-icons/tb";
import { BsYoutube, BsTwitterX } from "react-icons/bs";
import { IoLogoInstagram } from "react-icons/io5";
import { FaTiktok } from "react-icons/fa";
import { ROUTES } from "../../../../utils/routes";
import { createNewUserInfo } from "../../../../dataStore/user_info_apis";

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await createNewUserInfo(email);
    setLoading(false);
    setJoined(true);
    setEmail("");
  };

  const navLinks = [
    { label: "About", path: ROUTES.PUBLIC.ABOUT },
    { label: "Explore", path: ROUTES.PUBLIC.EXPLORETRIPS },
    { label: "Contact", path: ROUTES.PUBLIC.CONTACTUS },
  ];

  return (
    <footer className="bg-gray-950 text-white px-5 md:px-8 pt-16 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Left */}
          <div>
            <h2
              className="text-3xl font-black mb-3"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Hodrac
            </h2>
            <p className="text-white/50 text-sm max-w-xs mb-8 leading-relaxed">
              Behavioral travel intelligence. Discover trips built around how
              you actually travel.
            </p>
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className="text-left text-sm text-white/50 hover:text-white transition-colors w-fit"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right - CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/10 rounded-3xl p-7"
          >
            <h3
              className="text-xl font-black text-white mb-2"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              We're building this with travelers like you.
            </h3>
            <p className="text-sm text-white/50 mb-5">
              Follow our journey and get early access to new features shaped by
              your travel style.
            </p>
            {joined ? (
              <p className="text-sm text-emerald-400 font-medium">
                🎉 You're in! We'll be in touch.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 text-sm outline-none focus:ring-2 focus:ring-white/20 transition"
                />
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-white text-gray-300 text-sm font-bold hover:bg-gray-100 active:scale-95 transition-all whitespace-nowrap"
                >
                  {loading ? "Joining..." : "Join →"}
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Socials + bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2025 Hodrac. All Rights Reserved.
          </p>
          <div className="flex gap-2">
            {[
              TbBrandLinkedinFilled,
              BsYoutube,
              IoLogoInstagram,
              BsTwitterX,
              FaTiktok,
            ].map((Icon, i) => (
              <button
                key={i}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
