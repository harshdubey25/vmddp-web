"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminSidebar from "@/components/AdminSidebar";
import {
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    Calendar,
    MapPin,
    User,
    Package,
    Phone,
    Users,
    Leaf,
    Award,
    Upload,
} from "lucide-react";

import { Application } from "./server";

interface AdminApplicationsClientProps {
    applications: Application[];
}

export default function AdminApplicationsClient({ applications }: AdminApplicationsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");
    const [componentFilter, setComponentFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
    const [remarks, setRemarks] = useState("");

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        const matchesDistrict = districtFilter === "all" || app.district === districtFilter;
        const matchesComponent = componentFilter === "all" || app.component === componentFilter;
        return matchesSearch && matchesStatus && matchesDistrict && matchesComponent;
    });

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
    };

    const handleReview = (action: "approve" | "reject") => {
        setReviewAction(action);
        setShowReviewDialog(true);
    };

    const handleSubmitReview = () => {
        console.log(`${reviewAction} application with remarks:`, remarks);
        setShowReviewDialog(false);
        setReviewAction(null);
        setRemarks("");
        setSelectedApp(null);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: string; className: string }> = {
            Pending: { variant: "outline", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
            Approved: { variant: "outline", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
            Rejected: { variant: "outline", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
            Selected: { variant: "outline", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
        };

        return (
            <Badge variant={variants[status]?.variant as any} className={variants[status]?.className}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="admin" />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                    <div>
                        <h1 className="font-display font-semibold text-xl" data-testid="text-applications-title">
                            Applications Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and manage farmer applications
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2" data-testid="button-export">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </header>
                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <CardTitle>All Applications</CardTitle>
                                        <CardDescription>
                                            {filteredApplications.length} applications found
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by ID or name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                            data-testid="input-search"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger data-testid="select-status-filter">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Approved">Approved</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={districtFilter} onValueChange={setDistrictFilter}>
                                        <SelectTrigger data-testid="select-district-filter">
                                            <SelectValue placeholder="Filter by district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Districts</SelectItem>
                                            <SelectItem value="Nagpur">Nagpur</SelectItem>
                                            <SelectItem value="Amravati">Amravati</SelectItem>
                                            <SelectItem value="Akola">Akola</SelectItem>
                                            <SelectItem value="Yavatmal">Yavatmal</SelectItem>
                                            <SelectItem value="Wardha">Wardha</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={componentFilter} onValueChange={setComponentFilter}>
                                        <SelectTrigger data-testid="select-component-filter">
                                            <SelectValue placeholder="Filter by component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Components</SelectItem>
                                            <SelectItem value="Animal Induction (Calved Cow)">Animal Induction</SelectItem>
                                            <SelectItem value="HGM Purchase">HGM Purchase</SelectItem>
                                            <SelectItem value="Fertility Feed">Fertility Feed</SelectItem>
                                            <SelectItem value="Supply Chaff Cutter">Chaff Cutter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Applicant</th>
                                                    <th className="text-left p-4 font-semibold text-sm">District</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Component</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Approver</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Date</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((app, index) => (
                                                    <tr
                                                        key={app.id}
                                                        className="border-b hover:bg-muted/30 transition-colors"
                                                        data-testid={`application-row-${index}`}
                                                    >
                                                        <td className="p-4">
                                                            <span className="font-mono text-sm font-semibold">{app.id}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div>
                                                                <p className="font-medium text-sm">{app.applicantName}</p>
                                                                <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div>
                                                                <p className="text-sm">{app.district}</p>
                                                                <p className="text-xs text-muted-foreground">{app.taluka}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.component}</p>
                                                        </td>
                                                        <td className="p-4">{getStatusBadge(app.status)}</td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.approver || "-"}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.submittedDate}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleViewDetails(app)}
                                                                data-testid={`button-view-${index}`}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
            {selectedApp && (
                <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                Application Details
                            </DialogTitle>
                            <DialogDescription>
                                Review complete application information
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="font-mono font-semibold text-lg">{selectedApp.id}</p>
                                    <p className="text-sm text-muted-foreground">Submitted on {selectedApp.submittedDate}</p>
                                </div>
                                {getStatusBadge(selectedApp.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Personal Information
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Applicant Name</Label>
                                            <p className="font-medium">{selectedApp.applicantName}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Father&apos;s Name</Label>
                                            <p className="font-medium">{selectedApp.fatherName}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Gender</Label>
                                            <p className="font-medium">{selectedApp.gender}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Caste/Category</Label>
                                            <p className="font-medium">{selectedApp.caste}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Mobile Number</Label>
                                            <p className="font-medium flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                {selectedApp.mobile}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Aadhar Number</Label>
                                            <p className="font-medium">{selectedApp.aadharNumber}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Family Details
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Ration Card Members</Label>
                                            <p className="font-medium">{selectedApp.rationCardMembers}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Family Aadhar Numbers</Label>
                                            <div className="space-y-1 mt-1">
                                                {selectedApp.familyAadharNumbers.map((aadhar: string, idx: number) => (
                                                    <p key={idx} className="font-medium text-xs font-mono">{aadhar}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Location Details
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">District</Label>
                                            <p className="font-medium">{selectedApp.district}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Taluka</Label>
                                            <p className="font-medium">{selectedApp.taluka}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Village</Label>
                                            <p className="font-medium">{selectedApp.village}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Leaf className="w-4 h-4" />
                                        Eligibility & Livestock
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Animal Count</Label>
                                            <p className="font-medium">{selectedApp.animalCount ?? "N/A"}</p>
                                        </div>
                                        {selectedApp.animalTagNumber && (
                                            <div>
                                                <Label className="text-muted-foreground">Animal Tag Number</Label>
                                                <p className="font-medium font-mono">{selectedApp.animalTagNumber}</p>
                                            </div>
                                        )}
                                        <div>
                                            <Label className="text-muted-foreground">Land Holding (acres)</Label>
                                            <p className="font-medium">{selectedApp.landHolding}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Khasra Number</Label>
                                            <p className="font-medium">{selectedApp.khasraNumber}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Milk Pouring Point</Label>
                                            <p className="font-medium">{selectedApp.milkPouringPoint}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Farmer Pourer Code</Label>
                                            <p className="font-medium font-mono">{selectedApp.farmerPourerCode}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Component Details
                                </h3>
                                <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Selected Component</Label>
                                        <p className="font-medium text-base mt-1">{selectedApp.component}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Benefits</Label>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            {selectedApp.componentDetails.benefits.map((benefit: string, idx: number) => (
                                                <li key={idx} className="text-sm">{benefit}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {selectedApp.componentDetails.customQuestions.length > 0 && (
                                        <div>
                                            <Label className="text-muted-foreground">Component-Specific Information</Label>
                                            <div className="mt-2 space-y-2">
                                                {selectedApp.componentDetails.customQuestions.map((q: { label: string; answer: string }, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start">
                                                        <span className="text-sm text-muted-foreground">{q.label}:</span>
                                                        <span className="text-sm font-medium">{q.answer}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Documents Uploaded
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedApp.documents.map((doc: { name: string; uploaded: boolean; url?: string }, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {doc.uploaded ? (
                                                    <>
                                                        <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                                                            Uploaded
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                if (doc.url) {
                                                                    window.open(doc.url, '_blank');
                                                                }
                                                            }}
                                                            data-testid={`button-view-document-${doc.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            View
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                                        Missing
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedApp.status === "Pending" && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        className="flex-1 bg-chart-3 hover:bg-chart-3/90"
                                        onClick={() => handleReview("approve")}
                                        data-testid="button-approve"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Application
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleReview("reject")}
                                        data-testid="button-reject"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Application
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {showReviewDialog && (
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {reviewAction === "approve" ? "Approve Application" : "Reject Application"}
                            </DialogTitle>
                            <DialogDescription>
                                Please provide remarks for this decision
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Enter your remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                    data-testid="textarea-remarks"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowReviewDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmitReview}
                                    disabled={!remarks.trim()}
                                    data-testid="button-submit-review"
                                >
                                    Confirm {reviewAction === "approve" ? "Approval" : "Rejection"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
