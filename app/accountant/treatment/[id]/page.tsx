"use client";
export const runtime = 'edge';


import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Dynamic imports for lucide-react icons
const ArrowLeft = dynamic(() => import("lucide-react").then(mod => mod.ArrowLeft), { ssr: false });
const FileText = dynamic(() => import("lucide-react").then(mod => mod.FileText), { ssr: false });
const MapPin = dynamic(() => import("lucide-react").then(mod => mod.MapPin), { ssr: false });
const User = dynamic(() => import("lucide-react").then(mod => mod.User), { ssr: false });
const Stethoscope = dynamic(() => import("lucide-react").then(mod => mod.Stethoscope), { ssr: false });
const Pill = dynamic(() => import("lucide-react").then(mod => mod.Pill), { ssr: false });
const Loader2 = dynamic(() => import("lucide-react").then(mod => mod.Loader2), { ssr: false });
const Image = dynamic(() => import("lucide-react").then(mod => mod.Image), { ssr: false });
const CheckCircle = dynamic(() => import("lucide-react").then(mod => mod.CheckCircle), { ssr: false });

// Dynamic imports for UI components
const Button = dynamic(() => import("@/components/ui/button").then(mod => mod.Button), { ssr: false });
const Card = dynamic(() => import("@/components/ui/card").then(mod => mod.Card), { ssr: false });
const CardContent = dynamic(() => import("@/components/ui/card").then(mod => mod.CardContent), { ssr: false });
const CardHeader = dynamic(() => import("@/components/ui/card").then(mod => mod.CardHeader), { ssr: false });
const CardTitle = dynamic(() => import("@/components/ui/card").then(mod => mod.CardTitle), { ssr: false });
const Badge = dynamic(() => import("@/components/ui/badge").then(mod => mod.Badge), { ssr: false });
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false });

interface ImageTableEntry {
    image: string;
}

interface TreatmentDoc {
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
    symptom?: Array<{ symtomp: string }>;
    primary_treatment?: string;
    actual_treatment_outcome?: string;
    suggested_treatment?: string;
    treatment_given?: string;
    treatment_date?: string;
    follow_up_observations?: string;
    gallery_table?: ImageTableEntry[];
    medicine?: Array<{
        date?: string;
        medicine_name?: string;
        dose?: string;
        schedule?: string;
        route_of_administration?: string;
        batch_number?: string;
        expiry_date?: string;
        price?: number;
    }>;
    docstatus?: number;
}

export default function AccountantViewTreatmentApplication() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const applicationId = params?.id ? decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id) : null;

    const { data: treatmentDoc, isLoading, error, mutate } = useFrappeGetDoc<TreatmentDoc>(
        "Treatment of Infertile Animal",
        applicationId || "",
        applicationId ? undefined : null
    );

    const { updateDoc } = useFrappeUpdateDoc();

    const handleApproveAndSubmit = async () => {
        if (!applicationId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await updateDoc("Treatment of Infertile Animal", applicationId, {
                docstatus: 1
            });

            toast({
                title: "Application Submitted",
                description: "The treatment application has been approved and submitted successfully.",
            });

            mutate();
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err.message || "Failed to submit the application.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !treatmentDoc) {
        return (
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">Application not found</p>
                            <Button onClick={() => router.push("/accountant/treatment")}>
                                Back to Review List
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/accountant/treatment")}
                            data-testid="button-back"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                                    <Stethoscope className="w-6 h-6" />
                                    Review Application
                                </h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                    Treatment of Infertile Animal
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid="text-app-id">{treatmentDoc.name}</p>
                        </div>

                    </div>

                    {treatmentDoc.docstatus === 0 && (
                        <Button
                            className="gap-2"
                            onClick={handleApproveAndSubmit}
                            disabled={isSubmitting}
                            data-testid="button-submit"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Approve & Submit
                        </Button>
                    )}

                    {treatmentDoc.docstatus === 1 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1 inline" />
                            Submitted
                        </Badge>
                    )}
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {treatmentDoc.docstatus === 0 && (
                            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                <strong>Review needed:</strong> This application is currently in <strong>Draft</strong>. Verify the treatment and medicine details before approving fund release.
                            </div>
                        )}

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Owner & Animal Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">Owner Name</p>
                                        <p className="font-semibold text-lg">{treatmentDoc.first_name} {treatmentDoc.middle_name} {treatmentDoc.surname}</p>
                                        <p className="text-xs text-muted-foreground font-mono mt-1">Aadhar: {treatmentDoc.aadhar_number || "N/A"}</p>
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
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
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
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4" />
                                    Diagnosis & Treatment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <p className="text-sm text-muted-foreground mb-2">Symptoms Observed</p>
                                    <div className="flex flex-wrap gap-2">
                                        {treatmentDoc.symptom && treatmentDoc.symptom.length > 0 ? (
                                            treatmentDoc.symptom.map((s, idx) => (
                                                <Badge key={idx} variant="outline" className="bg-card">{s.symtomp}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">No symptoms recorded</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{treatmentDoc.follow_up_observations || "No observations recorded"}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Pill className="w-4 h-4" />
                                    Medicines & Expenses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {treatmentDoc.medicine && treatmentDoc.medicine.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Date</th>
                                                    <th className="text-left p-3 font-medium">Medicine</th>
                                                    <th className="text-left p-3 font-medium">Dose/Schedule</th>
                                                    <th className="text-left p-3 font-medium">Batch/Expiry</th>
                                                    <th className="text-right p-3 font-medium">Price (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {treatmentDoc.medicine.map((m, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                        <td className="p-3 whitespace-nowrap">{m.date}</td>
                                                        <td className="p-3 font-medium">{m.medicine_name}</td>
                                                        <td className="p-3">
                                                            <div className="text-xs">{m.dose}</div>
                                                            <div className="text-xs text-muted-foreground">{m.schedule}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="text-xs font-mono">{m.batch_number}</div>
                                                            <div className="text-[10px] text-muted-foreground">Exp: {m.expiry_date}</div>
                                                        </td>
                                                        <td className="p-3 text-right font-semibold">
                                                            ₹{m.price?.toLocaleString("en-IN") || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-primary/5 font-bold">
                                                <tr>
                                                    <td colSpan={4} className="p-3 text-right">Total Medicine Cost:</td>
                                                    <td className="p-3 text-right text-lg">
                                                        ₹{treatmentDoc.medicine.reduce((sum, m) => sum + (m.price || 0), 0).toLocaleString("en-IN")}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground italic">
                                        No medicine records found for this treatment.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {treatmentDoc.gallery_table && treatmentDoc.gallery_table.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        Gallery
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {treatmentDoc.gallery_table.map((entry, idx) => {
                                            const imageUrl = entry.image.startsWith('http') ? entry.image : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.image}`;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="group relative border rounded-lg overflow-hidden cursor-pointer bg-muted shadow-sm hover:shadow-md transition-all h-24"
                                                    onClick={() => setPreviewImage(imageUrl)}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Gallery ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>Treatment Image</DialogTitle>
                                </DialogHeader>
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    {previewImage && (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="max-w-full max-h-[70vh] object-contain rounded-md"
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {treatmentDoc.docstatus === 0 && (
                            <div className="flex justify-center pt-8">
                                <Button
                                    size="lg"
                                    className="px-12 py-6 text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                                    onClick={handleApproveAndSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-6 h-6 mr-2" />
                                    )}
                                    Approve and Finalize Payment
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
