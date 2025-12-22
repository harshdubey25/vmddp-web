import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("frappe_access_token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized - No token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const district = searchParams.get("district");
    const search = searchParams.get("search");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const status = searchParams.get("status");

    const params = new URLSearchParams();
    
    if (district && district !== "all") {
      params.set("district", district);
    }
    
    if (search && search.trim()) {
      params.set("search", search.trim());
    }
    
    if (start_date) {
      params.set("start_date", start_date);
    }
    
    if (end_date) {
      params.set("end_date", end_date);
    }
    
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.set("status", '["Approved","Selected"]');
    }

    const frappeUrl = `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.reports.generate_selected_applications_pdf?${params.toString()}`;

    const response = await fetch(frappeUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Frappe API error:", errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate PDF", 
          details: errorText,
          status: response.status 
        }), 
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const pdfBlob = await response.blob();

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="selected-applications.pdf"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response(
      JSON.stringify({ 
        error: "PDF generation failed", 
        details: String(err) 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
