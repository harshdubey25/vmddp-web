"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";

interface SplashWrapperProps {
  children: React.ReactNode;
}

export default function SplashWrapper({ children }: SplashWrapperProps) {
  const [showSplash, setShowSplash] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [inaugurationDate, setInaugurationDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch splash config from API on client side
    async function fetchSplashConfig() {
      try {
        const response = await fetch('/api/site-config');
        if (response.ok) {
          const data = await response.json();
          if (data.showSplash) {
            setShowSplash(true);
            setInaugurationDate(data.inaugurationDate);
          } else {
            setHasEntered(true);
          }
        } else {
          setHasEntered(true);
        }
      } catch (error) {
        console.error('Error fetching splash config:', error);
        setHasEntered(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSplashConfig();
  }, []);

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

  // Don't render children until we've checked the splash config
  if (isLoading) {
    return null;
  }

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
      {hasEntered && children}
    </>
  );
}