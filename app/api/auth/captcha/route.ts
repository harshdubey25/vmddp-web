export const runtime = "edge";

import { hashString } from "@/lib/hash";

function generateCaptchaSvg(text: string): string {
  return `<svg width="150" height="40" viewBox="0 0 150 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#18181b"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="#f4f4f5" letter-spacing="8" transform="skewX(-10)">${text}</text>
  </svg>`;
}

export async function GET(): Promise<Response> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let generatedCaptcha = "";
  for (let i = 0; i < 6; i++) {
    generatedCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const hashedCaptcha = await hashString(generatedCaptcha);
  const captchaSvg = generateCaptchaSvg(generatedCaptcha);

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  headers.append(
    "Set-Cookie",
    `expected_captcha=${hashedCaptcha}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
  );

  return new Response(
    JSON.stringify({ captchaSvg }),
    { status: 200, headers }
  );
}