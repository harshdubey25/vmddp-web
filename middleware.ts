import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/enums/roles";
import { validateUserToken } from "@/lib/auth";

// ─── Route & Role Configuration ───────────────────────────────────────────────
// Add / remove roles and routes here — the middleware logic adapts automatically.

interface RouteConfig {
  /** The URL prefix this role owns (e.g. "/admin") */
  basePath: string;
  /** Where to send this role after login or when redirected */
  homePath: string;
  /** The role required to access `basePath` routes */
  role: UserRole;
  /**
   * Optional cross-role exceptions: other roles that may access specific
   * sub-paths under this basePath.
   * Example: Admin can access /accountant/component-allocation
   */
  crossRoleAccess?: { role: UserRole; allowedSubPaths: string[] }[];
}

const ROUTE_CONFIG: RouteConfig[] = [
  {
    basePath: "/admin",
    homePath: "/admin/dashboard",
    role: UserRole.VMDDP_ADMIN,
  },
  {
    basePath: "/subadmin",
    homePath: "/subadmin/dashboard",
    role: UserRole.VMDDP_SUB_ADMIN,
  },
  {
    basePath: "/accountant",
    homePath: "/accountant/dd",
    role: UserRole.VMDDP_ACCOUNTANT,
    crossRoleAccess: [
      {
        role: UserRole.VMDDP_ADMIN,
        allowedSubPaths: ["/accountant/component-allocation","/accountant/dd-report","/accountant/admin-expenses"],
      },
    ],
  },
  {
    basePath: "/secretory",
    homePath: "/secretory/dashboard",
    role: UserRole.VMDDP_SECRETORY,
  },
];

const LOGIN_PATH = "/login";

// Build a quick lookup: role → homePath
const roleHomeMap = new Map<UserRole, string>(
  ROUTE_CONFIG.map(({ role, homePath }) => [role, homePath])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Redirect helper */
function redirect(url: URL, path: string) {
  url.pathname = path;
  return NextResponse.redirect(url);
}

/** Check if a role has cross-role access to the current path */
function hasCrossRoleAccess(
  config: RouteConfig,
  role: UserRole,
  pathname: string
): boolean {
  return (
    config.crossRoleAccess?.some(
      (cr) =>
        cr.role === role &&
        cr.allowedSubPaths.some((sub) => pathname.startsWith(sub))
    ) ?? false
  );
}

/** Find the home path for the first matching role the user has */
function getHomeForRoles(roles: string[]): string | undefined {
  for (const cfg of ROUTE_CONFIG) {
    if (roles.includes(cfg.role)) return cfg.homePath;
  }
  return undefined;
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("frappe_access_token")?.value;

  // ── Protected route sections ────────────────────────────────────────────
  const matchedConfig = ROUTE_CONFIG.find((cfg) =>
    url.pathname.startsWith(cfg.basePath)
  );

  if (matchedConfig) {
    // 1. No token → login
    if (!token) return redirect(url, LOGIN_PATH);

    // 2. Invalid token → login
    const data = await validateUserToken(token);
    if (!data?.roles) return redirect(url, LOGIN_PATH);

    // 3. Redirect users who belong to a *different* role to their own home
    for (const otherCfg of ROUTE_CONFIG) {
      if (otherCfg.role === matchedConfig.role) continue;
      if (!data.roles.includes(otherCfg.role)) continue;

      // Allow if cross-role exception applies
      if (hasCrossRoleAccess(matchedConfig, otherCfg.role, url.pathname))
        continue;

      return redirect(url, otherCfg.homePath);
    }

    // 4. User must have the owning role (or a valid cross-role exception)
    const roles = data.roles;
    const hasOwningRole = roles.includes(matchedConfig.role);
    const hasCrossAccess = ROUTE_CONFIG.some(
      (cfg) =>
        cfg !== matchedConfig &&
        roles.includes(cfg.role) &&
        hasCrossRoleAccess(matchedConfig, cfg.role, url.pathname)
    );

    if (!hasOwningRole && !hasCrossAccess) {
      return redirect(url, LOGIN_PATH);
    }
  }

  // ── Redirect logged-in users away from /login ──────────────────────────
  if (url.pathname === LOGIN_PATH && token) {
    const data = await validateUserToken(token);
    if (data?.roles) {
      const home = getHomeForRoles(data.roles);
      if (home) return NextResponse.redirect(new URL(home, req.url));
    }
    // If validation failed but token exists, allow access to login page
    // to prevent redirect loops in production
  }

  return NextResponse.next();
}

// Matcher must be statically analyzable by Next.js — keep in sync with ROUTE_CONFIG above.
export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/subadmin/:path*",
    "/accountant/:path*",
    "/secretory/:path*",
  ],
};
