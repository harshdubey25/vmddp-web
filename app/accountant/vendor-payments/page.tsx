"use client"
import Link from "next/link";
import {
    CheckCircle,
    Clock,
    Search,
    Building2,
    Filter,
    CreditCard,
    Check,
    Loader2,
    CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { PendingVendorPayment, FrappeCustomApiResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Helper for status badge
const getStatusBadge = (status: string) => {
    if (status === "pending") {
        return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <Clock className="h-3 w-3 mr-1" />
                Pending
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disbursed
        </Badge>
    );
};

export default function VendorPayments() {
    const { toast } = useToast();
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
    const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([])
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

    // Form state for cheque dialog
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState("");
    const [chequeAmount, setChequeAmount] = useState<number>(0);
    const [bankName, setBankName] = useState("");

    // Fetch pending vendor payments from API
    const { data: paymentsResponse, isLoading: loading, mutate: refetchPayments } = useFrappeGetCall<FrappeCustomApiResponse<PendingVendorPayment[]>>(
        "vmddp_app.api.v1.accountant.pending_vendor_payment_list",
        {
            limit_page_length: 100,
            vendor_name: selectedVendor || undefined
        },
        undefined,
        { revalidateOnFocus: false }
    );

    const vendorPayments = paymentsResponse?.message || [];

    // Fetch vendors for filter dropdown
    const { data: vendors } = useFrappeGetDocList<{ name: string; vendor_name: string }>("Vendor", {
        fields: ["name", "vendor_name"],
        limit: 100
    });
    const { data: BankList } = useFrappeGetDocList("Bank")
    // Create doc hook for Vendor Payments
    const { createDoc, loading: submitting } = useFrappeCreateDoc();

    // Computed values from API data
    const totalPending = vendorPayments.reduce((sum, p) => sum + p.total_cost, 0);

    // Compute selected total and vendor name from selected payments
    const selectedTotal = vendorPayments
        .filter((p) => selectedPaymentIds.includes(p.component_allocation_id))
        .reduce((sum, p) => sum + p.total_cost, 0);

    // Get vendor ID (link name) from selected payments
    const selectedVendorId = selectedPaymentIds.length > 0
        ? vendorPayments.find((p) => p.component_allocation_id === selectedPaymentIds[0])?.vendor || ""
        : "";

    const selectedVendorName = selectedPaymentIds.length > 0
        ? vendorPayments.find((p) => p.component_allocation_id === selectedPaymentIds[0])?.vendor_name || "-"
        : "-";

    // Get the vendor of the first selected payment (used to restrict selection to same vendor)
    const firstSelectedVendor = selectedPaymentIds.length > 0
        ? vendorPayments.find((p) => p.component_allocation_id === selectedPaymentIds[0])?.vendor
        : null;

    const handleTogglePayment = (paymentId: string, checked: boolean) => {
        if (checked) {
            setSelectedPaymentIds((prev) => [...prev, paymentId]);
        } else {
            setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
        }
    };

    const canSelectPayment = (payment: PendingVendorPayment) => {
        if (selectedPaymentIds.length === 0) return true;
        return payment.vendor === firstSelectedVendor;
    };

    // Reset form state
    const resetForm = () => {
        setChequeNumber("");
        setChequeDate("");
        setChequeAmount(0);
        setBankName("");
    };

    // Open dialog and set default cheque amount
    const handleOpenDialog = () => {
        setChequeAmount(selectedTotal);
        setOpenPaymentDialog(true);
    };

    // Submit cheque payment
    const handleSubmitCheque = async () => {
        // Validation
        if (!chequeNumber) {
            toast({ title: "Error", description: "Please enter cheque number", variant: "destructive" });
            return;
        }
        if (!chequeDate) {
            toast({ title: "Error", description: "Please enter cheque date", variant: "destructive" });
            return;
        }
        if (!chequeAmount || chequeAmount <= 0) {
            toast({ title: "Error", description: "Please enter valid cheque amount", variant: "destructive" });
            return;
        }
        if (!bankName) {
            toast({ title: "Error", description: "Please select a bank", variant: "destructive" });
            return;
        }

        try {
            await createDoc("Vendor Payments", {
                vendor: selectedVendorId,
                check_number: chequeNumber,
                cheque_date: chequeDate,
                cheque_amount: chequeAmount,
                bank_name: bankName,
                component_allocations: selectedPaymentIds.map((id) => ({
                    component_allocation: id,
                    amount: vendorPayments.find((p) => p.component_allocation_id === id)?.total_cost || 0
                }))
            });

            toast({ title: "Success", description: "Vendor payment created successfully" });
            setOpenPaymentDialog(false);
            resetForm();
            setSelectedPaymentIds([]);
            refetchPayments();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to create vendor payment",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="h-screen bg-background w-full">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    Vendor Payments
                                </h1>
                                <p className="text-muted-foreground">Process Animal Induction & HGM vendor payments via cheque</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card data-testid="card-pending-total">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Payments</p>
                                        <p className="text-2xl font-bold">₹{(totalPending / 100000).toFixed(2)}L</p>
                                        <p className="text-xs text-muted-foreground">{vendorPayments.length} records</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-beneficiaries-count">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Beneficiaries</p>
                                        <p className="text-2xl font-bold">{vendorPayments.length}</p>
                                        <p className="text-xs text-muted-foreground">with pending payments</p>
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
                                        placeholder="Search beneficiary, vendor..."
                                        className="pl-9"
                                        data-testid="input-search"
                                    />
                                </div>
                                <Select
                                    value={selectedVendor || "all"}
                                    onValueChange={(value) => {
                                        setSelectedVendor(value === "all" ? null : value);
                                        setSelectedPaymentIds([]); // Clear selection when vendor changes
                                    }}
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selection Summary Card - visible when payments are selected */}
                    {selectedPaymentIds.length > 0 && (
                        <Card className="border-primary" data-testid="card-selection-summary">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{selectedPaymentIds.length} payment(s) selected</p>
                                            <p className="text-sm text-muted-foreground">
                                                Vendor: {selectedVendorName} | Total: ₹{selectedTotal.toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" data-testid="button-clear-selection" onClick={() => setSelectedPaymentIds([])}>
                                            Clear Selection
                                        </Button>
                                        <Button data-testid="button-issue-cheque" onClick={handleOpenDialog}>
                                            <Check className="h-4 w-4 mr-2" />
                                            Issue Cheque
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card data-testid="card-payments-table">
                        <CardHeader>
                            <CardTitle>Pending Vendor Payments</CardTitle>
                            <CardDescription>
                                Select multiple payments for the same vendor to issue a single cheque
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
                                            <TableHead className="w-12">
                                                <Check data-testid="checkbox-select-all" />
                                            </TableHead>
                                            <TableHead>Beneficiary</TableHead>
                                            <TableHead>Component</TableHead>
                                            <TableHead>Animal</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead className="text-right">Cost Breakdown</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vendorPayments.map((payment) => {
                                            const isSelected = selectedPaymentIds.includes(payment.component_allocation_id);

                                            return (
                                                <TableRow
                                                    key={payment.component_allocation_id}
                                                    className={isSelected ? "bg-primary/5" : ""}
                                                    data-testid={`row-payment-${payment.component_allocation_id}`}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            disabled={!isSelected && !canSelectPayment(payment)}
                                                            onCheckedChange={(checked) => handleTogglePayment(payment.component_allocation_id, !!checked)}
                                                            data-testid={`checkbox-${payment.component_allocation_id}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{payment.beneficiary_name}</p>
                                                            <p className="text-xs text-muted-foreground">{payment.aadhar_number}</p>
                                                            <p className="text-xs text-muted-foreground">{payment.district}, {payment.taluka}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">{payment.component_name}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{payment.type_of_animal}</p>
                                                            <p className="text-xs text-muted-foreground">Tag: {payment.tag_number}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{payment.vendor_name}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-xs space-y-0.5">
                                                            <p>Animal: ₹{payment.animal_cost.toLocaleString("en-IN")}</p>
                                                            {payment.collar_cost > 0 && <p>Collar: ₹{payment.collar_cost.toLocaleString("en-IN")}</p>}
                                                            {payment.premium_paid > 0 && <p>Premium: ₹{payment.premium_paid.toLocaleString("en-IN")}</p>}
                                                            {payment.transportation_cost > 0 && <p>Transport: ₹{payment.transportation_cost.toLocaleString("en-IN")}</p>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-green-600">
                                                            ₹{payment.total_cost.toLocaleString("en-IN")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm">{payment.date_of_purchase}</p>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No pending vendor payments found</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Cheque Dialog */}
            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Issue Cheque</DialogTitle>
                        <DialogDescription>
                            Enter cheque details for {selectedPaymentIds.length} payment(s) to {selectedVendorName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span>Selected Payments:</span>
                                <span className="font-medium">{selectedPaymentIds.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Vendor:</span>
                                <span className="font-medium">{selectedVendorName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Total Amount:</span>
                                <span className="font-bold text-green-600">₹{selectedTotal.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chequeNumber">Cheque Number *</Label>
                            <Input
                                id="chequeNumber"
                                placeholder="Enter cheque number"
                                value={chequeNumber}
                                onChange={(e) => setChequeNumber(e.target.value)}
                                data-testid="input-cheque-number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chequeDate">Cheque Date *</Label>
                            <Input
                                id="chequeDate"
                                type="date"
                                value={chequeDate}
                                onChange={(e) => setChequeDate(e.target.value)}
                                data-testid="input-cheque-date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chequeAmount">Cheque Amount *</Label>
                            <Input
                                id="chequeAmount"
                                type="text"
                                value={`₹${chequeAmount.toLocaleString("en-IN")}`}
                                placeholder="Enter cheque amount"
                                data-testid="input-cheque-amount"
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Amount is auto-calculated from selected payments</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name *</Label>
                            <Select value={bankName} onValueChange={setBankName}>
                                <SelectTrigger data-testid="select-bank-name">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent >
                                    {BankList?.map((bank: { name: string }) => {

                                        return (
                                            <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>)
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" data-testid="button-cancel-cheque" onClick={() => setOpenPaymentDialog(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button data-testid="button-confirm-cheque" onClick={handleSubmitCheque} disabled={submitting}>
                            {submitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            {submitting ? "Processing..." : "Disburse Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
