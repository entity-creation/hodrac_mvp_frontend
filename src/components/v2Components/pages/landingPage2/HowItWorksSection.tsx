import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section } from "../../ui";
import { ROUTES } from "../../../../utils/v2Utils/routes";

// "What is this?" → "I understand." Three plain-language steps, each linking
// to the part of the product it describes.
const STEPS = [
  {
    n: "01",
    title: "Be inspired",
    body: "Ready-made itineraries from real travellers and creators, with day-by-day plans and honest costs.",
    cta: "Browse trips",
    to: ROUTES.PUBLIC.EXPLOREWISHLIST,
  },
  {
    n: "02",
    title: "Know before you go",
    body: "A considered guide to every destination: daily costs, safety, hidden expenses and the best time to visit.",
    cta: "Explore destinations",
    to: ROUTES.PUBLIC.EXPLOREDESTINATION,
  },
  {
    n: "03",
    title: "Travel together",
    body: "See who is already heading there and ask to join, or share your own plans and choose your companions.",
    cta: "Find companions",
    to: ROUTES.PUBLIC.BROWSETRIPS,
  },
];

export default function HowItWorksSection() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From undecided to departure."
      subtitle="Hodrac is for people who know they want to travel, just not yet where."
      className="bg-white border-y border-line"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.12, duration: 0.6 }}
            className="bg-white"
          >
            <Link to={step.to} className="group flex flex-col h-full p-8 md:p-10 hover:bg-cream transition-colors">
              <span className="font-display text-sm text-ink-muted mb-10">{step.n}</span>
              <h3 className="text-2xl font-light text-ink mb-3">{step.title}</h3>
              <p className="text-ink-soft leading-relaxed mb-8">{step.body}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-ink">
                {step.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
