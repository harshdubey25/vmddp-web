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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/enums/roles";
import { useToast } from "@/hooks/use-toast";

interface ApplicationDetailsDialogProps {
    application: any | null;
    isOpen: boolean;
    onClose: () => void;
    onReview?: (action: "approve" | "reject", remarks: string, selectedComponents: string[]) => void;
    showReviewActions?: boolean;
    page?: 'selection' | 'application' | 'dashboard';
}

export default function ApplicationDetailsDialog({
    page,
    application,
    isOpen,
    onClose,
    onReview,
    showReviewActions = true
}: ApplicationDetailsDialogProps) {
    const { user, loading } = useAuth();
    const isAdmin = !!user?.roles?.includes(UserRole.VMDDP_ADMIN);
    const { toast } = useToast();
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
    const [remarks, setRemarks] = useState("");
    const [villageName, setVillageName] = useState<string>("");
    const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

    // Fetch full application details including criteria child table
    const { data: fullAppDoc, isLoading: isLoadingFullApp } = useFrappeGetDoc(
        "App Form",
        application?.id || null
    );
    console.log('fullAppDoc', fullAppDoc)

    // Fetch village details to get the actual village name (name1 field)
    const { data: villageDoc } = useFrappeGetDoc(
        "Village Master",
        application?.village && application.village !== '--' ? application.village : null
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
        // Check if components are selected when approving
        if (action === "approve" && selectedComponents.length === 0) {
            toast({
                title: "No components selected",
                description: "Please select at least one component to approve.",
                variant: "destructive",
            });
            return;
        }
        setReviewAction(action);
        setShowReviewDialog(true);
    };

    const handleSubmitReview = () => {
        if (onReview && reviewAction) {
            onReview(reviewAction, remarks, selectedComponents);
        }
        setShowReviewDialog(false);
        setReviewAction(null);
        setRemarks("");
        setSelectedComponents([]);
        onClose();
    };

    const documents: { name: string; uploaded: boolean; url?: string }[] = [];
    if (fullAppDoc) {
        if (fullAppDoc.self_ration_card_image) {
            documents.push({ name: 'Self Ration Card', uploaded: true, url: fullAppDoc.self_ration_card_image });
        }
        if (fullAppDoc.family_ration_card_image) {
            documents.push({ name: 'Family Ration Card', uploaded: true, url: fullAppDoc.family_ration_card_image });
        }
        if (fullAppDoc.aadhar_image && typeof fullAppDoc.aadhar_image === 'string' && fullAppDoc.aadhar_image.startsWith('http')) {
            documents.push({ name: 'Aadhaar Card', uploaded: true, url: fullAppDoc.aadhar_image });
        }

        if (Array.isArray(fullAppDoc.components)) {
            fullAppDoc.components.forEach((component: any) => {
                if (component?.response && typeof component.response === 'string') {
                    try {
                        const responseData = JSON.parse(component.response);
                        if (responseData && typeof responseData === 'object') {
                            if (responseData.aadhar_image && typeof responseData.aadhar_image === 'string') {
                                documents.push({
                                    name: `${component.component} - Aadhaar Card`,
                                    uploaded: true,
                                    url: responseData.aadhar_image
                                });
                            }
                        }
                    } catch (e) { }
                }
            });
        }
    }
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
                                        <p className="font-medium">
                                            {fullAppDoc?.first_name || application.firstName || ''} {fullAppDoc?.mid_name || application.middleName || ''} {fullAppDoc?.last_name || application.lastName || ''}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Gender</Label>
                                        <p className="font-medium">{fullAppDoc?.gender || application.gender || '--'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Caste/Category</Label>
                                        <p className="font-medium">{fullAppDoc?.category || application.caste || application.category || '--'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Mobile Number</Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            {fullAppDoc?.mobile || application.mobile || '--'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Aadhaar Number</Label>
                                        <p className="font-medium font-mono">{fullAppDoc?.aadhar_number || application.aadharNumber || application.aadhar_number || '--'}</p>
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
                                        <p className="font-medium">
                                            {(() => {
                                                const v = fullAppDoc?.number_of_members_in_ration_card ?? application.rationCardMembers;
                                                const n = typeof v === 'string' ? parseInt(v as string) : (typeof v === 'number' ? v : 0);
                                                return Number.isFinite(n) && n > 0 ? n : 0;
                                            })()}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Family Aadhar Numbers</Label>
                                        <div className="space-y-1 mt-1">
                                            {(() => {
                                                const possible = [
                                                    fullAppDoc?.family_member_aadhar_number,
                                                ];
                                                let list: string[] = [];
                                                for (const field of possible) {
                                                    if (!field) continue;
                                                    if (Array.isArray(field)) {
                                                        list = field.filter(Boolean).map((x: any) => String(x));
                                                        break;
                                                    }
                                                    if (typeof field === 'string') {
                                                        list = field.split(',').map((s) => s.trim()).filter(Boolean);
                                                        break;
                                                    }
                                                }
                                                return list && list.length > 0 ? (
                                                    list.map((aadhar: string, idx: number) => (
                                                        <p key={idx} className="font-medium text-xs font-mono">{aadhar}</p>
                                                    ))
                                                ) : (
                                                    <p className="font-medium text-muted-foreground">-</p>
                                                );
                                            })()}
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
                                        <p className="font-medium">{fullAppDoc?.district || application.district || '--'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Taluka</Label>
                                        <p className="font-medium">{fullAppDoc?.taluka || application.taluka || '--'}</p>
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
                                            const jsonResponse = criterion.response;
                                            const parsedResponse = jsonResponse ? (() => {
                                                try {
                                                    return JSON.parse(jsonResponse);
                                                } catch (e) {
                                                    return null;
                                                }
                                            })() : null;

                                            // If there's a value in the response, use it
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
                                                    ) : criterion.type === 'checkbox' ? <p>{displayValue ? "Yes" : "No"}</p> : (
                                                        <>
                                                            <p className="font-medium">{displayValue || "N/A"}</p>
                                                            {parsedResponse && <div>{parsedResponse.map((parsedObject: any, idx: number) => <div key={idx}>
                                                                <p>{parsedObject.name}</p>  <p>{parsedObject.value}</p>

                                                            </div>)}</div>}
                                                        </>
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
                                    (() => {
                                        // Filter components based on page
                                        let componentsToShow = fullAppDoc.components;
                                        if (page === 'selection') {
                                            // Filter to show only components with status "Approved" or "Selected"
                                            componentsToShow = fullAppDoc.components.filter((comp: any) =>
                                                comp.component_status === 'Approved' || comp.component_status === 'Selected'
                                            );
                                        }

                                        return componentsToShow.map((comp: any, idx: number) => (
                                            <div key={idx} className="mb-3 last:mb-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <Label className="text-muted-foreground">Component {idx + 1}</Label>
                                                        <p className="font-medium text-base mt-1">{comp.component}</p>
                                                    </div>
                                                    {showReviewActions && application.status === "Pending" && !loading && !isAdmin && (
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`component-${idx}`}
                                                                checked={selectedComponents.includes(comp.component)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedComponents([...selectedComponents, comp.component]);
                                                                    } else {
                                                                        setSelectedComponents(selectedComponents.filter(c => c !== comp.component));
                                                                    }
                                                                }}
                                                            />
                                                            <Label
                                                                htmlFor={`component-${idx}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                Approve
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>
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

                                                        // Fallback: hide if no valid response data
                                                        return null;
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
                                        ));
                                    })()
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
                                {documents.length > 0 ? (
                                    documents.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                                                    Uploaded
                                                </Badge>
                                                {doc.url && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => window.open(doc.url!, '_blank')}
                                                        data-testid={`button-view-document-${doc.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        View
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                                )}
                            </div>
                        </div>

                        {showReviewActions && application.status === "Pending" && !loading && !isAdmin && (
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
                                Please provide remarks for this decision (maximum 30 characters)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {reviewAction === "approve" && selectedComponents.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Selected Components for Approval</Label>
                                    <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                                        {selectedComponents.map((component, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-chart-3" />
                                                <span className="text-sm font-medium">{component}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {reviewAction === "approve" && selectedComponents.length === 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> No components selected. Please select at least one component to approve.
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Enter your remarks..."
                                    value={remarks}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 30) {
                                            setRemarks(value);
                                        }
                                    }}
                                    rows={4}
                                    data-testid="textarea-remarks"
                                    maxLength={30}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {remarks.length}/30 characters
                                </p>
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
                                    disabled={!remarks.trim() || (reviewAction === "approve" && selectedComponents.length === 0)}
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