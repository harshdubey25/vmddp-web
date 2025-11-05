"use client"
import AuthorityMember from "./AuthorityMember";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';

 export default function AuthoritiesSection() {
  const { t } = useTranslation('common');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const mainAuthorities = t('authorities.mainAuthorities', { returnObjects: true }) as Array<{name: string, designation: string, image: string}>;
  const projectTeam = t('authorities.projectTeam', { returnObjects: true }) as Array<{name: string, designation: string, image: string}>;

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
        <div className="mb-12">
          {/* First row: 3 members - aligned properly */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
            {mainAuthorities.slice(0, 3).map((authority, index) => (
              <motion.div
                key={authority.name}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex justify-center h-full"
              >
                <div className="w-full">
                  <AuthorityMember
                    name={authority.name}
                    designation={authority.designation.replace(/\n/g, '<br />')}
                    image={authority.image}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Second row: 1 member centered */}
          <div className="flex justify-center mb-8">
            <motion.div
              key={mainAuthorities[3]?.name}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.5, delay: 3 * 0.1 }}
              className="w-full max-w-sm"
            >
              <AuthorityMember
                name={mainAuthorities[3]?.name}
                designation={mainAuthorities[3]?.designation.replace(/\n/g, '<br />')}
                image={mainAuthorities[3]?.image}
              />
            </motion.div>
          </div>
          
          {/* Third row: 2 members at left and right edges */}
          <div className="flex justify-between items-stretch max-w-6xl mx-auto">
            {mainAuthorities.slice(4, 6).map((authority, index) => (
              <motion.div
                key={authority.name}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.5, delay: (4 + index) * 0.1 }}
                className="w-full max-w-sm"
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
