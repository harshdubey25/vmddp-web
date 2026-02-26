"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { useDebounce } from "@/hooks/use-debounce";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DDReportPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [componentFilter, setComponentFilter] = useState("all");
    const [animalFilter, setAnimalFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");

    const animalOptions: { value: string; label: string }[] =
        componentFilter === "Animal Induction"
            ? [
                  { value: "Desi Cow", label: "Desi Cow" },
                  { value: "CrossBreed", label: "CrossBreed" },
                  { value: "Buffalo", label: "Buffalo" },
              ]
            : componentFilter === "HGM (Pregnant cow)"
            ? [
                  { value: "Buffalo", label: "Buffalo" },
                  { value: "Cow", label: "Cow" },
              ]
            : [];

    // Initialize page from URL params
    const initialPage = Number(searchParams.get("page") || 1);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const pageSize = 20;

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Fetch districts
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100,
    });

    const { data: apiResponse, isLoading } = useFrappeGetCall(
        "vmddp_app.api.v1.accountant.get_completed_dd_list",
        {
            limit_start: (currentPage - 1) * pageSize,
            limit_page_length: pageSize,
            search_text: debouncedSearchQuery || undefined,
            component: componentFilter !== "all" ? componentFilter : undefined,
            item: animalFilter !== "all" ? animalFilter : undefined,
            district: districtFilter !== "all" ? districtFilter : undefined,
        },
    );

    const reports = apiResponse?.message?.data || [];
    const pagination = apiResponse?.message?.pagination;
    const totalRecords = pagination?.total_items || reports.length;
    const totalPages = pagination?.total_pages || Math.ceil(totalRecords / pageSize);

    // Keep page number in the URL so refresh preserves the current page
    useEffect(() => {
        try {
            const params = new URLSearchParams(searchParams.toString());

            if (currentPage && currentPage > 1) {
                params.set("page", String(currentPage));
            } else {
                params.delete("page");
            }

            const query = params.toString();
            // Use replace to avoid adding history entries on every change
            router.replace(query ? `?${query}` : `/accountant/dd-report`);
        } catch (err) {
            console.error("Error syncing page params to URL", err);
        }
    }, [currentPage, router, searchParams]);

    // Export report
    const handleExport = async (format: ExportFormat = "excel") => {
        toast({
            title: "Export started",
            description: `Generating ${format.toUpperCase()} report...`,
        });

        try {
            const params: Record<string, string> = {};

            if (debouncedSearchQuery) params.search_text = debouncedSearchQuery;
            if (componentFilter !== "all") params.component = componentFilter;
            if (animalFilter !== "all") params.item = animalFilter;
            if (districtFilter !== "all") params.district = districtFilter;

            await exportReport({
                method: "vmddp_app.api.v1.accountant.export_completed_dd_list",
                params,
                format,
                filename: "dd-reports",
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
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex h-14 sm:h-16 items-center justify-between border-b px-4 sm:px-6 py-3 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-lg md:text-xl">
                        DD Collection Reports
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        View and export beneficiary payment reports
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="default"
                            className="gap-2 text-xs sm:text-sm h-8 sm:h-10"
                            data-testid="button-export"
                        >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Export Report</span>
                            <span className="xs:hidden">Export</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport("excel")} data-testid="export-excel">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Export as Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport("pdf")} data-testid="export-pdf">
                            <FileText className="h-4 w-4 mr-2" />
                            Export as PDF
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                    {/* Filters and Table */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">
                                        DD Collection Records
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {totalRecords} records found • Page{" "}
                                        {currentPage} of {totalPages}
                                    </CardDescription>
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, aadhar, or DD number..."
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSearch();
                                                }
                                            }}
                                            className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                                            data-testid="input-search"
                                        />
                                    </div>

                                    <Select
                                        value={componentFilter}
                                        onValueChange={(value) => {
                                            setComponentFilter(value);
                                            setAnimalFilter("all");
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                            <SelectValue placeholder="Filter by component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Components
                                            </SelectItem>
                                            <SelectItem value="Animal Induction">
                                                Animal Induction
                                            </SelectItem>
                                            <SelectItem value="HGM (Pregnant cow)">
                                                HGM (Pregnant cow)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(componentFilter === "Animal Induction" || componentFilter === "HGM (Pregnant cow)") && (
                                    <Select
                                        value={animalFilter}
                                        onValueChange={(value) => {
                                            setAnimalFilter(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                            <SelectValue placeholder="Filter by animal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Animals
                                            </SelectItem>
                                            {animalOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    )}

                                    <Select
                                        value={districtFilter}
                                        onValueChange={(value) => {
                                            setDistrictFilter(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                            <SelectValue placeholder="Filter by district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Districts
                                            </SelectItem>
                                            {districts?.map((d) => (
                                                <SelectItem key={d.name} value={d.name}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full min-w-[900px]">
                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                            <tr>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    Beneficiary Name
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    Aadhar No.
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    Bank
                                                </th>
                                                <th className="text-right p-3 text-xs sm:text-sm font-medium">
                                                    Amount
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    DD Number
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    Animal Opted
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    Component
                                                </th>
                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                    District
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                Array.from({ length: 5 }).map(
                                                    (_, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className="border-b"
                                                        >
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-16" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-20 mx-auto" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Skeleton className="h-5 w-full" />
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : reports.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="text-center py-8 text-sm text-muted-foreground"
                                                    >
                                                        No reports found
                                                    </td>
                                                </tr>
                                            ) : (
                                                reports.map((report: any) => (
                                                    <tr
                                                        key={report.name}
                                                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                                                    >
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="font-medium">
                                                                {`${report.first_name || ""} ${report.mid_name || ""} ${report.last_name || ""}`.trim()}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="font-mono text-muted-foreground">
                                                                {report.aadhar_number ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="text-muted-foreground">
                                                                {report.source_bank_name ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm text-right">
                                                            <div className="font-semibold text-primary">
                                                                ₹
                                                                {(
                                                                    report.dd_amount ||
                                                                    report.amount ||
                                                                    0
                                                                ).toLocaleString(
                                                                    "en-IN",
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="font-mono">
                                                                {report.dd_number ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {report.item ||
                                                                    "N/A"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="text-muted-foreground text-xs">
                                                                {report.component_name ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="text-muted-foreground text-xs">
                                                                {report.district ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {reports.length > 0 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages} •{" "}
                                        {reports.length} items
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            disabled={!pagination?.has_previous_page}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages, p + 1)
                                                )
                                            }
                                            disabled={!pagination?.has_next_page}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
