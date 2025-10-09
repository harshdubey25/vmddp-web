import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/enums/roles";
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("frappe_access_token")?.value;
  console.log("Middleware token:", token);
  async function validateUser() {
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/validate`,
        { headers: { cookie: req.headers.get("cookie") || "" } }
      );
      if (!resp.ok) return null;
      return await resp.json();
    } catch (err) {
      console.error("validate error:", err);
      return null;
    }
  }
  // 🔹 Redirect logged-in users away from /login
  if (url.pathname === "/login" && token) {
    const data = await validateUser();
    if (data?.roles.includes(UserRole.VMDDP_ADMIN)) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else if (data?.roles.includes(UserRole.VMDDP_SUB_ADMIN)) {
      return NextResponse.redirect(new URL("/subadmin/dashboard", req.url));
    }
  }

  // 🔹 Protect /dashboard for Website Users
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith("/subadmin")) {
      if (!token) {
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
    const data = await validateUser();
    if (!data || data.user_type !== "Website User") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/subadmin/:path*"],
};
