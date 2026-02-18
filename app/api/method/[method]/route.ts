import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const FRAPPE_BASE_URL = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  try {
    const { method } = await params;
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const token = request.cookies.get("frappe_access_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    const url = `${FRAPPE_BASE_URL}/api/method/${method}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Frappe API error:", errorText);
      return NextResponse.json(
        { message: "API call failed", error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  try {
    const { method } = await params;
    const body = await request.json();

    const token = request.cookies.get("frappe_access_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    const url = `${FRAPPE_BASE_URL}/api/method/${method}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Frappe API error:", errorText);
      return NextResponse.json(
        { message: "API call failed", error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
