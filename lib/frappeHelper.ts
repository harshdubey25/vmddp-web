"use server"
import { FrappeApp } from "frappe-js-sdk";
import { cookies } from "next/headers";

const FRAPPE_BASE = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL!;

/**
 * Async helper to create a FrappeApp instance with token from awaited cookies (for middleware or async context)
 */
export async function getFrappeWithUserToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("frappe_access_token");
  return new FrappeApp(FRAPPE_BASE, {
    useToken: true,
    token: () => token?.value || "",
    type: "Bearer",
  });
}
