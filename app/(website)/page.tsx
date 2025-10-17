import HeroSection from "@/components/HeroSection";
import StatsCounter from "@/components/StatsCounter";
import AboutSection from "@/components/AboutSection";
import SchemeComponents from "@/components/SchemeComponents";
import AuthoritiesSection from "@/components/AuthoritiesSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsCounter />
      <AboutSection />
      <SchemeComponents />
      <AuthoritiesSection />
    </div>
  );
}

