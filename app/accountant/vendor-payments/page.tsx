"use client"
import {
    CheckCircle,
    Clock,
    Search,
    Building2,
    Filter,
    CreditCard,
    Check,
    Loader2,
    Plus,
    ChevronLeft,
    ChevronRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { PendingVendorPayment, FrappeCustomApiResponse, PaginatedVendorPaymentResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import ParantagePendingPayments from "@/components/ParantagePendingPayments";

export default function VendorPayments() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("vendor");
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedPaymentsByKey, setSelectedPaymentsByKey] = useState<Record<string, PendingVendorPayment>>({})
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText, 500);
    const [currentPage, setCurrentPage] = useState(1);

    // Form state for cheque dialog
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState("");
    const [chequeAmount, setChequeAmount] = useState<number>(0);
    const [bankName, setBankName] = useState("");
    const [showNewBankDialog, setShowNewBankDialog] = useState(false);
    const [newBankName, setNewBankName] = useState("");
    const { createDoc: createbankDoc, loading: creatingBank } = useFrappeCreateDoc<{ bank_name: string }>();


    // Unique row key helper
    const getRowKey = (payment: PendingVendorPayment) =>
        `${payment.component_allocation_id}__${payment.vendor_category || 'default'}`;

    // Build params, omitting falsy values so they are not sent as "undefined"
    const pageSize = 20;
    const apiParams: Record<string, any> = {
        limit_start: (currentPage - 1) * pageSize,
        limit_page_length: pageSize,
    };
    if (selectedVendor) apiParams.vendor_name = selectedVendor;
    if (selectedCategory) apiParams.vendor_category = selectedCategory;
    if (selectedDistrict) apiParams.district = selectedDistrict;
    const trimmedSearch = debouncedSearchText.trim().replace(/\s+/g, " ");
    if (trimmedSearch) apiParams.search_text = trimmedSearch;

    // Fetch pending vendor payments from API
    const { data: paymentsResponse, isLoading: loading, mutate: refetchPayments } = useFrappeGetCall<FrappeCustomApiResponse<PaginatedVendorPaymentResponse>>(
        "vmddp_app.api.v1.accountant.pending_vendor_payment_list",
        apiParams,
        undefined,
        { revalidateOnFocus: false }
    );

    const vendorPayments = paymentsResponse?.message?.data || [];
    const pagination = paymentsResponse?.message?.pagination;

    // Fetch vendors for filter dropdown
    const { data: vendors } = useFrappeGetDocList<{ name: string; vendor_name: string }>("Vendor", {
        fields: ["name", "vendor_name"],
        limit: 100
    });
    const { data: BankList, mutate: refetchBanks } = useFrappeGetDocList("Bank")
    const { data: vendorCategories } = useFrappeGetDocList<{ name: string }>("Vendor Categories", {
        fields: ["name"],
        limit: 100
    });
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100
    });
    // Create doc hook for Vendor Payments
    const { createDoc, loading: submitting } = useFrappeCreateDoc();

    // Computed values from API data
    const totalPending = vendorPayments.reduce((sum, p) => sum + p.amount_to_pay, 0);
    const selectedPayments = selectedRowKeys
        .map((rowKey) => selectedPaymentsByKey[rowKey])
        .filter((payment): payment is PendingVendorPayment => Boolean(payment));

    // Compute selected total and vendor name from selected payments
    const selectedTotal = selectedPayments
        .reduce((sum, p) => sum + p.amount_to_pay, 0);

    // Get vendor ID (link name) from selected payments
    const selectedVendorId = selectedRowKeys.length > 0
        ? selectedPayments[0]?.selected_vendor || ""
        : "";

    const selectedVendorName = selectedRowKeys.length > 0
        ? selectedPayments[0]?.vendor_name || "-"
        : "-";

    // Get the vendor_name of the first selected payment (used to restrict selection to same vendor)
    const firstSelectedVendorId = selectedRowKeys.length > 0
        ? selectedPayments[0]?.selected_vendor
        : null;

    const resetSelection = () => {
        setSelectedRowKeys([]);
        setSelectedPaymentsByKey({});
    };

    const handleTogglePayment = (payment: PendingVendorPayment, checked: boolean) => {
        const rowKey = getRowKey(payment);

        if (checked) {
            setSelectedRowKeys((prev) => (prev.includes(rowKey) ? prev : [...prev, rowKey]));
            setSelectedPaymentsByKey((prev) => ({
                ...prev,
                [rowKey]: payment,
            }));
        } else {
            setSelectedRowKeys((prev) => prev.filter((id) => id !== rowKey));
            setSelectedPaymentsByKey((prev) => {
                const next = { ...prev };
                delete next[rowKey];
                return next;
            });
        }
    };

    const canSelectPayment = (payment: PendingVendorPayment) => {
        if (selectedRowKeys.length === 0) return true;
        return payment.selected_vendor === firstSelectedVendorId;
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
        if (!selectedVendorId) {
            toast({ title: "Error", description: "Vendor is required", variant: "destructive" });
            return;
        }

        try {
            const selectedPayments = vendorPayments.filter((p) => selectedRowKeys.includes(getRowKey(p)));
            await createDoc("Vendor Payments", {
                vendor: selectedVendorId,
                check_number: chequeNumber,
                cheque_date: chequeDate,
                cheque_amount: chequeAmount,
                bank_name: bankName,
                component_allocations: selectedPayments.map((p) => ({
                    component_allocation: p.component_allocation_id,
                    vendor_category: p.vendor_category,
                    amount: p.amount_to_pay
                }))
            });

            toast({ title: "Success", description: "Vendor payment created successfully" });
            setOpenPaymentDialog(false);
            resetForm();
            resetSelection();
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full max-w-xl grid-cols-2">
                            <TabsTrigger value="vendor" data-testid="tab-vendor-payments">Vendor Payments</TabsTrigger>
                            <TabsTrigger value="parantage" data-testid="tab-parantage-payments">Parantage Confirmation</TabsTrigger>
                        </TabsList>

                        <TabsContent value="vendor" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card
                                    data-testid="card-pending-total"
                                    className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm"
                                >
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />

                                    <CardContent className="pt-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                                <Clock className="h-5 w-5 text-yellow-600" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-yellow-700/80 dark:text-yellow-300">
                                                    Pending Payments
                                                </p>

                                                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 drop-shadow-sm">
                                                    ₹{(totalPending / 100000).toFixed(2)}L
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {pagination?.total_items ?? vendorPayments.length} records
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card
                                    data-testid="card-beneficiaries-count"
                                    className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm"
                                >
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />

                                    <CardContent className="pt-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                <Building2 className="h-5 w-5 text-blue-600" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300">
                                                    Beneficiaries
                                                </p>

                                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 drop-shadow-sm">
                                                    {vendorPayments.length}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    with pending payments
                                                </p>
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
                                                value={searchText}
                                                onChange={(e) => {
                                                    setSearchText(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </div>
                                        <Select
                                            value={selectedVendor || "all"}
                                            onValueChange={(value) => {
                                                setSelectedVendor(value === "all" ? null : value);
                                                resetSelection();
                                                setCurrentPage(1);
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
                                        <Select
                                            value={selectedCategory || "all"}
                                            onValueChange={(value) => {
                                                setSelectedCategory(value === "all" ? null : value);
                                                resetSelection();
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-44" data-testid="select-category">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {vendorCategories?.map((c) => (
                                                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={selectedDistrict || "all"}
                                            onValueChange={(value) => {
                                                setSelectedDistrict(value === "all" ? null : value);
                                                resetSelection();
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-44" data-testid="select-district">
                                                <SelectValue placeholder="District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Districts</SelectItem>
                                                {districts?.map((d) => (
                                                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedRowKeys.length > 0 && (
                                <Card className="border-primary" data-testid="card-selection-summary">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <CreditCard className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{selectedRowKeys.length} payment(s) selected</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Vendor: {selectedVendorName} | Total: ₹{selectedTotal.toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" data-testid="button-clear-selection" onClick={resetSelection}>
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
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full caption-bottom text-sm">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="h-12 px-4 text-left align-middle font-medium w-12">
                                                                    <Check data-testid="checkbox-select-all" />
                                                                </th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[140px]">Beneficiary</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[100px]">Component</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[100px]">Animal</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[100px]">District</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[100px]">Vendor</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[80px]">Category</th>
                                                                <th className="h-12 px-4 text-right align-middle font-medium min-w-[100px] whitespace-nowrap">Amount to Pay</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium min-w-[80px] whitespace-nowrap">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="[&_tr:last-child]:border-0">
                                                            {vendorPayments.map((payment) => {
                                                                const rowKey = getRowKey(payment);
                                                                const isSelected = selectedRowKeys.includes(rowKey);

                                                                const categoryColors: Record<string, string> = {
                                                                    Animal: "bg-blue-500/10 text-blue-700 border-blue-500/20",
                                                                    Collar: "bg-purple-500/10 text-purple-700 border-purple-500/20",
                                                                    Insurance: "bg-amber-500/10 text-amber-700 border-amber-500/20",
                                                                    Transportation: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                                                                };

                                                                return (
                                                                    <tr
                                                                        key={rowKey}
                                                                        className={`border-b transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`}
                                                                        data-testid={`row-payment-${rowKey}`}
                                                                    >
                                                                        <td className="p-4 align-middle">
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                disabled={!isSelected && !canSelectPayment(payment)}
                                                                                onCheckedChange={(checked) => handleTogglePayment(payment, !!checked)}
                                                                                data-testid={`checkbox-${rowKey}`}
                                                                            />
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <div>
                                                                                <p className="font-medium">{payment.beneficiary_name}</p>
                                                                                <p className="text-xs text-muted-foreground">{payment.aadhar_number}</p>
                                                                                <p className="text-xs text-muted-foreground">{payment.taluka}</p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-medium">{payment.component_name}</p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <div>
                                                                                <p className="font-medium">{payment.type_of_animal}</p>
                                                                                <p className="text-xs text-muted-foreground">Tag: {payment.tag_number}</p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <p className="text-sm">{payment.district}</p>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <div>
                                                                                <p className="font-medium">{payment.vendor_name}</p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <Badge variant="outline" className={categoryColors[payment.vendor_category] || ""}>
                                                                                {payment.vendor_category}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-4 align-middle text-right">
                                                                            <span className="font-bold text-green-600">
                                                                                ₹{payment.amount_to_pay.toLocaleString("en-IN")}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-4 align-middle">
                                                                            <p className="text-sm">{payment.date_of_purchase}</p>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {pagination && pagination.total_pages > 1 && (
                                                <div className="flex items-center justify-between pt-4 border-t">
                                                    <p className="text-sm text-muted-foreground">
                                                        Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total)
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!pagination.has_previous_page}
                                                            onClick={() => setCurrentPage((p) => p - 1)}
                                                            data-testid="button-prev-page"
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!pagination.has_next_page}
                                                            onClick={() => setCurrentPage((p) => p + 1)}
                                                            data-testid="button-next-page"
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">No pending vendor payments found</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="parantage">
                            <ParantagePendingPayments />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Cheque Dialog */}
            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Issue Cheque</DialogTitle>
                        <DialogDescription>
                            Enter cheque details for {selectedRowKeys.length} payment(s) to {selectedVendorName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span>Selected Payments:</span>
                                <span className="font-medium">{selectedRowKeys.length}</span>
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
                            <Select value={bankName}
                                onValueChange={(value) => {
                                    if (value === "__add_new__") {
                                        setShowNewBankDialog(true);
                                        return;
                                    }
                                    setBankName(value);
                                }}
                            >
                                <SelectTrigger data-testid="select-bank-name">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent >
                                    {BankList?.map((bank: { name: string }) => {

                                        return (
                                            <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>)
                                    })}
                                    <SelectItem value="__add_new__">
                                        <span className="flex items-center gap-1 text-primary">
                                            <Plus className="h-3 w-3" /> Add New Bank
                                        </span>
                                    </SelectItem>
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

            <Dialog
                open={showNewBankDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowNewBankDialog(false);
                        setNewBankName("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Bank</DialogTitle>
                        <DialogDescription>
                            Enter the name of the new bank to add it to the list.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <Label>Bank Name *</Label>
                        <Input
                            placeholder="e.g. State Bank of India"
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowNewBankDialog(false);
                                setNewBankName("");
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={!newBankName.trim() || submitting}
                            onClick={async () => {
                                try {
                                    const created = await createDoc("Bank", {
                                        bank_name: newBankName.trim(),
                                    });

                                    await refetchBanks?.();

                                    setBankName(created.name);

                                    toast({
                                        title: "Bank added",
                                        description: newBankName.trim(),
                                    });

                                    setShowNewBankDialog(false);
                                    setNewBankName("");

                                } catch (err: any) {
                                    toast({
                                        title: "Error",
                                        description: err?.message || "Failed to create bank",
                                        variant: "destructive",
                                    });
                                }
                            }}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}

                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}