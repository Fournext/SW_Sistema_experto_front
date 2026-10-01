import React from 'react';
import LandingNavbar from '../components/LandingNavbar';
import HeroSection from '../components/HeroSection';
import InteractiveDemoPreview from '../components/InteractiveDemoPreview';
import FeatureGrid from '../components/FeatureGrid';
import EducationalBenefits from '../components/EducationalBenefits';
import SeedTemplateBanner from '../components/SeedTemplateBanner';
import LandingFooter from '../components/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 antialiased selection:bg-teal-200 selection:text-teal-900">
      {/* Fixed Navigation Header */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main>
        <HeroSection />
        <InteractiveDemoPreview />
        <FeatureGrid />
        <EducationalBenefits />
        <SeedTemplateBanner />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
