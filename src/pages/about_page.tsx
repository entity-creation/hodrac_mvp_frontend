import { motion, type Variants } from "framer-motion";
import Footer from "../components/landingPage/footer";
import NavBar from "../components/landingPage/nav_bar";

// Animation Variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-white overflow-x-hidden">
      <div className="py-5 px-6 md:px-10">
        <NavBar />
      </div>

      <div className="bg-black text-gray-800">
        {/* HERO */}
        <section className="relative min-h-[60vh] md:h-125 flex items-center justify-center text-white">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="/images/portal.jpg"
            className="absolute inset-0 w-full h-full object-cover z-0 brightness-50"
          />

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative max-w-6xl mx-auto px-6 text-center md:text-left"
          >
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Hodrac <span className="text-white/50">. . . . .</span><br/>
              Your portal to the world
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl max-w-xl text-gray-200 mx-auto md:mx-0">
              Making travel easier, smarter, and more enjoyable for anyone who
              wants to explore the world.
            </motion.p>
          </motion.div>
        </section>

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white relative rounded-t-[40px] -mt-20 pt-20 pb-32 px-6 z-20">
          <div className="max-w-6xl mx-auto">
            
            {/* PARTNER LOGOS - Scrollable on mobile */}
            <div className="flex overflow-x-auto md:justify-center gap-8 md:gap-16 opacity-40 mb-20 no-scrollbar pb-4">
              {["Explorer", "Nomad", "Adventure", "Travelers", "Wander"].map((brand) => (
                <span key={brand} className="text-xl font-bold uppercase tracking-widest whitespace-nowrap">{brand}</span>
              ))}
            </div>

            {/* STATS */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-32"
            >
              <StatCard number="200+" label="Destinations explored" />
              <StatCard number="10k+" label="Travelers inspired" />
              <StatCard number="50+" label="Countries covered" />
            </motion.div>

            {/* SECTIONS */}
            <div className="space-y-32">
              <Section
                title="Our Vision"
                text={`Hodrac is a portal to the world for travelers. Our goal is simple: to make traveling easier, smarter, and more enjoyable.\n\nTravel should be exciting, not stressful. We remove the barriers of coordination and shared costs so you can focus on the experience.`}
                image="/images/vision.jpg"
              />

              <Section
                reverse
                title="What Hodrac Does"
                text={`We help travelers discover destinations, organize wishlists, and coordinate trips easily.\n\nAs the platform evolves, we are introducing tools that simplify group travel coordination, helping people plan together without the unnecessary stress.`}
                image="/images/discover.jpg"
              />

              <Section
                title="Why We Started"
                text={`Founded by Chimaobi Onuoha, a software engineer and travel enthusiast, Hodrac was born from personal frustration.\n\nChimaobi understands the logistics behind the scenes. Hodrac was created to solve those problems and help people who love to travel do it better.`}
                image="/images/founder.jpg"
              />
            </div>

            {/* VALUES */}
            <div className="mt-32">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ValueCard title="Freedom to Travel" text="Everyone should have the ability to explore the world and discover new places." />
                <ValueCard title="Pure Enjoyment" text="Planning and coordination should not take away from the excitement of the journey." />
                <ValueCard title="Informed Choices" text="Travelers deserve clear, useful information to make better travel decisions." />
              </div>
            </div>

            {/* MISSION */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center mt-40 bg-blue-50 p-12 rounded-[3rem] max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                We believe travel should be seamless. Hodrac is building the tools that help travelers move from the idea of a trip to the experience of it more easily, confidently, and with less stress.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

/* SUB-COMPONENTS */

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <motion.div variants={fadeIn} className="bg-gray-50 p-10 rounded-3xl text-center border border-gray-100">
      <h3 className="text-4xl font-bold text-purple-600 mb-2">{number}</h3>
      <p className="text-gray-500 font-medium">{label}</p>
    </motion.div>
  );
}

function Section({ title, text, image, reverse }: { title: string; text: string; image: string; reverse?: boolean; }) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center"
    >
      <motion.div variants={fadeIn} className={reverse ? "md:order-last" : ""}>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{text}</p>
      </motion.div>

      <motion.div variants={fadeIn}>
        <img src={image} alt={title} className="rounded-[2.5rem] h-80 md:h-125 w-full object-cover shadow-2xl" />
      </motion.div>
    </motion.div>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="w-12 h-1 text-purple-600 bg-purple-600 mb-6 rounded-full" />
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </motion.div>
  );
}