"use client";

import { useMemo, useState } from "react";
import { useFrappeCreateDoc, useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import {
    Building2,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    ExternalLink,
    FileCheck2,
    Loader2,
    Plus,
    Search,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { FrappeCustomApiResponse, PaginationData, ParantageConfirmationEntry } from "@/types";

const pageSize = 20;

type PaginatedParantagePaymentResponse = {
    data: ParantageConfirmationEntry[];
    pagination: PaginationData;
};

export default function ParantagePendingPayments() {
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState("");
    const [chequeAmount, setChequeAmount] = useState<number>(0);
    const [bankName, setBankName] = useState("");
    const [showNewBankDialog, setShowNewBankDialog] = useState(false);
    const [newBankName, setNewBankName] = useState("");
    const debouncedSearchText = useDebounce(searchText, 500);

    const { createDoc, loading: submitting } = useFrappeCreateDoc();
    const { data: bankList, mutate: refetchBanks } = useFrappeGetDocList<{ name: string }>("Bank");

    const apiParams: Record<string, string | number> = {
        limit_start: (currentPage - 1) * pageSize,
        limit_page_length: pageSize,
    };

    const trimmedSearch = debouncedSearchText.trim().replace(/\s+/g, " ");
    if (trimmedSearch) {
        apiParams.search_text = trimmedSearch;
    }

    const { data, isLoading, mutate } = useFrappeGetCall<FrappeCustomApiResponse<PaginatedParantagePaymentResponse>>(
        "vmddp_app.api.v1.accountant.pending_parantage_vendor_payment_list",
        apiParams,
        undefined,
        { revalidateOnFocus: false }
    );

    const apiEntries = data?.message?.data || [];
    const pagination = data?.message?.pagination;

    const entries = useMemo(() => {
        return apiEntries.filter((entry) => (entry.pending_amount || 0) > 0);
    }, [apiEntries]);

    const getRowKey = (entry: ParantageConfirmationEntry) =>
        entry.parantage_confirmation_id || entry.component_allocation_id;

    const totalPendingAmount = entries.reduce((sum, entry) => sum + (entry.pending_amount || 0), 0);
    const hasPreviousPage = pagination?.has_previous_page ?? currentPage > 1;
    const hasNextPage = pagination?.has_next_page ?? false;

    const selectedEntries = entries.filter((entry) => selectedRowKeys.includes(getRowKey(entry)));
    const selectedTotal = selectedEntries.reduce((sum, entry) => sum + (entry.pending_amount || 0), 0);
    const firstSelectedVendor = selectedEntries[0]?.vendor || null;
    const selectedVendorId = selectedEntries[0]?.vendor || "";
    const selectedVendorName = selectedEntries[0]?.vendor_name || selectedEntries[0]?.vendor || "-";

    const resetForm = () => {
        setChequeNumber("");
        setChequeDate("");
        setChequeAmount(0);
        setBankName("");
    };

    const resetSelection = () => {
        setSelectedRowKeys([]);
        resetForm();
    };

    const canSelectPayment = (entry: ParantageConfirmationEntry) => {
        if (!firstSelectedVendor) return true;
        return entry.vendor === firstSelectedVendor;
    };

    const handleTogglePayment = (rowKey: string, checked: boolean) => {
        if (checked) {
            setSelectedRowKeys((prev) => [...prev, rowKey]);
            return;
        }

        setSelectedRowKeys((prev) => prev.filter((id) => id !== rowKey));
    };

    const handleOpenDialog = () => {
        setChequeAmount(selectedTotal);
        setOpenPaymentDialog(true);
    };

    const handleSubmitCheque = async () => {
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
        if (selectedEntries.some((entry) => !entry.parantage_confirmation_id)) {
            toast({
                title: "Error",
                description: "One or more selected rows are missing a parantage confirmation ID",
                variant: "destructive",
            });
            return;
        }

        try {
            await createDoc("Vendor Payments", {
                vendor: selectedVendorId,
                check_number: chequeNumber,
                cheque_date: chequeDate,
                cheque_amount: chequeAmount,
                bank_name: bankName,
                for_parantage: 1,
                parantage_confirmation: selectedEntries.map((entry) => ({
                    parantage_confirmation: entry.parantage_confirmation_id,
                    amount: entry.pending_amount,
                })),
            });

            toast({ title: "Success", description: "Parantage vendor payment created successfully" });
            setOpenPaymentDialog(false);
            resetSelection();
            setCurrentPage(1);
            mutate();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to create parantage vendor payment",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="relative overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                                <FileCheck2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300">Approved Parantage Pending Payments</p>
                                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    ₹{(totalPendingAmount / 100000).toFixed(2)}L
                                </p>
                                <p className="text-xs text-muted-foreground">Final 25% amount pending release</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300">Beneficiaries</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{entries.length}</p>
                                <p className="text-xs text-muted-foreground">Approved parantage records with pending amount</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filters</CardTitle>
                    <CardDescription>Search approved parantage confirmations that still have pending vendor payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setCurrentPage(1);
                                setSelectedRowKeys([]);
                            }}
                            placeholder="Search beneficiary, vendor, application..."
                            className="pl-9"
                            data-testid="input-parantage-search"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card data-testid="card-parantage-pending-payments-table">
                <CardHeader>
                    <CardTitle>Parantage Confirmation Pending Payments</CardTitle>
                    <CardDescription>These entries are approved and still have a pending amount to be released.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : entries.length > 0 ? (
                        <div className="space-y-4">
                            {selectedRowKeys.length > 0 && (
                                <Card className="border-primary" data-testid="card-parantage-selection-summary">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-lg bg-primary/10 p-2">
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
                                                <Button variant="outline" onClick={resetSelection} data-testid="button-parantage-clear-selection">
                                                    Clear Selection
                                                </Button>
                                                <Button onClick={handleOpenDialog} data-testid="button-parantage-issue-cheque">
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Issue Cheque
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Check data-testid="checkbox-parantage-select-all" />
                                        </TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Parantage ID</TableHead>
                                        <TableHead>Beneficiary</TableHead>
                                        <TableHead>Component</TableHead>
                                        <TableHead>Animal</TableHead>
                                        <TableHead>District</TableHead>
                                        <TableHead className="text-right">Pending Amount</TableHead>
                                        <TableHead>Certificate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry) => {
                                        const beneficiaryName = [entry.first_name, entry.mid_name, entry.last_name]
                                            .filter(Boolean)
                                            .join(" ");

                                        return (
                                            <TableRow
                                                key={entry.parantage_confirmation_id || entry.component_allocation_id}
                                                data-testid={`row-parantage-payment-${entry.parantage_confirmation_id || entry.component_allocation_id}`}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRowKeys.includes(getRowKey(entry))}
                                                        disabled={!selectedRowKeys.includes(getRowKey(entry)) && !canSelectPayment(entry)}
                                                        onCheckedChange={(checked) => handleTogglePayment(getRowKey(entry), !!checked)}
                                                        data-testid={`checkbox-parantage-${getRowKey(entry)}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{entry.vendor_name || entry.vendor || "-"}</p>
                                                        <Badge variant="outline" className="mt-1">{entry.parantage_status || "Approved"}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{entry.parantage_confirmation_id || "-"}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.application_id}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{beneficiaryName || "-"}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.aadhar_number}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.village}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{entry.component}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.component_allocation_id}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{entry.type_of_animal || "-"}</p>
                                                        <p className="text-xs text-muted-foreground">DOB: {entry.calf_date_of_birth || "-"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{entry.district}</p>
                                                        <p className="text-xs text-muted-foreground">{entry.taluka}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-green-600">
                                                        ₹{(entry.pending_amount || 0).toLocaleString("en-IN")}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {entry.certficate ? (
                                                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                                                            <a href={entry.certficate} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="mr-1 h-4 w-4" />
                                                                View
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Not available</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between border-t pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination?.current_page ?? currentPage} of {pagination?.total_pages ?? 1}
                                    {" "}
                                    ({pagination?.total_items ?? entries.length} total)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!hasPreviousPage}
                                        onClick={() => {
                                            setSelectedRowKeys([]);
                                            setCurrentPage((page) => Math.max(1, page - 1));
                                        }}
                                        data-testid="button-parantage-prev-page"
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!hasNextPage}
                                        onClick={() => {
                                            setSelectedRowKeys([]);
                                            setCurrentPage((page) => page + 1);
                                        }}
                                        data-testid="button-parantage-next-page"
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">No approved parantage records with pending payments found</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Issue Cheque</DialogTitle>
                        <DialogDescription>
                            Enter cheque details for {selectedRowKeys.length} parantage payment(s) to {selectedVendorName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-muted p-3">
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
                            <Label htmlFor="parantageChequeNumber">Cheque Number *</Label>
                            <Input
                                id="parantageChequeNumber"
                                placeholder="Enter cheque number"
                                value={chequeNumber}
                                onChange={(e) => setChequeNumber(e.target.value)}
                                data-testid="input-parantage-cheque-number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parantageChequeDate">Cheque Date *</Label>
                            <Input
                                id="parantageChequeDate"
                                type="date"
                                value={chequeDate}
                                onChange={(e) => setChequeDate(e.target.value)}
                                data-testid="input-parantage-cheque-date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parantageChequeAmount">Cheque Amount *</Label>
                            <Input
                                id="parantageChequeAmount"
                                type="text"
                                value={`₹${chequeAmount.toLocaleString("en-IN")}`}
                                disabled
                                className="bg-muted"
                                data-testid="input-parantage-cheque-amount"
                            />
                            <p className="text-xs text-muted-foreground">Amount is auto-calculated from selected pending amounts</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parantageBankName">Bank Name *</Label>
                            <Select
                                value={bankName}
                                onValueChange={(value) => {
                                    if (value === "__add_new__") {
                                        setShowNewBankDialog(true);
                                        return;
                                    }
                                    setBankName(value);
                                }}
                            >
                                <SelectTrigger id="parantageBankName" data-testid="select-parantage-bank-name">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankList?.map((bank) => (
                                        <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>
                                    ))}
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
                        <Button variant="outline" onClick={() => setOpenPaymentDialog(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitCheque} disabled={submitting} data-testid="button-parantage-confirm-cheque">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
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
                                } catch (error: any) {
                                    toast({
                                        title: "Error",
                                        description: error?.message || "Failed to create bank",
                                        variant: "destructive",
                                    });
                                }
                            }}
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            {submitting ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}