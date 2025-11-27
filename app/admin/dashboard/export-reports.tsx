"use client"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Download,
} from "lucide-react";
import { frappeBrowser } from "@/lib/frappe";
import { useState } from "react";

export default function ExportReportsDashboard() {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleExportDistrictWiseReport = async (format: "xlsx" | "csv") => {
        try {
            setIsDownloading(true);

            const params = new URLSearchParams();
            params.append("file_format", format);

            // Get the authentication token
            const token = localStorage.getItem("frappe_access_token") ||
                document.cookie.match(/(?:^|; )frappe_access_token=([^;]*)/)?.[1];

            const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL;
            const url = `${baseUrl}/api/method/vmddp_app.api.reports.download_district_wise_report?${params.toString()}`;

            // Fetch with authentication
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json, application/octet-stream'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `district_wise_report.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Get the blob and trigger download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error exporting district-wise report:", error);
            alert("Failed to export report. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportDistrictWiseReport("xlsx")}
                className="hidden sm:flex gap-1 sm:gap-2 text-xs"
                data-testid="button-export-district-report"
                disabled={isDownloading}
            >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline">{isDownloading ? "Downloading..." : "District Report"}</span>
                <span className="lg:hidden">{isDownloading ? "..." : "Report"}</span>
            </Button>
            <Badge variant="outline" className="gap-1 sm:gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="hidden sm:inline">System Active</span>
                <span className="sm:hidden">Active</span>
            </Badge>
        </div>
    )
}