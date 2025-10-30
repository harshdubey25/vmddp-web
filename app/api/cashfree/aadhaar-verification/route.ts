export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";

// Frappe API endpoint for Aadhaar verification
const FRAPPE_AADHAAR_API =
  "http://localhost:8001/api/method/vmddp_app.api.cashfree.aadhar.aadhaar_verification";

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
    const FRAPPE_AADHAAR_API = `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.cashfree.aadhar.aadhaar_verification`;

    // Frappe API endpoint for Aadhaar verification using env variable

    // No longer using Cashfree env vars or baseUrl
    console.log("Environment check: Using Frappe API, not Cashfree env vars");

    // Call the Frappe API instead of Cashfree directly
    const frappeResponse = await fetch(FRAPPE_AADHAAR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ aadhaar }),
    });

    const frappeData = await frappeResponse.json();
    console.log("Frappe API Response Data:", frappeData);

    if (!frappeResponse.ok || !frappeData.message.success) {
      return NextResponse.json(
        {
          error:
            frappeData.message || frappeData.error || "Verification failed",
        },
        { status: frappeResponse.status }
      );
    }

    // Return verification_id and message from Frappe response
    return NextResponse.json({
      success: true,
      data: {
        verification_id: frappeData.message.data?.verification_id,
        message: frappeData.message.data?.message || "OTP sent successfully",
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
