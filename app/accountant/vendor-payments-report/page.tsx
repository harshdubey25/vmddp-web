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
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";


interface VendorPaymentReport {
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
    }>;
    total_allocations: number;
}

export default function VendorPaymentsReport() {
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: paymentsResponse, isLoading: loading, error } = useFrappeGetCall<FrappeCustomApiResponse<VendorPaymentReport[]>>(
        "vmddp_app.api.v1.accountant.completed_vendor_payment_list",
        {
            limit_page_length: 1000,
            vendor_name: selectedVendor || undefined,
            search_text: searchText || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined
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

    const filteredPayments = vendorPayments.filter((payment) => {
        if (startDate && payment.cheque_date < startDate) return false;
        if (endDate && payment.cheque_date > endDate) return false;
        return true;
    });

    const handleExport = () => {
        if (filteredPayments.length === 0) return;

        const exportData = filteredPayments.map((payment) => ({
            "Payment ID": payment.name,
            "Vendor Name": payment.vendor_name || payment.vendor,
            "Cheque Number": payment.check_number,
            "Cheque Date": payment.cheque_date,
            "Bank Name": payment.bank_name,
            "Cheque Amount": payment.cheque_amount,
            "Component Allocations": payment.component_allocations?.map(a => a.component_allocation).join(", ") || "None",
            "Allocation Count": payment.component_allocations?.length || 0,
            "Created On": new Date(payment.creation).toLocaleDateString("en-IN")
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Payments");

        XLSX.writeFile(workbook, `vendor_payments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    Vendor Payments Report
                                </h1>
                                <p className="text-muted-foreground">View all disbursed vendor payments and issued cheques</p>
                            </div>
                        </div>
                        <Button variant="outline" data-testid="button-export" onClick={handleExport} disabled={filteredPayments.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export to Excel
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <p className="text-sm text-muted-foreground">Unique Vendors</p>
                                        <p className="text-2xl font-bold">{new Set(vendorPayments.map(p => p.vendor)).size}</p>
                                        <p className="text-xs text-muted-foreground">Paid vendors</p>
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
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="w-56 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search cheque, vendor"
                                        className="pl-9"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        data-testid="input-search"
                                    />
                                </div>
                                <Select
                                    value={selectedVendor || "all"}
                                    onValueChange={(value) => setSelectedVendor(value === "all" ? null : value)}
                                >
                                    <SelectTrigger className="w-44" data-testid="select-vendor">
                                        <SelectValue placeholder="Vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Vendors</SelectItem>
                                        {vendors?.map((v) => (
                                            <SelectItem key={v.name} value={v.name}>{v.vendor_name || v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 items-center">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Start Date"
                                        className="w-40"
                                        data-testid="input-start-date"
                                    />
                                    <span className="text-muted-foreground">to</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        placeholder="End Date"
                                        className="w-40"
                                        data-testid="input-end-date"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-payments-table">
                        <CardHeader>
                            <CardTitle>Disbursed Payments</CardTitle>
                            <CardDescription>
                                All vendor payments that have been processed via cheque
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredPayments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Payment ID</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Cheque Details</TableHead>
                                            <TableHead>Bank</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.map((payment) => (
                                            <TableRow key={payment.name} data-testid={`row-payment-${payment.name}`}>
                                                <TableCell>
                                                    <p className="font-medium font-mono text-sm">{payment.name}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{payment.vendor_name || payment.vendor}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{payment.check_number}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.cheque_date}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{payment.bank_name}</p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-green-600">
                                                        ₹{payment.cheque_amount.toLocaleString("en-IN")}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{new Date(payment.creation).toLocaleDateString("en-IN")}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Disbursed
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No disbursed payments found</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
