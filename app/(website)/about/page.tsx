export const runtime = 'edge'; // Ensure the page uses the Edge runtime
import AboutSection from "@/components/AboutSection";

export default function About() {
    return (
        <div className="min-h-[calc(100vh-16rem)]">
            <AboutSection />
        </div>
    );
}
