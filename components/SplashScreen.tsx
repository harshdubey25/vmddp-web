"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SplashScreenProps {
    onEnter: () => void;
    inaugurationDate?: string;
}

export default function SplashScreen({ onEnter, inaugurationDate }: SplashScreenProps) {
    // Format the date if available, otherwise use today's date
    const dateToFormat = inaugurationDate ? new Date(inaugurationDate) : new Date();
    const formattedDate = dateToFormat.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black">
            {/* Curtain Rod */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-600 shadow-lg z-20">
                {/* Rod highlights */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
                {/* Left finial */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-md" />
                {/* Right finial */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-md" />
            </div>

            {/* Left Curtain */}
            <motion.div
                initial={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
                className="absolute top-8 bottom-0 left-0 w-1/2 shadow-2xl"
                style={{
                    background: "linear-gradient(to right, #8B0000 0%, #A00000 50%, #8B0000 100%)"
                }}
            >
                {/* Velvet pleats - multiple vertical folds */}
                <div className="absolute inset-0">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 w-[8.33%]"
                            style={{
                                left: `${i * 8.33}%`,
                                background: i % 2 === 0
                                    ? "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3) 100%)"
                                    : "linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.05) 100%)"
                            }}
                        />
                    ))}
                </div>

                {/* Gold trim on inner edge */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-400/30 via-transparent to-amber-400/30" />
                </div>

                {/* Tassel decoration */}
                <div className="absolute right-2 top-1/3 w-6 h-24 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full opacity-80" />

                {/* Deep shadow on center edge */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/40 to-transparent" />
            </motion.div>

            {/* Right Curtain */}
            <motion.div
                initial={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }}
                className="absolute top-8 bottom-0 right-0 w-1/2 shadow-2xl"
                style={{
                    background: "linear-gradient(to left, #8B0000 0%, #A00000 50%, #8B0000 100%)"
                }}
            >
                {/* Velvet pleats - multiple vertical folds */}
                <div className="absolute inset-0">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 w-[8.33%]"
                            style={{
                                left: `${i * 8.33}%`,
                                background: i % 2 === 0
                                    ? "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3) 100%)"
                                    : "linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.05) 100%)"
                            }}
                        />
                    ))}
                </div>

                {/* Gold trim on inner edge */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-400/30 via-transparent to-amber-400/30" />
                </div>

                {/* Tassel decoration */}
                <div className="absolute left-2 top-1/3 w-6 h-24 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full opacity-80" />

                {/* Deep shadow on center edge */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/40 to-transparent" />
            </motion.div>

            {/* Center Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4"
            >
                {/* Logo/Emblem Container */}
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mb-8"
                >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-background shadow-2xl flex items-center justify-center border-4 border-amber-500/40">
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold text-primary">
                                VMDDP
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Maharashtra
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Inauguration Text */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center mb-8 max-w-2xl mx-auto"
                >
                    <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-amber-50 mb-4 uppercase tracking-wide" data-testid="text-splash-title">
                        Inauguration of VMDDP Portal
                    </h1>
                    <div className="text-lg sm:text-xl text-amber-100/90 mb-4 uppercase tracking-wider">
                        By
                    </div>
                    <div className="space-y-2 mb-4">
                        <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-50" data-testid="text-splash-minister-name">
                            Smt. Pankaja Pradnya Gopinath Munde
                        </p>
                        <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed" data-testid="text-splash-minister-designation">
                            Hon. Minister for Animal Husbandry,<br />
                            Environment & Climate Change<br />
                            Maharashtra
                        </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-amber-400/30">
                        <p className="text-lg sm:text-xl text-amber-200 font-medium" data-testid="text-splash-date">
                            Date: {formattedDate}
                        </p>
                    </div>
                </motion.div>

                {/* Enter Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <Button
                        size="lg"
                        onClick={onEnter}
                        className="bg-background text-primary shadow-xl hover:bg-background/90"
                        data-testid="button-enter-portal"
                    >
                        Enter Portal
                        <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="absolute bottom-8 text-center text-amber-100/70 text-xs sm:text-sm"
                    data-testid="text-splash-tagline"
                >
                    Empowering Dairy Farmers Across 19 Districts
                </motion.div>
            </motion.div>

            {/* Center gap shadow (where curtains meet) */}
            <div className="absolute left-1/2 top-8 bottom-0 w-1 bg-black/60 transform -translate-x-1/2 shadow-xl" />
        </div>
    );
}
