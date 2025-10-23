import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export interface Role {
  role: string;
}

// export interface UserDataResponse {
//   data: {
//     user_type: "System User" | "Website User";
//     roles?: Role[];
//   };
// }

export interface UserApiResponse {
  user: string;
  user_type: "System User" | "Website User";
  full_name?: string;
  roles?: string[];
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("frappe_access_token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "No token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/frappe.auth.get_logged_user`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // Prevent caching in Cloudflare
      }
    );

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userResp = await resp.json();
    const userId = userResp.message;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userDoc = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/resource/User/${userId}?fields=["name","user_type","full_name","role_profile_name"]`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!userDoc.ok) {
      const errText = await userDoc.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch user", details: errText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userData = await userDoc.json();
    console.log("User Data:", userData.data);
    let userDetailsData;
    try {
      const userDetails = await fetch(
        `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.user.get_user_details?user_id=${userId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      console.log("User Details Response:", userDetails);
      if (userDetails.ok) {
        userDetailsData = await userDetails.json();
        userDetailsData = userDetailsData.message;
        console.log("User Details Data:", userDetailsData);
      } else {
        const errText = await userDetails.text();
        console.error("Failed to fetch user details:", errText);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
    const response: UserApiResponse = {
      user: userId,
      user_type:
        userData.data.user_type === "System User"
          ? "System User"
          : "Website User",

      full_name: userData.data.full_name,
      ...userDetailsData,
    };

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
