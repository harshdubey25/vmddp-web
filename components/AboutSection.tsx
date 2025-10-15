"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Award } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const heroImage = "/dairy_farm_cows_milk_3b68e1d2.jpg";
  return (
    <section className="py-0">
      <div className="relative h-[300px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Dairy farming in Maharashtra" 
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center text-white max-w-4xl"
          >
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-4" data-testid="text-about-title">
              About VMDDP
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
              A comprehensive initiative by the Government of Maharashtra and National Dairy Development Board (NDDB) to strengthen dairy infrastructure and support farmers across 19 districts in Vidarbha and Marathwada regions.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" ref={ref}>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Mission Card - Spans 2 rows on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            className="md:row-span-2"
          >
            <Card data-testid="card-mission" className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-16 h-16 rounded-lg bg-chart-1/10 flex items-center justify-center mb-6"
                >
                  <Target className="w-8 h-8 text-chart-1" />
                </motion.div>
                <h3 className="font-display font-semibold text-2xl mb-4">Our Mission</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  To build robust dairy infrastructure and empower farmers through financial assistance, modern technology, and comprehensive veterinary support across Vidarbha and Marathwada regions.
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
                <h3 className="font-display font-semibold text-lg mb-2">Our Vision</h3>
                <p className="text-sm text-muted-foreground">
                  To establish Vidarbha and Marathwada as self-reliant dairy hubs with sustainable livelihoods, ensuring economic prosperity and food security for farming families.
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
                <h3 className="font-display font-semibold text-lg mb-2">Core Values</h3>
                <p className="text-sm text-muted-foreground">
                  Transparency in operations, farmer-first approach, efficient service delivery, fair resource distribution, and commitment to sustainable dairy development.
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
          <h3 className="font-display font-semibold text-xl mb-6">Programme Highlights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Joint initiative of Government of Maharashtra and NDDB",
              "Coverage across 19 districts, 192 talukas, and 24,657 villages",
              "9 comprehensive dairy development components",
              "Modern dairy infrastructure and equipment support",
              "Digital application platform with transparent workflow",
              "Direct financial assistance to farmers' accounts",
              "Quality breeding stock and veterinary care support",
              "Capacity building through farmer training programs",
              "Real-time application tracking and status monitoring",
              "Fair and equitable resource allocation system"
            ].map((highlight, index) => (
              <div key={index} className="flex items-start gap-3">
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
