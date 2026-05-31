"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, FileText, RefreshCw, ArrowLeft, Loader2, Maximize2, Sprout, MapPin, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import Link from "next/link";

interface FodderSeedRow {
    district_name: string;
    no_of_applications: number;
    [variety: string]: string | number;
}

interface FodderSeedResponse {
    data: FodderSeedRow[];
    varieties: string[];
}

export default function FodderSeedReportPage() {
    const { toast } = useToast();
    const [districtFilter, setDistrictFilter] = useState("all");
    const statusFilter = "Selected";
    const [isExporting, setIsExporting] = useState(false);
    const [isTableFullscreen, setIsTableFullscreen] = useState(false);

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<any>(
        "vmddp_app.api.reports.fodder_seed_district_report",
        {
            district: districtFilter !== "all" ? districtFilter : undefined,
            status: statusFilter,
        },
        undefined,
        { revalidateOnFocus: false },
    );

    const rows: FodderSeedRow[] = apiResponse?.message?.data ?? [];
    const varieties: string[] = apiResponse?.message?.varieties ?? [];

    const handleExport = async (format: ExportFormat = "excel") => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: `Generating ${format.toUpperCase()} report...`,
        });

        try {
            const params: Record<string, string> = { status: statusFilter };
            if (districtFilter !== "all") params.district = districtFilter;

            await exportReport({
                method: "vmddp_app.api.reports.export_fodder_seed_district_report",
                params,
                format,
                filename: "fodder_seed_district_report",
            });

            toast({
                title: "Export completed",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export failed",
                description: "Failed to export report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRefresh = () => {
        mutate();
        toast({ title: "Refreshing", description: "Fetching latest data..." });
    };

    // Cycle of soft colours for variety columns
    const varietyColors = [
        { header: "bg-emerald-100 text-emerald-800", cell: "bg-emerald-50", total: "bg-emerald-200 text-emerald-900" },
        { header: "bg-sky-100 text-sky-800",     cell: "bg-sky-50",     total: "bg-sky-200 text-sky-900" },
        { header: "bg-violet-100 text-violet-800", cell: "bg-violet-50", total: "bg-violet-200 text-violet-900" },
        { header: "bg-amber-100 text-amber-800",  cell: "bg-amber-50",  total: "bg-amber-200 text-amber-900" },
        { header: "bg-rose-100 text-rose-800",    cell: "bg-rose-50",   total: "bg-rose-200 text-rose-900" },
        { header: "bg-cyan-100 text-cyan-800",    cell: "bg-cyan-50",   total: "bg-cyan-200 text-cyan-900" },
        { header: "bg-fuchsia-100 text-fuchsia-800", cell: "bg-fuchsia-50", total: "bg-fuchsia-200 text-fuchsia-900" },
        { header: "bg-teal-100 text-teal-800",    cell: "bg-teal-50",   total: "bg-teal-200 text-teal-900" },
    ];

    const renderReportTable = (containerClassName: string) => (
        <div className="border rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className={containerClassName}>
                <table className="w-full min-w-[600px] text-xs">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-muted border-b border-border">
                            <th className="text-center p-3 font-semibold whitespace-nowrap sticky left-0 z-30 min-w-[50px] bg-muted border-r border-border text-muted-foreground">
                                Sr. No.
                            </th>
                            <th className="text-left p-3 font-semibold whitespace-nowrap sticky left-[50px] z-30 min-w-[140px] bg-muted border-r border-border text-muted-foreground">
                                District Name
                            </th>
                            <th className="text-right p-3 font-semibold whitespace-nowrap bg-muted border-r border-border text-muted-foreground">
                                No. of Applications
                            </th>
                            {!isLoading &&
                                varieties.map((v, i) => (
                                    <th
                                        key={v}
                                        className={`text-right p-3 font-semibold whitespace-nowrap border-r last:border-r-0 ${varietyColors[i % varietyColors.length].header}`}
                                    >
                                        {v}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                    <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3 + varieties.length}
                                    className="p-10 text-center text-muted-foreground"
                                >
                                    <Sprout className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-60" />
                                    No records found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr
                                    key={row.district_name + idx}
                                    className={`border-b last:border-0 hover:bg-slate-50/50 transition-all ${
                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                    }`}
                                >
                                    <td className="p-3 text-center font-medium sticky left-0 z-10 bg-inherit border-r border-slate-200/60">{idx + 1}</td>
                                    <td className="p-3 font-semibold sticky left-[50px] z-10 bg-inherit border-r border-slate-200/60 text-slate-800">{row.district_name}</td>
                                    <td className="p-3 text-right font-medium text-slate-700">{row.no_of_applications}</td>
                                    {varieties.map((v, i) => (
                                        <td key={v} className={`p-3 text-right border-r last:border-r-0 ${varietyColors[i % varietyColors.length].cell}`}>
                                            {(row[v] as number) ?? 0}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="border-t-2 border-border font-bold">
                            <tr className="bg-muted">
                                <td className="p-3 sticky left-0 bg-muted z-10 border-r border-border"></td>
                                <td className="p-3 sticky left-[50px] bg-muted z-10 border-r border-border text-foreground">TOTAL</td>
                                <td className="p-3 text-right text-foreground">
                                    {rows.reduce((sum, r) => sum + r.no_of_applications, 0)}
                                </td>
                                {varieties.map((v, i) => (
                                    <td key={v} className={`p-3 text-right border-r last:border-r-0 ${varietyColors[i % varietyColors.length].total}`}>
                                        {rows.reduce((sum, r) => sum + ((r[v] as number) ?? 0), 0)}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-auto w-full">
            {/* Simple clean header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/reports">
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Fodder Seed District Report</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">District-wise fodder seed variety distribution</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filters */}
                    <Select value={districtFilter} onValueChange={setDistrictFilter}>
                        <SelectTrigger className="w-[140px] sm:w-[160px]">
                            <SelectValue placeholder="All Districts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Districts</SelectItem>
                            {districts?.map((d) => (
                                <SelectItem key={d.name} value={d.name}>
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isExporting || isLoading} variant="default" size="sm">
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                )}
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("excel")}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("csv")}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary cards */}
            {!isLoading && rows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Districts</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{rows.length}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Total Applications</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {rows.reduce((s, r) => s + r.no_of_applications, 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Sprout className="h-5 w-5 text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Varieties</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{varieties.length}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card className="border shadow-md">
                <CardHeader className="p-3 sm:p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-b border-border rounded-t-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-100">
                                District-wise Fodder Seed Records
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {rows.length} district{rows.length !== 1 ? "s" : ""} •{" "}
                                {varieties.length} variet{varieties.length !== 1 ? "ies" : "y"}
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                            onClick={() => setIsTableFullscreen(true)}
                            disabled={isLoading || rows.length === 0}
                        >
                            <Maximize2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Full Screen</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Sprout className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            No data available for the selected filters.
                        </div>
                    ) : (
                        renderReportTable("overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]")
                    )}
                </CardContent>
            </Card>

            <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
                <DialogContent className="h-[96vh] w-[98vw] max-w-none overflow-hidden p-0">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                        <DialogHeader className="border-b px-4 py-4 pr-12 sm:px-6">
                            <DialogTitle>Fodder Seed District Report</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 min-h-0 overflow-scroll p-4 sm:p-6">
                            {renderReportTable("min-w-0 overflow-x-scroll overflow-y-scroll max-h-full")}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
