import DestinationSection from "../components/landingPage/destinations_section";
import Footer from "../components/landingPage/footer";
import HeroSection from "../components/landingPage/hero_section";
import HowItWorksSection from "../components/landingPage/how_it_works_section";
import NavBar from "../components/landingPage/nav_bar";
import { PopularWishlists } from "../components/landingPage/popular_wishlist";
import { TopCountries } from "../components/landingPage/top_countries";

function LandingPage() {
  return (
    <>
      <div className="w-screen h-screen overflow-x-hidden">
        <div className="py-5 px-10 w-full flex flex-col items-start bg-white">
          <NavBar />
          <HeroSection />
          <DestinationSection />
          <TopCountries />
          <PopularWishlists />
          <HowItWorksSection />
        </div>
        <Footer />
      </div>
    </>
  );
}

export default LandingPage;
