"use client";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle,
    XCircle,
    FileText,
    User,
    Users,
    MapPin,
    Leaf,
    Award,
    Upload,
    Phone,
    Eye,
} from "lucide-react";
import { getStatusBadge } from "@/lib/status-utils";

interface ApplicationDetailsDialogProps {
    application: any | null;
    isOpen: boolean;
    onClose: () => void;
    onReview?: (action: "approve" | "reject", remarks: string) => void;
    showReviewActions?: boolean;
}

export default function ApplicationDetailsDialog({
    application,
    isOpen,
    onClose,
    onReview,
    showReviewActions = true
}: ApplicationDetailsDialogProps) {
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
    const [remarks, setRemarks] = useState("");

    if (!application) return null;

    const handleReview = (action: "approve" | "reject") => {
        setReviewAction(action);
        setShowReviewDialog(true);
    };

    const handleSubmitReview = () => {
        if (onReview && reviewAction) {
            onReview(reviewAction, remarks);
        }
        setShowReviewDialog(false);
        setReviewAction(null);
        setRemarks("");
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
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
                                <p className="font-mono font-semibold text-lg">{application.id}</p>
                                <p className="text-sm text-muted-foreground">Submitted on {application.submittedDate}</p>
                            </div>
                            {getStatusBadge(application.status)}
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
                                        <p className="font-medium">{application.applicantName}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Father&apos;s Name</Label>
                                        <p className="font-medium">{application.fatherName}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Gender</Label>
                                        <p className="font-medium">{application.gender}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Caste/Category</Label>
                                        <p className="font-medium">{application.caste}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Mobile Number</Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            {application.mobile}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Aadhar Number</Label>
                                        <p className="font-medium">{application.aadharNumber}</p>
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
                                        <p className="font-medium">{application.rationCardMembers}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Family Aadhar Numbers</Label>
                                        <div className="space-y-1 mt-1">
                                            {application.familyAadharNumbers?.map((aadhar: string, idx: number) => (
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
                                        <p className="font-medium">{application.district}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Taluka</Label>
                                        <p className="font-medium">{application.taluka}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Village</Label>
                                        <p className="font-medium">{application.village}</p>
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
                                        <p className="font-medium">{application.animalCount ?? "N/A"}</p>
                                    </div>
                                    {application.animalTagNumber && (
                                        <div>
                                            <Label className="text-muted-foreground">Animal Tag Number</Label>
                                            <p className="font-medium font-mono">{application.animalTagNumber}</p>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-muted-foreground">Land Holding (acres)</Label>
                                        <p className="font-medium">{application.landHolding}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Khasra Number</Label>
                                        <p className="font-medium">{application.khasraNumber}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Milk Pouring Point</Label>
                                        <p className="font-medium">{application.milkPouringPoint}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Farmer Pourer Code</Label>
                                        <p className="font-medium font-mono">{application.farmerPourerCode}</p>
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
                                    <p className="font-medium text-base mt-1">{application.component}</p>
                                </div>
                                {application.componentDetails?.benefits && (
                                    <div>
                                        <Label className="text-muted-foreground">Benefits</Label>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            {application.componentDetails.benefits.map((benefit: string, idx: number) => (
                                                <li key={idx} className="text-sm">{benefit}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {application.componentDetails?.customQuestions?.length > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground">Component-Specific Information</Label>
                                        <div className="mt-2 space-y-2">
                                            {application.componentDetails.customQuestions.map((q: { label: string; answer: string }, idx: number) => (
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
                                {application.documents?.map((doc: { name: string; uploaded: boolean; url?: string }, idx: number) => (
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

                        {showReviewActions && application.status === "Pending" && (
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
        </>
    );
}