export const runtime = "edge";
export const dynamic = "force-dynamic";

import { revokeOtherSessions } from "@/lib/session-management";

// Atomic cache map to handle anti-replay matching
const globalCaptchaStore = new Map<string, string>();

function verifyLocalCaptcha(loginData: string, captchaToken: string): boolean {
  if (!loginData || !captchaToken) {
    return false;
  }
  return loginData.trim().toLowerCase() === captchaToken.trim().toLowerCase();
}

export async function POST(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    const { email, password, captchaInput } = await req.json();

    // Whitelist input sanitation parameters
    const emailTest = /[^a-zA-Z0-9@.]/.test(email || "");
    const isHexPassword = /^[a-fA-F0-9]{64}$/.test(password || "");
    const isStandardPassword = !/[^a-zA-Z0-9@#]/.test(password || "");
    const passwordTest = !(isHexPassword || isStandardPassword);
    const captchaTest = /[^a-zA-Z0-9]/.test(captchaInput || "");

    if (emailTest || passwordTest || captchaTest) {
      return new Response(
        JSON.stringify({ error: "Invalid input format." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Atomic Get-and-Delete Verification logic
    const uniqueSessionKey = email.trim().toLowerCase(); 
    const actualCaptchaValue = globalCaptchaStore.get(uniqueSessionKey);
    globalCaptchaStore.delete(uniqueSessionKey);

    if (!captchaInput || !actualCaptchaValue || captchaInput.trim().toLowerCase() !== actualCaptchaValue.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Security CAPTCHA expired or invalid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    // Clear out tracking CAPTCHA metadata cookies instantly
    headers.append("Set-Cookie", "expected_captcha=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

    // Call upstream identity exchange layer
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/frappe.integrations.oauth2.get_token`,
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
      headers.append("Set-Cookie", "frappe_access_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid username or password credentials." }), 
        { status: 401, headers }
      );
    }

    await revokeOtherSessions(email, data.access_token);

    const secureServerSessionNonce = crypto.randomUUID();

    headers.append(
      "Set-Cookie",
      `frappe_access_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );
    headers.append(
      "Set-Cookie",
      `frappe_refresh_token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    );
    headers.append(
      "Set-Cookie",
      `server_session_nonce=${secureServerSessionNonce}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        sessionNonce: secureServerSessionNonce,
        access_token: data.access_token
      }),
      { status: 200, headers }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: "System processing error: " + message }), { status: 500 });
  }
}

export function saveCaptchaToStore(email: string, actualCode: string) {
  globalCaptchaStore.set(email.trim().toLowerCase(), actualCode);
}