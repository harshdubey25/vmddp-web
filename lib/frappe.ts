import { FrappeApp } from "frappe-js-sdk";

const FRAPPE_BASE = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL!;

/**
 * Client-side frappe instance (uses browser token)
 */
export const frappeBrowser = new FrappeApp(FRAPPE_BASE, {

  useToken: true,
  token: () => {
    if (typeof window === "undefined") return "";
    // Try localStorage first
    const token = localStorage.getItem("frappe_access_token");
    if (token) return token;
    // Fallback to cookies
    const match = document.cookie.match(/(?:^|; )frappe_access_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : "";
},
  
  type: "Bearer",
});

/**
 * Server-side frappe instance (uses API key/secret or public access)
 * 👉 Safer for Next.js App Router server components
 */
export const frappeServer = new FrappeApp(FRAPPE_BASE, {
  useToken: true,
  token: () => {
    const apiKey = process.env.FRAPPE_API_KEY;
    const apiSecret = process.env.FRAPPE_SECRET_KEY;
    return apiKey && apiSecret ? `${apiKey}:${apiSecret}` : "";
  },
  
  type: "token", // ✅ use "token" for API key/secret auth
});

/**
 * Public frappe instance (no credentials, for public API access)
 */
export const frappePublic = new FrappeApp(FRAPPE_BASE);
