"use client";
import { useState, useEffect } from "react";
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
import { useFrappeGetDoc } from "frappe-react-sdk";

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
    const [villageName, setVillageName] = useState<string>("");

    // Fetch full application details including criteria child table
    const { data: fullAppDoc, isLoading: isLoadingFullApp } = useFrappeGetDoc(
        "App Form",
        application?.id || null
    );

    // Fetch village details to get the actual village name (name1 field)
    const { data: villageDoc } = useFrappeGetDoc(
        "Village Master",
        application?.village && application.village !== 'N/A' ? application.village : null
    );

    // Update village name when village document is fetched
    useEffect(() => {
        if (villageDoc?.name1) {
            setVillageName(villageDoc.name1);
        } else if (application?.village) {
            setVillageName(application.village);
        } else {
            setVillageName('N/A');
        }
    }, [villageDoc, application?.village]);

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
    console.log("full app doc", fullAppDoc)
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
                                        <p className="font-medium">{villageName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Leaf className="w-4 h-4" />
                                    Eligibility Criteria
                                </h3>
                                <div className="space-y-3 text-sm">
                                    {isLoadingFullApp ? (
                                        <p className="text-muted-foreground">Loading criteria...</p>
                                    ) : fullAppDoc?.criteria && Array.isArray(fullAppDoc.criteria) && fullAppDoc.criteria.length > 0 ? (
                                        fullAppDoc.criteria.map((criterion: any, idx: number) => {
                                            // Check for both 'value' and 'file' keys
                                            const displayValue = criterion.file || criterion.value;
                                            const valueStr = String(displayValue || '');
                                            const isDocumentLink = valueStr && (
                                                valueStr.startsWith('http') ||
                                                valueStr.includes('/files/') ||
                                                valueStr.includes('/private/files/')
                                            );

                                            return (
                                                <div key={idx}>
                                                    <Label className="text-muted-foreground">{criterion.criteria}</Label>
                                                    {isDocumentLink ? (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                {valueStr.split('/').pop() || 'Document'}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(valueStr, '_blank')}
                                                                className="h-7 text-xs"
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium">{displayValue || "N/A"}</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-muted-foreground">No criteria data available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Component Details
                            </h3>
                            <div className="p-4 bg-primary/5 rounded-lg space-y-4">
                                {isLoadingFullApp ? (
                                    <p className="text-muted-foreground">Loading components...</p>
                                ) : fullAppDoc?.components && Array.isArray(fullAppDoc.components) && fullAppDoc.components.length > 0 ? (
                                    fullAppDoc.components.map((comp: any, idx: number) => (
                                        <div key={idx} className="mb-3 last:mb-0">
                                            <Label className="text-muted-foreground">Component {idx + 1}</Label>
                                            <p className="font-medium text-base mt-1">{comp.component}</p>
                                            {comp.response && comp.response !== '{}' && (() => {
                                                try {
                                                    const parsed = JSON.parse(comp.response);
                                                    // If response is an array of question/value objects, render in readable form
                                                    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((r: any) => r && (r.question !== undefined || r.value !== undefined))) {
                                                        return (
                                                            <div className="mt-2">
                                                                <Label className="text-muted-foreground text-xs">Response Data</Label>
                                                                <div className="mt-1 space-y-2 text-sm">
                                                                    {parsed.map((item: any, ridx: number) => {
                                                                        const valueStr = String(item.value || '');
                                                                        const isDocumentLink = valueStr && (
                                                                            valueStr.startsWith('http') ||
                                                                            valueStr.includes('/files/') ||
                                                                            valueStr.includes('/private/files/')
                                                                        );

                                                                        return (
                                                                            <div key={ridx} className="p-2 bg-muted/10 rounded">
                                                                                <div>
                                                                                    <Label className="text-muted-foreground text-xs">Question</Label>
                                                                                    <p className="font-medium">{item.question ?? 'N/A'}</p>
                                                                                </div>
                                                                                <div className="mt-1">
                                                                                    <Label className="text-muted-foreground text-xs">Value</Label>
                                                                                    {isDocumentLink ? (
                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                                                {valueStr.split('/').pop() || 'Document'}
                                                                                            </span>
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                onClick={() => window.open(valueStr, '_blank')}
                                                                                                className="h-7 text-xs"
                                                                                            >
                                                                                                <Eye className="w-3 h-3 mr-1" />
                                                                                                View
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="font-medium">{(item.value !== undefined && item.value !== null && String(item.value) !== '') ? String(item.value) : 'N/A'}</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // If parsed is an object that contains question/value pairs (single item)
                                                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                                                        // If it looks like a map of question -> value, render each key
                                                        const entries = Object.entries(parsed);
                                                        if (entries.length > 0) {
                                                            return (
                                                                <div className="mt-2">
                                                                    <Label className="text-muted-foreground text-xs">Response Data</Label>
                                                                    <div className="mt-1 space-y-2 text-sm">
                                                                        {entries.map(([k, v], eidx) => {
                                                                            const valueStr = String(v || '');
                                                                            const isDocumentLink = valueStr && (
                                                                                valueStr.startsWith('http') ||
                                                                                valueStr.includes('/files/') ||
                                                                                valueStr.includes('/private/files/')
                                                                            );

                                                                            return (
                                                                                <div key={eidx} className="p-2 bg-muted/10 rounded">
                                                                                    <Label className="text-muted-foreground text-xs">{k}</Label>
                                                                                    {isDocumentLink ? (
                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                                                {valueStr.split('/').pop() || 'Document'}
                                                                                            </span>
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                onClick={() => window.open(valueStr, '_blank')}
                                                                                                className="h-7 text-xs"
                                                                                            >
                                                                                                <Eye className="w-3 h-3 mr-1" />
                                                                                                View
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="font-medium">{v === null || v === undefined || String(v) === '' ? 'N/A' : String(v)}</p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    }

                                                    // Fallback: pretty-print the JSON
                                                    return (
                                                        <div className="mt-2">
                                                            <Label className="text-muted-foreground text-xs">No Response Data Found</Label>

                                                        </div>
                                                    );
                                                } catch (err) {
                                                    // If JSON.parse fails, show raw response
                                                    return (
                                                        <div className="mt-2">
                                                            <Label className="text-muted-foreground text-xs">Response Data</Label>
                                                            <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto">
                                                                {String(comp.response)}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    ))
                                ) : (
                                    <div>
                                        <Label className="text-muted-foreground">Selected Component</Label>
                                        <p className="font-medium text-base mt-1">{application.component}</p>
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