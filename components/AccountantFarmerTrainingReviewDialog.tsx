"use client";

import { useEffect, useState } from "react";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Building,
    CheckCircle,
    FileText,
    GraduationCap,
    ImageIcon,
    IndianRupee,
    Loader2,
    MapPin,
    Users,
} from "lucide-react";

interface ImageTableEntry {
    image: string;
}

interface PDFTableEntry {
    pdf_file: string;
}

interface FarmerTrainingApplication {
    name: string;
    event_name: string;
    event_date: string;
    district: string;
    taluka: string;
    village: string;
    venue_type: string;
    venue_name: string;
    number_of_participants: number;
    no_of_male?: number;
    no_of_female?: number;
    images_table?: PDFTableEntry[];
    gallery_table?: ImageTableEntry[];
    training_material: number;
    logistics: number;
    refreshment: number;
    docstatus: number;
    creation: string;
}

interface AccountantFarmerTrainingReviewDialogProps {
    applicationId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApproved?: () => void | Promise<void>;
}

const EXPENSE_PER_HEAD = 360;

function getFileUrl(path: string) {
    if (!path) {
        return "";
    }

    return path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${path}`;
}

export default function AccountantFarmerTrainingReviewDialog({
    applicationId,
    open,
    onOpenChange,
    onApproved,
}: AccountantFarmerTrainingReviewDialogProps) {
    const { toast } = useToast();
    const { updateDoc } = useFrappeUpdateDoc();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: application,
        isLoading,
        error,
        mutate,
    } = useFrappeGetDoc<FarmerTrainingApplication>(
        "Farmer Training Application",
        applicationId || "",
        applicationId ? undefined : null
    );

    useEffect(() => {
        if (!open) {
            setPreviewImage(null);
        }
    }, [open]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);

    const getTotalBudget = () => {
        if (!application) {
            return 0;
        }

        return (application.training_material || 0) + (application.logistics || 0) + (application.refreshment || 0);
    };

    const getExpectedBudget = () => {
        if (!application) {
            return 0;
        }

        return application.number_of_participants * EXPENSE_PER_HEAD;
    };

    const getRemainingBudget = () => getExpectedBudget() - getTotalBudget();

    const handleApproveAndSubmit = async () => {
        if (!applicationId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            await updateDoc("Farmer Training Application", applicationId, {
                docstatus: 1,
            });

            await mutate();
            await onApproved?.();

            toast({
                title: "Application Submitted",
                description: "The training application has been approved and submitted successfully.",
            });
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err?.message || "Failed to submit the application. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Review Training Application
                                    </DialogTitle>
                                    {application?.docstatus === 1 && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                            Already Submitted
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription>
                                    {application ? application.name : applicationId || "Loading application"}
                                </DialogDescription>
                            </div>

                            {application?.docstatus === 0 && (
                                <Button
                                    className="gap-2 self-start"
                                    onClick={handleApproveAndSubmit}
                                    disabled={isSubmitting}
                                    data-testid="button-submit-application"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    Approve & Submit
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : error || !application ? (
                            <div className="py-12 text-center">
                                <p className="text-sm text-muted-foreground">Application not found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {application.docstatus === 0 && (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                        <strong>Attention:</strong> This application is in <strong>Draft</strong> status.
                                        Review it before approving.
                                    </div>
                                )}

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <GraduationCap className="h-4 w-4" />
                                            Event Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Event Name</p>
                                                <p className="font-medium">{application.event_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Event Date</p>
                                                <p className="font-medium">
                                                    {new Date(application.event_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <MapPin className="h-4 w-4" />
                                            Location Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">District</p>
                                                <p className="font-medium">{application.district}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Taluka</p>
                                                <p className="font-medium">{application.taluka}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Village</p>
                                                <p className="font-medium">{application.village}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Building className="h-4 w-4" />
                                                Training Venue
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Venue Type</p>
                                                <p className="font-medium text-capitalize">{application.venue_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Venue Name</p>
                                                <p className="font-medium">{application.venue_name}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Users className="h-4 w-4" />
                                                Participants Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Participants</p>
                                                <p className="text-2xl font-medium">{application.number_of_participants}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Male</p>
                                                    <p className="text-lg font-medium">{application.no_of_male || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Female</p>
                                                    <p className="text-lg font-medium">{application.no_of_female || 0}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <IndianRupee className="h-4 w-4" />
                                            Budget & Fund Allocation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-sm text-muted-foreground">Max Allowed Budget</span>
                                                    <span className="font-semibold">{formatCurrency(getExpectedBudget())}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Calculation: {application.number_of_participants} participants x Rs.
                                                    {EXPENSE_PER_HEAD} per head
                                                </p>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="rounded-lg border p-3">
                                                    <p className="mb-1 text-xs text-muted-foreground">Training Material</p>
                                                    <p className="font-semibold">
                                                        {formatCurrency(application.training_material)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border p-3">
                                                    <p className="mb-1 text-xs text-muted-foreground">Logistics</p>
                                                    <p className="font-semibold">{formatCurrency(application.logistics)}</p>
                                                </div>
                                                <div className="rounded-lg border p-3">
                                                    <p className="mb-1 text-xs text-muted-foreground">Refreshment</p>
                                                    <p className="font-semibold">{formatCurrency(application.refreshment)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 rounded-lg bg-primary/10 p-4">
                                                <div>
                                                    <span className="block text-sm font-semibold">Total Claimed Amount</span>
                                                    <span className="text-xs text-muted-foreground">Sum of all allocations</span>
                                                </div>
                                                <span className="text-2xl font-bold">{formatCurrency(getTotalBudget())}</span>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-semibold">Budget Variance</span>
                                                    <span
                                                        className={cn(
                                                            "text-lg font-bold",
                                                            getRemainingBudget() < 0 ? "text-destructive" : "text-green-600"
                                                        )}
                                                    >
                                                        {getRemainingBudget() < 0 ? "-" : "+"}
                                                        {formatCurrency(Math.abs(getRemainingBudget()))}
                                                        <span className="ml-1 text-xs font-normal opacity-70">
                                                            ({getRemainingBudget() < 0 ? "Over Budget" : "Under Budget"})
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <FileText className="h-4 w-4" />
                                            Supporting Documents (PDF)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {application.images_table && application.images_table.length > 0 ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {application.images_table.map((entry, idx) => {
                                                    const pdfUrl = getFileUrl(entry.pdf_file);
                                                    const fileName =
                                                        pdfUrl.split("/").pop() || `Participant List ${idx + 1}`;

                                                    return (
                                                        <a
                                                            key={`${pdfUrl}-${idx}`}
                                                            href={pdfUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted"
                                                        >
                                                            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50 text-red-500">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium">{fileName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Click to view or download
                                                                </p>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
                                                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">
                                                    No participant lists uploaded
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ImageIcon className="h-4 w-4" />
                                            Event Gallery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {application.gallery_table && application.gallery_table.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                                {application.gallery_table.map((entry, idx) => {
                                                    const imageUrl = getFileUrl(entry.image);

                                                    return (
                                                        <div
                                                            key={`${imageUrl}-${idx}`}
                                                            className="group relative cursor-pointer overflow-hidden rounded-lg border bg-muted shadow-sm transition-all hover:shadow-md"
                                                            onClick={() => setPreviewImage(imageUrl)}
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Gallery image ${idx + 1}`}
                                                                className="h-32 w-full object-cover transition-transform group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <ImageIcon className="h-6 w-6 text-white" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
                                                <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                                                <p className="text-sm text-muted-foreground">No gallery images available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {application.docstatus === 0 && (
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            size="lg"
                                            className="px-10 text-base font-semibold"
                                            onClick={handleApproveAndSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="mr-2 h-5 w-5" />
                                            )}
                                            Submit for Fund Release
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-2">
                        {previewImage && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-h-[70vh] max-w-full rounded-md object-contain shadow-2xl"
                                />
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
