export const runtime = "edge";
import { frappeServer } from "@/lib/frappe";
import { NextRequest, NextResponse } from "next/server";

// Example: Replace this with your actual tag number validation logic or API call
async function validateTagNumber(
  tagNumber: string
): Promise<{ valid: boolean; message?: string; data?: any }> {
  // Example: Call an external API or your backend here
  // For now, just check if the tag number is 14 digits
  const response = await frappeServer
    .call()
    .post("vmddp_app.api.epashudhan.tag_number.validate_animal_tag", {
      tag_number: tagNumber,
    });
  // The SDK often returns the payload under `message`
  const payload = response?.message ?? response;
  console.log("tag number response payload", payload);

  // If the payload contains an error field, treat it as invalid
  if (payload?.error || payload?.status === "error") {
    return {
      valid: false,
      message: payload?.message || payload?.error || "Validation failed",
    };
  }

  // Otherwise return the payload to the caller
  return { valid: true, data: payload };
}

export async function POST(request: NextRequest) {
  try {
    const { tagNumber } = await request.json();
    if (!tagNumber) {
      return NextResponse.json(
        { valid: false, message: "Tag Number is required." },
        { status: 400 }
      );
    }
    const result = await validateTagNumber(tagNumber);
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ valid: true, data: result.data });
  } catch (error) {
    console.error("/api/validate-tag-number error:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
