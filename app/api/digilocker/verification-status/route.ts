export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { frappeServer } from "@/lib/frappe";

export async function GET(request: NextRequest) {
  console.log("=== DigiLocker Verification Status Check Started ===");

  try {
    const searchParams = request.nextUrl.searchParams;
    const verification_id = searchParams.get("verification_id");
    const reference_id = searchParams.get("reference_id");

    console.log("Request received:", {
      verification_id,
      reference_id,
      timestamp: new Date().toISOString(),
    });

    if (!verification_id && !reference_id) {
      console.log("❌ Missing verification_id and reference_id");
      return NextResponse.json(
        { error: "Either verification_id or reference_id is required" },
        { status: 400 }
      );
    }

    console.log("Calling Frappe API via frappeServer");

    // Call the Frappe API using frappeServer
    const params: any = {};
    if (verification_id) params.verification_id = verification_id;
    if (reference_id) params.reference_id = reference_id;

    const frappeData = await frappeServer
      .call()
      .get("vmddp_app.api.cashfree.aadhar.get_digilocker_verification_status", params);

    console.log("Frappe API Response:", frappeData);

    // Check if response has an error status (not 200) - but not if it's just success: false with data
    if (!frappeData || (frappeData.message?.status && frappeData.message?.status !== 200)) {
      return NextResponse.json(
        {
          error:
            frappeData.message?.message ||
            frappeData.message ||
            frappeData.error ||
            "Failed to get verification status",
        },
        { status: frappeData.message?.status || 500 }
      );
    }

    // Handle case where success is false but we have data (e.g., INVALID_DETAILS)
    if (frappeData.message?.success === false && frappeData.message?.data) {
      return NextResponse.json({
        success: false,
        data: {
          verification_id: frappeData.message.data?.verification_id,
          reference_id: frappeData.message.data?.reference_id,
          status: frappeData.message.data?.status,
          user_details: frappeData.message.data?.user_details || {},
          document_requested: frappeData.message.data?.document_requested || [],
          document_consent: frappeData.message.data?.document_consent || [],
          message: frappeData.message.data?.message || "Verification failed",
        },
      });
    }

    // Return verification status and details for successful case
    return NextResponse.json({
      success: true,
      data: {
        verification_id: frappeData.message.data?.verification_id,
        reference_id: frappeData.message.data?.reference_id,
        status: frappeData.message.data?.status,
        user_details: frappeData.message.data?.user_details || {},
        document_requested: frappeData.message.data?.document_requested || [],
        document_consent: frappeData.message.data?.document_consent || [],
        message: frappeData.message.data?.message || "Verification status retrieved successfully",
      },
    });
  } catch (error) {
    console.error("❌ DigiLocker verification status error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log("=== DigiLocker Verification Status Check Completed ===");
  }
}
