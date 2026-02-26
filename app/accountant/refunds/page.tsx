"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    RefreshCcw,
    AlertCircle,
    User,
    Download,
    Send,
    Clock,
    CheckCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrappeGetCall, useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Types for API response
interface PendingRefund {
    application_id: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    district: string;
    village: string;
    dd_amount: number;
    component: string;
    type_of_animal: string;
    animal_cost: number;
    collar_cost: number;
    premium_paid: number;
    transportation_cost: number;
    refund_amount: number;
    eligible_subsidy: number;
    account_holder_name?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    component_allocation_id: string;
}

interface PendingRefundResponse {
    refunds: PendingRefund[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
}

interface PaidRefund {
    name: string;
    application: string;
    component: string;
    refund_amount: number;
    transanction_id: string;
    transanction_date: string;
    creation: string;
    account_holder_name?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
}

const PAGE_SIZE = 20;


// Helper to get full name
const getFullName = (refund: PendingRefund) => {
    return [refund.first_name, refund.mid_name, refund.last_name].filter(Boolean).join(" ");
};

const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return "N/A";
    if (accountNumber.length <= 4) return accountNumber;
    return "X".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

export default function Refunds() {
    const [activeTab, setActiveTab] = useState("pending");
    const [showDBTDialog, setShowDBTDialog] = useState(false);
    const [currentRefund, setCurrentRefund] = useState<PendingRefund | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [paidPage, setPaidPage] = useState(1);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [paidDistrict, setPaidDistrict] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const { toast } = useToast();

    const handleExport = async (format: ExportFormat) => {
        setIsExporting(true);
        try {
            await exportReport({
                method: "vmddp_app.api.v1.accountant.export_paid_refund_list",
                params: { export_format: format },
                format,
                filename: "paid-refund-list",
            });
        } catch {
            toast({ title: "Export failed", description: "Could not export report. Please try again.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };
    const { createDoc, loading: submitting } = useFrappeCreateDoc();

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", { fields: ["name"], limit: 100 });

    // Fetch pending refunds from API
    const { data: refundsResponse, isLoading: loading, error, mutate } = useFrappeGetCall<{ message: PendingRefundResponse }>(
        "vmddp_app.api.v1.accountant.pending_refund_list",
        {
            page: currentPage,
            page_size: PAGE_SIZE,
            district: selectedDistrict || undefined,
        },
        `pending_refund_list_${currentPage}_${selectedDistrict || 'all'}`
    );

    const pendingRefunds = refundsResponse?.message?.refunds || [];
    const totalCount = refundsResponse?.message?.total_count || 0;
    const totalPages = refundsResponse?.message?.total_pages || 1;

    // Fetch paid refunds - submitted refunds with docstatus = 1
    const paidFilters: any[] = [["docstatus", "=", 1]];
    if (paidDistrict) {
        paidFilters.push(["application", "like", `%${paidDistrict}%`]);
    }

    const { data: paidRefundsData, isLoading: paidLoading } = useFrappeGetDocList<PaidRefund>("Refund", {
        fields: [
            "name",
            "application",
            "component",
            "refund_amount",
            "transanction_id",
            "transanction_date",
            "creation",
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code"
        ],
        filters: paidFilters,
        limit_start: (paidPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        orderBy: { field: "creation", order: "desc" },
    });

    // Get total count of paid refunds
    const { data: paidCountData } = useFrappeGetDocList<PaidRefund>("Refund", {
        fields: ["name"],
        filters: paidFilters,
        limit: 0,
    });

    const paidRefunds = paidRefundsData || [];
    const paidTotalCount = paidCountData?.length || paidRefunds.length;
    const paidTotalPages = Math.ceil(paidTotalCount / PAGE_SIZE) || 1;

    // Calculate totals
    const totalPending = pendingRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const totalPaid = paidRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

    const handleOpenDBTDialog = (refund: PendingRefund) => {
        setCurrentRefund(refund);
        setSubmitError(null);
        setShowDBTDialog(true);
    };

    const handleSubmitRefund = async () => {
        if (!currentRefund) return;

        setSubmitError(null);

        try {
            await createDoc("Refund", {
                application: currentRefund.application_id,
                component: currentRefund.component,
                refund_amount: currentRefund.refund_amount,
                component_allocation: currentRefund.component_allocation_id,
                status: "Pending",
                docstatus: 0, // Draft status - requires admin approval
            });

            toast({
                title: "Refund Submitted for Approval",
                description: `Refund of ₹${currentRefund.refund_amount.toLocaleString("en-IN")} has been submitted for admin approval.`,
            });

            setShowDBTDialog(false);
            setCurrentRefund(null);
            // Refresh the list to remove processed refund
            mutate();
        } catch (err: any) {
            const errorMessage = err?.message || err?._server_messages || "Failed to process refund";
            setSubmitError(typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage));
            toast({
                title: "Error",
                description: "Failed to process refund. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value === "all" ? null : value);
        setCurrentPage(1);
    };

    const handlePaidDistrictChange = (value: string) => {
        setPaidDistrict(value === "all" ? null : value);
        setPaidPage(1);
    };

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                    Refund Management
                                </h1>
                                <p className="text-sm text-muted-foreground">Process excess DD refunds via DBT</p>
                            </div>
                        </div>
                        {activeTab === "paid" && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" data-testid="button-export" className="w-full sm:w-auto" disabled={isExporting}>
                                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Excel (.xlsx)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        PDF (.pdf)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Info Banner */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Auto-Calculated Refunds with Admin Approval</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Refunds are automatically calculated when the actual subsidy is less than the DD amount collected. The
                                difference is refunded to the beneficiary via Direct Benefit Transfer (DBT). All refund requests require admin approval before processing.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-pending-refunds">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <Clock className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Refunds</p>
                                        <p className="text-2xl font-bold">₹{totalPending.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{totalCount} beneficiaries</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-paid">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Paid Refunds</p>
                                        <p className="text-2xl font-bold">₹{totalPaid.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{paidTotalCount} completed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-total-cases">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Cases</p>
                                        <p className="text-2xl font-bold">{totalCount}</p>
                                        <p className="text-xs text-muted-foreground">All refund cases</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Pending and Paid Refunds */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="pending">Pending ({totalCount})</TabsTrigger>
                            <TabsTrigger value="paid">Paid ({paidTotalCount})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {/* Filter */}
                            <Card data-testid="card-filter" className="mb-6">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                        <Label className="text-sm">Filter by District:</Label>
                                        <Select value={selectedDistrict || "all"} onValueChange={handleDistrictChange}>
                                            <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-district">
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
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pending Refunds List */}
                            <Card data-testid="card-refunds-list">
                                <CardHeader>
                                    <CardTitle className="text-lg sm:text-xl">Pending Refunds</CardTitle>
                                    <CardDescription className="text-sm">Process refunds for beneficiaries</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-8 text-destructive">
                                            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                            <p className="text-sm">Failed to load refunds. Please try again.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full min-w-[900px]">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Application ID</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Beneficiary</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">District</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Village</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Component</th>
                                                                <th className="text-right p-3 text-xs sm:text-sm font-medium">DD Amount</th>
                                                                <th className="text-right p-3 text-xs sm:text-sm font-medium">Eligible Subsidy</th>
                                                                <th className="text-right p-3 text-xs sm:text-sm font-medium">Refund Amount</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pendingRefunds.map((refund) => (
                                                                <tr key={refund.application_id} data-testid={`row-refund-${refund.application_id}`} className="border-b hover:bg-muted/30">
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <span className="font-mono text-xs">{refund.application_id}</span>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <p className="font-medium">{getFullName(refund)}</p>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">{refund.district}</td>
                                                                    <td className="p-3 text-xs sm:text-sm">{refund.village}</td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <div className="flex flex-col gap-1">
                                                                            <Badge variant="outline" className="w-fit">{refund.component}</Badge>
                                                                            {refund.component === "Animal Induction" && refund.type_of_animal && (
                                                                                <span className="text-xs font-medium text-primary/70">{refund.type_of_animal}</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm text-right">₹{refund.dd_amount.toLocaleString("en-IN")}</td>
                                                                    <td className="p-3 text-xs sm:text-sm text-right text-green-600">₹{refund.eligible_subsidy.toLocaleString("en-IN")}</td>
                                                                    <td className="p-3 text-xs sm:text-sm text-right font-bold text-primary">₹{refund.refund_amount.toLocaleString("en-IN")}</td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <Button size="sm" onClick={() => handleOpenDBTDialog(refund)} data-testid={`button-dbt-${refund.application_id}`} className="whitespace-nowrap">
                                                                            <Send className="h-4 w-4 mr-1" />
                                                                            DBT
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {pendingRefunds.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={9} className="text-center py-8 text-muted-foreground p-3">
                                                                        No pending refunds
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                                                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                                        Page {currentPage} of {totalPages} • {totalCount} total records
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={currentPage === 1}
                                                            data-testid="button-prev-page"
                                                        >
                                                            <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                                            <span className="hidden sm:inline">Previous</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={currentPage >= totalPages}
                                                            data-testid="button-next-page"
                                                        >
                                                            <span className="hidden sm:inline">Next</span>
                                                            <ChevronRight className="h-4 w-4 sm:ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="paid">
                            {/* Filter for Paid */}
                            <Card data-testid="card-paid-filter" className="mb-6">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                        <Label className="text-sm">Filter by District:</Label>
                                        <Select value={paidDistrict || "all"} onValueChange={handlePaidDistrictChange}>
                                            <SelectTrigger className="w-full sm:w-48" data-testid="select-paid-filter-district">
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
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Paid Refunds List */}
                            <Card data-testid="card-paid-refunds-list">
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg sm:text-xl">Paid Refunds</CardTitle>
                                        <CardDescription className="text-sm">History of completed refund transfers</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {paidLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full min-w-[900px]">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Application ID</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Component</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Bank Details</th>
                                                                <th className="text-right p-3 text-xs sm:text-sm font-medium">Refund Amount</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Transaction ID</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Transaction Date</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Processed On</th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paidRefunds.map((refund: any) => (
                                                                <tr key={refund.name} data-testid={`row-paid-refund-${refund.name}`} className="border-b hover:bg-muted/30">
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <span className="font-mono text-xs">{refund.application}</span>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <Badge variant="outline" className="w-fit">{refund.component}</Badge>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="font-medium text-sm">{refund.bank_name || "N/A"}</span>
                                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                                {maskAccountNumber(refund.account_number)}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm text-right font-bold text-green-600">
                                                                        ₹{refund.refund_amount.toLocaleString("en-IN")}
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <span className="font-mono text-xs">{refund.transanction_id}</span>
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        {new Date(refund.transanction_date).toLocaleDateString("en-IN")}
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        {new Date(refund.creation).toLocaleDateString("en-IN")}
                                                                    </td>
                                                                    <td className="p-3 text-xs sm:text-sm">
                                                                        <Badge variant="default" className="bg-green-500">
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            Paid
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {paidRefunds.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={8} className="text-center py-8 text-muted-foreground p-3">
                                                                        No paid refunds found
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Pagination for Paid */}
                                            {paidTotalPages > 1 && (
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                                                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                                        Page {paidPage} of {paidTotalPages} • {paidTotalCount} total records
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaidPage(p => Math.max(1, p - 1))}
                                                            disabled={paidPage === 1}
                                                            data-testid="button-paid-prev-page"
                                                        >
                                                            <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                                            <span className="hidden sm:inline">Previous</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaidPage(p => Math.min(paidTotalPages, p + 1))}
                                                            disabled={paidPage >= paidTotalPages}
                                                            data-testid="button-paid-next-page"
                                                        >
                                                            <span className="hidden sm:inline">Next</span>
                                                            <ChevronRight className="h-4 w-4 sm:ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* DBT Dialog */}
            <Dialog open={showDBTDialog} onOpenChange={setShowDBTDialog}>
                <DialogContent className="w-[95vw] sm:w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-dbt">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                            Initiate DBT Transfer
                        </DialogTitle>
                        <DialogDescription className="text-sm">Process refund via Direct Benefit Transfer</DialogDescription>
                    </DialogHeader>

                    {currentRefund && (
                        <div className="space-y-4 py-4">
                            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="text-muted-foreground">Application ID</span>
                                    <span className="font-mono text-sm">{currentRefund.application_id}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="text-muted-foreground">Beneficiary</span>
                                    <span className="font-medium">{getFullName(currentRefund)}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="text-muted-foreground">Location</span>
                                    <span className="font-medium">{currentRefund.village}, {currentRefund.district}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="text-muted-foreground">Component</span>
                                    <div className="flex flex-col items-start sm:items-end gap-0.5">
                                        <span className="font-medium">{currentRefund.component}</span>
                                        {currentRefund.component === "Animal Induction" && currentRefund.type_of_animal && (
                                            <span className="text-xs text-muted-foreground">{currentRefund.type_of_animal}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 border rounded-lg space-y-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <h4 className="font-medium text-xs sm:text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <User className="h-4 w-4" />
                                    Bank Account Details
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span className="text-muted-foreground text-sm">Account Holder</span>
                                        <span className="font-medium text-sm">{currentRefund.account_holder_name || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span className="text-muted-foreground text-sm">Bank Name</span>
                                        <span className="font-medium text-sm">{currentRefund.bank_name || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span className="text-muted-foreground text-sm">Account Number</span>
                                        <span className="font-mono text-sm">{maskAccountNumber(currentRefund.account_number)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <span className="text-muted-foreground text-sm">IFSC Code</span>
                                        <span className="font-mono text-sm">{currentRefund.ifsc_code || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakup */}
                            <div className="p-3 sm:p-4 border rounded-lg space-y-2 bg-card">
                                <h4 className="font-medium text-xs sm:text-sm mb-3">Cost Breakdown</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Animal Cost</span>
                                    <span>₹{currentRefund.animal_cost.toLocaleString("en-IN")}</span>
                                </div>
                                {currentRefund.collar_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Collar Cost</span>
                                        <span>₹{currentRefund.collar_cost.toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                {currentRefund.premium_paid > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Premium Paid</span>
                                        <span>₹{currentRefund.premium_paid.toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                {currentRefund.transportation_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Transportation Cost</span>
                                        <span>₹{currentRefund.transportation_cost.toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                            </div>

                            {/* Refund Calculation */}
                            <div className="p-3 sm:p-4 border rounded-lg space-y-2 bg-card">
                                <h4 className="font-medium text-xs sm:text-sm mb-3">Refund Calculation</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">DD Amount Collected</span>
                                    <span>₹{currentRefund.dd_amount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Eligible Subsidy</span>
                                    <span className="text-green-600">₹{currentRefund.eligible_subsidy.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                                    <span>Refund Amount</span>
                                    <span className="text-primary">₹{currentRefund.refund_amount.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {submitError && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Please ensure the bank details are verified before submitting. This request will be sent to admin for approval. Transaction details will be added by admin during approval.
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t mt-2">
                        <Button variant="outline" onClick={() => setShowDBTDialog(false)} disabled={submitting} className="w-full sm:w-auto order-2 sm:order-1" data-testid="button-cancel-dbt">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitRefund} disabled={submitting} className="w-full sm:w-auto order-1 sm:order-2" data-testid="button-confirm-dbt">
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit for Approval"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
