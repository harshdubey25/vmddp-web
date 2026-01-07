"use client"
import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    AlertCircle,
    Upload,
    IndianRupee,
    Clock,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ParantageDetailsForm from "./ParantageDetailsForm";
import { useFrappeGetCall } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";

type ParantageEntry = {
    application_id: string;
    first_name: string;
    mid_name: string;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    vendor: string;
    vendor_name: string;
    component_allocation_id: string;
    component: string;
    type_of_animal: string;
    animal_cost: number;
    sum_assured: number;
    premium_paid: number;
    transportation_cost: number;
    paid_payment: number;
    pending_amount: number;
    // Additional fields for pending_approval and approved statuses
    parantage_confirmation_id?: string;
    calf_born?: string;
    certficate?: string;
    certified_by_agency?: string;
    agency_name?: string;
    parantage_status?: string;
};

type ParantageStats = FrappeCustomApiResponse<{
    approved: number;
    awaiting_admin_approval: number;
    certficate_pending: number;
}>

export default function Parantage() {
    const [openFormId, setOpenFormId] = useState<string | null>(null);

    const { data: parantageStats } = useFrappeGetCall<ParantageStats>('vmddp_app.api.v1.accountant.parantage_confirmation_stats');

    const { data: pendingData, mutate: mutatePending } = useFrappeGetCall<FrappeCustomApiResponse<ParantageEntry[]>>(
        'vmddp_app.api.v1.accountant.get_parantage_confirmation_list',
        { status: 'pending' }
    );

    const { data: pendingApprovalData } = useFrappeGetCall<FrappeCustomApiResponse<ParantageEntry[]>>(
        'vmddp_app.api.v1.accountant.get_parantage_confirmation_list',
        { status: 'pending_approval' }
    );

    const { data: approvedData } = useFrappeGetCall<FrappeCustomApiResponse<ParantageEntry[]>>(
        'vmddp_app.api.v1.accountant.get_parantage_confirmation_list',
        { status: 'approved' }
    );

    const pendingEntries = pendingData?.message || [];
    const pendingApprovalEntries = pendingApprovalData?.message || [];
    const approvedEntries = approvedData?.message || [];

    return (
        <div className="h-screen bg-background">


            <div className="overflow-auto h-screen ">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    Parantage Confirmation
                                </h1>
                                <p className="text-muted-foreground">HGM parantage verification and 25% final payment release</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">HGM 75/25 Payment Split</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                75% of the HGM subsidy is paid upon allocation. The remaining 25% is released after parantage
                                confirmation - when the calf is born and verified by a certifying agency.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card data-testid="card-pending-certificates">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-gray-500/10">
                                        <Upload className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Certificate Pending</p>
                                        <p className="text-2xl font-bold">{parantageStats?.message.certficate_pending}</p>

                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-ready-payment">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <IndianRupee className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                                        <p className="text-2xl font-bold">{parantageStats?.message.awaiting_admin_approval}</p>

                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-completed">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <Check className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold">{parantageStats?.message.approved}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Parantage List */}
                    <Card data-testid="card-parantage-list">
                        <CardHeader>
                            <CardTitle>HGM Parantage Cases</CardTitle>
                            <CardDescription>Track parantage verification and final payment release</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="pending" data-testid="tab-pending">
                                        Pending
                                    </TabsTrigger>
                                    <TabsTrigger value="ready" data-testid="tab-ready">
                                        Awaiting Admin
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" data-testid="tab-completed">
                                        Approved
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Beneficiary</TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>Vendor</TableHead>
                                                <TableHead>Paid Amount</TableHead>
                                                <TableHead>Pending Amount</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingEntries.map((entry) => (
                                                <>
                                                    <TableRow key={entry.component_allocation_id} data-testid={`row-parantage-${entry.component_allocation_id}`}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                                <p className="text-xs text-muted-foreground">{entry.aadhar_number}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{entry.district}</TableCell>
                                                        <TableCell>{entry.vendor_name || entry.vendor}</TableCell>
                                                        <TableCell className="text-green-600">₹{entry.paid_payment?.toLocaleString("en-IN") || 0}</TableCell>
                                                        <TableCell className="font-medium">₹{entry.pending_amount?.toLocaleString("en-IN") || 0}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                data-testid={`button-expand-${entry.component_allocation_id}`}
                                                                onClick={() => setOpenFormId(openFormId === entry.component_allocation_id ? null : entry.component_allocation_id)}
                                                            >
                                                                <ChevronRight className={`h-5 w-5 transition-transform ${openFormId === entry.component_allocation_id ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {openFormId === entry.component_allocation_id && (
                                                        <TableRow className="bg-muted/30">
                                                            <TableCell colSpan={6}>
                                                                <ParantageDetailsForm
                                                                    entryId={entry.component_allocation_id}
                                                                    applicationId={entry.application_id}
                                                                    onCancel={() => setOpenFormId(null)}
                                                                    onSuccess={() => setOpenFormId(null)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="ready">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Beneficiary</TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>Calf Gender</TableHead>
                                                <TableHead>Certified By</TableHead>
                                                <TableHead>Pending Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingApprovalEntries.map((entry) => (
                                                <TableRow key={entry.parantage_confirmation_id} data-testid={`row-parantage-${entry.parantage_confirmation_id}`}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                            <p className="text-xs text-muted-foreground">{entry.aadhar_number}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{entry.district}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {entry.calf_born}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{entry.agency_name || entry.certified_by_agency}</TableCell>
                                                    <TableCell className="font-medium text-primary">
                                                        ₹{entry.pending_amount?.toLocaleString("en-IN") || 0}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                </TabsContent>

                                <TabsContent value="completed">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Beneficiary</TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>Calf Gender</TableHead>
                                                <TableHead>Certified By</TableHead>
                                                <TableHead>Total Paid</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvedEntries.map((entry) => (
                                                <TableRow key={entry.parantage_confirmation_id} data-testid={`row-parantage-${entry.parantage_confirmation_id}`}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                            <p className="text-xs text-muted-foreground">{entry.aadhar_number}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{entry.district}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {entry.calf_born}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{entry.agency_name || entry.certified_by_agency}</TableCell>
                                                    <TableCell className="font-medium text-green-600">
                                                        ₹{((entry.paid_payment || 0) + (entry.pending_amount || 0)).toLocaleString("en-IN")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                </div>
            </div>



        </div>
    );
}
