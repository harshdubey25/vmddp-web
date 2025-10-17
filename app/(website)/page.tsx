export const runtime = 'edge';
import HeroSection from "@/components/HeroSection";
import StatsCounter from "@/components/StatsCounter";
import AboutSection from "@/components/AboutSection";
import SchemeComponents from "@/components/SchemeComponents";
import AuthoritiesSection from "@/components/AuthoritiesSection";

export default function Home() {
  return (

    //remove these props from each component then u will be able to see data on website i did this for errors
    <div>
      <HeroSection  />
      <StatsCounter  />
      <AboutSection />
      <SchemeComponents />
      <AuthoritiesSection />
    </div>
  );      
}

