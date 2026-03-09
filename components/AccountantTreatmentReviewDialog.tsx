"use client";

import { useEffect, useState } from "react";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    CheckCircle,
    ImageIcon,
    Loader2,
    MapPin,
    Pill,
    Stethoscope,
    User,
} from "lucide-react";

interface ImageTableEntry {
    image: string;
}

interface TreatmentMedicineEntry {
    date?: string;
    medicine_name?: string;
    dose?: string;
    schedule?: string;
    route_of_administration?: string;
    batch_number?: string;
    expiry_date?: string;
    price?: number;
}

interface TreatmentSymptomEntry {
    symtomp: string;
}

interface TreatmentApplication {
    name: string;
    first_name: string;
    middle_name?: string;
    surname: string;
    aadhar_number?: string;
    village: string;
    creation: string;
    district: string;
    taluka: string;
    animal_type: string;
    tag_number: string;
    examination_date?: string;
    veterinarian_name?: string;
    symptom?: TreatmentSymptomEntry[];
    primary_treatment?: string;
    actual_treatment_outcome?: string;
    suggested_treatment?: string;
    treatment_given?: string;
    treatment_date?: string;
    follow_up_observations?: string;
    gallery_table?: ImageTableEntry[];
    medicine?: TreatmentMedicineEntry[];
    docstatus?: number;
}

interface AccountantTreatmentReviewDialogProps {
    applicationId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApproved?: () => void | Promise<void>;
}

