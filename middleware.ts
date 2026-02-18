import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/enums/roles";
import { validateUserToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("frappe_access_token")?.value;

  if (url.pathname.startsWith("/accountant")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const data = await validateUserToken(token);
    if (!data || !data.roles) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Block admin from accessing accountant routes (except component-allocation)
    if (data.roles.includes(UserRole.VMDDP_ADMIN) && !url.pathname.startsWith("/accountant/component-allocation")) {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
    // Block subadmin from accessing accountant routes
    if (data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
      url.pathname = "/subadmin/dashboard";
      return NextResponse.redirect(url);
    }
    if (data.roles.includes(UserRole.VMDDP_SECRETORY)) {
      url.pathname = "/secretory/dashboard";
      return NextResponse.redirect(url);
    }
    // Only allow accountant (or admin on component-allocation)
    if (!data.roles.includes(UserRole.VMDDP_ACCOUNTANT) && !(data.roles.includes(UserRole.VMDDP_ADMIN) && url.pathname.startsWith("/accountant/component-allocation"))) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith("/secretory")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const data = await validateUserToken(token);
    if (!data || !data.roles) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (data.roles.includes(UserRole.VMDDP_ADMIN)) {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
    if (data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
      url.pathname = "/subadmin/dashboard";
      return NextResponse.redirect(url);
    }
    if (data.roles.includes(UserRole.VMDDP_ACCOUNTANT)) {
      url.pathname = "/accountant/dd";
      return NextResponse.redirect(url);
    }
    if (!data.roles.includes(UserRole.VMDDP_SECRETORY)) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 🔹 Protect /admin and /subadmin routes and block cross-access
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const data = await validateUserToken(token);
    if (!data || !data.roles) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Block subadmin from accessing admin routes
    if (data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
      url.pathname = "/subadmin/dashboard";
      return NextResponse.redirect(url);
    }
    // Only allow admin
    if (!data.roles.includes(UserRole.VMDDP_ADMIN)) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }
  if (url.pathname.startsWith("/subadmin")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const data = await validateUserToken(token);
    if (!data || !data.roles) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Block admin from accessing subadmin routes
    if (data.roles.includes(UserRole.VMDDP_ADMIN)) {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
    // Only allow subadmin
    if (!data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // 🔹 Redirect logged-in users away from /login
  if (url.pathname === "/login" && token) {
    const data = await validateUserToken(token);
    console.log("Middleware validate data:", data);
    if (data?.roles) {
      if (data.roles.includes(UserRole.VMDDP_ADMIN)) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else if (data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
        return NextResponse.redirect(new URL("/subadmin/dashboard", req.url));
      } else if (data.roles.includes(UserRole.VMDDP_ACCOUNTANT)) {
        return NextResponse.redirect(new URL("/accountant/dd", req.url));
      } else if (data.roles.includes(UserRole.VMDDP_SECRETORY)) {
        return NextResponse.redirect(new URL("/secretory/dashboard", req.url));
      }
    }
    // If validation failed but token exists, allow access to login page
    // to prevent redirect loops in production
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/subadmin/:path*",
    "/accountant/:path*",
    "/secretory/:path*",
  ],
};
