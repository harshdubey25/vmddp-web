"use client"
import { Milk, HeartPulse, Pill, Sprout, Sparkles, Scissors, Package, Stethoscope, GraduationCap } from "lucide-react";
import SchemeCard from "./SchemeCard";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const schemes = [
  {
    id: 1,
    icon: Milk,
    title: "Animal Induction (Calved Cow)",
    description: "Financial assistance for purchasing high-yielding calved indigenous or crossbred dairy cows",
    benefits: [
      "Subsidy up to 50% (General) / 75% (SC/ST)",
      "Support for quality milch animals",
      "Veterinary health certification included"
    ]
  },
  {
    id: 2,
    icon: HeartPulse,
    title: "HGM (Pregnant Cow)",
    description: "High Genetic Merit pregnant cow support for enhanced dairy productivity and breeding excellence",
    benefits: [
      "Financial aid for HGM pregnant cow acquisition",
      "Genetic superiority certification",
      "Breeding guidance and veterinary support"
    ]
  },
  {
    id: 3,
    icon: Pill,
    title: "Fertility Feed",
    description: "Specialized nutritional supplements to improve reproductive health and fertility in dairy animals",
    benefits: [
      "Subsidized fertility-enhancing feed supply",
      "Improves conception rates",
      "Expert consultation on feeding protocols"
    ]
  },
  {
    id: 4,
    icon: Sprout,
    title: "Fodder Seed",
    description: "Quality fodder seed distribution for green and dry fodder cultivation to ensure year-round feed availability",
    benefits: [
      "Subsidized high-quality fodder seeds",
      "Technical guidance on cultivation",
      "Support for fodder crop varieties"
    ]
  },
  {
    id: 5,
    icon: Sparkles,
    title: "SNF Enhancer",
    description: "Solids-Not-Fat enhancer supplements to improve milk quality and increase farmer income",
    benefits: [
      "Enhances milk SNF content",
      "Better price realization for quality milk",
      "Feed additive supply support"
    ]
  },
  {
    id: 6,
    icon: Scissors,
    title: "Supply Chaff Cutter",
    description: "Mechanized chaff cutting equipment to process fodder efficiently and reduce labor",
    benefits: [
      "Subsidy on chaff cutter machines",
      "Training on equipment operation",
      "Maintenance support included"
    ]
  },
  {
    id: 7,
    icon: Package,
    title: "Supply Of Silage",
    description: "Provision of quality silage for round-the-year nutritious fodder availability",
    benefits: [
      "Ready-to-use silage supply",
      "Ensures feed during scarcity periods",
      "Nutritional quality assurance"
    ]
  },
  {
    id: 8,
    icon: Stethoscope,
    title: "Treatment of Infertile Animal",
    description: "Comprehensive veterinary treatment program for infertile animals to restore productivity",
    benefits: [
      "Free veterinary consultation and diagnosis",
      "Subsidized treatment and medicines",
      "Follow-up care and monitoring"
    ]
  },
  {
    id: 9,
    icon: GraduationCap,
    title: "Farmer Training",
    description: "Capacity building programs on modern dairy management, animal health, and best practices",
    benefits: [
      "Free training sessions and workshops",
      "Hands-on practical demonstrations",
      "Certification and resource materials"
    ]
  }
];

export default function SchemeComponents() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 sm:py-16" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-schemes-title">
            Scheme Components
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive range of dairy development schemes designed to support farmers at every stage
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme, index) => (
            <SchemeCard
              key={scheme.id}
              icon={scheme.icon}
              title={scheme.title}
              description={scheme.description}
              benefits={scheme.benefits}
              componentId={scheme.id}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
