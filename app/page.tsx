import HeroSection from "@/components/HeroSection";

import AboutSection from "@/components/AboutSection";
import SchemeComponents from "@/components/SchemeComponents";
import AuthoritiesSection from "@/components/AuthoritiesSection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsCounterWrapper from "@/components/StatsCounterWrapper";
import QRCodeScanner from "@/components/QRCodeScanner";

export default function Home() {
  return (
    <div>
      <QRCodeScanner />
      <Header />
      <HeroSection />
      <StatsCounterWrapper />
      <AboutSection />
      <SchemeComponents />
      <AuthoritiesSection />
      <Footer />
    </div>
  );
}

