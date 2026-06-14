import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    emoji: "🔍",
    title: "Discover",
    description: "Explore structured trips designed around real travel styles — not random destination lists.",
    accent: "#6366f1",
  },
  {
    number: "02",
    emoji: "⭐",
    title: "Personalize",
    description: "Save trips, explore destinations, and build a travel feed tailored to your interests, budget, and travel group.",
    accent: "#f59e0b",
  },
  {
    number: "03",
    emoji: "👥",
    title: "Plan Together",
    description: "Share wishlists, coordinate budgets and schedules with fellow travelers — from first idea to final itinerary.",
    accent: "#10b981",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-20 px-5 md:px-8 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Simple by design</p>
          <h2
            className="text-3xl md:text-5xl font-black text-gray-900"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            How Hodrac Works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-gray-200 z-0" />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Icon Container with solid white background to hide the underlying connector line */}
              <div className="relative mb-5 z-10 w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center">
                {/* Accent Tint Overlay layer */}
                <div 
                  className="absolute inset-0 rounded-3xl"
                  style={{ 
                    backgroundColor: `${step.accent}15`, 
                    border: `2px solid ${step.accent}30` 
                  }} 
                />
                
                {/* Emoji Content Layer */}
                <span className="relative z-10 text-3xl">{step.emoji}</span>
              </div>

              <span
                className="text-xs font-black uppercase tracking-widest mb-2"
                style={{ color: step.accent }}
              >
                Step {step.number}
              </span>

              <h3
                className="text-xl font-black text-gray-900 mb-3"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {step.title}
              </h3>

              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}