"use client";
export const runtime = 'edge';


import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFrappeGetDoc, useFrappeAuth, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Dynamic imports for lucide-react icons
const ArrowLeft = dynamic(() => import("lucide-react").then(mod => mod.ArrowLeft), { ssr: false });
const FileText = dynamic(() => import("lucide-react").then(mod => mod.FileText), { ssr: false });
const GraduationCap = dynamic(() => import("lucide-react").then(mod => mod.GraduationCap), { ssr: false });
const MapPin = dynamic(() => import("lucide-react").then(mod => mod.MapPin), { ssr: false });
const Building = dynamic(() => import("lucide-react").then(mod => mod.Building), { ssr: false });
const Users = dynamic(() => import("lucide-react").then(mod => mod.Users), { ssr: false });
const Image = dynamic(() => import("lucide-react").then(mod => mod.Image), { ssr: false });
const IndianRupee = dynamic(() => import("lucide-react").then(mod => mod.IndianRupee), { ssr: false });
const Loader2 = dynamic(() => import("lucide-react").then(mod => mod.Loader2), { ssr: false });
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

interface PDFTableEntry {
    pdf_file: string;
}

interface Application {
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

const EXPENSE_PER_HEAD = 360;

export default function AccountantViewFarmerTrainingApplication() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const applicationId = params?.id ? decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id) : null;

    const { data: application, isLoading, error, mutate } = useFrappeGetDoc<Application>(
        "Farmer Training Application",
        applicationId || "",
        applicationId ? undefined : null
    );

    const { updateDoc } = useFrappeUpdateDoc();

    const handleApproveAndSubmit = async () => {
        if (!applicationId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // In Frappe, setting docstatus to 1 submits the document
            await updateDoc("Farmer Training Application", applicationId, {
                docstatus: 1
            });

            toast({
                title: "Application Submitted",
                description: "The training application has been approved and submitted successfully.",
            });

            mutate(); // Refresh the data
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err.message || "Failed to submit the application. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTotalBudget = () => {
        if (!application) return 0;
        return (application.training_material || 0) + (application.logistics || 0) + (application.refreshment || 0);
    };

    const getExpectedBudget = () => {
        if (!application) return 0;
        return application.number_of_participants * EXPENSE_PER_HEAD;
    };

    const getRemainingBudget = () => {
        return getExpectedBudget() - getTotalBudget();
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

    if (error || !application) {
        return (
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">Application not found</p>
                            <Button onClick={() => router.push("/accountant/farmer-training")}>
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
                            onClick={() => router.push("/accountant/farmer-training")}
                            data-testid="button-back"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                                    <FileText className="w-6 h-6" />
                                    Review Training Application
                                </h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                    Farmer Training
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid="text-app-id">{application.name}</p>
                        </div>

                    </div>

                    {application.docstatus === 0 && (
                        <Button
                            className="gap-2"
                            onClick={handleApproveAndSubmit}
                            disabled={isSubmitting}
                            data-testid="button-submit-application"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Approve & Submit
                        </Button>
                    )}

                    {application.docstatus === 1 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1 inline" />
                            Already Submitted
                        </Badge>
                    )}
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* Status Alert for Accountant */}
                        {application.docstatus === 0 && (
                            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                <strong>Attention:</strong> This application is in <strong>Draft</strong> status. Please review the details below before approving it.
                            </div>
                        )}

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Event Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Event Name</p>
                                        <p className="font-medium">{application.event_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Event Date</p>
                                        <p className="font-medium">{new Date(application.event_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Building className="w-4 h-4" />
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
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Participants Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Participants</p>
                                        <p className="font-medium text-2xl">{application.number_of_participants}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Male</p>
                                            <p className="font-medium text-lg">{application.no_of_male || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Female</p>
                                            <p className="font-medium text-lg">{application.no_of_female || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4" />
                                    Budget & Fund Allocation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Max Allowed Budget</span>
                                            <span className="font-semibold">{formatCurrency(getExpectedBudget())}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Calculation: {application.number_of_participants} participants × ₹{EXPENSE_PER_HEAD} per head
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Training Material</p>
                                            <p className="font-semibold">{formatCurrency(application.training_material)}</p>
                                        </div>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Logistics</p>
                                            <p className="font-semibold">{formatCurrency(application.logistics)}</p>
                                        </div>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Refreshment</p>
                                            <p className="font-semibold">{formatCurrency(application.refreshment)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary/10 rounded-lg flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold block text-sm">Total Claimed Amount</span>
                                            <span className="text-xs text-muted-foreground">Sum of all allocations</span>
                                        </div>
                                        <span className="text-2xl font-bold">{formatCurrency(getTotalBudget())}</span>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Budget Variance</span>
                                            <span className={cn(
                                                "font-bold text-lg",
                                                getRemainingBudget() < 0 ? "text-destructive" : "text-green-600"
                                            )}>
                                                {getRemainingBudget() < 0 ? "-" : "+"}{formatCurrency(Math.abs(getRemainingBudget()))}
                                                <span className="text-xs ml-1 font-normal opacity-70">
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
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Supporting Documents (PDF)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {application.images_table && application.images_table.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {application.images_table.map((entry, idx) => {
                                            const pdfUrl = entry.pdf_file.startsWith('http') ? entry.pdf_file : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.pdf_file}`;
                                            const fileName = pdfUrl.split('/').pop() || `Participant List ${idx + 1}`;
                                            return (
                                                <a
                                                    key={idx}
                                                    href={pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors bg-card"
                                                >
                                                    <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center text-red-500">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate">{fileName}</p>
                                                        <p className="text-xs text-muted-foreground">Click to view/download</p>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="border border-dashed rounded-lg p-8 text-center bg-muted/20">
                                        <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                        <p className="text-sm text-muted-foreground">No participant lists uploaded</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Image className="w-4 h-4" />
                                    Event Gallery
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {application.gallery_table && application.gallery_table.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {application.gallery_table.map((entry, idx) => {
                                            const imageUrl = entry.image.startsWith('http') ? entry.image : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.image}`;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="group relative border rounded-lg overflow-hidden cursor-pointer bg-muted shadow-sm hover:shadow-md transition-all"
                                                    onClick={() => setPreviewImage(imageUrl)}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Gallery image ${idx + 1}`}
                                                        className="w-full h-32 object-cover transition-transform group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Image className="text-white w-6 h-6" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="border border-dashed rounded-lg p-8 text-center bg-muted/20">
                                        <Image className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                        <p className="text-sm text-muted-foreground">No gallery images available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>Image Preview</DialogTitle>
                                </DialogHeader>
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    {previewImage && (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="max-w-full max-h-[70vh] object-contain rounded-md shadow-2xl"
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Action Section at bottom */}
                        {application.docstatus === 0 && (
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
                                    Submit for Fund Release
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
