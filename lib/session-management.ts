/**
 * Revoke all other active OAuth Bearer Tokens for a user
 */
export async function revokeOtherSessions(
  email: string,
  currentAccessToken: string
): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL;

  if (!baseUrl) {
    console.error("[REVOKE] Missing baseUrl");
    return 0;
  }

  try {
    console.log(`[REVOKE] Getting active tokens for user: ${email}`);
    
    // Call the custom whitelisted Frappe method to revoke other sessions
    const methodResp = await fetch(
      `${baseUrl}/api/method/vmddp_app.api.session.revoke_user_other_tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentAccessToken}`,
        },
      }
    );

    if (!methodResp.ok) {
      console.warn(
        `[REVOKE] Method call failed: ${methodResp.status} ${methodResp.statusText}`
      );
      const errorText = await methodResp.text();
      console.warn(`[REVOKE] Error: ${errorText}`);
      return 0;
    }

    const methodData = await methodResp.json();
    const revokedCount = methodData.message || 0;
    console.log(`[REVOKE] Total revoked: ${revokedCount}`);
    
    return revokedCount;
  } catch (err) {
    console.error("[REVOKE] Error:", err);
    return 0;
  }
}
