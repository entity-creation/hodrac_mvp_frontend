import { lazy, Suspense } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "../hooks/v2Hooks/useAuth";
import { PersonalizationProvider } from "../hooks/v2Hooks/usePersonalization";
import { CurrencyProvider } from "../hooks/v2Hooks/useCurrency";
import "../App.css";

// Admin dashboard: its own bundle, only downloaded when someone opens /admin.
const AdminApp = lazy(() => import("../admin/AdminApp"));

// Hodrac Host pages: own chunks, registered only when HOST_ENABLED.
const HostHomePage       = lazy(() => import("../pages/v2Pages/host/HostHomePage"));
const HostOnboardingPage = lazy(() => import("../pages/v2Pages/host/HostOnboardingPage"));
const HostTripFormPage   = lazy(() => import("../pages/v2Pages/host/HostTripFormPage"));
const TripPayPage        = lazy(() => import("../pages/v2Pages/host/TripPayPage"));
const PaymentCallbackPage = lazy(() => import("../pages/v2Pages/host/PaymentCallbackPage"));
const ReceiptsPage       = lazy(() => import("../pages/v2Pages/host/ReceiptsPage"));
const HostTripsPage      = lazy(() => import("../pages/v2Pages/host/HostTripsPage"));
const HostManifestPage   = lazy(() => import("../pages/v2Pages/host/HostManifestPage"));
const HostReportsPage    = lazy(() => import("../pages/v2Pages/host/HostReportsPage"));
const HostDashboardPage  = lazy(() => import("../pages/v2Pages/host/HostDashboardPage"));
const host = (page: React.ReactNode) => <Suspense fallback={<PageSkeleton />}>{page}</Suspense>;

// Layout
import AppNavBar from "../components/v2Components/layout/AppNavBar";
import Footer from "../components/v2Components/pages/landingPage2/Footer";
import PageSkeleton from "../components/v2Components/layout/PageSkeleton";
import RequireAuth from "../components/v2Components/auth/RequireAuth";
import PageMeta from "../components/v2Components/seo/PageMeta";
import { HOST_ENABLED } from "../utils/v2Utils/host";
import { STATIC_PAGE_META } from "../utils/v2Utils/pageMeta";
import { ButtonLink, FullPageSpinner } from "../components/v2Components/ui";

// Landing: in the main bundle, since most visits start here.
import LandingPage from "../pages/v2Pages/landingPage/LandingPage";

// Every other page is its own chunk, downloaded the first time it's opened
// (the Suspense in AppLayout shows PageSkeleton meanwhile).

// Explore
const ExploreWishlistsPage    = lazy(() => import("../pages/v2Pages/explore/ExploreWishlistsPage"));
const ExploreDestinationsPage = lazy(() => import("../pages/v2Pages/explore/ExploreDestinationsPage"));

// Detail
const WishlistDetailPage    = lazy(() => import("../pages/v2Pages/detail/WishlistDetailPage"));
const DestinationDetailPage = lazy(() => import("../pages/v2Pages/detail/DestinationDetailPage"));

// User
const SavedPage        = lazy(() => import("../pages/v2Pages/user/SavedPage"));
const MyWishlistsPage  = lazy(() => import("../pages/v2Pages/user/MyWishlistsPage"));
const EditWishlistPage = lazy(() => import("../pages/v2Pages/user/EditWishlistPage"));
const CollaboratePage  = lazy(() => import("../pages/v2Pages/user/CollaboratePage"));
const AccountPage      = lazy(() => import("../pages/v2Pages/user/AccountPage"));

// Search
const SearchResultsPage = lazy(() => import("../pages/v2Pages/search/SearchResultsPage"));

