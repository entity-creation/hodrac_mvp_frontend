"use client";

import { FaHeart } from "react-icons/fa";
import useWishlist from "../../hooks/use_wishlist";
import { slugify, summarizeArray } from "../../utils/summarize";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import { motion } from "framer-motion";

interface Props {
  name: string;
  description: string;
  image: string;
  id: string;
}

export function PopularWishlists() {
  const { wishlists, loading } = useWishlist();
  const wishlistSummary = summarizeArray(wishlists, 3);

  return (
    <>
      {/* HEADER ANIMATION */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center h-full w-full text-black my-20"
      >
        <div
          className="flex flex-col gap-y-1 justify-center w-4/5 mb-20"
          id="text"
        >
          <h2 className="text-center font-bold text-[min(10vw,40px)]">
            Popular Travel Wishlists
          </h2>
          <p className="text-center text-black/40">
            Just like you explore, others do too browse places they love and
            find something for yourself.
          </p>
        </div>
      </motion.div>

      {/* GRID */}
      <div className="flex flex-col gap-y-10 items-center h-fit md:pl-20 md:grid md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
        {loading ? (
            // LOADING SKELETONS
            Array.from({ length: 3 }).map((_, i) => <WishlistSkeleton key={i} />)
          ) : (
            // ACTUAL CONTENT
            wishlistSummary.map((wishlist, index) => (
              <Wishlists
                name={wishlist.wishlistName}
                description={wishlist.wishlistDescription}
                image={wishlist.wishlistHeroImage}
                id={wishlist.wishlistId}
                key={wishlist.wishlistId}
                index={index}
              />
            ))
          )}
      </div>

      {/* FOOT CTA ANIMATION */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center text-black/40 w-full my-20 hover:text-black hover:cursor-pointer"
      >
        Explore more...
      </motion.div>
    </>
  );
}

export function Wishlists({ name, description, image, id, index }: Props & { index: number }) {
  const navigate = useNavigate();

  const goToWishlistDetails = () => {
    navigate(`${ROUTES.PUBLIC.WISHLIST}/${id}/${slugify(name)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="flex flex-col items-center gap-y-5 w-70"
    >
      {/* IMAGE */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className={`h-50 w-70 rounded-2xl bg-center bg-no-repeat bg-cover flex justify-end pt-2 pr-2 shadow-md shadow-gray-400`}
        style={{
          backgroundImage: `url(${image})`,
        }}
      >
        {/* HEART */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`h-6! w-6! rounded-full! bg-white/50! flex items-center justify-center p-1! m-01`}
        >
          <FaHeart />
        </motion.button>
      </motion.div>

      {/* TEXT */}
      <div className="text-black">
        <h2 className="font-bold text-lg">{name}</h2>
        <p className="text-black/40 text-sm">{description}</p>
      </div>

      {/* BUTTON */}
      <div className="text-black flex justify-between w-full items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-white w-20 h-10 text-[10px]!"
          onClick={() => goToWishlistDetails()}
        >
          See More
        </motion.button>
      </div>
    </motion.div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[320px] animate-pulse">
      <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
        <div className="h-4 w-full bg-gray-200 rounded-md" />
      </div>
      <div className="mt-4 h-8 w-24 bg-gray-200 rounded-full" />
    </div>
  );
}