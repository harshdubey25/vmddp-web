"use client";

import {
    RefreshCcw,
    AlertCircle,
    User,
    Download,
    Clock,
    Loader2,
    ArrowLeft,
    XCircle,
    CheckCircle,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFrappeGetDocList } from "frappe-react-sdk";
import * as XLSX from "xlsx";

interface Refund {
    name: string;
    application: string;
    component: string;
    component_allocation: string;
    status: "Paid";
    account_holder_name: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    transanction_id: string;
    transanction_date: string;
    refund_amount: number;
    rejection_reason: string;
}


const pendingFilters: any[] = [
    ["docstatus", "=", 0],
    ["status", "=", "Pending"],
];

const approvedFilters: any[] = [
    ["docstatus", "=", 1],
];

const rejectedFilters: any[] = [
    ["status", "=", "Rejected"],
];

export default function RefundsReport() {
    const { data: refunds, isLoading: loading, error } = useFrappeGetDocList<Refund>("Refund", {
        fields: [
            "name",
            "application",
            "component",
            "component_allocation",
            "status",
            "account_holder_name",
            "bank_name",
            "account_number",
            "ifsc_code",
            "transanction_id",
            "transanction_date",
            "refund_amount",
            "rejection_reason",
        ],
        filters: [["docstatus", "=", 1], ["status", "=", "Paid"]],
        orderBy: { field: "modified", order: "desc" },
        limit: 500,
    });

    const { data: pendingRefunds } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name", "refund_amount"],
        filters: pendingFilters,
        limit: 500,
    });

    const { data: approvedRefunds } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name", "refund_amount"],
        filters: approvedFilters,
        limit: 500,
    });

    const { data: rejectedRefunds } = useFrappeGetDocList<Refund>("Refund", {
        fields: ["name", "refund_amount"],
        filters: rejectedFilters,
        limit: 500,
    });

    const pendingCount = pendingRefunds?.length || 0;
    const approvedCount = approvedRefunds?.length || 0;
    const rejectedCount = rejectedRefunds?.length || 0;

    const totalPendingAmount = pendingRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;
    const totalApprovedAmount = approvedRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;
    const totalRejectedAmount = rejectedRefunds?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Paid": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
        }
    };

    const handleExport = () => {
        if (!refunds || refunds.length === 0) return;

        const exportData = refunds.map((refund) => ({
            "Refund ID": refund.name,
            "Application": refund.application,
            "Component": refund.component,
            "Status": refund.status,
            "Account Holder": refund.account_holder_name,
            "Bank Name": refund.bank_name,
            "Account Number": refund.account_number,
            "IFSC Code": refund.ifsc_code,
            "Transaction ID": refund.transanction_id,
            "Transaction Date": refund.transanction_date,
            "Refund Amount": refund.refund_amount,
            "Rejection Reason": refund.rejection_reason,
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Refunds Report");
        XLSX.writeFile(workbook, `refunds_report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                                Refunds Report
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">Track excess DD refunds via DBT</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        data-testid="button-export"
                        onClick={handleExport}
                        disabled={!refunds || refunds.length === 0}
                        className="w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Info Banner */}
                <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 sm:gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 text-sm sm:text-base">Auto-Calculated Refunds</h4>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                            Refunds are automatically calculated when the actual subsidy is less than the DD amount collected. The
                            difference is refunded to the beneficiary via Direct Benefit Transfer (DBT).
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                                    <p className="text-2xl font-bold text-yellow-600 drop-shadow-sm">₹{totalPendingAmount.toLocaleString("en-IN")}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">{pendingCount} requests</span>
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-green-600 font-medium">+7%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paid</p>
                                    <p className="text-2xl font-bold text-green-600 drop-shadow-sm">₹{totalApprovedAmount.toLocaleString("en-IN")}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">{approvedCount} requests</span>
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-green-600 font-medium">+20%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-2 border-red-500/30 bg-gradient-to-br from-red-500/20 to-red-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <XCircle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Rejected</p>
                                    <p className="text-2xl font-bold text-red-600 drop-shadow-sm">₹{totalRejectedAmount.toLocaleString("en-IN")}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">{rejectedCount} requests</span>
                                        <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                                        <span className="text-red-600 font-medium">-5%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Refunds List */}
                <Card data-testid="card-refunds-list">
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Paid Refunds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-destructive">
                                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                <p className="text-xs sm:text-sm">Failed to load refunds. Please try again.</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full min-w-[900px]">
                                        <thead className="bg-muted border-b sticky top-0 z-10 text-xs sm:text-sm">
                                            <tr>
                                                <th className="text-left p-3 font-medium min-w-28">Refund ID</th>
                                                <th className="text-left p-3 font-medium min-w-28">Application</th>
                                                <th className="text-left p-3 font-medium min-w-24">Component</th>
                                                <th className="text-left p-3 font-medium min-w-32">Account Holder</th>
                                                <th className="text-left p-3 font-medium min-w-24">Bank</th>
                                                <th className="text-left p-3 font-medium min-w-32">Account No.</th>
                                                <th className="text-left p-3 font-medium min-w-24">IFSC</th>
                                                <th className="text-left p-3 font-medium min-w-28">Txn ID</th>
                                                <th className="text-left p-3 font-medium min-w-24">Txn Date</th>
                                                <th className="text-right p-3 font-medium min-w-24">Refund Amount</th>
                                                <th className="text-left p-3 font-medium min-w-20">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {refunds?.map((refund) => (
                                                <tr key={refund.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-refund-${refund.name}`}>
                                                    <td className="p-3 font-mono text-xs">{refund.name}</td>
                                                    <td className="p-3 font-mono text-xs">{refund.application}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-xs">{refund.component}</Badge>
                                                    </td>
                                                    <td className="p-3 text-xs sm:text-sm">{refund.account_holder_name}</td>
                                                    <td className="p-3 text-xs sm:text-sm">{refund.bank_name}</td>
                                                    <td className="p-3 font-mono text-xs">{refund.account_number}</td>
                                                    <td className="p-3 font-mono text-xs">{refund.ifsc_code}</td>
                                                    <td className="p-3 font-mono text-xs">{refund.transanction_id || "—"}</td>
                                                    <td className="p-3 text-xs sm:text-sm">{refund.transanction_date || "—"}</td>
                                                    <td className="p-3 text-right font-bold text-primary text-xs sm:text-sm">
                                                        ₹{(refund.refund_amount || 0).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="p-3">{getStatusBadge(refund.status)}</td>
                                                </tr>
                                            ))}
                                            {(!refunds || refunds.length === 0) && (
                                                <tr>
                                                    <td colSpan={11} className="p-3 text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                        No refund records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}