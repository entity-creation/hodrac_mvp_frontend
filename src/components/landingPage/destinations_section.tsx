import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ROUTES } from "../../utils/routes";
import type { FilterQuery } from "../../models/filter_query";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  },
};

export default function DestinationSection() {
  const navigate = useNavigate();

  const destinations = [
    { title: "Local Favorite", tag: "Local Favorite", img: "/images/destinations.jpg" },
    { title: "Tourist Hotspots", tag: "Tourist Hotspot", img: "/images/tourist.jpg" },
    { title: "Hidden Gem", tag: "Hidden Gem", img: "/images/hidden.jpg" },
  ];

  const handleNavigation = (tag: string) => {
    navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
      state: { filters: { tags: tag } as FilterQuery },
    });
  };

  return (
    <section className="w-full px-6 my-16 md:my-32 flex flex-col gap-y-16 md:gap-y-24 max-w-7xl mx-auto">
      {/* Header text with right alignment on desktop, centered on mobile */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex flex-col items-center md:items-end text-center md:text-right text-gray-800"
      >
        <p className="italic text-lg md:text-xl font-light text-black/60">
          "You think you have seen it all? Who decided that?"
        </p>
        <p className="max-w-md mt-2 font-medium">
          Explore curated tourist spots, hidden gems, and real traveler wishlists.
        </p>
      </motion.div>

      {/* Destination Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10"
      >
        {destinations.map((dest) => (
          <motion.div
            key={dest.tag}
            variants={itemVariants}
            whileHover={{ y: -10 }}
            className="relative group h-72 md:h-80 w-full overflow-hidden rounded-3xl cursor-pointer shadow-lg"
            onClick={() => handleNavigation(dest.tag)}
          >
            {/* Background Image with Zoom effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url('${dest.img}')` }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Content */}
            <div className="relative h-full flex items-center justify-center p-6">
              <p className="text-white text-2xl md:text-3xl font-bold tracking-wide text-center drop-shadow-md">
                {dest.title}
              </p>
            </div>
            
            {/* Subtle bottom light effect on hover */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}