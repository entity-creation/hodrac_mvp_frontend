"use client";

import { TbBrandLinkedinFilled } from "react-icons/tb";
import { BsYoutube, BsTwitterX } from "react-icons/bs";
import { IoLogoInstagram } from "react-icons/io5";
import { FaTiktok } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { motion } from "framer-motion";
import { useState, type MouseEvent } from "react";
import { createNewUserInfo } from "../../dataStore/user_info_apis";

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  setLoadingStatus(true);

  await createNewUserInfo(email);

  setLoadingStatus(false);
  setEmail("");
};

  return (
    <footer className="bg-black text-white px-6 md:px-12 lg:px-20 py-16 md:py-24">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-10"
          >
            <h2 className="text-2xl font-bold">Hodrac</h2>

            <div className="flex flex-col gap-4 text-white/80">
              {[
                "About",
                "Explore",
                "Popular Trips",
                "How it Works",
              ].map((item) => (
                <p
                  key={item}
                  className="hover:text-white transition-colors duration-300 cursor-pointer"
                >
                  {item}
                </p>
              ))}

              <p
                onClick={() => navigate(ROUTES.PUBLIC.CONTACTUS)}
                className="hover:text-white transition-colors duration-300 cursor-pointer"
              >
                Contact Us
              </p>
            </div>
          </motion.div>

          {/* RIGHT SIDE (CTA BOX) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-white text-black rounded-2xl p-6 md:p-10 flex flex-col gap-6 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-xl md:text-2xl font-bold">
                We are building this with travelers like you.
              </h2>
              <p className="text-sm text-black/70">
                Join our community and follow our journey as we build something
                amazing together.
              </p>
            </div>

            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-black/5 outline-none focus:ring-2 focus:ring-black transition"
              />
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-black/80 transition" onClick={(e) => handleSubmit(e)}>
                {loadingStatus ? "Joining..." : "Join"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* SOCIALS */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          {[TbBrandLinkedinFilled, BsYoutube, IoLogoInstagram, BsTwitterX, FaTiktok].map(
            (Icon, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <Icon />
              </motion.button>
            )
          )}
        </motion.div>

        {/* BOTTOM */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-white/50"
        >
          <p>© 2025 Hodrac. All Rights Reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
}