"use client"
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    CheckCircle,
    Search,
    Building2,
    Filter,
    Loader2,
    Receipt,
    Calendar,
    Eye,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface VendorPaymentReport {
    name: string;
    vendor: string;
    vendor_name: string;
    check_number: string;
    cheque_date: string;
    cheque_amount: number;
    bank_name: string;
    creation: string;
    component_allocations: Array<{
        component_allocation: string;
        amount: number;
        application?: string;
        component?: string;
        type_of_animal?: string;
        animal_cost?: number;
        tag_number?: string;
    }>;
    total_allocations: number;
    for_parantage?: boolean;
    parantage_confirmations?: Array<{
        parantage_confirmation: string;
        amount: number;
        app_form: string;
        calf_born: string;
        calf_date_of_birth: string;
        certified_by_agency: string;
        status: string;
        component_allocation: string;
        first_name: string;
        mid_name: string;
        last_name: string;
        district: string;
        taluka: string;
        village: string;
    }>;
    total_parantage?: number;
}

interface VendorPaymentsReportProps {
    backLink: string;
}

export default function VendorPaymentsReport({ backLink }: VendorPaymentsReportProps) {
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<VendorPaymentReport | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const pageSize = 20;

    const { data: paymentsResponse, isLoading: loading } = useFrappeGetCall<FrappeCustomApiResponse<VendorPaymentReport[]>>(
        "vmddp_app.api.v1.accountant.completed_vendor_payment_list",
        {
            limit_page_length: 1000,
            vendor_name: selectedVendor || undefined,
            search_text: searchText || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        },
        undefined,
        { revalidateOnFocus: false }
    );

    const { data: vendors } = useFrappeGetDocList<{ name: string; vendor_name: string }>("Vendor", {
        fields: ["name", "vendor_name"],
        limit: 100
    });

    const vendorPayments = paymentsResponse?.message || [];

    const totalDisbursed = vendorPayments.reduce((sum, p) => sum + (p.cheque_amount || 0), 0);
    const totalCheques = vendorPayments.length;

    // Pagination calculations
    const totalRecords = vendorPayments.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedPayments = vendorPayments.slice(startIndex, startIndex + pageSize);

    const handleExport = async (format: ExportFormat = "excel") => {
        if (vendorPayments.length === 0 || isExporting) return;
        setIsExporting(true);
        try {
            const params: Record<string, string> = {};
            if (selectedVendor) params.vendor_name = selectedVendor;
            if (searchText) params.search_text = searchText;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            await exportReport({
                method: "vmddp_app.api.v1.accountant.export_completed_vendor_payment_list",
                params,
                format,
                filename: "vendor_payments_report",
            });
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 h-full overflow-auto bg-background">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link href={backLink}>
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                    Vendor Payments Report
                                </h1>
                                <p className="text-sm text-muted-foreground">View all disbursed vendor payments and issued cheques</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" data-testid="button-export" disabled={vendorPayments.length === 0 || isExporting}>
                                        {isExporting
                                            ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                                            : <Download className="h-4 w-4 sm:mr-2" />}
                                        <span className="hidden sm:inline">Export</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <Card data-testid="card-total-disbursed">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Disbursed</p>
                                        <p className="text-2xl font-bold">₹{(totalDisbursed / 100000).toFixed(2)}L</p>
                                        <p className="text-xs text-muted-foreground">{totalCheques} cheques</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-cheques-issued">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <Receipt className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cheques Issued</p>
                                        <p className="text-2xl font-bold">{totalCheques}</p>
                                        <p className="text-xs text-muted-foreground">Total payments</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-vendors">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-purple-500/10">
                                        <Building2 className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Vendors</p>
                                        <p className="text-2xl font-bold">{vendors?.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card data-testid="card-filters">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
                                <div className="w-full sm:w-56 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search cheque, vendor"
                                        className="pl-9"
                                        value={searchText}
                                        onChange={(e) => {
                                            setSearchText(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        data-testid="input-search"
                                    />
                                </div>
                                <Select
                                    value={selectedVendor || "all"}
                                    onValueChange={(value) => {
                                        setSelectedVendor(value === "all" ? null : value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-full sm:w-44" data-testid="select-vendor">
                                        <SelectValue placeholder="Vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Vendors</SelectItem>
                                        {vendors?.map((v) => (
                                            <SelectItem key={v.name} value={v.name}>{v.vendor_name || v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex flex-col xs:flex-row gap-2 items-start xs:items-center">
                                    <div className="flex gap-2 items-center">
                                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Start Date"
                                            className="w-full sm:w-36"
                                            data-testid="input-start-date"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-muted-foreground text-sm">to</span>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="End Date"
                                            className="w-full sm:w-36"
                                            data-testid="input-end-date"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-payments-table">
                        <CardHeader>
                            <CardTitle>Disbursed Payments</CardTitle>
                            <CardDescription>
                                All vendor payments that have been processed via cheque • Showing {totalRecords} records
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : vendorPayments.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden flex flex-col">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-muted border-b sticky top-0 z-10">
                                                <tr>
                                                    <th className="text-left p-3 font-medium w-12">#</th>
                                                    <th className="text-left p-3 font-medium">Payment ID</th>
                                                    <th className="text-left p-3 font-medium">Vendor</th>
                                                    <th className="text-left p-3 font-medium">Cheque Number</th>
                                                    <th className="text-left p-3 font-medium">Cheque Date</th>
                                                    <th className="text-left p-3 font-medium">Bank</th>
                                                    <th className="text-right p-3 font-medium">Amount</th>
                                                    <th className="text-left p-3 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedPayments.map((payment, idx) => (
                                                    <tr key={payment.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-payment-${payment.name}`}>
                                                        <td className="p-3 text-sm text-muted-foreground">{startIndex + idx + 1}</td>
                                                        <td className="p-3">
                                                            <p className="font-medium font-mono text-sm">{payment.name}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-sm">{payment.vendor_name || payment.vendor}</p>
                                                                {payment.for_parantage ? (
                                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                                        Parantage
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="font-medium text-sm">{payment.check_number}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="font-medium text-sm">{new Date(payment.cheque_date).toLocaleDateString("en-GB")}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="font-medium">{payment.bank_name}</p>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <span className="font-bold text-green-600">
                                                                ₹{payment.cheque_amount.toLocaleString("en-IN")}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPayment(payment);
                                                                    setDetailsDialog(true);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No disbursed payments found</p>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && paginatedPayments.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {paginatedPayments.length} of {totalRecords} records • Page {currentPage} of {totalPages}
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

            <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
                <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                        <DialogDescription>Complete information about the vendor payment</DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment ID</p>
                                    <p className="font-medium font-mono">{selectedPayment.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendor</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{selectedPayment.vendor_name || selectedPayment.vendor}</p>
                                        {selectedPayment.for_parantage ? (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                Parantage
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cheque Number</p>
                                    <p className="font-medium">{selectedPayment.check_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cheque Date</p>
                                    <p className="font-medium">{new Date(selectedPayment.cheque_date).toLocaleDateString("en-GB")}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Bank Name</p>
                                    <p className="font-medium">{selectedPayment.bank_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cheque Amount</p>
                                    <p className="font-bold text-green-600 text-lg">₹{selectedPayment.cheque_amount.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created On</p>
                                    <p className="font-medium">{new Date(selectedPayment.creation).toLocaleString("en-GB")}</p>
                                </div>
                            </div>

                            {selectedPayment.for_parantage && selectedPayment.parantage_confirmations ? (
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Parantage Confirmations ({selectedPayment.total_parantage || 0})
                                    </h3>
                                    {selectedPayment.parantage_confirmations.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedPayment.parantage_confirmations.map((parantage, idx) => (
                                                <Card key={idx}>
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Parantage ID</p>
                                                                <p className="font-medium font-mono text-sm">{parantage.parantage_confirmation}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Application ID</p>
                                                                <p className="font-medium font-mono text-sm">{parantage.app_form}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Beneficiary Name</p>
                                                                <p className="font-medium">{`${parantage.first_name} ${parantage.mid_name} ${parantage.last_name}`}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Location</p>
                                                                <p className="font-medium text-sm">{parantage.village}</p>
                                                                <p className="text-xs text-muted-foreground">{parantage.taluka}, {parantage.district}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Calf Born</p>
                                                                <p className="font-medium">{parantage.calf_born}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Calf Date of Birth</p>
                                                                <p className="font-medium">{new Date(parantage.calf_date_of_birth).toLocaleDateString("en-GB")}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Certified By</p>
                                                                <p className="font-medium">{parantage.certified_by_agency}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Component Allocation</p>
                                                                <p className="font-medium text-sm">{parantage.component_allocation}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Status</p>
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 w-fit">
                                                                    {parantage.status}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Amount</p>
                                                                <p className="font-semibold text-green-600">₹{parantage.amount.toLocaleString("en-IN")}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">No parantage confirmations</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Component Allocations ({selectedPayment.total_allocations})
                                    </h3>
                                    {selectedPayment.component_allocations && selectedPayment.component_allocations.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedPayment.component_allocations.map((allocation, idx) => (
                                                <Card key={idx}>
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Component</p>
                                                                <p className="font-medium">{allocation.component}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Application ID</p>
                                                                <p className="font-medium font-mono text-sm">{allocation.application}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Animal Type</p>
                                                                <p className="font-medium">{allocation.type_of_animal}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Tag Number</p>
                                                                <p className="font-medium font-mono">{allocation.tag_number}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Animal Cost</p>
                                                                <p className="font-medium">₹{allocation.animal_cost?.toLocaleString("en-IN")}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Allocated Amount</p>
                                                                <p className="font-semibold text-green-600">₹{allocation.amount.toLocaleString("en-IN")}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">No component allocations</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
