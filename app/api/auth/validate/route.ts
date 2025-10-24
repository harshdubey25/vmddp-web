import type { NextRequest } from "next/server";
import { validateUserToken, type UserApiResponse } from "@/lib/auth";

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

    if (!response) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
