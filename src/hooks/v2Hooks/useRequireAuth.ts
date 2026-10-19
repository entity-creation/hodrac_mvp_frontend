import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { loginPath } from "../../utils/v2Utils/authRedirect";

// Wraps an action that needs a signed-in user. Signed in: runs it.
// Signed out: sends the user to the login page, and back here afterwards.
//
//   const requireAuth = useRequireAuth();
//   <button onClick={() => requireAuth(() => save(id))}>
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    <T>(action: () => T, redirectTo?: string): T | undefined => {
      if (isAuthenticated) return action();
      navigate(loginPath(redirectTo ?? location.pathname + location.search));
      return undefined;
    },
    [isAuthenticated, navigate, location.pathname, location.search]
  );
}
