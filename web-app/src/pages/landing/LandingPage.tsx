import { useEffect } from "react";
import LandingNav from "./sections/LandingNav";
import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import CoinSection from "./sections/CoinSection";
import StatsSection from "./sections/StatsSection";
import TestimonialSection from "./sections/TestimonialSection";
import FaqSection from "./sections/FaqSection";
import DownloadSection from "./sections/DownloadSection";
import LandingFooter from "./sections/LandingFooter";

export default function LandingPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Ballmate - App đặt sân bóng đá nhanh nhất Việt Nam";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfdfa] text-slate-800 antialiased">
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Bỏ qua điều hướng, đi tới nội dung
      </a>

      <LandingNav />

      <main id="noi-dung-chinh">
        <HeroSection />

        <FeaturesSection />
        <HowItWorksSection />
        <CoinSection />
        <StatsSection />
        <TestimonialSection />
        <FaqSection />
        <DownloadSection />
      </main>

      <LandingFooter />
    </div>
  );
}
