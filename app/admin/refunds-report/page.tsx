"use client";

import { useState } from "react";
import {
    RefreshCcw,
    AlertCircle,
    User,
    Download,
    Clock,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import * as XLSX from "xlsx";

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
    animal_cost: number;
    collar_cost: number;
    premium_paid: number;
    transportation_cost: number;
    refund_amount: number;
    eligible_subsidy: number;
}

interface PendingRefundResponse {
    refunds: PendingRefund[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
}

const getFullName = (refund: PendingRefund) => {
    return [refund.first_name, refund.mid_name, refund.last_name].filter(Boolean).join(" ");
};

export default function RefundsReport() {
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", { fields: ["name"], limit: 100 });

    const { data: refundsResponse, isLoading: loading, error } = useFrappeGetCall<{ message: PendingRefundResponse }>(
        "vmddp_app.api.v1.accountant.pending_refund_list",
        {
            page: 1,
            page_size: 500,
            district: selectedDistrict || undefined,
        },
        `pending_refund_list_${selectedDistrict || 'all'}`
    );

    const pendingRefunds = refundsResponse?.message?.refunds || [];
    const totalCount = refundsResponse?.message?.total_count || 0;

    const totalPending = pendingRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

    const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value === "all" ? null : value);
    };

    const handleExport = () => {
        if (!pendingRefunds || pendingRefunds.length === 0) return;

        const exportData = pendingRefunds.map((refund) => ({
            "Application ID": refund.application_id,
            "Beneficiary": getFullName(refund),
            "District": refund.district,
            "Village": refund.village,
            "Component": refund.component,
            "DD Amount": refund.dd_amount,
            "Eligible Subsidy": refund.eligible_subsidy,
            "Refund Amount": refund.refund_amount,
            "Animal Cost": refund.animal_cost,
            "Collar Cost": refund.collar_cost,
            "Premium Paid": refund.premium_paid,
            "Transportation Cost": refund.transportation_cost,
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
                        disabled={!pendingRefunds || pendingRefunds.length === 0}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card data-testid="card-pending-refunds">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10 flex-shrink-0">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Pending Refunds</p>
                                    <p className="text-lg sm:text-2xl font-bold">₹{totalPending.toLocaleString("en-IN")}</p>
                                    <p className="text-xs text-muted-foreground">{totalCount} beneficiaries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-total-cases">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Cases</p>
                                    <p className="text-lg sm:text-2xl font-bold">{totalCount}</p>
                                    <p className="text-xs text-muted-foreground">All refund cases</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-average-refund">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10 flex-shrink-0">
                                    <RefreshCcw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Avg Refund</p>
                                    <p className="text-lg sm:text-2xl font-bold">₹{totalCount > 0 ? Math.round(totalPending / totalCount).toLocaleString("en-IN") : 0}</p>
                                    <p className="text-xs text-muted-foreground">Per beneficiary</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <Card data-testid="card-filter">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <Label className="text-xs sm:text-sm">Filter by District:</Label>
                            <Select value={selectedDistrict || "all"} onValueChange={handleDistrictChange}>
                                <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm" data-testid="select-filter-district">
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

                {/* Refunds List */}
                <Card data-testid="card-refunds-list">
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Pending Refunds</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">All pending refund cases and amounts</CardDescription>
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
                            <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <Table className="text-xs sm:text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-20 sm:min-w-28">Application ID</TableHead>
                                            <TableHead className="min-w-24 sm:min-w-32">Beneficiary</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-24">District</TableHead>
                                            <TableHead className="min-w-20 sm:min-w-24">Village</TableHead>
                                            <TableHead className="min-w-24 sm:min-w-28">Component</TableHead>
                                            <TableHead className="text-right min-w-20 sm:min-w-24">DD Amount</TableHead>
                                            <TableHead className="text-right min-w-24 sm:min-w-28">Eligible Subsidy</TableHead>
                                            <TableHead className="text-right min-w-20 sm:min-w-24">Refund Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRefunds.map((refund) => (
                                            <TableRow key={refund.application_id} data-testid={`row-refund-${refund.application_id}`}>
                                                <TableCell>
                                                    <span className="font-mono text-xs sm:text-xs">{refund.application_id}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium text-xs sm:text-sm">{getFullName(refund)}</p>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">{refund.district}</TableCell>
                                                <TableCell className="text-xs sm:text-sm">{refund.village}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs sm:text-xs">{refund.component}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs sm:text-sm">₹{refund.dd_amount.toLocaleString("en-IN")}</TableCell>
                                                <TableCell className="text-right text-green-600 text-xs sm:text-sm">₹{refund.eligible_subsidy.toLocaleString("en-IN")}</TableCell>
                                                <TableCell className="text-right font-bold text-primary text-xs sm:text-sm">
                                                    ₹{refund.refund_amount.toLocaleString("en-IN")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {pendingRefunds.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                    No pending refunds
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}