export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    const { email, password } = await req.json();

    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_BASE}/api/method/frappe.integrations.oauth2.get_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password",
          username: email,
          password,
          client_id: process.env.FRAPPE_OAUTH_CLIENT_ID!,
          client_secret: process.env.FRAPPE_OAUTH_CLIENT_SECRET!,
        }),
      }
    );

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify(data), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Properly set multiple cookies in Edge
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    headers.append(
      "Set-Cookie",
      `frappe_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    );
    headers.append(
      "Set-Cookie",
      `frappe_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

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

    return new Response(JSON.stringify({ error: "Login failed: " + message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
