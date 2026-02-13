"use client";
import { useState, Fragment } from "react";
import {
    Check,
    AlertCircle,
    Upload,
    IndianRupee,
    Clock,
    ChevronRight,
    Eye,
    FileText,
    ExternalLink,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ParantageDetailsForm from "./ParantageDetailsForm";
import { useFrappeGetCall } from "frappe-react-sdk";
import { FrappeCustomApiResponse } from "@/types";

export type ParantageEntry = {
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
    calf_date_of_birth?: string;
    certficate?: string;
    certified_by_agency?: string;
    agency_name?: string;
    parantage_status?: string;
    reason?: string;
    is_paid?: number;
};

type ParantageStats = FrappeCustomApiResponse<{
    approved: number;
    awaiting_admin_approval: number;
    certficate_pending: number;
    rejected: number;
}>;

export default function Parantage() {
    const [openFormId, setOpenFormId] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<ParantageEntry | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");

    const { data: parantageStats } = useFrappeGetCall<ParantageStats>(
        "vmddp_app.api.v1.accountant.parantage_confirmation_stats",
    );

    const { data: pendingData, mutate: mutatePending } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >("vmddp_app.api.v1.accountant.get_parantage_confirmation_list", {
        status: "pending",
    });

    const { data: pendingApprovalData } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >((activeTab === "ready" ? "vmddp_app.api.v1.accountant.get_parantage_confirmation_list" : null) as string, {
        status: "pending_approval",
    });

    const { data: approvedData } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >((activeTab === "completed" ? "vmddp_app.api.v1.accountant.get_parantage_confirmation_list" : null) as string, {
        status: "approved",
    });

    const { data: rejectData } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >((activeTab === "rejected" ? "vmddp_app.api.v1.accountant.get_parantage_confirmation_list" : null) as string, {
        status: "rejected",
    });

    const pendingEntries = pendingData?.message || [];
    const pendingApprovalEntries = pendingApprovalData?.message || [];
    const approvedEntries = approvedData?.message || [];
    const rejectedEntries = rejectData?.message || [];

    const handleViewDetails = (entry: ParantageEntry) => {
        setSelectedEntry(entry);
        setIsDetailsOpen(true);
    };

    return (
        <div className="h-screen w-full bg-background">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1
                                    className="text-2xl font-display font-bold"
                                    data-testid="text-page-title"
                                >
                                    Parantage Confirmation
                                </h1>
                                <p className="text-muted-foreground">
                                    HGM parantage verification and 25% final
                                    payment release
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">
                                HGM 75/25 Payment Split
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                75% of the HGM subsidy is paid upon allocation.
                                The remaining 25% is released after parantage
                                confirmation - when the calf is born and
                                verified by a certifying agency.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card data-testid="card-pending-certificates">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-gray-500/10">
                                        <Upload className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Pending Parantage
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {
                                                parantageStats?.message
                                                    .certficate_pending
                                            }
                                        </p>
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
                                        <p className="text-sm text-muted-foreground">
                                            Pending Approval
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {
                                                parantageStats?.message
                                                    .awaiting_admin_approval
                                            }
                                        </p>
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
                                        <p className="text-sm text-muted-foreground">
                                            Approved
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {parantageStats?.message.approved}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-rejected">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-red-500/10">
                                        <Clock className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Rejected
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {parantageStats?.message?.rejected || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Parantage List */}
                    <Card data-testid="card-parantage-list">
                        <CardHeader>
                            <CardTitle>HGM Parantage Cases</CardTitle>
                            <CardDescription>
                                Track parantage verification and final payment
                                release
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending" onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger
                                        value="pending"
                                        data-testid="tab-pending"
                                    >
                                        Pending
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="ready"
                                        data-testid="tab-ready"
                                    >
                                        Awaiting Admin
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="completed"
                                        data-testid="tab-completed"
                                    >
                                        Approved
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="rejected"
                                        data-testid="tab-rejected"
                                    >
                                        Rejected
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Beneficiary
                                                </TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>Vendor</TableHead>
                                                <TableHead>
                                                    Paid Amount
                                                </TableHead>
                                                <TableHead>
                                                    Pending Amount
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingEntries.map((entry) => (
                                                <Fragment
                                                    key={
                                                        entry.component_allocation_id
                                                    }
                                                >
                                                    <TableRow
                                                        data-testid={`row-parantage-${entry.component_allocation_id}`}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        entry.aadhar_number
                                                                    }
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.district}
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.vendor_name ||
                                                                entry.vendor}
                                                        </TableCell>
                                                        <TableCell className="text-green-600">
                                                            ₹
                                                            {entry.paid_payment?.toLocaleString(
                                                                "en-IN",
                                                            ) || 0}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₹
                                                            {entry.pending_amount?.toLocaleString(
                                                                "en-IN",
                                                            ) || 0}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                data-testid={`button-expand-${entry.component_allocation_id}`}
                                                                onClick={() =>
                                                                    setOpenFormId(
                                                                        openFormId ===
                                                                            entry.component_allocation_id
                                                                            ? null
                                                                            : entry.component_allocation_id,
                                                                    )
                                                                }
                                                            >
                                                                <ChevronRight
                                                                    className={`h-5 w-5 transition-transform ${openFormId === entry.component_allocation_id ? "rotate-90" : ""}`}
                                                                />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {openFormId ===
                                                        entry.component_allocation_id && (
                                                            <TableRow className="bg-muted/30">
                                                                <TableCell
                                                                    colSpan={6}
                                                                >
                                                                    <ParantageDetailsForm
                                                                        entryId={
                                                                            entry.component_allocation_id
                                                                        }
                                                                        applicationId={
                                                                            entry.application_id
                                                                        }
                                                                        onCancel={() =>
                                                                            setOpenFormId(
                                                                                null,
                                                                            )
                                                                        }
                                                                        onSuccess={() =>
                                                                            setOpenFormId(
                                                                                null,
                                                                            )
                                                                        }
                                                                        component_allocation_id={
                                                                            entry.component_allocation_id
                                                                        }
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                </Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="ready">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Beneficiary
                                                </TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>
                                                    Calf Gender
                                                </TableHead>
                                                <TableHead>
                                                    Certified By
                                                </TableHead>
                                                <TableHead>
                                                    Pending Amount
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingApprovalEntries.map(
                                                (entry) => (
                                                    <TableRow
                                                        key={
                                                            entry.parantage_confirmation_id
                                                        }
                                                        data-testid={`row-parantage-${entry.parantage_confirmation_id}`}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        entry.aadhar_number
                                                                    }
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.district}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize"
                                                            >
                                                                {
                                                                    entry.calf_born
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.agency_name ||
                                                                entry.certified_by_agency}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-primary">
                                                            ₹
                                                            {entry.pending_amount?.toLocaleString(
                                                                "en-IN",
                                                            ) || 0}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleViewDetails(entry)}
                                                                data-testid={`button-view-pending-approval-${entry.parantage_confirmation_id}`}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="completed">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Beneficiary
                                                </TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>
                                                    Calf Gender
                                                </TableHead>
                                                <TableHead>
                                                    Certified By
                                                </TableHead>
                                                <TableHead>
                                                    Pending Payment
                                                </TableHead>
                                                <TableHead>Payment Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvedEntries.map((entry) => (
                                                <TableRow
                                                    key={
                                                        entry.parantage_confirmation_id
                                                    }
                                                    data-testid={`row-parantage-${entry.parantage_confirmation_id}`}
                                                >
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">
                                                                {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    entry.aadhar_number
                                                                }
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.district}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {entry.calf_born}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.agency_name ||
                                                            entry.certified_by_agency}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-green-600">
                                                        ₹
                                                        {(
                                                            (entry.pending_amount ||
                                                                0)
                                                        ).toLocaleString(
                                                            "en-IN",
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.is_paid === 1 ? (
                                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                                                                Paid
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20" variant="outline">
                                                                Unpaid
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewDetails(entry)}
                                                            data-testid={`button-view-approved-${entry.parantage_confirmation_id}`}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="rejected">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Beneficiary
                                                </TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>
                                                    Calf Gender
                                                </TableHead>
                                                <TableHead>
                                                    Certified By
                                                </TableHead>
                                                <TableHead>
                                                    Pending Amount
                                                </TableHead>
                                                <TableHead>
                                                    Status
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rejectedEntries.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No rejected entries found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rejectedEntries.map((entry) => (
                                                    <TableRow
                                                        key={
                                                            entry.parantage_confirmation_id
                                                        }
                                                        data-testid={`row-rejected-${entry.parantage_confirmation_id}`}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {
                                                                        entry.aadhar_number
                                                                    }
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.district}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize"
                                                            >
                                                                {
                                                                    entry.calf_born
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.agency_name ||
                                                                entry.certified_by_agency}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-primary">
                                                            ₹
                                                            {entry.pending_amount?.toLocaleString(
                                                                "en-IN",
                                                            ) || 0}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-red-500/10 text-red-600 border-red-500/20"
                                                            >
                                                                Rejected
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleViewDetails(entry)}
                                                                data-testid={`button-view-rejected-${entry.parantage_confirmation_id}`}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Parantage Confirmation Details</DialogTitle>
                        <DialogDescription>
                            Review the parantage confirmation information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-6">
                            {/* IDs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Confirmation ID</Label>
                                    <p className="font-mono text-sm">{selectedEntry.parantage_confirmation_id || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Application ID</Label>
                                    <p className="font-mono text-sm">{selectedEntry.application_id}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Beneficiary Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Name</Label>
                                        <p className="font-medium">
                                            {`${selectedEntry.first_name} ${selectedEntry.mid_name || ""} ${selectedEntry.last_name}`.trim()}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Aadhaar Number</Label>
                                        <p className="font-medium">{selectedEntry.aadhar_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">District</Label>
                                        <p className="font-medium">{selectedEntry.district}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Taluka</Label>
                                        <p className="font-medium">{selectedEntry.taluka}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Village</Label>
                                        <p className="font-medium">{selectedEntry.village}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Vendor</Label>
                                        <p className="font-medium">{selectedEntry.vendor_name || selectedEntry.vendor}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Calf Information - only show if parantage_confirmation_id exists */}
                            {selectedEntry.parantage_confirmation_id && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Calf Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Calf Gender</Label>
                                            <Badge variant="outline" className="capitalize mt-1">
                                                {selectedEntry.calf_born || "N/A"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                                            <p className="font-medium">{selectedEntry.calf_date_of_birth || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Certified By Agency</Label>
                                            <p className="font-medium">{selectedEntry.agency_name || selectedEntry.certified_by_agency || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Certificate</Label>
                                            {selectedEntry.certficate ? (
                                                <a
                                                    href={selectedEntry.certficate}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    View Certificate
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <p className="text-muted-foreground">Not uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Information */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Payment Information</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Animal Cost</Label>
                                        <p className="font-medium">₹{selectedEntry.animal_cost?.toLocaleString("en-IN") || 0}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Paid Amount (75%)</Label>
                                        <p className="font-medium text-green-600">₹{selectedEntry.paid_payment?.toLocaleString("en-IN") || 0}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Pending Amount (25%)</Label>
                                        <p className="font-medium text-primary">₹{selectedEntry.pending_amount?.toLocaleString("en-IN") || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Remarks - only show if reason exists */}
                            {selectedEntry.reason && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Remarks</h4>
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm">{selectedEntry.reason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
