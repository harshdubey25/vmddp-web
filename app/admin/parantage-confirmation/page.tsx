"use client";
import { useState, Fragment } from "react";
import {
    Check,
    AlertCircle,
    Clock,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    Search,
    Download,
    ExternalLink,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useFrappeGetCall, useFrappeUpdateDoc, useFrappePostCall } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
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
    parantage_confirmation_id?: string;
    calf_born?: string;
    calf_date_of_birth?: string;
    certficate?: string;
    certified_by_agency?: string;
    agency_name?: string;
    parantage_status?: string;
    reason?: string;
};

type ParantageStats = FrappeCustomApiResponse<{
    approved: number;
    awaiting_admin_approval: number;
    certficate_pending: number;
}>;

export default function AdminParantageConfirmation() {
    const { toast } = useToast();
    const [selectedEntry, setSelectedEntry] = useState<ParantageEntry | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { updateDoc } = useFrappeUpdateDoc();


    const { data: parantageStats, mutate: mutateStats } = useFrappeGetCall<ParantageStats>(
        "vmddp_app.api.v1.accountant.parantage_confirmation_stats"
    );

    const { data: pendingApprovalData, mutate: mutatePendingApproval } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >("vmddp_app.api.v1.accountant.get_parantage_confirmation_list", {
        status: "pending_approval",
    });

    const { data: approvedData, mutate: mutateApproved } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >("vmddp_app.api.v1.accountant.get_parantage_confirmation_list", {
        status: "approved",
    });

    const { data: rejectedData, mutate: mutateRejected } = useFrappeGetCall<
        FrappeCustomApiResponse<ParantageEntry[]>
    >("vmddp_app.api.v1.accountant.get_parantage_confirmation_list", {
        status: "rejected",
    });

    const pendingApprovalEntries = pendingApprovalData?.message || [];
    const approvedEntries = approvedData?.message || [];
    const rejectedEntries = rejectedData?.message || [];

    // Filter entries based on search query
    const filterEntries = (entries: ParantageEntry[]) => {
        if (!searchQuery.trim()) return entries;
        const query = searchQuery.toLowerCase();
        return entries.filter(
            (entry) =>
                `${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`
                    .toLowerCase()
                    .includes(query) ||
                entry.aadhar_number?.toLowerCase().includes(query) ||
                entry.district?.toLowerCase().includes(query) ||
                entry.parantage_confirmation_id?.toLowerCase().includes(query)
        );
    };

    const  handleViewDetails = (entry: ParantageEntry) => {
        setSelectedEntry(entry);
        setIsDetailsOpen(true);
    };

    const handleApprove = (entry: ParantageEntry) => {
        setSelectedEntry(entry);
        setRemarks("");
        setIsApproveDialogOpen(true);
    };

    const handleReject = (entry: ParantageEntry) => {
        setSelectedEntry(entry);
        setRemarks("");
        setIsRejectDialogOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedEntry?.parantage_confirmation_id) return;

        setIsSubmitting(true);
        try {
            // Update status to Approved
            await updateDoc("Parantage Confirmation", selectedEntry.parantage_confirmation_id, {
                status: "Approved",
                docstatus: 1,
                reason: remarks || "",
            });

            // Submit the document


            toast({
                title: "Success",
                description: "Parantage confirmation approved successfully",
            });

            // Refresh data
            mutatePendingApproval();
            mutateApproved();
            mutateStats();
            setIsApproveDialogOpen(false);
            setSelectedEntry(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to approve parantage confirmation",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmReject = async () => {
        if (!selectedEntry?.parantage_confirmation_id) return;

        setIsSubmitting(true);
        try {
            // Update status to Rejected and submit the document
            await updateDoc("Parantage Confirmation", selectedEntry.parantage_confirmation_id, {
                status: "Rejected",
                docstatus: 1,
                reason: remarks || "",
            });

            toast({
                title: "Rejected",
                description: "Parantage confirmation has been rejected",
            });

            // Refresh data
            mutatePendingApproval();
            mutateRejected();
            mutateStats();
            setIsRejectDialogOpen(false);
            setSelectedEntry(null);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to reject parantage confirmation",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending Approval":
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Approval
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <div className="h-screen bg-background">
            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1
                                className="text-2xl font-display font-bold"
                                data-testid="text-page-title"
                            >
                                Parantage Confirmation
                            </h1>
                            <p className="text-muted-foreground">
                                Review and approve HGM parantage verifications for final payment release
                            </p>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">
                                Admin Approval Required
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Review and approve parantage confirmations submitted by the accountant.
                                Upon approval, the remaining 25% of the HGM subsidy will be released to the beneficiary.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-pending-approval">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <Clock className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Pending Approval
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {parantageStats?.message?.awaiting_admin_approval || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-certificate-pending">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-gray-500/10">
                                        <FileText className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Certificate Pending
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {parantageStats?.message?.certficate_pending || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-approved">
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
                                            {parantageStats?.message?.approved || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, Aadhaar, district, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                data-testid="input-search"
                            />
                        </div>
                    </div>

                    {/* Parantage List */}
                    <Card data-testid="card-parantage-list">
                        <CardHeader>
                            <CardTitle>Parantage Confirmations</CardTitle>
                            <CardDescription>
                                Review and approve parantage verification requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="pending">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="pending" data-testid="tab-pending">
                                        Pending Approval ({filterEntries(pendingApprovalEntries).length})
                                    </TabsTrigger>
                                    <TabsTrigger value="approved" data-testid="tab-approved">
                                        Approved ({filterEntries(approvedEntries).length})
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected" data-testid="tab-rejected">
                                        Rejected ({filterEntries(rejectedEntries).length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>District</TableHead>
                                                    <TableHead>Calf Gender</TableHead>
                                                    <TableHead>Certified By</TableHead>
                                                    <TableHead>Pending Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filterEntries(pendingApprovalEntries).length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                            No pending parantage confirmations found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filterEntries(pendingApprovalEntries).map((entry) => (
                                                        <TableRow
                                                            key={entry.parantage_confirmation_id}
                                                            data-testid={`row-parantage-${entry.parantage_confirmation_id}`}
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <TableCell>
                                                                <span className="font-mono text-xs">
                                                                    {entry.parantage_confirmation_id}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {entry.aadhar_number}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{entry.district}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {entry.calf_born}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.agency_name || entry.certified_by_agency}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-primary">
                                                                ₹{entry.pending_amount?.toLocaleString("en-IN") || 0}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(entry.parantage_status || "Pending Approval")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleViewDetails(entry)}
                                                                        data-testid={`button-view-${entry.parantage_confirmation_id}`}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleApprove(entry)}
                                                                        data-testid={`button-approve-${entry.parantage_confirmation_id}`}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleReject(entry)}
                                                                        data-testid={`button-reject-${entry.parantage_confirmation_id}`}
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="approved">
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>District</TableHead>
                                                    <TableHead>Calf Gender</TableHead>
                                                    <TableHead>Certified By</TableHead>
                                                    <TableHead>Total Paid</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filterEntries(approvedEntries).length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                            No approved parantage confirmations found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filterEntries(approvedEntries).map((entry) => (
                                                        <TableRow
                                                            key={entry.parantage_confirmation_id}
                                                            data-testid={`row-parantage-${entry.parantage_confirmation_id}`}
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <TableCell>
                                                                <span className="font-mono text-xs">
                                                                    {entry.parantage_confirmation_id}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {entry.aadhar_number}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{entry.district}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {entry.calf_born}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.agency_name || entry.certified_by_agency}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-green-600">
                                                                ₹{((entry.paid_payment || 0) + (entry.pending_amount || 0)).toLocaleString("en-IN")}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge("Approved")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleViewDetails(entry)}
                                                                    data-testid={`button-view-${entry.parantage_confirmation_id}`}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="rejected">
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>District</TableHead>
                                                    <TableHead>Calf Gender</TableHead>
                                                    <TableHead>Certified By</TableHead>
                                                    <TableHead>Pending Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filterEntries(rejectedEntries).length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={8}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No rejected entries found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filterEntries(rejectedEntries).map((entry) => (
                                                        <TableRow
                                                            key={entry.parantage_confirmation_id}
                                                            data-testid={`row-rejected-${entry.parantage_confirmation_id}`}
                                                        >
                                                            <TableCell className="font-mono text-xs">
                                                                {entry.parantage_confirmation_id}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {`${entry.first_name} ${entry.mid_name || ""} ${entry.last_name}`.trim()}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {entry.aadhar_number}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{entry.district}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {entry.calf_born}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.agency_name || entry.certified_by_agency}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-primary">
                                                                ₹{entry.pending_amount?.toLocaleString("en-IN") || 0}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(entry.parantage_status || "Rejected")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
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
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Parantage Confirmation Details</DialogTitle>
                        <DialogDescription>
                            Review the parantage confirmation information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-6">
                            {/* Beneficiary Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Confirmation ID</Label>
                                    <p className="font-mono text-sm">{selectedEntry.parantage_confirmation_id}</p>
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

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Calf Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Calf Gender</Label>
                                        <Badge variant="outline" className="capitalize mt-1">
                                            {selectedEntry.calf_born}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                                        <p className="font-medium">{selectedEntry.calf_date_of_birth || "N/A"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Certified By Agency</Label>
                                        <p className="font-medium">{selectedEntry.agency_name || selectedEntry.certified_by_agency}</p>
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

                            {selectedEntry.reason && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Admin Remarks</h4>
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
                        {selectedEntry?.parantage_status === "Pending Approval" && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setIsDetailsOpen(false);
                                        handleReject(selectedEntry);
                                    }}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        setIsDetailsOpen(false);
                                        handleApprove(selectedEntry);
                                    }}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Parantage Confirmation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this parantage confirmation?
                            This will release the remaining 25% payment to the beneficiary.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-medium">
                                    {`${selectedEntry.first_name} ${selectedEntry.mid_name || ""} ${selectedEntry.last_name}`.trim()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Aadhaar: {selectedEntry.aadhar_number}
                                </p>
                                <p className="text-sm font-medium text-primary mt-2">
                                    Amount to be released: ₹{selectedEntry.pending_amount?.toLocaleString("en-IN") || 0}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Remarks (Optional)</Label>
                                <Textarea
                                    placeholder="Add any remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsApproveDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={confirmApprove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Parantage Confirmation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this parantage confirmation?
                            It will be sent back to the accountant for review.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="font-medium">
                                    {`${selectedEntry.first_name} ${selectedEntry.mid_name || ""} ${selectedEntry.last_name}`.trim()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Aadhaar: {selectedEntry.aadhar_number}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason for Rejection</Label>
                                <Textarea
                                    placeholder="Please provide a reason for rejection..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRejectDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmReject}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
