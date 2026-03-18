"use client";

import { Ban, CreditCard, Loader2, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PendingApplicationForDDCancel {
    name: string;
    first_name: string;
    last_name: string;
    mid_name: string;
    aadhar_number: string;
    component_name: string;
    dd_number: string;
    dd_date: string;
    dd_amount: number;
    source_bank_name: string;
    branch_name: string;
    item: string | null;
    village: string;
    district: string;
    taluka: string;
}

export interface DDDocDetails {
    name: string;
    application: string;
    component: string;
    item?: string;
    dd_number: string;
    dd_date: string;
    amount: number;
    source_bank_name: string;
    branch_name: string;
}

interface CancelDDDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPendingApplication: PendingApplicationForDDCancel | null;
    selectedDD: DDDocDetails | null;
    loadingDDDetails: boolean;
    onCancelDD: () => void;
}

export default function CancelDDDialog({
    open,
    onOpenChange,
    selectedPendingApplication,
    selectedDD,
    loadingDDDetails,
    onCancelDD,
}: CancelDDDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Cancel DD</DialogTitle>
                    <DialogDescription>
                        Review the applicant and DD details before cancelling the DD document.
                    </DialogDescription>
                </DialogHeader>

                {selectedPendingApplication ? (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4" />
                                        Applicant Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Application ID</span>
                                        <span className="font-medium">{selectedPendingApplication.name}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-medium text-right">{selectedPendingApplication.first_name} {selectedPendingApplication.mid_name} {selectedPendingApplication.last_name}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Aadhaar</span>
                                        <span className="font-medium font-mono">{selectedPendingApplication.aadhar_number}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">District</span>
                                        <span className="font-medium">{selectedPendingApplication.district}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Taluka</span>
                                        <span className="font-medium">{selectedPendingApplication.taluka}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Village</span>
                                        <span className="font-medium text-right">{selectedPendingApplication.village}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Component</span>
                                        <span className="font-medium text-right">{selectedPendingApplication.component_name}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CreditCard className="h-4 w-4" />
                                        DD Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {loadingDDDetails ? (
                                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">DD Doc</span>
                                                <span className="font-medium">{selectedDD?.name || "-"}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">DD Number</span>
                                                <span className="font-medium">{selectedDD?.dd_number || selectedPendingApplication.dd_number || "-"}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">DD Date</span>
                                                <span className="font-medium">{selectedDD?.dd_date || selectedPendingApplication.dd_date || "-"}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">Amount</span>
                                                <span className="font-medium">₹{Number(selectedDD?.amount ?? selectedPendingApplication.dd_amount ?? 0).toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">Source Bank</span>
                                                <span className="font-medium text-right">{selectedDD?.source_bank_name || selectedPendingApplication.source_bank_name || "-"}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">Branch</span>
                                                <span className="font-medium text-right">{selectedDD?.branch_name || selectedPendingApplication.branch_name || "-"}</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-muted-foreground">Animal/Item</span>
                                                <span className="font-medium text-right">{selectedDD?.item || selectedPendingApplication.item || "-"}</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                            Cancelling the DD will cancel the submitted DD .
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onCancelDD}
                        disabled={loadingDDDetails || !selectedDD?.name}
                        data-testid="button-confirm-cancel-dd"
                    >
                        {loadingDDDetails ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                        Cancel DD
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}