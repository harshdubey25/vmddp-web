import type { NextRequest } from "next/server";
import { validateUserToken } from "@/lib/auth";
import { getActiveSession, setActiveSession } from "@/lib/session-management";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("frappe_access_token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: "No token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await validateUserToken(token);

    if (!response || !response.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionNonce = req.cookies.get("server_session_nonce")?.value;
    const email = response.user;
    
    if (email) {
      const activeNonce = getActiveSession(email);
      if (activeNonce) {
        if (sessionNonce !== activeNonce) {
          const headers = new Headers({ "Content-Type": "application/json" });
          headers.append("Set-Cookie", "frappe_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
          headers.append("Set-Cookie", "frappe_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
          headers.append("Set-Cookie", "server_session_nonce=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
          return new Response(JSON.stringify({ error: "Multiple sessions detected. You have been logged out." }), {
            status: 401,
            headers
          });
        }
      } else if (sessionNonce) {
        setActiveSession(email, sessionNonce);
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Validation error:", err);
    return new Response(
      JSON.stringify({ error: "Validation failed", details: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
