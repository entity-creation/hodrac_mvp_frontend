import { useEffect} from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landing_page";
import ContactUsPage from "./pages/contact_us_page";
import ExploreTripsPage from "./pages/explore_trips_page";
import { ROUTES } from "./utils/routes";
import DestinationDetailsPage from "./pages/destination_details_page";
import AboutPage from "./pages/about_page";
import WishlistPage from "./pages/WishlistPage";

function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path={ROUTES.PUBLIC.HOME} element={<LandingPage />} />
        <Route path={ROUTES.PUBLIC.CONTACTUS} element={<ContactUsPage />} />
        <Route
          path={ROUTES.PUBLIC.EXPLORETRIPS}
          element={<ExploreTripsPage />}
        />
        <Route
          path={`${ROUTES.PUBLIC.WISHLIST}/:id/:name`}
          element={<WishlistPage />}
        />
        <Route
          path={`${ROUTES.PUBLIC.DESTINATIONDETAILS}/:id/:name`}
          element={<DestinationDetailsPage />}
        />
        <Route path={ROUTES.PUBLIC.ABOUT} element={<AboutPage />} />
      </Routes>
    </>
  );
}

export default App;

function ScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);
  return null;
}
