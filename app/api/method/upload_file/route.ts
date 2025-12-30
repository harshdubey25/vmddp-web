import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const FRAPPE_BASE_URL = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const token = request.cookies.get("frappe_access_token")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const response = await fetch(`${FRAPPE_BASE_URL}/api/method/upload_file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Frappe upload error:", errorText);
      return NextResponse.json(
        { message: "Upload failed", error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
