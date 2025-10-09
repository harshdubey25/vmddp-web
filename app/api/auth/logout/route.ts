export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Clear cookies by setting them to expire in the past
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

  return new Response(JSON.stringify({ ok: true, message: "Logged out" }), {
    status: 200,
    headers,
  });
}