function getFileUrl(path: string) {
    if (!path) {
        return "";
    }

    return path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${path}`;
}

export default function AccountantTreatmentReviewDialog({
    applicationId,
    open,
    onOpenChange,
    onApproved,
}: AccountantTreatmentReviewDialogProps) {
    const { toast } = useToast();
    const { updateDoc } = useFrappeUpdateDoc();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: treatmentDoc,
        isLoading,
        error,
        mutate,
    } = useFrappeGetDoc<TreatmentApplication>(
        "Treatment of Infertile Animal",
        applicationId || "",
        applicationId ? undefined : null
    );

    useEffect(() => {
        if (!open) {
            setPreviewImage(null);
        }
    }, [open]);

    const handleApproveAndSubmit = async () => {
        if (!applicationId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            await updateDoc("Treatment of Infertile Animal", applicationId, {
                docstatus: 1,
            });

            await mutate();
            await onApproved?.();

            toast({
                title: "Application Submitted",
                description: "The treatment application has been approved and submitted successfully.",
            });
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err?.message || "Failed to submit the application.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const medicineTotal = treatmentDoc?.medicine?.reduce((sum, medicine) => sum + (medicine.price || 0), 0) || 0;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5" />
                                        Review Application
                                    </DialogTitle>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        Treatment of Infertile Animal
                                    </Badge>
                                    {treatmentDoc?.docstatus === 1 && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                            Submitted
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription>
                                    {treatmentDoc ? treatmentDoc.name : applicationId || "Loading application"}
                                </DialogDescription>
                            </div>

                            {treatmentDoc?.docstatus === 0 && (
                                <Button
                                    className="gap-2 self-start"
                                    onClick={handleApproveAndSubmit}
                                    disabled={isSubmitting}
                                    data-testid="button-submit"
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
                        ) : error || !treatmentDoc ? (
                            <div className="py-12 text-center">
                                <p className="text-sm text-muted-foreground">Application not found.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {treatmentDoc.docstatus === 0 && (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                        <strong>Review needed:</strong> This application is currently in <strong>Draft</strong>.
                                        Verify the treatment and medicine details before approving fund release.
                                    </div>
                                )}

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <User className="h-4 w-4" />
                                            Owner & Animal Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-6 md:grid-cols-4">
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-muted-foreground">Owner Name</p>
                                                <p className="text-lg font-semibold">
                                                    {treatmentDoc.first_name} {treatmentDoc.middle_name} {treatmentDoc.surname}
                                                </p>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    Aadhar: {treatmentDoc.aadhar_number || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Animal Type</p>
                                                <p className="font-medium">{treatmentDoc.animal_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Tag Number</p>
                                                <p className="font-mono font-medium">{treatmentDoc.tag_number}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <MapPin className="h-4 w-4" />
                                            Location
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">District</p>
                                                <p className="font-medium">{treatmentDoc.district}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Taluka</p>
                                                <p className="font-medium">{treatmentDoc.taluka}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Village</p>
                                                <p className="font-medium">{treatmentDoc.village}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Stethoscope className="h-4 w-4" />
                                            Diagnosis & Treatment Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Veterinarian</p>
                                                <p className="font-medium">{treatmentDoc.veterinarian_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Examination Date</p>
                                                <p className="font-medium">{treatmentDoc.examination_date || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm text-muted-foreground">Symptoms Observed</p>
                                            <div className="flex flex-wrap gap-2">
                                                {treatmentDoc.symptom && treatmentDoc.symptom.length > 0 ? (
                                                    treatmentDoc.symptom.map((symptom, idx) => (
                                                        <Badge key={`${symptom.symtomp}-${idx}`} variant="outline" className="bg-card">
                                                            {symptom.symtomp}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm italic text-muted-foreground">
                                                        No symptoms recorded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Primary Treatment</p>
                                                <p className="font-medium">{treatmentDoc.primary_treatment || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Treatment Date</p>
                                                <p className="font-medium">{treatmentDoc.treatment_date || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Follow-up Observations</p>
                                            <p className="mt-1 rounded bg-muted/50 p-2 text-sm">
                                                {treatmentDoc.follow_up_observations || "No observations recorded"}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="border-b pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Pill className="h-4 w-4" />
                                            Medicines & Expenses
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {treatmentDoc.medicine && treatmentDoc.medicine.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="border-b bg-muted/50">
                                                        <tr>
                                                            <th className="p-3 text-left font-medium">Date</th>
                                                            <th className="p-3 text-left font-medium">Medicine</th>
                                                            <th className="p-3 text-left font-medium">Dose/Schedule</th>
                                                            <th className="p-3 text-left font-medium">Batch/Expiry</th>
                                                            <th className="p-3 text-right font-medium">Price (Rs.)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {treatmentDoc.medicine.map((medicine, idx) => (
                                                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                                <td className="whitespace-nowrap p-3">{medicine.date}</td>
                                                                <td className="p-3 font-medium">{medicine.medicine_name}</td>
                                                                <td className="p-3">
                                                                    <div className="text-xs">{medicine.dose}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {medicine.schedule}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="font-mono text-xs">{medicine.batch_number}</div>
                                                                    <div className="text-[10px] text-muted-foreground">
                                                                        Exp: {medicine.expiry_date}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right font-semibold">
                                                                    Rs. {medicine.price?.toLocaleString("en-IN") || 0}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-primary/5 font-bold">
                                                        <tr>
                                                            <td colSpan={4} className="p-3 text-right">
                                                                Total Medicine Cost:
                                                            </td>
                                                            <td className="p-3 text-right text-lg">
                                                                Rs. {medicineTotal.toLocaleString("en-IN")}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center italic text-muted-foreground">
                                                No medicine records found for this treatment.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {treatmentDoc.gallery_table && treatmentDoc.gallery_table.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <ImageIcon className="h-4 w-4" />
                                                Gallery
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                                {treatmentDoc.gallery_table.map((entry, idx) => {
                                                    const imageUrl = getFileUrl(entry.image);

                                                    return (
                                                        <div
                                                            key={`${imageUrl}-${idx}`}
                                                            className="group relative h-24 cursor-pointer overflow-hidden rounded-lg border bg-muted shadow-sm transition-all hover:shadow-md"
                                                            onClick={() => setPreviewImage(imageUrl)}
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Gallery ${idx + 1}`}
                                                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {treatmentDoc.docstatus === 0 && (
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
                                            Approve and Finalize Payment
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
                        <DialogTitle>Treatment Image</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-full w-full items-center justify-center p-2">
                        {previewImage && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-h-[70vh] max-w-full rounded-md object-contain"
                                />
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
