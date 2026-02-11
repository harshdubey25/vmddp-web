"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    RefreshCcw,
    AlertCircle,
    User,
    Download,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrappeGetDocList, useFrappeUpdateDoc, useFrappeGetDoc } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";

// Types
interface Refund {
    name: string;
    application: string;
    component: string;
    refund_amount: number;
    transanction_id: string;
    transanction_date: string;
    creation: string;
    modified: string;
    account_holder_name?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    docstatus: number;
    status: string;
    owner: string;
}

interface AppFormData {
    first_name: string;
    mid_name?: string;
    last_name: string;
    district: string;
    village: string;
}

const PAGE_SIZE = 20;

const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return "N/A";
    if (accountNumber.length <= 4) return accountNumber;
    return "X".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};

const getStatusBadgeVariant = (docstatus: number) => {
    switch (docstatus) {
        case 0:
            return "outline"; // Draft/Pending Approval
        case 1:
            return "default"; // Approved/Submitted
        case 2:
            return "destructive"; // Rejected/Cancelled
        default:
            return "secondary";
    }
};

const getStatusBadgeClass = (docstatus: number) => {
    switch (docstatus) {
        case 0:
            return "border-yellow-500 text-yellow-700 dark:text-yellow-400"; // Pending
        case 1:
            return "bg-green-500 text-white"; // Approved
        case 2:
            return ""; // Destructive already has red styling
        default:
            return "";
    }
};

const getStatusLabel = (docstatus: number) => {
    switch (docstatus) {
        case 0:
            return "Pending Approval";
        case 1:
            return "Approved";
        case 2:
            return "Rejected";
        default:
            return "Unknown";
    }
};

