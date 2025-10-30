import { NextRequest, NextResponse } from "next/server";

// Frappe API endpoint for Aadhaar OTP verification using env variable
const FRAPPE_OTP_API = `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.cashfree.aadhar.aadhaar_otp_verification`;

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

    // Call the Frappe API for OTP verification
    const frappeResponse = await fetch(FRAPPE_OTP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verification_id, otp }),
    });

    const frappeData = await frappeResponse.json();
    console.log("Frappe OTP API Response Data:", frappeData);

    if (!frappeResponse.ok || !frappeData.message.success) {
      return NextResponse.json(
        {
          error:
            frappeData.message ||
            frappeData.message.message ||
            "OTP verification failed",
        },
        { status: frappeResponse.status }
      );
    }

    // Return Aadhaar details from Frappe response
    return NextResponse.json({
      success: true,
      verified: frappeData.message.verified || false,
      data: {
        name: frappeData.message.data?.name,
        date_of_birth: frappeData.message.data?.date_of_birth,
        gender: frappeData.message.data?.gender,
        address: frappeData.message.data?.address,
        message:
          frappeData.message.data?.message || "Aadhaar verified successfully",
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
