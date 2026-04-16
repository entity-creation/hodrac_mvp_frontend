import { FaFontAwesomeFlag } from "react-icons/fa";
import { BsArrowRightShort } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion"; // Make sure to npm install framer-motion
import type { FilterQuery } from "../../models/filter_query";
import { ROUTES } from "../../utils/routes";

interface Props {
  countryName: string;
  destinationCount: number;
  bgImage: string;
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      duration: 0.5, 
      ease: "easeOut" 
    } 
  }
};

export function TopCountries() {
  const demoCountries = [
    { Country: "Canada", Destination: ["Banff", "Church of NotreDame"] },
    { Country: "United States", Destination: ["NYC", "LA"] },
    { Country: "Spain", Destination: ["Madrid", "Barcelona"] },
    { Country: "Ghana", Destination: ["Accra", "Kumasi"] },
    { Country: "Dubai", Destination: ["Burj Khalifa"] },
    { Country: "Qatar", Destination: ["Doha"] },
    { Country: "Mexico", Destination: ["Cancun"] },
    { Country: "New Zealand", Destination: ["Queenstown"] },
  ];

  return (
    <section className="flex flex-col items-center px-6 py-16 md:py-24 max-w-7xl mx-auto w-full" id="top-countries">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-y-3 text-center mb-16 md:w-3/4"
      >
        <h2 className="font-bold text-3xl md:text-5xl tracking-tight text-gray-900">
          Explore Top Searched Countries
        </h2>
        <p className="text-black/50 text-sm md:text-lg">
          Discover the world’s top trending countries to visit right now, with
          experiences for every kind of traveler.
        </p>
      </motion.div>

      {/* Responsive Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
      >
        {demoCountries.map((country) => (
          <TopCountry
            key={country.Country}
            countryName={country.Country}
            destinationCount={country.Destination.length}
            bgImage="/images/globe.jpg"
          />
        ))}
      </motion.div>

      {/* Footer Link */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-16 text-black/40 hover:text-black cursor-pointer transition-colors font-medium"
      >
        Explore more countries →
      </motion.div>
    </section>
  );
}

export function TopCountry({ countryName, destinationCount, bgImage }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
      className="group border border-gray-100 rounded-2xl p-4 bg-white transition-all shadow-sm flex flex-col justify-between h-32 cursor-pointer"
      onClick={() =>
        navigate(ROUTES.PUBLIC.EXPLORETRIPS, {
          state: { filters: { country: countryName } as FilterQuery },
        })
      }
    >
      <div className="flex gap-x-4 items-center">
        <div
          className="w-14 h-14 rounded-full bg-cover bg-center shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundImage: `url(${bgImage})` }} // Fixed interpolation
        />
        <div className="flex flex-col">
          <p className="font-bold text-gray-900 text-lg">{countryName}</p>
          <span className="flex gap-x-1.5 items-center text-black/40 text-sm">
            <FaFontAwesomeFlag className="text-xs" />
            <span>{destinationCount} Destinations</span>
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
          <BsArrowRightShort size={24} />
        </div>
      </div>
    </motion.div>
  );
}