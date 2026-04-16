"use client";

import { Heart, Copy, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Button } from "../ui/button";
import type { ClientWishlistView } from "../../../models/wishlist_client";

interface props {
  wishlist: ClientWishlistView;
}

export function WishlistHeroSection({ wishlist }: props) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Animation variants for staggering children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants  = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-end overflow-hidden">
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear" }}
          src={wishlist.wishlistHeroImage}
          alt={wishlist.wishlistName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Advanced Gradient for Text Readability: Darker on mobile, subtle on desktop */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 md:via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-black/20 md:bg-transparent" /> {/* Subtle darkening overlay for mobile */}
      </div>

      {/* Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full px-6 pb-12 pt-40 md:px-12 lg:px-20 md:pb-20"
      >
        <div className="mx-auto max-w-5xl">
          {/* Main Title */}
          <motion.h1 
            variants={itemVariants}
            className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white md:text-foreground text-balance leading-[1.1] mb-6"
          >
            {wishlist.wishlistName}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-base md:text-xl text-white/90 md:text-foreground/80 max-w-2xl leading-relaxed mb-8 md:mb-10"
          >
            {wishlist.wishlistDescription}
          </motion.p>

          {/* Metadata Row */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm md:text-base text-white/80 md:text-muted-foreground mb-10"
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Clock className="w-4 h-4 text-primary" />
              <span>{wishlist.totalDays} days / {wishlist.totalDays - 1} nights</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{wishlist.destinations.length} destinations</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Users className="w-4 h-4 text-primary" />
              <span>{wishlist.peopleType}</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              variant={saved ? "secondary" : "default"}
              onClick={() => setSaved(!saved)}
              className="group gap-2 px-8 h-14 md:h-12 rounded-full transition-all duration-300 w-full sm:w-auto text-white"
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-125 ${saved ? "fill-red-500 text-red-500" : ""}`}
              />
              {saved ? "Saved to Wishlist" : "Save Wishlist"}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleCopy}
              className="gap-2 px-8 h-14 md:h-12 rounded-full bg-white/10! backdrop-blur-md border-white/20 md:border-foreground/20 text-white md:text-foreground hover:bg-white md:hover:bg-foreground md:hover:text-background transition-all w-full sm:w-auto"
            >
              <Copy className="w-5 h-5" />
              {copied ? "Link Copied!" : "Share This Trip"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}