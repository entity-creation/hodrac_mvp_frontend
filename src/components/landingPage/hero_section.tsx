import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ROUTES } from "../../utils/routes";

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 } 
  }
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full px-4 md:px-6 mt-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        className="relative flex flex-col items-center justify-center text-white w-full min-h-[500px] md:h-[600px] py-20 px-6 rounded-[2rem] overflow-hidden"
      >
        {/* Animated Background Image */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 bg-[url('/images/globe.jpg')] bg-cover bg-center bg-no-repeat"
        />
        
        {/* Overlay for Readability */}
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] z-0" />

        {/* Content Container */}
        <motion.div variants={childVariants} className="relative z-10 flex flex-col items-center space-y-6 max-w-3xl">
          <h1 className="font-bold text-center leading-tight">
            <span className="text-3xl md:text-6xl block mb-2">
              Plan your trips with ease.
            </span>
            <span className="text-xl md:text-3xl font-medium opacity-90 block">
              Discover places you would love.
            </span>
          </h1>

          <motion.p 
            variants={childVariants}
            className="text-center text-sm md:text-lg text-white/90 max-w-xl leading-relaxed"
          >
            Explore everything from popular tourist spots to hidden gems and see
            where fellow travelers would love to go.
          </motion.p>

          <motion.button 
            variants={childVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(ROUTES.PUBLIC.EXPLORETRIPS)}
            className="mt-4 px-8 py-4 bg-white font-bold rounded-full shadow-xl hover:bg-blue-50 transition-colors"
          >
            Start your journey
          </motion.button>
        </motion.div>

        {/* Floating Tagline - Hidden on small mobile for cleaner UI */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1, duration: 1 }}
          className="hidden sm:block absolute bottom-10 left-10 text-sm border-l-2 border-white/30 pl-4"
        >
          Your portal to the <br/> rest of the world
        </motion.div>
      </motion.div>
    </section>
  );
}