"use client";

import { motion } from "framer-motion";
import type { ClientWishlistView } from "../../../models/wishlist_client";

interface Props {
  wishlist: ClientWishlistView;
}

export function StorySection({ wishlist }: Props) {
  return (
    <section className="py-12 md:py-28 px-4 md:px-12 lg:px-20 overflow-hidden">
      <div className="mx-auto max-w-4xl relative">
        {/* Subtle Decorative Background Element */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-10 -left-4 md:-left-10 text-8xl md:text-[12rem] font-serif pointer-events-none select-none"
        >
          “
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center relative z-10"
        >
          <p className="font-serif text-xl md:text-3xl lg:text-4xl text-foreground leading-relaxed md:leading-loose text-balance italic md:not-italic">
            {wishlist.shortStory}
          </p>
          
          {/* Animated accent line */}
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "60px" }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 bg-primary/20 mx-auto mt-8 md:mt-12 rounded-full"
          />
        </motion.div>
      </div>
    </section>
  );
}