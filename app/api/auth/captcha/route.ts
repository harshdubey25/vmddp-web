export const runtime = "edge";

export async function GET(): Promise<Response> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let generatedCaptcha = "";
  for (let i = 0; i < 6; i++) {
    generatedCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  headers.append(
    "Set-Cookie",
    `expected_captcha=${generatedCaptcha}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
  );

  return new Response(
    JSON.stringify({ captchaCode: generatedCaptcha }),
    { status: 200, headers }
  );
}