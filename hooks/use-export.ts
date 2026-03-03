"use client";

import { useState, useCallback } from "react";
import { exportReport, ExportFormat } from "@/lib/export-report";
import { useToast } from "@/hooks/use-toast";

interface UseExportOptions {
    /** The Frappe API method path for export */
    method: string;
    /** Default base filename (without extension/date) - can be overridden per call */
    filename?: string;
}

interface ExportParams {
    params?: Record<string, string>;
    format?: ExportFormat;
    /** Override the default filename for this export */
    filename?: string;
}

export function useExport({ method, filename: defaultFilename }: UseExportOptions) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = useCallback(
        async ({ params = {}, format = "excel", filename }: ExportParams = {}) => {
            const exportFilename = filename || defaultFilename;
            if (!exportFilename) {
                toast({
                    title: "Export failed",
                    description: "Filename is required for export.",
                    variant: "destructive",
                });
                return;
            }

            setIsExporting(true);
            toast({
                title: "Export started",
                description: `Generating ${format.toUpperCase()} report...`,
            });

            try {
                await exportReport({
                    method,
                    params,
                    format,
                    filename: exportFilename,
                });

                toast({
                    title: "Export completed",
                    description: "Report downloaded successfully.",
                });
            } catch (error) {
                console.error("Export error:", error);
                toast({
                    title: "Export failed",
                    description: "Failed to generate report. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsExporting(false);
            }
        },
        [method, defaultFilename, toast]
    );

    return { isExporting, handleExport };
}
