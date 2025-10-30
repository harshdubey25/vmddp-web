import { publicEncrypt, constants } from "crypto";

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID; // or get from env too

export function getSignature(): string | null {
  console.log();
  const publicKeyPem = process.env.CASHFREE_PUBLIC_CERT!.replace(/\\n/g, "\n");
  console.log("Public Key PEM:", publicKeyPem ? publicKeyPem : "Missing");
  if (!publicKeyPem) {
    console.error("Missing CASHFREE_PUBLIC_CERT env var");
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const plainData = `${CLIENT_ID}.${timestamp}`;

  return encryptRSA(plainData, publicKeyPem);
}

function encryptRSA(plainData: string, publicKeyPem: string): string | null {
  try {
    const encryptedBuffer = publicEncrypt(
      {
        key: publicKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha1", // adjust depending on what your PHP side used
      },
      Buffer.from(plainData, "utf8")
    );
    return encryptedBuffer.toString("base64");
  } catch (err) {
    throw err;
    console.error("RSA encryption failed:", err);
    return null;
  }
}
