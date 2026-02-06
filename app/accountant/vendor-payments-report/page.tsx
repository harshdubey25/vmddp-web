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
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        application: string;
        component: string;
        type_of_animal: string;
        animal_cost: number;
        tag_number: string;
    }>;
    total_allocations: number;
    for_parantage: boolean;
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

export default function VendorPaymentsReport() {
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<VendorPaymentReport | null>(null);

    const { data: paymentsResponse, isLoading: loading, error } = useFrappeGetCall<FrappeCustomApiResponse<VendorPaymentReport[]>>(
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



    const handleExport = () => {
        if (vendorPayments.length === 0) return;

        const exportData = vendorPayments.map((payment) => ({
            "Payment ID": payment.name,
            "Vendor Name": payment.vendor_name || payment.vendor,
            "Cheque Number": payment.check_number,
            "Cheque Date": payment.cheque_date,
            "Bank Name": payment.bank_name,
            "Cheque Amount": payment.cheque_amount,
            "Component Allocations": payment.component_allocations?.map(a => a.component_allocation).join(", ") || "None",
            "Allocation Count": payment.component_allocations?.length || 0,
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
                        <Button variant="outline" data-testid="button-export" onClick={handleExport} disabled={vendorPayments.length === 0}>
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
                                        <p className="text-sm text-muted-foreground"> Vendors</p>
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
                            ) : vendorPayments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Payment ID</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead>Cheque Number</TableHead>
                                            <TableHead>Cheque Date</TableHead>
                                            <TableHead>Bank</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendorPayments.map((payment) => (
                                            <TableRow key={payment.name} data-testid={`row-payment-${payment.name}`}>
                                                <TableCell>
                                                    <p className="font-medium font-mono text-sm">{payment.name}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{payment.vendor_name || payment.vendor}</p>
                                                        {payment.for_parantage ? (
                                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                                Parantage
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{payment.check_number}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{new Date(payment.cheque_date).toLocaleDateString("en-GB")}</p>
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

            <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                        <DialogDescription>Complete information about the vendor payment</DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment ID</p>
                                    <p className="font-medium font-mono">{selectedPayment.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendor</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{selectedPayment.vendor_name || selectedPayment.vendor}</p>
                                        {selectedPayment.for_parantage && (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                Parantage
                                            </Badge>
                                        )}
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
                                                        <div className="grid grid-cols-2 gap-3">
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
                                                        <div className="grid grid-cols-2 gap-3">
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
                                                                <p className="font-medium">₹{allocation.animal_cost.toLocaleString("en-IN")}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Allocated Amount</p>
                                                                <p className="font-semibold text-green-600">₹uni{allocation.amount.toLocaleString("en-IN")}</p>
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
