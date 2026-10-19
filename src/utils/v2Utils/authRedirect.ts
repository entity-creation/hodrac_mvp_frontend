// Helpers for "send the user to log in, then bring them back".

export const LOGIN_PATH = "/auth/login";
export const REGISTER_PATH = "/auth/register";

// Builds e.g. /auth/login?redirect=%2Fwishlists%2F123
export function authPath(base: string, redirectTo?: string): string {
  const target = safeRedirect(redirectTo);
  return target === "/" ? base : `${base}?redirect=${encodeURIComponent(target)}`;
}

export const loginPath = (redirectTo?: string) => authPath(LOGIN_PATH, redirectTo);
export const registerPath = (redirectTo?: string) => authPath(REGISTER_PATH, redirectTo);

// Only allow same-site relative paths, so ?redirect= can't be abused to send
// users to another site after they log in. Never redirect back into /auth.
export function safeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  if (value.startsWith("/auth/")) return "/";
  return value;
}

export function currentPath(): string {
  return window.location.pathname + window.location.search + window.location.hash;
}
