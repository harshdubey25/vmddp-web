export const runtime = "edge";
export const dynamic = "force-dynamic";

import { validateUserToken } from "@/lib/auth";

/**
 * Simple session validation endpoint
 * For now, just validates that the token is still valid
 * Full session tracking requires the User Session DocType
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: "No session token found" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Validate the token
    const userDetails = await validateUserToken(token);
    
    if (!userDetails?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Token is valid
    return new Response(
      JSON.stringify({
        ok: true,
        user: userDetails.user,
        roles: userDetails.roles,
        full_name: userDetails.full_name,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Session validation error:", err);
    return new Response(
      JSON.stringify({ error: "Session validation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
