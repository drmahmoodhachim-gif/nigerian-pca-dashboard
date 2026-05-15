/** Where magic-link emails should send users (must match Supabase redirect allow list). */
const PRODUCTION_SITE =
  import.meta.env.VITE_SITE_URL ?? "https://nigerian-pca-dashboard.netlify.app";

export function getAuthRedirectUrl(): string {
  // Production build: always use live Netlify URL (never localhost in email links)
  if (import.meta.env.PROD) {
    return PRODUCTION_SITE.replace(/\/$/, "");
  }

  const origin = window.location.origin.replace(/\/$/, "");
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin;
  }

  return origin || PRODUCTION_SITE.replace(/\/$/, "");
}
