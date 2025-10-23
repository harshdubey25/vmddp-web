import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/enums/roles";
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("frappe_access_token")?.value;

  async function validateUser() {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/validate`,
        { 
          headers: { cookie: req.headers.get("cookie") || "" },
          cache: 'no-store' // Prevent Cloudflare caching
        }
      );
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.error("validate error:", err);
      return null;
    }
  }

  // 🔹 Protect /admin and /subadmin routes and block cross-access
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const data = await validateUser();
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
    const data = await validateUser();
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
    const data = await validateUser();
    console.log("Middleware validate data:", data);
    if (data?.roles) {
      if (data.roles.includes(UserRole.VMDDP_ADMIN)) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else if (data.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
        return NextResponse.redirect(new URL("/subadmin/dashboard", req.url));
      }
    }
    // If validation failed but token exists, allow access to login page
    // to prevent redirect loops in production
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/subadmin/:path*"],
};
