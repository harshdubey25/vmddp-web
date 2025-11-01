"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";

interface SplashWrapperProps {
  children: React.ReactNode;
  initialShowSplash: boolean;
  inaugurationDate?: string | null;
}

export default function SplashWrapper({ children, initialShowSplash, inaugurationDate }: SplashWrapperProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    // Show splash only if backend flag is true
    if (initialShowSplash) {
      setShowSplash(true);
    } else {
      setHasEntered(true);
    }
  }, [initialShowSplash]);

  const handleEnter = async () => {
    setHasEntered(true);

    // Save to backend that user has entered
    try {
      await fetch('/api/mark-entered', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error saving entered status:', error);
    }

    // Animate out the splash screen
    setTimeout(() => {
      setShowSplash(false);
    }, 1200); // Animation duration
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && !hasEntered && (
          <SplashScreen
            key="splash"
            onEnter={handleEnter}
            inaugurationDate={inaugurationDate || undefined}
          />
        )}
      </AnimatePresence>
      {(hasEntered || !initialShowSplash) && children}
    </>
  );
}