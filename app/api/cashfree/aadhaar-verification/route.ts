import { NextRequest, NextResponse } from "next/server";

const CASHFREE_BASE_URL =
  "https://payout-gamma.cashfree.com/payout/v1/verification/aadhaar";

export async function POST(request: NextRequest) {
  console.log("=== Cashfree Aadhaar Verification Started ===");

  try {
    const requestBody = await request.json();
    const { aadhaar } = requestBody;

    console.log("Request received:", {
      aadhaar: aadhaar ? `${aadhaar.substring(0, 4)}********` : "undefined",
      timestamp: new Date().toISOString(),
    });

    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      console.log("❌ Invalid Aadhaar:", {
        hasAadhaar: !!aadhaar,
        length: aadhaar?.length,
        isValid: aadhaar ? /^\d{12}$/.test(aadhaar) : false,
      });
      return NextResponse.json(
        { error: "Valid 12-digit Aadhaar number is required" },
        { status: 400 }
      );
    }

    // Log environment variables (masked)
    console.log("Environment check:", {
      hasClientId: !!process.env.CASHFREE_CLIENT_ID,
      hasClientSecret: !!process.env.CASHFREE_CLIENT_SECRET,
      clientIdLength: process.env.CASHFREE_CLIENT_ID?.length,
      clientSecretLength: process.env.CASHFREE_CLIENT_SECRET?.length,
      baseUrl: CASHFREE_BASE_URL,
    });

    const requestPayload = {
      aadhaar_number: aadhaar,
    };
    console.log("Request payload:", {
      aadhaar_number: `${aadhaar.substring(0, 4)}********`,
    });

    const response = await fetch(CASHFREE_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": process.env.CASHFREE_CLIENT_ID!,
        "X-Client-Secret": process.env.CASHFREE_CLIENT_SECRET!,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("Cashfree API Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    const data = await response.json();
    console.log("Cashfree API Response Data:", {
      success: !!data.success,
      hasVerificationId: !!data.verification_id,
      hasMessage: !!data.message,
      verificationIdLength: data.verification_id?.length,
      fullResponse: data, // Log full response to see the exact structure
    });

    if (!response.ok) {
      console.log("❌ Cashfree API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorData: data,
      });
      return NextResponse.json(
        { error: data.message || "Verification failed" },
        { status: response.status }
      );
    }

    console.log(
      "✅ Aadhaar verification successful, verification_id generated"
    );
    return NextResponse.json({
      success: true,
      data: {
        verification_id: data.verification_id,
        message: data.message || "OTP sent successfully",
      },
    });
  } catch (error) {
    console.error("❌ Aadhaar verification error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log("=== Cashfree Aadhaar Verification Completed ===");
  }
}
