import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/v2Hooks/useAuth";
import { loginPath } from "../../../utils/v2Utils/authRedirect";
import { FullPageSpinner } from "../ui";

// Route guard: wraps routes that need a signed-in user. Waits for the
// session restore on first load so signed-in users don't get bounced.
export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPath(location.pathname + location.search + location.hash)}
        replace
      />
    );
  }

  return <Outlet />;
}
