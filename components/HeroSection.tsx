"use client"
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, MapPin, Building, Home, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';


export default function HeroSection() {
  const { t } = useTranslation('common');
  const stats = [
    { value: "19", label: t("districts"), icon: MapPin },
    { value: "192", label: t("talukas"), icon: Building },
    { value: "24,657", label: t("villages"), icon: Home },
    { value: "9", label: t("components"), icon: Package },
  ];


  const heroBackground = "/hero.jpg";

  return (
    <section className="relative bg-gradient-to-br from-primary/95 to-primary text-primary-foreground overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNC40MTgtMy41ODIgOC04IDhzLTgtMy41ODItOC04IDMuNTgyLTggOC04IDggMy41ODIgOCA4em0wIDI0YzAgNC40MTgtMy41ODIgOC04IDhzLTgtMy41ODItOC04IDMuNTgyLTggOC04IDggMy41ODIgOCA4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div> */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Side by Side Layout: Content on Left, Stats on Right */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">

          {/* Left Side: Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl mb-6"
              data-testid="text-hero-title"
            >
              {t("hero_title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl mb-8 text-primary-foreground/80"
              data-testid="text-hero-subtitle"
            >
              {t("hero_subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  data-testid="button-hero-register"
                >
                  {t("register_now")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Link href="/track">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 backdrop-blur-sm"
                  data-testid="button-hero-track"
                >
                  <FileText className="mr-2 w-5 h-5" />
                  {t("track_application")}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Stats in 2x2 Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full lg:w-auto lg:min-w-[400px]"
          >
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    data-testid={`stat-${stat.label.toLowerCase()}`}
                  >
                    <Card className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur-sm p-4 sm:p-6 hover-elevate">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-1">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="font-display font-bold text-2xl sm:text-3xl text-primary-foreground">{stat.value}</div>
                        <div className="text-xs sm:text-sm text-primary-foreground/80">{stat.label}</div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Curved Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-8 sm:h-12 lg:h-16"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
