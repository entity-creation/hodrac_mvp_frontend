"use client";

import { CiSearch } from "react-icons/ci";
import { IoAdd } from "react-icons/io5";
import { FaAngellist } from "react-icons/fa";
import { motion } from "framer-motion";

export default function HowItWorksSection() {
  return (
    <div
      className="flex flex-col text-black items-center w-full mb-20 px-6 md:px-12 lg:px-20"
      id="how-it-works"
    >
      {/* TITLE */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-10"
      >
        <h2 className="font-bold text-2xl md:text-3xl">How it Works?</h2>
      </motion.div>

      {/* STEPS */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-10 lg:gap-0">

        {/* STEP 1 */}
        <Step
          icon={<CiSearch />}
          title="Explore"
          description="Explore popular destinations and trending wishlists"
          bg="bg-purple-400"
          delay={0}
        />

        {/* CONNECTOR */}
        <Connector color1="bg-purple-400" color2="bg-cyan-300" />

        {/* STEP 2 */}
        <Step
          icon={<IoAdd />}
          title="Save"
          description="Find a place you want to visit, save it"
          bg="bg-cyan-300"
          delay={0.2}
        />

        {/* CONNECTOR */}
        <Connector color1="bg-cyan-300" color2="bg-purple-600" />

        {/* STEP 3 */}
        <Step
          icon={<FaAngellist />}
          title="Create"
          description="Create a wishlist of places you want to visit"
          bg="bg-purple-600"
          delay={0.4}
        />
      </div>
    </div>
  );
}

/* STEP COMPONENT */
function Step({
  icon,
  title,
  description,
  bg,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -6 }}
      className="flex flex-col items-center gap-y-5 w-full lg:w-1/4 text-center"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`flex justify-center items-center rounded-xl h-14 w-14 ${bg} text-white`}
      >
        {icon}
      </motion.div>

      <div className="flex flex-col gap-y-1">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm font-light text-black/70">{description}</p>
      </div>
    </motion.div>
  );
}

/* CONNECTOR (hidden on mobile) */
function Connector({
  color1,
  color2,
}: {
  color1: string;
  color2: string;
}) {
  return (
    <div className="hidden lg:flex items-center justify-center gap-x-3 h-fit">
      <div className={`h-2 w-2 rounded-full ${color1}`} />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
        className="origin-left text-black/20 font-bold pb-2"
      >
        -------
      </motion.div>
      <div className={`h-2 w-2 rounded-full ${color2}`} />
    </div>
  );
}