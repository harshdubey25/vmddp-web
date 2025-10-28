import { NextRequest, NextResponse } from "next/server";

const CASHFREE_BASE_URL =
  "https://payout-gamma.cashfree.com/payout/v1/verification/aadhaar";

export async function POST(request: NextRequest) {
  try {
    const { aadhaar } = await request.json();

    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return NextResponse.json(
        { error: "Valid 12-digit Aadhaar number is required" },
        { status: 400 }
      );
    }

    const response = await fetch(CASHFREE_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": process.env.CASHFREE_CLIENT_ID!,
        "X-Client-Secret": process.env.CASHFREE_CLIENT_SECRET!,
      },
      body: JSON.stringify({
        aadhaar_number: aadhaar,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Verification failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        verification_id: data.verification_id,
        message: data.message || "OTP sent successfully",
      },
    });
  } catch (error) {
    console.error("Aadhaar verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
