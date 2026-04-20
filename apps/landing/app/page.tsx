import { HeroSection } from "@/components/hero";
import { FeaturesSection } from "@/components/features";
import DemoSection from "@/components/demo";
import { PricingSection } from "@/components/pricing";
import { FaqSection } from "@/components/faq";
import { ContactSection } from "@/components/contact";
import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DemoSection />
        <PricingSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
