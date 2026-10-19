import HeroSection from "../../../components/v2Components/pages/landingPage2/HeroSection";
import SocialValidationStrip from "../../../components/v2Components/pages/landingPage2/SocialValidationStrip";
import HowItWorksSection from "../../../components/v2Components/pages/landingPage2/HowItWorksSection";
import FeaturedWishlistsSection from "../../../components/v2Components/pages/landingPage2/FeaturedWishlists";
import TripsStrip from "../../../components/v2Components/pages/landingPage2/TripsStrip";
import DestinationsSection from "../../../components/v2Components/pages/landingPage2/DestinationsSection";
import SignupBand from "../../../components/v2Components/pages/landingPage2/SignupBand";
import EngagementPopup from "../../../components/v2Components/pages/landingPage2/EngagementPopup";

// The landing page is a guided journey; each section answers the visitor's
// next question:
//   "What is this?"              → Hero
//   "What do people like me do?" → Travellers like you (wishlists)
//   "Can they help me?"          → Pick your interests (wishlists, live)
//   "Where is everyone going?"   → Popular destinations
//   "Oh, I get it."              → How it works
//   "I don't want to go alone"   → Trips strip
//   "OK, I'm in."                → Sign-up band
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <SocialValidationStrip />
      <FeaturedWishlistsSection />
      <DestinationsSection />
      <HowItWorksSection />
      <TripsStrip />
      <SignupBand />
      <EngagementPopup triggerAfterSeconds={45} />
    </>
  );
}
