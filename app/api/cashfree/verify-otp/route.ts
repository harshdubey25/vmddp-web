import { NextRequest, NextResponse } from "next/server";

const CASHFREE_BASE_URL =
  "https://payout-gamma.cashfree.com/payout/v1/verification/aadhaar";

export async function POST(request: NextRequest) {
  console.log("=== Cashfree OTP Verification Started ===");

  try {
    const requestBody = await request.json();
    const { verification_id, otp } = requestBody;

    console.log("Request received:", {
      verification_id: verification_id
        ? `${verification_id.substring(0, 8)}***`
        : "undefined",
      otp: otp ? `${otp.substring(0, 2)}****` : "undefined",
      timestamp: new Date().toISOString(),
    });

    if (!verification_id || !otp) {
      console.log("❌ Missing required fields:", {
        verification_id: !!verification_id,
        otp: !!otp,
      });
      return NextResponse.json(
        { error: "Verification ID and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      console.log("❌ Invalid OTP format:", {
        otp: otp ? `${otp.substring(0, 2)}****` : "undefined",
        length: otp?.length,
      });
      return NextResponse.json(
        { error: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    // Log environment variables (masked)
    console.log("Environment check:", {
      hasClientId: !!process.env.CASHFREE_CLIENT_ID,
      hasClientSecret: !!process.env.CASHFREE_CLIENT_SECRET,
      clientIdLength: process.env.CASHFREE_CLIENT_ID?.length,
      clientSecretLength: process.env.CASHFREE_CLIENT_SECRET?.length,
    });

    const apiUrl = `${CASHFREE_BASE_URL}/${verification_id}`;
    console.log("Making API call to:", apiUrl);

    const requestPayload = {
      otp: otp,
    };
    console.log("Request payload:", { otp: `${otp.substring(0, 2)}****` });

    const response = await fetch(apiUrl, {
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
      verified: !!data.verified,
      hasName: !!data.name,
      hasMessage: !!data.message,
      fullResponse: data, // Log full response to see the exact structure
    });

    if (!response.ok) {
      console.log("❌ Cashfree API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorData: data,
      });
      return NextResponse.json(
        { error: data.message || "OTP verification failed" },
        { status: response.status }
      );
    }

    console.log("✅ OTP verification successful");
    return NextResponse.json({
      success: true,
      verified: data.verified || false,
      data: {
        name: data.name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        address: data.address,
        message: data.message || "Aadhaar verified successfully",
      },
    });
  } catch (error) {
    console.error("❌ OTP verification error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log("=== Cashfree OTP Verification Completed ===");
  }
}
