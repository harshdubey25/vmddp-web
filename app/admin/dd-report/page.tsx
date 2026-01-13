"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Download,
    Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useDebounce } from "@/hooks/use-debounce";
import { frappeBrowser } from "@/lib/frappe";

export default function DDReportPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [componentFilter, setComponentFilter] = useState("all");
    const [animalFilter, setAnimalFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: apiResponse, isLoading } = useFrappeGetCall(
        'vmddp_app.api.v1.accountant.get_completed_dd_list',
        {
            page: currentPage,
            limit: pageSize,
            search_text: debouncedSearchQuery || undefined,
            component: componentFilter !== "all" ? componentFilter : undefined,
            item: animalFilter !== "all" ? animalFilter : undefined,
        }
    );

    const reports = apiResponse?.message || [];
    const totalRecords = apiResponse?.total || reports.length;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Export to Excel
    const handleExport = async () => {
        toast({
            title: "Export started",
            description: "Generating report...",
        });

        try {
            const params: Record<string, string> = {};

            if (debouncedSearchQuery) params.search_text = debouncedSearchQuery;
            if (componentFilter !== 'all') params.component = componentFilter;
            if (animalFilter !== 'all') params.item = animalFilter;

            const axiosResponse = await frappeBrowser.call().axios.get(
                '/api/method/vmddp_app.api.v1.accountant.export_completed_dd_list',
                {
                    params,
                    responseType: 'blob',
                }
            );

            const blob = new Blob([axiosResponse.data], {
                type: axiosResponse.headers['content-type'] || 'application/octet-stream',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `dd-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: "Export completed",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error('Export error:', error);
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
                <Button
                    variant="default"
                    className="gap-2 text-xs sm:text-sm h-8 sm:h-10"
                    onClick={handleExport}
                    data-testid="button-export"
                >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Export Report</span>
                    <span className="xs:hidden">Export</span>
                </Button>
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
                                        {totalRecords} records found • Page {currentPage} of {totalPages}
                                    </CardDescription>
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, aadhar, or DD number..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                            className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                                            data-testid="input-search"
                                        />
                                    </div>

                                    <Select value={componentFilter} onValueChange={(value) => {
                                        setComponentFilter(value);
                                        setCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                            <SelectValue placeholder="Filter by component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Components</SelectItem>
                                            <SelectItem value="Animal Induction">Animal Induction</SelectItem>
                                            <SelectItem value="HGM (Pregnant cow)">HGM (Pregnant cow)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={animalFilter} onValueChange={(value) => {
                                        setAnimalFilter(value);
                                        setCurrentPage(1);
                                    }}>
                                        <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                            <SelectValue placeholder="Filter by animal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Animals</SelectItem>
                                            <SelectItem value="Desi Cow">Desi Cow</SelectItem>
                                            <SelectItem value="CrossBreed">CrossBreed</SelectItem>
                                            <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            <SelectItem value="Cow">Cow</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead className="bg-muted/50 border-b">
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
                                                <th className="text-center p-3 text-xs sm:text-sm font-medium">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                Array.from({ length: 5 }).map((_, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-full" /></td>
                                                        <td className="p-3"><Skeleton className="h-5 w-20 mx-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : reports.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
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
                                                                {report.aadhar_number?.startsWith('http')
                                                                    ? "N/A"
                                                                    : report.aadhar_number?.replace(/(\d{4})(?=\d)/g, "$1 ") || "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="text-muted-foreground">{report.source_bank_name || "N/A"}</div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm text-right">
                                                            <div className="font-semibold text-primary">
                                                                ₹{(report.dd_amount || report.amount || 0).toLocaleString("en-IN")}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="font-mono">{report.dd_number || "N/A"}</div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <Badge variant="outline" className="text-xs">
                                                                {report.item || "N/A"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm">
                                                            <div className="text-muted-foreground text-xs">
                                                                {report.component_name || "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs sm:text-sm text-center">
                                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                                                {report.component_status || "DD Completed"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center mt-4 pt-4 border-t">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <PaginationItem key={pageNum}>
                                                        <PaginationLink
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            isActive={currentPage === pageNum}
                                                            className="cursor-pointer"
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            {reports.length > 0 && (
                                <div className="mt-4 text-xs sm:text-sm text-muted-foreground text-center">
                                    Showing {reports.length} records on page {currentPage} of {totalPages}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
