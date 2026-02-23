"use client";

import { useRouter, useParams } from "next/navigation";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileText, GraduationCap, MapPin, Building, Users, Image, IndianRupee, Loader2, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { uploadImagesWithCompression } from "@/lib/image-utils";

interface ImageTableEntry {
    name: string;
    image: string;
}

interface PDFTableEntry {
    name: string;
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

export default function ViewFarmerTrainingApplication({ id }: { id: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const applicationId = decodeURIComponent(id);

    const { data: application, isLoading, error, mutate } = useFrappeGetDoc<Application>(
        "Farmer Training Application",
        applicationId || "",
        applicationId ? undefined : null
    );


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

    const handleDeleteGalleryImage = async (idx: number, entryName: string) => {
        if (!application) return;
        
        try {
            setDeletingIdx(idx);
            const updatedGalleryTable = application.gallery_table?.filter((_, i) => i !== idx) || [];
            
            await updateDoc("Farmer Training Application", application.name, {
                gallery_table: updatedGalleryTable.map((entry) => ({
                    name: entry.name,
                    image: entry.image,
                })),
            });

            await mutate();

            toast({
                title: "Image removed",
                description: "Gallery image has been deleted successfully.",
            });

            if (application) {
                application.gallery_table = updatedGalleryTable;
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete image. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDeletingIdx(null);
        }
    };

    const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!application) return;
        
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploadingGallery(true);
            const fileCount = files.length;

            // Show immediate feedback
            toast({
                title: "Uploading...",
                description: `Adding ${fileCount} image(s) to gallery...`,
            });
            
            const uploadedImages = await uploadImagesWithCompression(
                Array.from(files),
                { fileType: 'image' }
            );

            const existingGallery = application.gallery_table || [];
            const newGalleryEntries = uploadedImages.map((img) => ({
                image: img.image,
            }));

            await updateDoc("Farmer Training Application", application.name, {
                gallery_table: [
                    ...existingGallery.map((entry) => ({
                        name: entry.name,
                        image: entry.image,
                    })),
                    ...newGalleryEntries,
                ],
            });

            await mutate();

            toast({
                title: "Images added successfully",
                description: `${uploadedImages.length} image(s) added to gallery.`,
            });

            if (galleryInputRef.current) {
                galleryInputRef.current.value = "";
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload images. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploadingGallery(false);
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

    if (error || !application) {
        return (
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">Application not found</p>
                            <Button onClick={() => router.push("/subadmin/farmer-training")}>
                                Back to Applications
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
                            onClick={() => router.push("/admin/farmer-training")}
                            data-testid="button-back"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                                <FileText className="w-6 h-6" />
                                Training Application Details
                            </h1>
                            <p className="text-sm text-muted-foreground" data-testid="text-app-id">{application.name}</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-4xl">
                        <Card className="border-0 bg-muted/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="font-mono font-semibold text-lg">{application.name}</p>
                                        <p className="text-sm text-muted-foreground">Submitted on {new Date(application.creation).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                        <p className="font-medium">{application.venue_type}</p>
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
                                        Participants
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Participants</p>
                                        <p className="font-medium text-2xl">{application.number_of_participants}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Male Participants</p>
                                            <p className="font-medium text-lg">{application.no_of_male || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Female Participants</p>
                                            <p className="font-medium text-lg">{application.no_of_female || 0}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Budget</p>
                                        <p className="font-semibold text-lg">{formatCurrency(getTotalBudget())}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Participant List PDFs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {application.images_table && application.images_table.length > 0 ? (
                                    <div className="space-y-2">
                                        {application.images_table.map((entry, idx) => {
                                            const pdfUrl = entry.pdf_file && entry.pdf_file.startsWith('http') ? entry.pdf_file : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.pdf_file || ''}`;
                                            const fileName = pdfUrl.split('/').pop() || `PDF ${idx + 1}`;
                                            return (
                                                <a
                                                    key={idx}
                                                    href={pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                                                >
                                                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                    <span className="font-medium text-sm truncate">{fileName}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                        <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">No PDFs uploaded</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Image className="w-4 h-4" />
                                    Gallery Images
                                    <Button
                                        onClick={() => galleryInputRef.current?.click()}
                                        disabled={uploadingGallery || isUpdating}
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        {uploadingGallery ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Add Images
                                            </>
                                        )}
                                    </Button>
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleAddGalleryImage}
                                        className="hidden"
                                    />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {application.gallery_table && application.gallery_table.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {application.gallery_table.map((entry, idx) => {
                                            const imageUrl = entry.image.startsWith('http') ? entry.image : `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}${entry.image}`;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "border rounded-lg overflow-hidden transition-shadow relative group",
                                                        uploadingGallery ? "opacity-60" : "cursor-pointer hover:shadow-lg"
                                                    )}
                                                    onClick={() => !uploadingGallery && setPreviewImage(imageUrl)}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Gallery image ${idx + 1}`}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteGalleryImage(idx, entry.name);
                                                        }}
                                                        disabled={deletingIdx === idx || isUpdating || uploadingGallery}
                                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                    >
                                                        {deletingIdx === idx ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">No images uploaded</p>
                                        <p className="text-xs text-muted-foreground mt-1">Click to add images</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                            <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>Image Preview</DialogTitle>
                                </DialogHeader>
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {previewImage && (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="max-w-full max-h-[70vh] object-contain"
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4" />
                                    Fund Allocation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Expected Budget</span>
                                            <span className="font-semibold">{formatCurrency(getExpectedBudget())}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {application.number_of_participants} participants × ₹{EXPENSE_PER_HEAD} per head
                                        </p>
                                    </div>
                                    <div className="p-4 bg-primary/10 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total Allocated</span>
                                            <span className="text-xl font-bold">{formatCurrency(getTotalBudget())}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
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
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Balance Remaining</span>
                                            <span className={cn(
                                                "font-bold text-lg",
                                                getRemainingBudget() < 0 ? "text-destructive" : "text-green-600"
                                            )}>
                                                {formatCurrency(getRemainingBudget())}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