export default function AdminRefundsApproval() {
    const [activeTab, setActiveTab] = useState("pending");
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [currentRefund, setCurrentRefund] = useState<Refund | null>(null);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [approvedPage, setApprovedPage] = useState(1);
    const [rejectedPage, setRejectedPage] = useState(1);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

    const { toast } = useToast();
    const { updateDoc, loading: submitting } = useFrappeUpdateDoc();

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100
    });

    // Fetch pending approval refunds (docstatus = 0)
    const pendingFilters: any[] = [
        ["docstatus", "=", 0],
    ];

    const { data: pendingRefunds, isLoading: pendingLoading, mutate: mutatePending } = useFrappeGetDocList<Refund>("Refund", {
        fields: [
            "name",
            "application",
            "component",
            "refund_amount",
            "transanction_id",
            "transanction_date",
            "creation",
            "modified",
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code",
            "docstatus",
            "status",
            "owner"
        ],
        filters: pendingFilters,
        limit_start: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        orderBy: { field: "creation", order: "desc" },
    });

    // Fetch approved refunds (docstatus = 1 and status = Approved)
    const approvedFilters: any[] = [
        ["docstatus", "=", 1],
    ];

    const { data: approvedRefunds, isLoading: approvedLoading } = useFrappeGetDocList<Refund>("Refund", {
        fields: [
            "name",
            "application",
            "component",
            "refund_amount",
            "transanction_id",
            "transanction_date",
            "creation",
            "modified",
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code",
            "docstatus",
            "status",
            "owner"
        ],
        filters: approvedFilters,
        limit_start: (approvedPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        orderBy: { field: "modified", order: "desc" },
    });

    // Fetch rejected refunds (docstatus = 2)
    const rejectedFilters: any[] = [
        ["docstatus", "=", 2],
    ];

    const { data: rejectedRefunds, isLoading: rejectedLoading } = useFrappeGetDocList<Refund>("Refund", {
        fields: [
            "name",
            "application",
            "component",
            "refund_amount",
            "transanction_id",
            "transanction_date",
            "creation",
            "modified",
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code",
            "docstatus",
            "status",
            "owner"
        ],
        filters: rejectedFilters,
        limit_start: (rejectedPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        orderBy: { field: "modified", order: "desc" },
    });

    // Get counts
    const { data: pendingCountData } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name"],
        filters: pendingFilters,
        limit: 0,
    });

    const { data: approvedCountData } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name"],
        filters: approvedFilters,
        limit: 0,
    });

    const { data: rejectedCountData } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name"],
        filters: rejectedFilters,
        limit: 0,
    });

    const pendingCount = pendingCountData?.length || pendingRefunds?.length || 0;
    const approvedCount = approvedCountData?.length || approvedRefunds?.length || 0;
    const rejectedCount = rejectedCountData?.length || rejectedRefunds?.length || 0;

    const pendingTotalPages = Math.ceil(pendingCount / PAGE_SIZE) || 1;
    const approvedTotalPages = Math.ceil(approvedCount / PAGE_SIZE) || 1;
    const rejectedTotalPages = Math.ceil(rejectedCount / PAGE_SIZE) || 1;

    // Calculate totals
    const totalPendingAmount = pendingRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;
    const totalApprovedAmount = approvedRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;
    const totalRejectedAmount = rejectedRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;

    const handleOpenApprovalDialog = (refund: Refund, action: "approve" | "reject") => {
        setCurrentRefund(refund);
        setApprovalAction(action);
        setRejectionReason("");
        setShowApprovalDialog(true);
    };

    const handleApprovalAction = async () => {
        if (!currentRefund || !approvalAction) return;

        if (approvalAction === "reject" && !rejectionReason.trim()) {
            toast({
                title: "Rejection reason required",
                description: "Please provide a reason for rejection",
                variant: "destructive",
            });
            return;
        }

        try {
            if (approvalAction === "approve") {
                // Submit the document (docstatus = 1)
                await updateDoc("Refund", currentRefund.name, {
                    docstatus: 1,
                    status: "Approved",
                });

                toast({
                    title: "Refund Approved",
                    description: `Refund of ₹${currentRefund.refund_amount.toLocaleString("en-IN")} has been approved successfully.`,
                });
            } else {
                // Cancel the document (docstatus = 2)
                await updateDoc("Refund", currentRefund.name, {
                    docstatus: 2,
                    status: "Rejected",
                });

                toast({
                    title: "Refund Rejected",
                    description: `Refund has been rejected.`,
                });
            }

            setShowApprovalDialog(false);
            setCurrentRefund(null);
            setApprovalAction(null);
            setRejectionReason("");

            // Refresh the lists
            mutatePending();
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to process approval action";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const renderRefundTable = (
        refunds: Refund[] | undefined,
        loading: boolean,
        showActions: boolean = false
    ) => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (!refunds || refunds.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">No refunds found</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[120px]">Refund ID</TableHead>
                            <TableHead className="min-w-[120px]">Application ID</TableHead>
                            <TableHead className="min-w-[120px]">Component</TableHead>
                            <TableHead className="min-w-[150px]">Bank Details</TableHead>
                            <TableHead className="text-right min-w-[120px]">Amount</TableHead>
                            <TableHead className="min-w-[140px]">Transaction ID</TableHead>
                            <TableHead className="min-w-[120px]">Transaction Date</TableHead>
                            <TableHead className="min-w-[120px]">Created On</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            {showActions && <TableHead className="min-w-[150px]">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {refunds.map((refund) => (
                            <TableRow key={refund.name}>
                                <TableCell>
                                    <span className="font-mono text-xs">{refund.name}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">{refund.application}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{refund.component}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                        <div className="font-medium">{refund.account_holder_name || "N/A"}</div>
                                        <div className="text-muted-foreground">{refund.bank_name || "N/A"}</div>
                                        <div className="font-mono">{maskAccountNumber(refund.account_number)}</div>
                                        <div className="font-mono">{refund.ifsc_code || "N/A"}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">
                                    ₹{refund.refund_amount.toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-xs">{refund.transanction_id}</span>
                                </TableCell>
                                <TableCell>
                                    {refund.transanction_date ? new Date(refund.transanction_date).toLocaleDateString("en-IN") : "N/A"}
                                </TableCell>
                                <TableCell>
                                    {new Date(refund.creation).toLocaleDateString("en-IN")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(refund.docstatus)} className={getStatusBadgeClass(refund.docstatus)}>
                                        {getStatusLabel(refund.docstatus)}
                                    </Badge>
                                </TableCell>
                                {showActions && (
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleOpenApprovalDialog(refund, "approve")}
                                                className="whitespace-nowrap"
                                            >
                                                <ThumbsUp className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleOpenApprovalDialog(refund, "reject")}
                                                className="whitespace-nowrap"
                                            >
                                                <ThumbsDown className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-display font-bold">
                                    Refund Approval Management
                                </h1>
                                <p className="text-sm text-muted-foreground">Review and approve refund requests</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    {/* Info Banner */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Admin Approval Required</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                All refund requests submitted by accountants require admin approval before being processed. Review bank details and transaction information carefully before approving.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <Clock className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                                        <p className="text-2xl font-bold">₹{totalPendingAmount.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{pendingCount} requests</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold">₹{totalApprovedAmount.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{approvedCount} requests</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-red-500/10">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rejected</p>
                                        <p className="text-2xl font-bold">₹{totalRejectedAmount.toLocaleString("en-IN")}</p>
                                        <p className="text-xs text-muted-foreground">{rejectedCount} requests</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg sm:text-xl">Pending Approvals</CardTitle>
                                    <CardDescription className="text-sm">Review and approve refund requests</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {renderRefundTable(pendingRefunds, pendingLoading, true)}

                                    {/* Pagination */}
                                    {pendingTotalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                                            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                                Page {currentPage} of {pendingTotalPages} • {pendingCount} total records
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                                    <span className="hidden sm:inline">Previous</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(pendingTotalPages, p + 1))}
                                                    disabled={currentPage >= pendingTotalPages}
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="approved">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg sm:text-xl">Approved Refunds</CardTitle>
                                    <CardDescription className="text-sm">History of approved refunds</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {renderRefundTable(approvedRefunds, approvedLoading, false)}

                                    {/* Pagination */}
                                    {approvedTotalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                                            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                                Page {approvedPage} of {approvedTotalPages} • {approvedCount} total records
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setApprovedPage(p => Math.max(1, p - 1))}
                                                    disabled={approvedPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                                    <span className="hidden sm:inline">Previous</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setApprovedPage(p => Math.min(approvedTotalPages, p + 1))}
                                                    disabled={approvedPage >= approvedTotalPages}
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="rejected">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg sm:text-xl">Rejected Refunds</CardTitle>
                                    <CardDescription className="text-sm">History of rejected refunds</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {renderRefundTable(rejectedRefunds, rejectedLoading, false)}

                                    {/* Pagination */}
                                    {rejectedTotalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                                            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                                Page {rejectedPage} of {rejectedTotalPages} • {rejectedCount} total records
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRejectedPage(p => Math.max(1, p - 1))}
                                                    disabled={rejectedPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                                    <span className="hidden sm:inline">Previous</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRejectedPage(p => Math.min(rejectedTotalPages, p + 1))}
                                                    disabled={rejectedPage >= rejectedTotalPages}
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {approvalAction === "approve" ? "Approve Refund" : "Reject Refund"}
                        </DialogTitle>
                        <DialogDescription>
                            {approvalAction === "approve"
                                ? "Please review the refund details before approving."
                                : "Please provide a reason for rejecting this refund request."}
                        </DialogDescription>
                    </DialogHeader>

                    {currentRefund && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Refund ID</span>
                                    <span className="font-mono text-sm">{currentRefund.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Application ID</span>
                                    <span className="font-mono text-sm">{currentRefund.application}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Component</span>
                                    <span className="font-medium">{currentRefund.component}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Refund Amount</span>
                                    <span className="text-lg font-bold text-primary">
                                        ₹{currentRefund.refund_amount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg space-y-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <h4 className="font-medium text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <User className="h-4 w-4" />
                                    Bank Account Details
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-sm">Account Holder</span>
                                        <span className="font-medium text-sm">{currentRefund.account_holder_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-sm">Bank Name</span>
                                        <span className="font-medium text-sm">{currentRefund.bank_name || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-sm">Account Number</span>
                                        <span className="font-mono text-sm">{maskAccountNumber(currentRefund.account_number)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground text-sm">IFSC Code</span>
                                        <span className="font-mono text-sm">{currentRefund.ifsc_code || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg space-y-2 bg-card">
                                <h4 className="font-medium text-sm mb-3">Transaction Details</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction ID</span>
                                    <span className="font-mono">{currentRefund.transanction_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction Date</span>
                                    <span>{currentRefund.transanction_date ? new Date(currentRefund.transanction_date).toLocaleDateString("en-IN") : "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Created By</span>
                                    <span>{currentRefund.owner}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Created On</span>
                                    <span>{new Date(currentRefund.creation).toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {approvalAction === "reject" && (
                                <div className="space-y-2">
                                    <Label htmlFor="rejection-reason">
                                        Rejection Reason <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="rejection-reason"
                                        placeholder="Enter the reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={4}
                                        disabled={submitting}
                                    />
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    {approvalAction === "approve"
                                        ? "Approving this refund will mark it as approved and allow the transfer to proceed."
                                        : "Rejecting this refund will prevent the transfer and notify the accountant."}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowApprovalDialog(false)}
                            disabled={submitting}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprovalAction}
                            disabled={submitting}
                            variant={approvalAction === "approve" ? "default" : "destructive"}
                            className="w-full sm:w-auto"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : approvalAction === "approve" ? (
                                <>
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Approve Refund
                                </>
                            ) : (
                                <>
                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                    Reject Refund
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
