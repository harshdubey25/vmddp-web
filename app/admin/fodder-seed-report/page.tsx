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
                        <tr>
                            <th className="text-center p-3 font-semibold whitespace-nowrap sticky left-0 z-30 min-w-[50px] bg-lime-600 text-white border-r border-lime-500">
                                Sr. No.
                            </th>
                            <th className="text-left p-3 font-semibold whitespace-nowrap sticky left-[50px] z-30 min-w-[140px] bg-lime-600 text-white border-r border-lime-500">
                                District Name
                            </th>
                            <th className="text-right p-3 font-semibold whitespace-nowrap bg-green-700 text-white border-r border-green-600">
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
                                    <Sprout className="h-10 w-10 mx-auto mb-2 text-lime-400 opacity-60" />
                                    No records found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr
                                    key={row.district_name + idx}
                                    className={`border-b last:border-0 hover:brightness-95 transition-all ${
                                        idx % 2 === 0 ? "bg-white" : "bg-lime-50/40"
                                    }`}
                                >
                                    <td className="p-3 text-center font-medium sticky left-0 z-10 bg-inherit border-r border-lime-100">{idx + 1}</td>
                                    <td className="p-3 font-semibold sticky left-[50px] z-10 bg-inherit border-r border-lime-100 text-lime-800">{row.district_name}</td>
                                    <td className="p-3 text-right font-medium text-green-700">{row.no_of_applications}</td>
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
                        <tfoot className="border-t-2 border-lime-300 font-bold">
                            <tr className="bg-lime-100">
                                <td className="p-3 sticky left-0 bg-lime-100 z-10 border-r border-lime-200"></td>
                                <td className="p-3 sticky left-[50px] bg-lime-100 z-10 border-r border-lime-200 text-lime-900">TOTAL</td>
                                <td className="p-3 text-right text-green-800">
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
            {/* Gradient hero header */}
            <div className="relative rounded-2xl bg-gradient-to-br from-lime-500 via-green-500 to-emerald-600 p-4 sm:p-6 overflow-hidden shadow-lg">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white">Fodder Seed District Report</h1>
                            <p className="text-sm text-white/80">District-wise fodder seed variety distribution</p>
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

                    <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-white hover:bg-white/20">
                        <RefreshCw className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isExporting || isLoading} variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 border border-white/30">
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
            </div>

            {/* Summary cards */}
            {!isLoading && rows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="relative overflow-hidden border-2 border-lime-500/30 bg-gradient-to-br from-lime-500/20 to-lime-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-lime-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="p-4 relative">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Districts</p>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <MapPin className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-lime-700">{rows.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="p-4 relative">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Total Applications</p>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Sprout className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {rows.reduce((s, r) => s + r.no_of_applications, 0)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="p-4 relative">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Varieties</p>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Leaf className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">{varieties.length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card className="border-2 border-lime-200 shadow-md">
                <CardHeader className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-lime-50 to-green-50 border-b border-lime-200 rounded-t-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base sm:text-lg md:text-xl text-lime-800">
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
                            className="w-full sm:w-auto border-lime-400 text-lime-700 hover:bg-lime-50"
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
                            <Sprout className="h-12 w-12 mx-auto mb-4 text-lime-300" />
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
