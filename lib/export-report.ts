import { frappeBrowser } from "@/lib/frappe";

export type ExportFormat = "excel" | "csv" | "pdf";

interface ExportReportOptions {
  /** The Frappe API method path, e.g. "vmddp_app.api.v1.accountant.export_completed_dd_list" */
  method: string;
  /** Query parameters to pass to the API */
  params?: Record<string, string>;
  /** Export format — defaults to "excel" */
  format?: ExportFormat;
  /** Base filename (without extension/date), e.g. "dd-reports" */
  filename: string;
}

const FORMAT_EXTENSION: Record<ExportFormat, string> = {
  excel: "xlsx",
  csv: "csv",
  pdf: "pdf",
};

/**
 * Downloads a report from a Frappe export API endpoint.
 *
 * Handles the full flow: API call with blob response, creating an object URL,
 * triggering the download, and cleaning up.
 *
 * @returns A promise that resolves when the download has been triggered.
 * @throws Throws if the API call fails.
 */
export async function exportReport({
  method,
  params = {},
  format = "excel",
  filename,
}: ExportReportOptions): Promise<void> {
  const queryParams: Record<string, string> = {
    ...params,
    export_format: format,
  };

  const axiosResponse = await frappeBrowser.call().axios.get(
    `/api/method/${method}`,
    {
      params: queryParams,
      responseType: "blob",
    },
  );

  const ext = FORMAT_EXTENSION[format] ?? "xlsx";
  const blob = new Blob([axiosResponse.data], {
    type: axiosResponse.headers["content-type"] || "application/octet-stream",
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
