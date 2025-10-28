import { NextRequest, NextResponse } from "next/server";

const CASHFREE_BASE_URL =
  "https://payout-gamma.cashfree.com/payout/v1/verification/aadhaar";

export async function POST(request: NextRequest) {
  try {
    const { verification_id, otp } = await request.json();

    if (!verification_id || !otp) {
      return NextResponse.json(
        { error: "Verification ID and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    const response = await fetch(`${CASHFREE_BASE_URL}/${verification_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": process.env.CASHFREE_CLIENT_ID!,
        "X-Client-Secret": process.env.CASHFREE_CLIENT_SECRET!,
      },
      body: JSON.stringify({
        otp: otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "OTP verification failed" },
        { status: response.status }
      );
    }

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
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
