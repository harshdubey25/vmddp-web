export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    // Get refresh token from cookie or request body
    const cookies = req.headers.get("cookie") || "";
    const cookieMap = Object.fromEntries(
      cookies.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      })
    );

    let refreshToken = cookieMap["frappe_refresh_token"];

    // Also allow refresh token from request body as fallback
    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refresh_token;
      } catch {
        // No body provided
      }
    }

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: "No refresh token provided" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/frappe.integrations.oauth2.get_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.FRAPPE_OAUTH_CLIENT_ID!,
          client_secret: process.env.FRAPPE_OAUTH_CLIENT_SECRET!,
        }),
      }
    );

    const data = await resp.json();

    if (!resp.ok) {
      // Clear invalid tokens
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      headers.append(
        "Set-Cookie",
        `frappe_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
      );
      headers.append(
        "Set-Cookie",
        `frappe_refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
      );

      return new Response(
        JSON.stringify({ error: "Failed to refresh token", details: data }),
        { status: 401, headers }
      );
    }

    // Set new cookies with updated tokens
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    headers.append(
      "Set-Cookie",
      `frappe_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    // Only set new refresh token if one was returned
    if (data.refresh_token) {
      headers.append(
        "Set-Cookie",
        `frappe_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: "Token refresh failed: " + message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
