"use client"
import { useState } from "react";
import {
    Download,
    CheckCircle,
    Banknote,
    ExternalLink,
    Search,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { Component, DBTClaim } from "@/types";
import * as XLSX from "xlsx";

export default function DBTClaimsReport() {
    const [selectedComponent, setSelectedComponent] = useState<string>("all");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const { data: components } = useFrappeGetDocList<Pick<Component, 'name' | 'subsidy_percent' | 'maximum_subsidy_amount' | 'rate_per_kg' | 'max_quantity'>>(
        "Component",
        {
            fields: ['name', 'subsidy_percent', 'maximum_subsidy_amount', 'rate_per_kg', 'max_quantity'],
            filters: [['for_dbt_claims', '=', '1']]
        }
    );

    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", { fields: ["name"], limit: 100 });

    const filters: any[] = [["docstatus", "=", 1]];
    
    if (selectedComponent !== "all") {
        filters.push(["component", "=", selectedComponent]);
    }

    const { data: disbursedClaims, isLoading: disbursedLoading } = useFrappeGetDocList<DBTClaim>(
        "DBT Claims",
        {
            fields: ["name", "creation", "app_form", "component", "invoice_number", "invoice_upload", "purchase_date", "quantity", "total_amount", "subsidy_given", "docstatus"],
            filters: filters,
            orderBy: { field: "creation", order: "desc" },
        }
    );

    const filteredClaims = (disbursedClaims || []).filter(claim => {
        const matchesSearch = searchText.length === 0 || 
            claim.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (claim.app_form && claim.app_form.toLowerCase().includes(searchText.toLowerCase()));
        
        return matchesSearch;
    });

    const totalRecords = filteredClaims.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedClaims = filteredClaims.slice(startIndex, endIndex);

    const stats = {
        total_disbursed_amount: filteredClaims.reduce((sum, claim) => sum + (claim.total_amount || 0), 0),
        total_claims_processed: filteredClaims.length,
        total_beneficiaries: new Set(filteredClaims.map(c => c.app_form)).size,
        total_components: new Set(filteredClaims.map(c => c.component)).size,
    };

    const handleExport = () => {
        if (!filteredClaims || filteredClaims.length === 0) return;

        const exportData = filteredClaims.map((claim) => ({
            "Date": new Date(claim.creation).toLocaleDateString("en-IN"),
            "Claim ID": claim.name,
            "Application ID": claim.app_form,
            "Component": claim.component,
            "Invoice Number": claim.invoice_number,
            "Purchase Date": claim.purchase_date,
            "Quantity": claim.quantity,
            "Total Amount": claim.total_amount,
            "Subsidy Given": claim.subsidy_given ? parseFloat(claim.subsidy_given) : 0,
            "Status": "Disbursed",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        const maxWidth = 50;
        const colWidths = Object.keys(exportData[0] || {}).map(key => {
            const maxLength = Math.max(
                key.length,
                ...exportData.map(row => String(row[key as keyof typeof row] || "").length)
            );
            return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DBT Claims");
        XLSX.writeFile(workbook, `dbt_claims_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    
                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports">
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                DBT Claims Report
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">View all processed Direct Benefit Transfer claims</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        data-testid="button-export"
                        onClick={handleExport}
                        disabled={!disbursedClaims || disbursedClaims.length === 0}
                        className="w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card data-testid="card-total-disbursed">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Disbursed</p>
                                    <p className="text-lg sm:text-2xl font-bold">₹{stats.total_disbursed_amount?.toLocaleString("en-IN") || 0}</p>
                                    <p className="text-xs text-muted-foreground">{stats.total_claims_processed || 0} claims</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-claims-processed">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Claims Processed</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_claims_processed || 0}</p>
                                    <p className="text-xs text-muted-foreground">Disbursed successfully</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-beneficiaries">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10 flex-shrink-0">
                                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_beneficiaries || 0}</p>
                                    <p className="text-xs text-muted-foreground">Received benefits</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-dbt-components">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10 flex-shrink-0">
                                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">DBT Components</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_components || 0}</p>
                                    <p className="text-xs text-muted-foreground">Available components</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Claims List */}
                <Card data-testid="card-claims-list">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            Disbursed Claims
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Complete history of processed DBT payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                            <div className="relative flex-1 sm:flex-initial w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search claim ID, application..."
                                    className="pl-9 w-full text-xs sm:text-sm"
                                    value={searchText}
                                    onChange={(e) => {
                                        setSearchText(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    data-testid="input-search"
                                />
                            </div>
                            <Select value={selectedComponent} onValueChange={(value) => {
                                setSelectedComponent(value);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm" data-testid="select-component">
                                    <SelectValue placeholder="Component" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Components</SelectItem>
                                    {components?.map((c) => (
                                        <SelectItem key={c.name} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm" data-testid="select-district">
                                    <SelectValue placeholder="District" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Districts</SelectItem>
                                    {districts?.map((d) => (
                                        <SelectItem key={d.name} value={d.name}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                        </div>

                        {/* Table */}
                        {disbursedLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : disbursedClaims && filteredClaims.length > 0 ? (
                            <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <Table className="text-xs sm:text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-24">Date</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-24">Claim ID</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-28">Application</TableHead>
                                            <TableHead className="min-w-24 sm:min-w-28">Component</TableHead>
                                            <TableHead className="min-w-24 sm:min-w-32">Invoice</TableHead>
                                            <TableHead className="text-right min-w-16 sm:min-w-20">Quantity</TableHead>
                                            <TableHead className="text-right min-w-20 sm:min-w-28">Total Amount</TableHead>
                                            <TableHead className="text-right min-w-16 sm:min-w-20">Subsidy</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-24">Status</TableHead>
                                            <TableHead className="min-w-16 sm:min-w-20">Invoice</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedClaims.map((claim, idx) => (
                                            <TableRow key={claim.name} data-testid={`row-claim-${claim.name}`}>
                                                <TableCell className="text-xs sm:text-sm text-muted-foreground">{startIndex + idx + 1}</TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {new Date(claim.creation).toLocaleDateString("en-IN")}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs sm:text-xs">{claim.name}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs sm:text-sm">{claim.app_form}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">{claim.component}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-xs sm:text-sm">{claim.invoice_number}</p>
                                                        <p className="text-xs text-muted-foreground">{claim.purchase_date}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs sm:text-sm">
                                                    {claim.quantity}
                                                </TableCell>
                                                <TableCell className="text-right text-xs sm:text-sm">
                                                    ₹{claim.total_amount?.toLocaleString("en-IN") || 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-medium text-green-600 text-xs sm:text-sm">
                                                        ₹{claim.subsidy_given ? parseFloat(claim.subsidy_given).toLocaleString("en-IN") : 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="default" className="bg-green-600 text-xs">Disbursed</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {claim.invoice_upload ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => window.open(claim.invoice_upload!, "_blank")}
                                                            data-testid={`button-view-invoice-${claim.name}`}
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            View
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">N/A</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No disbursed claims found</p>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && paginatedClaims.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Showing {paginatedClaims.length} of {totalRecords} records • Page {currentPage} of {totalPages}
                                </p>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}