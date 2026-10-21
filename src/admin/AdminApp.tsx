import { Link, NavLink, Outlet, Route, Routes } from "react-router-dom";
import {
  LayoutDashboard, Users, Plane, Handshake, Inbox, Mail, MapPin, Tags, Globe,
  Map, Star, Sparkles, BadgeCheck, ArrowLeft, ShieldAlert, PieChart, type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminStatus, clearAdminCache, type AdminCheck } from "./useAdmin";
import { useAuth } from "../hooks/v2Hooks/useAuth";
import { loginPath } from "../utils/v2Utils/authRedirect";
import { FullPageSpinner } from "../components/v2Components/ui";
import { ToastProvider } from "./ui";
import OverviewPage from "./pages/OverviewPage";
import InsightsPage from "./pages/InsightsPage";
import UsersPage from "./pages/UsersPage";
import NewsletterPage from "./pages/NewsletterPage";
import TripsPage from "./pages/TripsPage";
import PartnersPage from "./pages/PartnersPage";
import LeadsPage from "./pages/LeadsPage";
import DestinationsPage from "./pages/DestinationsPage";
import WishlistsPage from "./pages/WishlistsPage";
import FeaturedPoolPage from "./pages/FeaturedPoolPage";
import FeaturedDestinationsPage from "./pages/FeaturedDestinationsPage";
import CreatorsPage from "./pages/CreatorsPage";
import TaxonomyPage from "./pages/TaxonomyPage";
import PlacesPage from "./pages/PlacesPage";

// Admin dashboard at /admin. Lazy-loaded from vzApp/App.tsx (its own bundle)
// and wrapped in <RequireAuth>, so only signed-in users reach this; the admin
// check here shows non-admins a "not authorised" page.

interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ADMIN_SECTIONS: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/insights", label: "Audience insights", icon: PieChart },
    ],
  },
  {
    group: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    group: "Trips",
    items: [{ to: "/admin/trips", label: "Trips & moderation", icon: Plane }],
  },
  {
    group: "Partners",
    items: [
      { to: "/admin/partners", label: "Partners & links", icon: Handshake },
      { to: "/admin/leads", label: "Partner leads", icon: Inbox },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/admin/destinations", label: "Destinations", icon: MapPin },
      { to: "/admin/wishlists", label: "Wishlist templates", icon: Map },
      { to: "/admin/featured-destinations", label: "Featured destinations", icon: Sparkles },
      { to: "/admin/featured", label: "Featured wishlists", icon: Star },
      { to: "/admin/creators", label: "Creators", icon: BadgeCheck },
    ],
  },
  {
    group: "Lookups",
    items: [
      { to: "/admin/taxonomy", label: "Tags & categories", icon: Tags },
      { to: "/admin/places", label: "Countries & cities", icon: Globe },
    ],
  },
];

function AdminLayout() {
  const { me } = useAdminStatus();

  return (
    <div className="min-h-screen bg-cream-deep/60 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-white">
        <div className="h-16 flex items-center px-5 border-b border-line">
          <Link to="/admin" className="font-display text-xl font-light text-ink">
            Hodrac <span className="text-xs font-sans uppercase tracking-[0.2em] text-ink-muted ml-1">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {ADMIN_SECTIONS.map(section => (
            <div key={section.group} className="mb-4">
              <p className="px-5 mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-muted">{section.group}</p>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? "bg-ink text-white" : "text-ink-soft hover:bg-cream-deep hover:text-ink"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="text-sm text-ink truncate">{me?.displayName}</p>
          <p className="text-xs text-ink-muted truncate">{me?.email}</p>
          <Link to="/" className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-line bg-white overflow-x-auto no-scrollbar">
          <Link to="/admin" className="font-display text-lg font-light text-ink shrink-0">Admin</Link>
          {ADMIN_SECTIONS.flatMap(s => s.items).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 rounded-full text-xs ${isActive ? "bg-ink text-white" : "text-ink-soft border border-line"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <main className="flex-1 min-w-0 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Explains why the dashboard isn't available, with ways to fix it.
function NotAuthorised({ check, onRetry }: { check: AdminCheck; onRetry: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const signOutAndIn = async () => {
    clearAdminCache();
    // Leave first so the route guard doesn't redirect elsewhere.
    navigate(loginPath("/admin"), { replace: true });
    await logout();
  };

  if (check.state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-ink-muted mx-auto mb-4" strokeWidth={1.25} />
          <h1 className="text-3xl font-light text-ink mb-2">Couldn't check your access</h1>
          <p className="text-sm text-ink-muted mb-2">We couldn't reach the server to confirm you're an admin.</p>
          <p className="text-xs text-ink-muted mb-6 wrap-break-word">{check.message}</p>
          <div className="flex justify-center gap-3">
            <button onClick={onRetry} className="rounded-full bg-ink text-white px-4 py-2 text-sm hover:bg-ink-soft">Try again</button>
            <Link to="/" className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink">Back to Hodrac</Link>
          </div>
        </div>
      </div>
    );
  }

  const status = check.state === "not-admin" ? check.status : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <ShieldAlert className="w-10 h-10 text-ink-muted mx-auto mb-4" strokeWidth={1.25} />
        <h1 className="text-3xl font-light text-ink mb-2">Admins only</h1>
        <p className="text-sm text-ink-muted mb-1">
          {user?.email ? <>You're signed in as <span className="text-ink">{user.email}</span>, </> : null}
          which doesn't have admin access.
        </p>
        <p className="text-xs text-ink-muted mb-6">
          If this account was just made an admin, sign out and back in so your login picks up the new role.
          {status ? ` (Server response: ${status})` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={signOutAndIn} className="rounded-full bg-ink text-white px-4 py-2 text-sm hover:bg-ink-soft">Sign out and back in</button>
          <button onClick={onRetry} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink">Check again</button>
          <Link to="/" className="rounded-full px-4 py-2 text-sm text-ink-soft hover:text-ink">Back to Hodrac</Link>
        </div>
      </div>
    </div>
  );
}


function AdminNotFound() {
  return (
    <div>
      <h1 className="text-3xl font-light text-ink mb-2">Not found</h1>
      <p className="text-sm text-ink-muted">This admin page doesn't exist. <Link to="/admin" className="underline underline-offset-4">Go to the overview</Link>.</p>
    </div>
  );
}

export default function AdminApp() {
  // Always re-check on entry: a cached answer could be stale.
  const { check, isAdmin, loading, retry } = useAdminStatus({ force: true });

  if (loading) return <FullPageSpinner />;
  if (!isAdmin) return <NotAuthorised check={check} onRetry={retry} />;

  return (
    <ToastProvider>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="destinations" element={<DestinationsPage />} />
        <Route path="wishlists" element={<WishlistsPage />} />
        <Route path="featured" element={<FeaturedPoolPage />} />
        <Route path="featured-destinations" element={<FeaturedDestinationsPage />} />
        <Route path="creators" element={<CreatorsPage />} />
        <Route path="taxonomy" element={<TaxonomyPage />} />
        <Route path="places" element={<PlacesPage />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
    </ToastProvider>
  );
}
