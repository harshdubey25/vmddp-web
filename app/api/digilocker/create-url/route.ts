export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { frappeServer } from "@/lib/frappe";

export async function POST(request: NextRequest) {
  console.log("=== DigiLocker Create URL Started ===");

  try {
    const requestBody = await request.json();
    const { verification_id, document_requested, redirect_url, user_flow } = requestBody;

    console.log("Request received:", {
      verification_id,
      document_requested,
      redirect_url,
      user_flow,
      timestamp: new Date().toISOString(),
    });

    if (!verification_id) {
      console.log("❌ Missing verification_id");
      return NextResponse.json(
        { error: "Verification ID is required" },
        { status: 400 }
      );
    }

    console.log("Calling Frappe API via frappeServer");

    // Call the Frappe API using frappeServer
    const frappeData = await frappeServer
      .call()
      .post("vmddp_app.api.cashfree.aadhar.create_digilocker_url", {
        verification_id,
        document_requested: document_requested || ["AADHAAR"],
        redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_BASE_URL}/register`,
        user_flow: user_flow || "signup",
      });

    console.log("Frappe API Response:", frappeData);

    // Check if response has an error status (not 200)
    if (!frappeData || frappeData.message?.success === false || (frappeData.message?.status && frappeData.message?.status !== 200)) {
      return NextResponse.json(
        {
          error:
            frappeData.message?.message ||
            frappeData.message ||
            frappeData.error ||
            "Failed to create DigiLocker URL",
        },
        { status: frappeData.message?.status || 500 }
      );
    }

    // Return the DigiLocker URL and details
    return NextResponse.json({
      success: true,
      data: {
        verification_id: frappeData.message.data?.verification_id,
        reference_id: frappeData.message.data?.reference_id,
        url: frappeData.message.data?.url,
        status: frappeData.message.data?.status,
        document_requested: frappeData.message.data?.document_requested,
        redirect_url: frappeData.message.data?.redirect_url,
        user_flow: frappeData.message.data?.user_flow,
        message: frappeData.message.data?.message || "DigiLocker URL created successfully",
      },
    });
  } catch (error) {
    console.error("❌ DigiLocker URL creation error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log("=== DigiLocker Create URL Completed ===");
  }
}
