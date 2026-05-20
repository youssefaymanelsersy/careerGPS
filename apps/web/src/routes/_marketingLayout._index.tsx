import HeroSection from "@/features/marketing/components/hero-section";
import type { Route } from "./+types/_marketingLayout._index";
import HowItWorksSection from "@/features/marketing/components/how-it-works-section";
import FeaturesSection from "@/features/marketing/components/features-section";
import PricingSection from "@/features/marketing/components/pricing-section";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CareerGPS" },
    { name: "description", content: "CareerGPS is a web application" },
  ];
}

export default function Home() {

  return (
    <main>
      <HeroSection/>
      <HowItWorksSection/>
      <FeaturesSection/>
      <PricingSection/>
    </main>
  );
}
