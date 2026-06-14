import { useEffect, useState } from "react";
import Footer from "../../../components/v2Components/pages/landingPage2/Footer";
import HeroSection from "../../../components/v2Components/pages/landingPage2/HeroSection";
import HowItWorksSection from "../../../components/v2Components/pages/landingPage2/HowItWorksSection";
import NavBar from "../../../components/v2Components/pages/landingPage2/NavBar";
import DestinationsSection from "../../../components/v2Components/pages/landingPage2/DestinationsSection";
import EngagementPopup from "../../../components/v2Components/pages/landingPage2/EngagementPopup";
import PersonalizationModal, {
  type PersonalizationData,
} from "../../../components/v2Components/pages/landingPage2/PersonalizationModal";
import SocialValidationStrip from "../../../components/v2Components/pages/landingPage2/SocialValidationStrip";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { authApi, eventsApi } from "../../../dataStore/v2Api/client";
import FeaturedWishlistsSection from "../../../components/v2Components/pages/landingPage2/FeaturedWishlists";

export default function LandingPage() {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [modalOpen,        setModalOpen]       = useState(false);
  const [personalization,  setPersonalization] = useState<PersonalizationData | null>(null);

  // Auto-open the personalization modal on first visit for authenticated users
  // who haven't completed onboarding yet.
  useEffect(() => {
    if (isAuthenticated && user && !user.hasCompletedOnboarding) {
      const timer = setTimeout(() => setModalOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  const handlePersonalizationComplete = async (data: PersonalizationData) => {
    setPersonalization(data);
    setModalOpen(false);

    // Fire the behavioral event so the MongoDB tag inference loop can process it.
    eventsApi.track(
      "onboarding_completed",
      user?.userId ?? "anonymous",
      data.interests ?? [],
      "landing_page"
    );

    // Mark onboarding complete on the user account so the modal doesn't reappear.
    if (isAuthenticated) {
      await authApi.completeOnboarding().catch(() => {});
      updateUser({ hasCompletedOnboarding: true });
    }
  };

  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-white">
      <NavBar
        onForYouClick={() => setModalOpen(true)}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      <PersonalizationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={handlePersonalizationComplete}
      />

      <main>
        <HeroSection
          personalization={personalization}
          onPersonalizeClick={() => setModalOpen(true)}
        />

        <SocialValidationStrip
          personalization={personalization}
          userId={user?.userId}
        />

        <FeaturedWishlistsSection
          personalization={personalization}
          userId={user?.userId}
        />

        <HowItWorksSection />

        <DestinationsSection />
      </main>

      <Footer />

      <EngagementPopup triggerAfterSeconds={45} />
    </div>
  );
}
