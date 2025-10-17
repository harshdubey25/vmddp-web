export const runtime = 'edge';
import HeroSection from "@/components/HeroSection";
import StatsCounter from "@/components/StatsCounter";
import AboutSection from "@/components/AboutSection";
import SchemeComponents from "@/components/SchemeComponents";
import AuthoritiesSection from "@/components/AuthoritiesSection";
import Header from "@/components/Header";
import { Footer } from "react-day-picker";

export default function Home() {
  return (
    <div>
      <Header />
      <HeroSection />
      <StatsCounter />
      <AboutSection />
      <SchemeComponents />
      <AuthoritiesSection />
      <Footer />
    </div>
  );
}