// Auth (one chunk for all of them)
const authPages = () => import("../pages/v2Pages/auth/AuthPages");
const LoginPage          = lazy(() => authPages().then(m => ({ default: m.LoginPage })));
const RegisterPage       = lazy(() => authPages().then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => authPages().then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazy(() => authPages().then(m => ({ default: m.ResetPasswordPage })));
const ConfirmEmailPage   = lazy(() => authPages().then(m => ({ default: m.ConfirmEmailPage })));

// Trips
const BrowseTripPage     = lazy(() => import("../pages/v2Pages/trip/BrowseTripPage"));
const CreateTripPage     = lazy(() => import("../pages/v2Pages/trip/CreateTripPage"));
const TripThreadChatPage = lazy(() => import("../pages/v2Pages/trip/TripThreadChatPage"));
const TripHubPage        = lazy(() => import("../pages/v2Pages/trip/TripHubPage"));
const TripPage           = lazy(() => import("../pages/v2Pages/trip/TripPage"));
const SharedWishlistPage = lazy(() => import("../pages/v2Pages/shared/SharedWishlistPage"));

// Blog
const BlogListPage = lazy(() => import("../pages/v2Pages/blog/BlogListPage"));
const BlogPostPage = lazy(() => import("../pages/v2Pages/blog/BlogPostPage"));

// Business & info
const PartnersPage  = lazy(() => import("../pages/v2Pages/partners/PartnersPage"));
const ContactUsPage = lazy(() => import("../pages/contact_us_page"));
const AboutPage     = lazy(() => import("../pages/about_page"));
const TermsPage     = lazy(() => import("../pages/v2Pages/legal/TermsPage"));
const PrivacyPage   = lazy(() => import("../pages/v2Pages/legal/PrivacyPage"));

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function AppLayout() {
  const location = useLocation();
  // The landing hero sits under the transparent navbar; other pages get a spacer.
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <AppNavBar />
      <main className={`flex-1 ${isLanding ? "" : "pt-16"}`}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
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
          {/* Admin has its own layout (no site navbar/footer) */}
          <Route element={<><PageMeta title="Admin" noindex /><RequireAuth /></>}>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<FullPageSpinner />}>
                  <AdminApp />
                </Suspense>
              }
            />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/" element={<><PageMeta {...STATIC_PAGE_META["/"]} /><LandingPage /></>} />

            {/* Explore — public */}
            <Route path="/explore/wishlists"    element={<><PageMeta {...STATIC_PAGE_META["/explore/wishlists"]} /><ExploreWishlistsPage /></>} />
            <Route path="/explore/destinations" element={<><PageMeta {...STATIC_PAGE_META["/explore/destinations"]} /><ExploreDestinationsPage /></>} />
            <Route path="/search"               element={<><PageMeta title="Search" noindex /><SearchResultsPage /></>} />
            <Route path="/browse-trip"          element={<><PageMeta {...STATIC_PAGE_META["/browse-trip"]} /><BrowseTripPage /></>} />

            {/* Shareable pages (no login). Paths match the backend's share redirects. */}
            <Route path="/trips/:id"               element={<><PageMeta title="Trip" noindex /><TripPage /></>} />
            <Route path="/shared/wishlists/:token" element={<><PageMeta title="Shared wishlist" noindex /><SharedWishlistPage /></>} />

            {/* Detail — public */}
            <Route path="/wishlists/:id/:slug"    element={<WishlistDetailPage />} />
            <Route path="/wishlists/:id"          element={<WishlistDetailPage />} />
            <Route path="/destinations/:id/:slug" element={<DestinationDetailPage />} />
            <Route path="/destinations/:id"       element={<DestinationDetailPage />} />

            {/* Signed-in only — logged-out visitors are sent to login and back */}
            <Route element={<><PageMeta title="My Hodrac" noindex /><RequireAuth /></>}>
              <Route path="/saved"                        element={<SavedPage />} />
              <Route path="/my-wishlists"                 element={<MyWishlistsPage />} />
              <Route path="/my-wishlists/:id/edit"        element={<EditWishlistPage />} />
              <Route path="/my-wishlists/:id/collaborate" element={<CollaboratePage />} />
              <Route path="/create-trip"                  element={<CreateTripPage />} />
              <Route path="/trip-thread/:id"              element={<TripThreadChatPage />} />
              <Route path="/trip-hub"                     element={<TripHubPage />} />
              <Route path="/account"                      element={<AccountPage />} />
              {HOST_ENABLED && <Route path="/host/onboarding" element={host(<HostOnboardingPage />)} />}
              {HOST_ENABLED && <Route path="/host/trips" element={host(<HostTripsPage />)} />}
              {HOST_ENABLED && <Route path="/host/trips/new" element={host(<HostTripFormPage />)} />}
              {HOST_ENABLED && <Route path="/host/trips/:id" element={host(<HostManifestPage />)} />}
              {HOST_ENABLED && <Route path="/host/reports" element={host(<HostReportsPage />)} />}
              {HOST_ENABLED && <Route path="/host/dashboard" element={host(<HostDashboardPage />)} />}
              {HOST_ENABLED && <Route path="/host/trips/:id/edit" element={host(<HostTripFormPage />)} />}
              {HOST_ENABLED && <Route path="/trips/:id/pay" element={host(<TripPayPage />)} />}
              {HOST_ENABLED && <Route path="/trips/payment/callback" element={host(<PaymentCallbackPage />)} />}
              {HOST_ENABLED && <Route path="/payments" element={host(<ReceiptsPage />)} />}
              {HOST_ENABLED && <Route path="/payments/:reference" element={host(<ReceiptsPage />)} />}
            </Route>

            {/* Auth */}
            <Route path="/auth/login"    element={<><PageMeta title="Log in" noindex /><LoginPage /></>} />
            <Route path="/auth/register" element={<><PageMeta title="Sign up" noindex /><RegisterPage /></>} />
            <Route path="/auth/forgot-password" element={<><PageMeta title="Forgot password" noindex /><ForgotPasswordPage /></>} />
            {/* Paths match the links in the backend's emails */}
            <Route path="/reset-password"       element={<><PageMeta title="Reset password" noindex /><ResetPasswordPage /></>} />
            <Route path="/confirm-email"        element={<><PageMeta title="Confirm email" noindex /><ConfirmEmailPage /></>} />
            <Route path="/auth/reset-password"  element={<><PageMeta title="Reset password" noindex /><ResetPasswordPage /></>} />

            {/* Blog: pages set their own meta */}
            <Route path="/blog"           element={<BlogListPage />} />
            <Route path="/blog/tag/:tag"  element={<BlogListPage />} />
            <Route path="/blog/:slug"     element={<BlogPostPage />} />

            {/* Business & info */}
            <Route path="/partners"   element={<><PageMeta {...STATIC_PAGE_META["/partners"]} /><PartnersPage /></>} />
            <Route path="/contact-us" element={<><PageMeta {...STATIC_PAGE_META["/contact-us"]} /><ContactUsPage /></>} />
            <Route path="/about"      element={<><PageMeta {...STATIC_PAGE_META["/about"]} /><AboutPage /></>} />
            <Route path="/terms"      element={<><PageMeta {...STATIC_PAGE_META["/terms"]} /><TermsPage /></>} />
            <Route path="/privacy"    element={<><PageMeta {...STATIC_PAGE_META["/privacy"]} /><PrivacyPage /></>} />

            {/* Hodrac Host (hidden until launch) */}
            {HOST_ENABLED && (
              <Route path="/host" element={host(<><PageMeta title="Host with Hodrac" noindex
                description="Sell seats on your group trips from one link: deposits, instalments and signed terms, paid straight to your bank." /><HostHomePage /></>)} />
            )}

            <Route path="*" element={<><PageMeta title="Page not found" noindex /><NotFoundPage /></>} />
          </Route>
        </Routes>
      </PersonalizationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
