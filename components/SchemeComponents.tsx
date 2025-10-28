"use client"
import { Milk, HeartPulse, Pill, Sprout, Sparkles, Scissors, Package, Stethoscope, GraduationCap } from "lucide-react";
import SchemeCard from "./SchemeCard";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';
import { getComponentById } from "@/componentData/componentData";

const schemes = [
  {
    id: 1,
    icon: Milk,
    titleKey: "scheme_animal_induction_title",
    descriptionKey: "scheme_animal_induction_desc",
    benefitsKey: "scheme_animal_induction_benefits"
  },
  {
    id: 2,
    icon: HeartPulse,
    titleKey: "scheme_hgm_title",
    descriptionKey: "scheme_hgm_desc",
    benefitsKey: "scheme_hgm_benefits"
  },
  {
    id: 3,
    icon: Pill,
    titleKey: "scheme_fertility_feed_title",
    descriptionKey: "scheme_fertility_feed_desc",
    benefitsKey: "scheme_fertility_feed_benefits"
  },
  {
    id: 4,
    icon: Sparkles,
    titleKey: "scheme_fodder_seed_title",
    descriptionKey: "scheme_snf_enhancer_desc",
    benefitsKey: "scheme_snf_enhancer_benefits"
  },
  {
    id: 5,
    icon: Sprout,
    titleKey: "scheme_snf_enhancer_title",
    descriptionKey: "scheme_fodder_seed_desc",
    benefitsKey: "scheme_fodder_seed_benefits"
  },
  {
    id: 6,
    icon: Scissors,
    titleKey: "scheme_chaff_cutter_title",
    descriptionKey: "scheme_chaff_cutter_desc",
    benefitsKey: "scheme_chaff_cutter_benefits"
  },
  {
    id: 7,
    icon: Package,
    titleKey: "scheme_silage_title",
    descriptionKey: "scheme_silage_desc",
    benefitsKey: "scheme_silage_benefits"
  },
  {
    id: 8,
    icon: Stethoscope,
    titleKey: "scheme_infertile_treatment_title",
    descriptionKey: "scheme_infertile_treatment_desc",
    benefitsKey: "scheme_infertile_treatment_benefits"
  },
  {
    id: 9,
    icon: GraduationCap,
    titleKey: "scheme_training_title",
    descriptionKey: "scheme_training_desc",
    benefitsKey: "scheme_training_benefits"
  }
];

export default function SchemeComponents() {
  const { t } = useTranslation('common');
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
            {t('scheme_components_title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('scheme_components_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme, index) => {
            const componentDetail = getComponentById(scheme.id);
            return (
              <SchemeCard
                key={scheme.id}
                icon={scheme.icon}
                title={t(scheme.titleKey)}
                description={t(scheme.descriptionKey)}
                benefits={t(scheme.benefitsKey, { returnObjects: true }) as string[]}
                componentId={scheme.id}
                index={index}
                isInView={isInView}
                backgroundImage={componentDetail?.image}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
