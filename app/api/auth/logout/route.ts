export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateUserToken } from "@/lib/auth";
import { clearActiveSession } from "@/lib/session-management";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("frappe_access_token")?.value;
  const refreshToken = req.cookies.get("frappe_refresh_token")?.value;

  const revokeUrl = `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/frappe.integrations.oauth2.revoke_token`;
  const clientId = process.env.FRAPPE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.FRAPPE_OAUTH_CLIENT_SECRET;

  // Revoke tokens in upstream Frappe IDP
  if (clientId && clientSecret) {
    if (accessToken) {
      try {
        await fetch(revokeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: accessToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
      } catch (err) {
        console.error("Error revoking access token:", err);
      }
    }

    if (refreshToken) {
      try {
        await fetch(revokeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
      } catch (err) {
        console.error("Error revoking refresh token:", err);
      }
    }
  }

  if (accessToken) {
    try {
      const userDetails = await validateUserToken(accessToken);
      if (userDetails?.user) {
        clearActiveSession(userDetails.user);
      }
    } catch (err) {
      console.error("Error clearing session mapping:", err);
    }
  }

  // Clear cookies
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  headers.append(
    "Set-Cookie",
    `frappe_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
  headers.append(
    "Set-Cookie",
    `frappe_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
  headers.append(
    "Set-Cookie",
    `server_session_nonce=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );

  return new Response(JSON.stringify({ ok: true, message: "Logged out" }), {
    status: 200,
    headers,
  });
}
