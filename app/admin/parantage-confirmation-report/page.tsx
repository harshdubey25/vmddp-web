"use client"
import {
    Check,
    AlertCircle,
    Upload,
    IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ParantageConfirmationReport() {
    const { data: parantageStats } = useFrappeGetCall<ParantageStats>('vmddp_app.api.v1.accountant.parantage_confirmation_stats');

    const { data: pendingData } = useFrappeGetCall<FrappeCustomApiResponse<ParantageEntry[]>>(
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
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                            Parantage Confirmation Report
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">HGM parantage verification and 25% final payment tracking</p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 sm:gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 text-sm sm:text-base">HGM 75/25 Payment Split</h4>
                        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                            75% of the HGM subsidy is paid upon allocation. The remaining 25% is released after parantage
                            confirmation - when the calf is born and verified by a certifying agency.
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card data-testid="card-pending-certificates">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-gray-500/10 flex-shrink-0">
                                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Certificate Pending</p>
                                    <p className="text-xl sm:text-2xl font-bold">{parantageStats?.message.certficate_pending ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-awaiting-approval">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                                    <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Awaiting Admin Approval</p>
                                    <p className="text-xl sm:text-2xl font-bold">{parantageStats?.message.awaiting_admin_approval ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-approved" className="sm:col-span-2 lg:col-span-1">
                        <CardContent className="pt-4 sm:pt-6">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                                    <p className="text-xl sm:text-2xl font-bold">{parantageStats?.message.approved ?? 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Parantage Cases */}
                <Card data-testid="card-parantage-list">
                    <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="text-lg sm:text-xl">HGM Parantage Cases</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Track parantage verification and final payment release status</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                        <Tabs defaultValue="pending" className="w-full">
                            <TabsList className="mb-3 sm:mb-4 w-full grid grid-cols-3">
                                <TabsTrigger value="pending" data-testid="tab-pending" className="text-xs sm:text-sm">
                                    Pending ({pendingEntries.length})
                                </TabsTrigger>
                                <TabsTrigger value="ready" data-testid="tab-ready" className="text-xs sm:text-sm">
                                    Awaiting ({pendingApprovalEntries.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed" data-testid="tab-completed" className="text-xs sm:text-sm">
                                    Approved ({approvedEntries.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pending" className="mt-3 sm:mt-4">
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <Table className="text-xs sm:text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[130px]">Beneficiary</TableHead>
                                                <TableHead className="min-w-[120px]">Aadhaar</TableHead>
                                                <TableHead className="min-w-[100px]">District</TableHead>
                                                <TableHead className="min-w-[100px]">Vendor</TableHead>
                                                <TableHead className="text-right min-w-[100px]">Paid</TableHead>
                                                <TableHead className="text-right min-w-[100px]">Pending</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingEntries.length > 0 ? (
                                                pendingEntries.map((entry) => (
                                                    <TableRow key={entry.component_allocation_id} data-testid={`row-parantage-${entry.component_allocation_id}`}>
                                                        <TableCell className="min-w-[130px]">
                                                            <div>
                                                                <p className="font-medium text-xs sm:text-sm">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="min-w-[120px] font-mono text-xs">{entry.aadhar_number}</TableCell>
                                                        <TableCell className="min-w-[100px] text-xs sm:text-sm">{entry.district}</TableCell>
                                                        <TableCell className="min-w-[100px] text-xs sm:text-sm">{entry.vendor_name || entry.vendor}</TableCell>
                                                        <TableCell className="text-right min-w-[100px] text-green-600 text-xs sm:text-sm">₹{entry.paid_payment?.toLocaleString("en-IN") || 0}</TableCell>
                                                        <TableCell className="text-right min-w-[100px] font-medium text-xs sm:text-sm">₹{entry.pending_amount?.toLocaleString("en-IN") || 0}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                                                        No pending entries
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="ready" className="mt-3 sm:mt-4">
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <Table className="text-xs sm:text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[130px]">Beneficiary</TableHead>
                                                <TableHead className="min-w-[120px]">Aadhaar</TableHead>
                                                <TableHead className="min-w-[100px]">District</TableHead>
                                                <TableHead className="min-w-[90px]">Calf</TableHead>
                                                <TableHead className="min-w-[110px]">Certified By</TableHead>
                                                <TableHead className="text-right min-w-[100px]">Pending</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingApprovalEntries.length > 0 ? (
                                                pendingApprovalEntries.map((entry) => (
                                                    <TableRow key={entry.parantage_confirmation_id} data-testid={`row-parantage-${entry.parantage_confirmation_id}`}>
                                                        <TableCell className="min-w-[130px]">
                                                            <div>
                                                                <p className="font-medium text-xs sm:text-sm">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="min-w-[120px] font-mono text-xs">{entry.aadhar_number}</TableCell>
                                                        <TableCell className="min-w-[100px] text-xs sm:text-sm">{entry.district}</TableCell>
                                                        <TableCell className="min-w-[90px]">
                                                            <Badge variant="outline" className="capitalize text-xs">
                                                                {entry.calf_born || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="min-w-[110px] text-xs sm:text-sm">{entry.agency_name || entry.certified_by_agency || '-'}</TableCell>
                                                        <TableCell className="text-right min-w-[100px] font-medium text-primary text-xs sm:text-sm">
                                                            ₹{entry.pending_amount?.toLocaleString("en-IN") || 0}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                                                        No entries awaiting approval
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="completed" className="mt-3 sm:mt-4">
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <Table className="text-xs sm:text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[130px]">Beneficiary</TableHead>
                                                <TableHead className="min-w-[120px]">Aadhaar</TableHead>
                                                <TableHead className="min-w-[100px]">District</TableHead>
                                                <TableHead className="min-w-[90px]">Calf</TableHead>
                                                <TableHead className="min-w-[110px]">Certified By</TableHead>
                                                <TableHead className="text-right min-w-[100px]">Total Paid</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvedEntries.length > 0 ? (
                                                approvedEntries.map((entry) => (
                                                    <TableRow key={entry.parantage_confirmation_id} data-testid={`row-parantage-${entry.parantage_confirmation_id}`}>
                                                        <TableCell className="min-w-[130px]">
                                                            <div>
                                                                <p className="font-medium text-xs sm:text-sm">{`${entry.first_name} ${entry.mid_name || ''} ${entry.last_name}`.trim()}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="min-w-[120px] font-mono text-xs">{entry.aadhar_number}</TableCell>
                                                        <TableCell className="min-w-[100px] text-xs sm:text-sm">{entry.district}</TableCell>
                                                        <TableCell className="min-w-[90px]">
                                                            <Badge variant="outline" className="capitalize text-xs">
                                                                {entry.calf_born || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="min-w-[110px] text-xs sm:text-sm">{entry.agency_name || entry.certified_by_agency || '-'}</TableCell>
                                                        <TableCell className="text-right min-w-[100px] font-medium text-green-600 text-xs sm:text-sm">
                                                            ₹{((entry.paid_payment || 0) + (entry.pending_amount || 0)).toLocaleString("en-IN")}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                                                        No approved entries
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}