"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, Award, ArrowRight, FileText } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from 'react-i18next';

export default function AboutSection() {
  const { t } = useTranslation('common');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const heroImage = "/dairy_farm_cows_milk_3b68e1d2.jpg";
  return (
    <section className="py-0">
      <div className="relative h-[200px] sm:h-[250px] lg:h-[300px] overflow-hidden">
        <img
          src={heroImage}
          alt={t('about_hero_alt')}
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        <div className="relative h-full flex items-center justify-center px-3 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center text-white max-w-4xl"
          >
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6" data-testid="text-about-title">
              {t('about_title')}
            </h2>
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  data-testid="button-about-register"
                >
                  {t("register_now")}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>

              <Link href="/track" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  data-testid="button-about-track"
                >
                  <FileText className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  {t("track_application")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16" ref={ref}>
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10 lg:mb-12">
          {/* Mission Card - Spans 2 rows on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            className="md:row-span-2"
          >
            <Card data-testid="card-mission" className="h-full">
              <CardContent className="p-5 sm:p-6 lg:p-8 h-full flex flex-col">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4 sm:mb-5 lg:mb-6"
                >
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-chart-1" />
                </motion.div>
                <h3 className="font-display font-semibold text-xl sm:text-2xl mb-3 sm:mb-4">{t('about_mission_title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t('about_mission_desc')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vision Card - Top right */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card data-testid="card-vision" className="h-full">
              <CardContent className="p-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4"
                >
                  <Eye className="w-6 h-6 text-chart-2" />
                </motion.div>
                <h3 className="font-display font-semibold text-lg mb-2">{t('about_vision_title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about_vision_desc')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Core Values Card - Bottom right */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card data-testid="card-values" className="h-full">
              <CardContent className="p-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4"
                >
                  <Award className="w-6 h-6 text-chart-3" />
                </motion.div>
                <h3 className="font-display font-semibold text-lg mb-2">{t('about_values_title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('about_values_desc')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Programme Highlights - Full width with 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-primary/5 rounded-lg p-6 sm:p-8"
        >
          <h3 className="font-display font-semibold text-xl mb-6 text-center">{t('about_highlights_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(t('about_highlights', { returnObjects: true }))
              ? t('about_highlights', { returnObjects: true }) as string[]
              : [])
              .map((highlight: string, index: number) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3"
                  style={{ 
                    order: Math.floor(index / 3) + (index % 3) * Math.ceil(9 / 3)
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">{highlight}</p>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
