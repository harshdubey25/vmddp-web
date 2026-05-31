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
import { FileSpreadsheet, FileText, RefreshCw, ArrowLeft, Loader2, Maximize2, Sprout, MapPin, Leaf, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExport } from "@/hooks/use-export";

interface FodderSeedDetailedRow {
    sn: number;
    application_id: string;
    farmer_name: string;
    village: string;
    taluka: string;
    district: string;
    total_quantity: number;
    total_amount: number;
    expected_land_covered: number;
    expected_yield: number;
    [variety: string]: any;
}

export default function FodderSeedDetailedReportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [districtFilter, setDistrictFilter] = useState("all");
    const [isTableFullscreen, setIsTableFullscreen] = useState(false);

    const { isExporting, handleExport: exportData } = useExport({
        method: "vmddp_app.api.v1.admin.export_fodder_seed_report",
        filename: "Detailed_Fodder_Seed_Report",
    });

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100,
    });

    // Fetch fodder seed detailed report data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<any>(
        "vmddp_app.api.v1.admin.fodder_seed_report",
        {
            district: districtFilter !== "all" ? districtFilter : undefined,
        },
        `fodder_seed_detailed_report_${districtFilter}`,
        { revalidateOnFocus: false },
    );

    const rows: FodderSeedDetailedRow[] = apiResponse?.message ?? [];

    // Extract dynamic varieties from returned rows
    const standardKeys = [
        "sn",
        "application_id",
        "farmer_name",
        "village",
        "taluka",
        "district",
        "total_quantity",
        "total_amount",
        "expected_land_covered",
        "expected_yield"
    ];

    const varieties = Array.from(
        new Set(
            rows.flatMap(row =>
                Object.keys(row).filter(key => !standardKeys.includes(key))
            )
        )
    );

    const handleExport = (format: "excel" | "csv") => {
        const params: Record<string, string> = {};
        if (districtFilter !== "all") {
            params.district = districtFilter;
        }
        exportData({
            params,
            format,
        });
    };

    const handleRefresh = () => {
        mutate();
        toast({ title: "Refreshing", description: "Fetching latest data..." });
    };

    // Cycle of soft colours for variety columns
    const varietyColors = [
        { header: "bg-emerald-100 text-emerald-800", cell: "bg-emerald-50/50", total: "bg-emerald-200 text-emerald-900" },
        { header: "bg-sky-100 text-sky-800",     cell: "bg-sky-50/50",     total: "bg-sky-200 text-sky-900" },
        { header: "bg-violet-100 text-violet-800", cell: "bg-violet-50/50", total: "bg-violet-200 text-violet-900" },
        { header: "bg-amber-100 text-amber-800",  cell: "bg-amber-50/50",  total: "bg-amber-200 text-amber-900" },
        { header: "bg-rose-100 text-rose-800",    cell: "bg-rose-50/50",   total: "bg-rose-200 text-rose-900" },
        { header: "bg-cyan-100 text-cyan-800",    cell: "bg-cyan-50/50",   total: "bg-cyan-200 text-cyan-900" },
        { header: "bg-fuchsia-100 text-fuchsia-800", cell: "bg-fuchsia-50/50", total: "bg-fuchsia-200 text-fuchsia-900" },
        { header: "bg-teal-100 text-teal-800",    cell: "bg-teal-50/50",   total: "bg-teal-200 text-teal-900" },
    ];

    const renderReportTable = (containerClassName: string) => (
        <div className="border rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className={containerClassName}>
                <table className="w-full min-w-[1200px] text-xs border-collapse">
                    <thead className="sticky top-0 z-30">
                        <tr className="bg-muted text-muted-foreground border-b border-border">
                            <th rowSpan={2} className="text-center p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                S.N.
                            </th>
                            <th rowSpan={2} className="text-left p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Farmer name
                            </th>
                            <th rowSpan={2} className="text-left p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Village
                            </th>
                            <th rowSpan={2} className="text-left p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Taluka
                            </th>
                            <th rowSpan={2} className="text-left p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                District
                            </th>
                            <th rowSpan={2} className="text-left p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Application ID
                            </th>
                            {varieties.length > 0 && (
                                <th colSpan={varieties.length} className="text-center p-2 font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-r border-b border-border text-xs">
                                    Fodder Seed Alloted (In Kgs)
                                </th>
                            )}
                            <th rowSpan={2} className="text-right p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Total Quantity Alloted (kgs)
                            </th>
                            <th rowSpan={2} className="text-right p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Total Amount (Rs.)
                            </th>
                            <th rowSpan={2} className="text-right p-3 font-semibold whitespace-nowrap bg-muted border-r border-b border-border">
                                Expected Land Covered (Hect.)
                            </th>
                            <th rowSpan={2} className="text-right p-3 font-semibold whitespace-nowrap bg-muted border-b border-border">
                                Expected Yield in M.Ton
                            </th>
                        </tr>
                        {varieties.length > 0 && (
                            <tr className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-border">
                                {varieties.map((v, i) => (
                                    <th
                                        key={v}
                                        className={`text-right p-2 font-semibold whitespace-nowrap border-r border-b border-border/60 ${varietyColors[i % varietyColors.length].header}`}
                                    >
                                        {v}
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                    <td className="p-3"><Skeleton className="h-4 w-8" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                                    {varieties.map((v) => (
                                        <td key={v} className="p-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                    ))}
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                    <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={10 + varieties.length}
                                    className="p-10 text-center text-muted-foreground"
                                >
                                    <Sprout className="h-10 w-10 mx-auto mb-2 text-slate-400 opacity-60" />
                                    No records found for the selected filters.
                                </td>
                             </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr
                                    key={row.application_id + idx}
                                    className={`border-b last:border-0 hover:bg-slate-50/80 transition-all ${
                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                    }`}
                                >
                                    <td className="p-3 text-center font-medium border-r border-slate-200/60">{row.sn || idx + 1}</td>
                                    <td className="p-3 font-semibold border-r border-slate-200/60 text-slate-800">{row.farmer_name}</td>
                                    <td className="p-3 border-r border-slate-200/60">{row.village}</td>
                                    <td className="p-3 border-r border-slate-200/60">{row.taluka}</td>
                                    <td className="p-3 border-r border-slate-200/60">{row.district}</td>
                                    <td className="p-3 border-r border-slate-200/60 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{row.application_id}</td>
                                    {varieties.map((v, i) => (
                                        <td key={v} className={`p-3 text-right border-r border-slate-200/60 ${varietyColors[i % varietyColors.length].cell} font-mono`}>
                                            {row[v] !== undefined && row[v] !== null ? Number(row[v]).toFixed(1) : "-"}
                                        </td>
                                    ))}
                                    <td className="p-3 text-right font-semibold text-slate-700 font-mono">{(row.total_quantity as number)?.toFixed(1) ?? "0.0"}</td>
                                    <td className="p-3 text-right font-bold text-slate-800 font-mono">₹{(row.total_amount as number)?.toLocaleString('en-IN') ?? "0"}</td>
                                    <td className="p-3 text-right font-mono">{(row.expected_land_covered as number)?.toFixed(2) ?? "0.00"}</td>
                                    <td className="p-3 text-right font-mono">{(row.expected_yield as number)?.toFixed(2) ?? "0.00"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="border-t-2 border-border font-bold bg-muted">
                            <tr>
                                <td className="p-3 text-center border-r border-border"></td>
                                <td className="p-3 border-r border-border text-foreground" colSpan={5}>TOTAL</td>
                                {varieties.map((v, i) => (
                                    <td key={v} className={`p-3 text-right border-r border-border ${varietyColors[i % varietyColors.length].total} font-mono`}>
                                        {rows.reduce((sum, r) => sum + (Number(r[v]) || 0), 0).toFixed(1)}
                                    </td>
                                ))}
                                <td className="p-3 text-right text-foreground border-r border-border font-mono">
                                    {rows.reduce((sum, r) => sum + (Number(r.total_quantity) || 0), 0).toFixed(1)}
                                </td>
                                <td className="p-3 text-right text-foreground border-r border-border font-mono">
                                    ₹{rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 text-right text-foreground border-r border-border font-mono">
                                    {rows.reduce((sum, r) => sum + (Number(r.expected_land_covered) || 0), 0).toFixed(2)}
                                </td>
                                <td className="p-3 text-right text-foreground font-mono">
                                    {rows.reduce((sum, r) => sum + (Number(r.expected_yield) || 0), 0).toFixed(2)}
                                </td>
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
                        <h1 className="text-xl sm:text-2xl font-bold">Fodder Seed Detailed Report</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Application-wise fodder seed variety distribution &amp; utilization</p>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary cards */}
            {!isLoading && rows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Farmers Count</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{rows.length}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Total Qty (Kgs)</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {rows.reduce((s, r) => s + (Number(r.total_quantity) || 0), 0).toFixed(1)}
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
                                <p className="text-xs text-muted-foreground font-medium mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    ₹{rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-slate-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Seed Varieties</p>
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
                                Detailed Fodder Seed Distribution Report
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {rows.length} record{rows.length !== 1 ? "s" : ""} • {varieties.length} seed variet{varieties.length !== 1 ? "ies" : "y"}
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
                            <DialogTitle>Fodder Seed Detailed Report</DialogTitle>
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
