export interface Role {
  role: string;
}

export interface UserApiResponse {
  user: string;
  user_type: "System User" | "Website User";
  full_name?: string;
  roles?: string[];
}

/**
 * Validates a user token and returns user information including roles
 * @param token - The frappe access token
 * @returns User information with roles or null if validation fails
 */
export async function validateUserToken(
  token: string
): Promise<UserApiResponse | null> {
  if (!token) {
    return null;
  }
  try {
    let userDetailsData;
    try {
      const userDetails = await fetch(
        `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.user.get_user_details`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (userDetails.ok) {
        const detailsResponse = await userDetails.json();
        userDetailsData = detailsResponse.message;
      } else {
        console.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
    const response: UserApiResponse = {
      ...userDetailsData,
    };

    return response;
  } catch (err) {
    console.error("Token validation error:", err);
    return null;
  }
}
