import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "../hooks/v2Hooks/useAuth";
import { PersonalizationProvider } from "../hooks/v2Hooks/usePersonalization";
import { CurrencyProvider } from "../hooks/v2Hooks/useCurrency";
import "../App.css";

// Layout
import AppNavBar from "../components/v2Components/layout/AppNavBar";
import Footer from "../components/v2Components/pages/landingPage2/Footer";
import RequireAuth from "../components/v2Components/auth/RequireAuth";
import { ButtonLink } from "../components/v2Components/ui";

// Landing
import LandingPage from "../pages/v2Pages/landingPage/LandingPage";

// Explore
import ExploreWishlistsPage    from "../pages/v2Pages/explore/ExploreWishlistsPage";
import ExploreDestinationsPage from "../pages/v2Pages/explore/ExploreDestinationsPage";

// Detail
import WishlistDetailPage    from "../pages/v2Pages/detail/WishlistDetailPage";
import DestinationDetailPage from "../pages/v2Pages/detail/DestinationDetailPage";

// User
import SavedPage         from "../pages/v2Pages/user/SavedPage";
import MyWishlistsPage   from "../pages/v2Pages/user/MyWishlistsPage";
import EditWishlistPage  from "../pages/v2Pages/user/EditWishlistPage";
import CollaboratePage   from "../pages/v2Pages/user/CollaboratePage";

// Search
import SearchResultsPage from "../pages/v2Pages/search/SearchResultsPage";

// Auth
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ConfirmEmailPage } from "../pages/v2Pages/auth/AuthPages";
import AccountPage from "../pages/v2Pages/user/AccountPage";

// Trips
import BrowseTripPage     from "../pages/v2Pages/trip/BrowseTripPage";
import CreateTripPage     from "../pages/v2Pages/trip/CreateTripPage";
import TripThreadChatPage from "../pages/v2Pages/trip/TripThreadChatPage";
import TripHubPage        from "../pages/v2Pages/trip/TripHubPage";

// Business & info
import PartnersPage  from "../pages/v2Pages/partners/PartnersPage";
import ContactUsPage from "../pages/contact_us_page";
import AboutPage     from "../pages/about_page";

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function AppLayout() {
  const location = useLocation();
  // The landing hero sits under the transparent navbar; other pages get a spacer.
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <AppNavBar />
      <main className={`flex-1 ${isLanding ? "" : "pt-16"}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted mb-6">404</p>
        <h1 className="text-4xl md:text-5xl font-light text-ink mb-3">This page could not be found</h1>
        <p className="text-ink-soft mb-8 max-w-sm mx-auto">
          The link may be broken, or the page may have moved.
        </p>
        <ButtonLink to="/" size="lg">Return home</ButtonLink>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
      <PersonalizationProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />

            {/* Explore — public */}
            <Route path="/explore/wishlists"    element={<ExploreWishlistsPage />} />
            <Route path="/explore/destinations" element={<ExploreDestinationsPage />} />
            <Route path="/search"               element={<SearchResultsPage />} />
            <Route path="/browse-trip"          element={<BrowseTripPage />} />

            {/* Detail — public */}
            <Route path="/wishlists/:id/:slug"    element={<WishlistDetailPage />} />
            <Route path="/wishlists/:id"          element={<WishlistDetailPage />} />
            <Route path="/destinations/:id/:slug" element={<DestinationDetailPage />} />
            <Route path="/destinations/:id"       element={<DestinationDetailPage />} />

            {/* Signed-in only — logged-out visitors are sent to login and back */}
            <Route element={<RequireAuth />}>
              <Route path="/saved"                        element={<SavedPage />} />
              <Route path="/my-wishlists"                 element={<MyWishlistsPage />} />
              <Route path="/my-wishlists/:id/edit"        element={<EditWishlistPage />} />
              <Route path="/my-wishlists/:id/collaborate" element={<CollaboratePage />} />
              <Route path="/create-trip"                  element={<CreateTripPage />} />
              <Route path="/trip-thread/:id"              element={<TripThreadChatPage />} />
              <Route path="/trip-hub"                     element={<TripHubPage />} />
              <Route path="/account"                      element={<AccountPage />} />
            </Route>

            {/* Auth */}
            <Route path="/auth/login"    element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            {/* Paths match the links in the backend's emails */}
            <Route path="/reset-password"       element={<ResetPasswordPage />} />
            <Route path="/confirm-email"        element={<ConfirmEmailPage />} />
            <Route path="/auth/reset-password"  element={<ResetPasswordPage />} />

            {/* Business & info */}
            <Route path="/partners"   element={<PartnersPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />
            <Route path="/about"      element={<AboutPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </PersonalizationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
