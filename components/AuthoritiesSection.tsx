"use client"
import AuthorityMember from "./AuthorityMember";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';

const mainAuthorities = [
  {
    name: "श्री देवेंद्र फडणवीस",
    designation: "Hon. Chief Minister of Maharashtra Government",
    image: "member1_1759739467950.png",
  },
  {
    name: "श्री एकनाथ शिंदे",
    designation: "Hon. Deputy Chief Minister of Maharashtra Government",
    image: "member2_1759739467949.png",
  },
  {
    name: "श्री अजित पवार",
    designation: "Hon. Deputy Chief Minister of Maharashtra Government",
    image: "member3_1759739467949.png",
  },
  {
    name: "मा. ना. श्रीमती. पंकजताई मुंडे",
    designation: "Hon. Minister for Animal Husbandry, Environment & Climate Change",
    image: "member4_1759739467948.png",
  },
  {
    name: "डॉ. रामस्वामी एन.",
    designation: "Hon. Secretary of Animal Husbandry , Dairy Development & Fisheries",
    image: "member5_1759739467948.png",
  },
  {
    name: "श्री प्रवीणकुमार देवरे",
    designation: "Hon. Commissioner Department of Animal Husbandry Maharashtra Government",
    image: "member6_1759739467947.png",
  },
];

const projectTeam = [
  {
    name: "डॉ. संजय गोराणी",
    designation: "Hon. Project Director\nVidarbha And Marathwada Dairy development Project",
    image: "member_head.png",
  },
  {
    name: "डॉ. नाना अर्जुन सोनवणे",
    designation: "Hon. Additional Project Director\n Vidarbha And Marathwada Dairy development Project",
    image: "member_7.jpg",
  },
  {
    name: "डॉ. नरेंद्र पाटील",
    designation: "Hon. Officer On Special Duty\nVidarbha And Marathwada Dairy development Project",
    image: "membe_8.jpg",
  },
];

export default function AuthoritiesSection() {
  const { t } = useTranslation('common');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 sm:py-16 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-authorities-title">
            {t('authorities_title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('authorities_subtitle')}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mainAuthorities.map((authority, index) => (
            <motion.div
              key={authority.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AuthorityMember
                name={authority.name}
                designation={authority.designation.replace(/\n/g, '<br />')}
                image={authority.image}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-project-team-title">
            {t('authorities_title1')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('authorities_subtitle1')}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectTeam.map((authority, index) => (
            <motion.div
              key={authority.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AuthorityMember
                name={authority.name}
                designation={authority.designation.replace(/\n/g, '<br />')}
                image={authority.image}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
