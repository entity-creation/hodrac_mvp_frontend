import { useState } from "react";
import {Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "../hooks/v2Hooks/useAuth";
import "../App.css";
// Layout
import AppNavBar from "../components/v2Components/layout/AppNavBar";

// Landing page (existing)
import LandingPage from "../pages/v2Pages/landingPage/LandingPage";
import PersonalizationModal, { type PersonalizationData } from "../components/v2Components/pages/landingPage2/PersonalizationModal";

// Explore
import ExploreWishlistsPage    from "../pages/v2Pages/explore/ExploreWishlistsPage";
import ExploreDestinationsPage from "../pages/v2Pages/explore/ExploreDestinationsPage";

// Detail
import WishlistDetailPage    from "../pages/v2Pages/detail/WishlistDetailPage";
import DestinationDetailPage from "../pages/v2Pages/detail/DestinationDetailPage";

// User
import SavedPage         from "../pages/v2Pages//user/SavedPage";
import MyWishlistsPage   from "../pages/v2Pages/user/MyWishlistsPage";
import EditWishlistPage  from "../pages/v2Pages/user/EditWishlistPage";
import CollaboratePage   from "../pages/v2Pages/user/CollaboratePage";

// Search
import SearchResultsPage from "../pages/v2Pages/search/SearchResultsPage";

// Auth
import { LoginPage, RegisterPage } from "../pages/v2Pages/auth/AuthPages";

// ─── Layout wrapper ───────────────────────────────────────────────────────────
// Pages that use the AppNavBar (everything except the landing page root)

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  // Personalization modal state — available app-wide via NavBar "For You" button
  const [modalOpen, setModalOpen] = useState(false);
  const [, setPersonalization] = useState<PersonalizationData | null>(null);

  if (isLanding) return <Outlet />;

  return (
    <>
      <AppNavBar onForYouClick={() => setModalOpen(true)} />

      <PersonalizationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={(data) => {
          setPersonalization(data);
          setModalOpen(false);
        }}
      />

      {/* Spacer for fixed navbar */}
      <div className="pt-16">
        <Outlet />
      </div>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      
        <Routes>
          {/* Landing page has its own nav */}
          <Route path="/" element={<LandingPage />} />

          {/* All other pages share AppLayout with the app navbar */}
          <Route element={<AppLayout />}>
            {/* Explore */}
            <Route path="/explore/wishlists"    element={<ExploreWishlistsPage />} />
            <Route path="/explore/destinations" element={<ExploreDestinationsPage />} />

            {/* Detail pages */}
            <Route path="/wishlists/:id/:slug"    element={<WishlistDetailPage />} />
            <Route path="/wishlists/:id"          element={<WishlistDetailPage />} />
            <Route path="/destinations/:id/:slug" element={<DestinationDetailPage />} />
            <Route path="/destinations/:id"       element={<DestinationDetailPage />} />

            {/* User pages */}
            <Route path="/saved"                              element={<SavedPage />} />
            <Route path="/my-wishlists"                       element={<MyWishlistsPage />} />
            <Route path="/my-wishlists/:id/edit"              element={<EditWishlistPage />} />
            <Route path="/my-wishlists/:id/collaborate"       element={<CollaboratePage />} />

            {/* Search */}
            <Route path="/search" element={<SearchResultsPage />} />

            {/* Auth */}
            <Route path="/auth/login"    element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Catch-all */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-6xl mb-4">🗺️</p>
                  <h1 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                    Page not found
                  </h1>
                  <p className="text-gray-500 mb-6 text-sm">This route doesn't exist yet — or you may have followed a broken link.</p>
                  <a href="/" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full inline-block">
                    Back to home
                  </a>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      
    </AuthProvider>
  );
}
