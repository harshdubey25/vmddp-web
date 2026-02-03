"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFrappePostCall, useFrappeGetCall, useFrappeFileUpload } from "frappe-react-sdk";
import { CardSkeleton } from "@/components/LoadingSkeletons";
import { ArrowLeft, CreditCard, User, FileText, MapPin, Package, Upload, X, AlertCircle, Check, IndianRupee, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

enum DDComponents {
    HGM = "HGM (Pregnant cow)",
    ANIMAL_INDUCTION = "Animal Induction",
}

export default function DDCollectionForm({
    applicationId
}: {
    applicationId: string;
}) {

    const { toast } = useToast();
    const router = useRouter();

    console.log("Application ID:", applicationId);

    const { data: applicationResponse, isLoading: loading, error } = useFrappeGetCall(
        "vmddp_app.api.v1.accountant.get_application_details",
        { app_form: applicationId },
        undefined,
        { revalidateOnFocus: false }
    );

    const application = applicationResponse?.message?.[0];
    console.log("Fetched Application:", application);

    const { call: submitDD, loading: isSubmitting, error: submitError } = useFrappePostCall(
        "vmddp_app.api.v1.accountant.submit_dd_application"
    );

    const [ddFormData, setDdFormData] = useState({
        animalType: "",
        ddNumber: "",
        ddDate: "",
        bankName: "",
        branchName: "",
        amount: "",
        ddImage: null as string | null,
    });

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const { upload } = useFrappeFileUpload();

    useEffect(() => {
        if (submitError) {
            toast({
                title: "Submission Failed",
                description: submitError.message || "Failed to record DD. Please try again.",
                variant: "destructive",
            });
        }
    }, [submitError, toast]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please upload an image smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }

            setIsUploadingImage(true);
            try {
                const uploadedFile = await upload(file, {
                    isPrivate: true,

                });

                if (uploadedFile?.file_url) {
                    const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '';
                    const fullImageUrl = uploadedFile.file_url.startsWith('http')
                        ? uploadedFile.file_url
                        : `${baseUrl}${uploadedFile.file_url}`;
                    setDdFormData((prev) => ({ ...prev, ddImage: fullImageUrl }));
                    toast({
                        title: "Image uploaded",
                        description: "DD image has been uploaded successfully",
                    });
                }
            } catch (error: any) {
                console.error("Image upload error:", error);
                toast({
                    title: "Upload failed",
                    description: error.message || "Failed to upload image. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const removeImage = () => {
        setDdFormData((prev) => ({ ...prev, ddImage: null }));
    };

    const isFormValid = () => {
        return (
            ddFormData.animalType !== "" &&
            ddFormData.ddNumber.trim() !== "" &&
            ddFormData.ddDate !== "" &&
            ddFormData.bankName !== "" &&
            ddFormData.amount !== "" &&
            parseFloat(ddFormData.amount) > 0
        );
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast({
                title: "Validation Error",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await submitDD({
                app_form: applicationId,
                animal_type: ddFormData.animalType,
                dd_number: ddFormData.ddNumber,
                dd_date: ddFormData.ddDate,
                amount: application?.amount || ddFormData.amount,
                bank_name: ddFormData.bankName,
                branch_name: ddFormData.branchName,
                component: application?.component_name,
                dd_image: ddFormData.ddImage,
            });

            if (response?.message.success) {
                toast({
                    title: "DD Recorded Successfully",
                    description: `DD #${ddFormData.ddNumber} for ₹${parseFloat(application?.amount || ddFormData.amount).toLocaleString("en-IN")} has been recorded`,
                });

                // Redirect to DD collection list after successful submission
                setTimeout(() => {
                    router.push("/accountant/dd?tab=approved");
                }, 1500);
            } else {
                throw new Error(response?.message || "Failed to submit DD");
            }
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to record DD. Please try again.",
                variant: "destructive",
            })
        }
    };

    // Update the amount in the form data when componentData is available
    useEffect(() => {
        if (application?.amount) {
            setDdFormData(prev => ({ ...prev, amount: application.amount.toString() }));
        }
    }, [application?.amount]);

    if (loading) {
        return (
            <div className="bg-background w-full h-screen overflow-y-auto">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <CardSkeleton showHeader={true} showDescription={false} contentLines={4} />
                    <CardSkeleton showHeader={true} showDescription={true} contentLines={6} />
                    <CardSkeleton showHeader={true} showDescription={false} contentLines={3} />
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="h-screen bg-background">

                <div className="ml-72 flex items-center justify-center h-screen">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                Application Not Found
                            </CardTitle>
                            <CardDescription>
                                The application you&apos;re looking for doesn&apos;t exist or has already been processed.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href="/accountant/dd-collection">
                                <Button data-testid="button-back-to-list">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to DD Collection
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background w-full h-screen overflow-y-auto">
            <div className="p-6 space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/accountant/dd">
                        <Button variant="ghost" size="icon" data-testid="button-back">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                            DD Collection
                        </h1>
                        <p className="text-muted-foreground">
                            Record DD for {application.first_name} {application.mid_name} {application.last_name}
                        </p>
                    </div>

                </div>

                {/* Card 1: Beneficiary Information */}
                <Card data-testid="card-beneficiary-info">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Beneficiary Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-medium">{application.first_name} {application.mid_name} {application.last_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                                    <p className="font-medium font-mono">{application.aadhar_number && application.aadhar_number.replace(/(\d{4})/g, "$1 ").trim()}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Location</p>
                                    <p className="font-medium">{application.district}, {application.taluka}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Application ID</p>
                                    <p className="font-medium">{application.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                                    <Package className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">Component</p>
                                    <p className="font-medium">{application?.component_name}</p>
                                    {application?.response && application.component_name === "Animal Induction" && (() => {
                                        try {
                                            const responses = JSON.parse(application.response);
                                            const animals = responses.map((item: any) => item.value).filter(Boolean).join(", ");
                                            return animals ? (
                                                <p className="text-sm text-muted-foreground mt-1">{animals}</p>
                                            ) : null;
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                                    <IndianRupee className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">DD Required</p>
                                    <p className="font-bold text-lg text-primary">₹{application?.amount?.toLocaleString("en-IN") || "0"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                                    <Check className="h-4 w-4 text-orange-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <Badge variant="secondary" className="mt-1">{application?.component_status}</Badge>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Card 2: DD Details Form */}
                <Card data-testid="card-dd-form">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            DD Details
                        </CardTitle>
                        <CardDescription>Enter the demand draft information collected from the beneficiary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="animalType">Type of Animal *</Label>
                                <Select
                                    value={ddFormData.animalType}
                                    onValueChange={(value) => setDdFormData({ ...ddFormData, animalType: value })}
                                >
                                    <SelectTrigger id="animalType" data-testid="select-animal-type">
                                        <SelectValue placeholder="Select animal type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {application?.component_name.toLowerCase() === DDComponents.ANIMAL_INDUCTION.toLowerCase() ? (
                                            <>
                                                <SelectItem value="Desi Cow">Desi Cow</SelectItem>
                                                <SelectItem value="CrossBreed">CrossBreed</SelectItem>
                                                <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            </>
                                        ) : application?.component_name.toLowerCase() === DDComponents.HGM.toLowerCase() ? (
                                            <>
                                                <SelectItem value="Cow">Cow</SelectItem>
                                                <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Desi Cow">Desi Cow</SelectItem>
                                                <SelectItem value="CrossBreed">CrossBreed</SelectItem>
                                                <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ddNumber">DD Number *</Label>
                                <Input
                                    id="ddNumber"
                                    placeholder="Enter DD number"
                                    value={ddFormData.ddNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setDdFormData({ ...ddFormData, ddNumber: value });
                                    }}
                                    data-testid="input-dd-number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ddDate">DD Date *</Label>
                                <div className="relative">
                                    <Input
                                        id="ddDate"
                                        type="date"
                                        value={ddFormData.ddDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setDdFormData({ ...ddFormData, ddDate: e.target.value })}
                                        data-testid="input-dd-date"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₹) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={application?.amount || ""}
                                    readOnly
                                    data-testid="input-amount"
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name *</Label>
                                <Input
                                    id="bankName"
                                    placeholder="Enter bank name"
                                    value={ddFormData.bankName}
                                    onChange={(e) => setDdFormData({ ...ddFormData, bankName: e.target.value })}
                                    data-testid="input-branch"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branchName">Branch Name</Label>
                                <Input
                                    id="branchName"
                                    placeholder="Enter branch name"
                                    value={ddFormData.branchName}
                                    onChange={(e) => setDdFormData({ ...ddFormData, branchName: e.target.value })}
                                    data-testid="input-branch"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* DD Image Upload */}
                        <div className="space-y-2">
                            <Label>DD Image (Optional)</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center" data-testid="upload-dd-image-area">
                                {isUploadingImage ? (
                                    <div className="flex flex-col items-center gap-3 py-4">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-sm text-muted-foreground">Uploading image...</p>
                                    </div>
                                ) : ddFormData.ddImage ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-3 py-6">
                                            <div className="p-3 rounded-full bg-green-500/10">
                                                <Check className="h-8 w-8 text-green-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-green-600 dark:text-green-400">DD Image Uploaded Successfully</p>
                                                <p className="text-xs text-muted-foreground break-all mt-1">{ddFormData.ddImage}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeImage}
                                                data-testid="button-remove-image"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Remove Image
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label htmlFor="ddImage" className="cursor-pointer block">
                                        <div className="flex flex-col items-center gap-3 py-4">
                                            <div className="p-3 rounded-full bg-muted">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Click to upload DD image</span>
                                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                                            </div>
                                        </div>
                                        <input
                                            id="ddImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            data-testid="input-dd-image"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 3: Review & Submit */}
                <Card data-testid="card-review-submit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5" />
                            Review & Submit
                        </CardTitle>
                        <CardDescription>Verify the DD details before recording</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Summary */}
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">DD Number</p>
                                    <p className="font-medium">{ddFormData.ddNumber || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">DD Date</p>
                                    <p className="font-medium">{ddFormData.ddDate || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Bank</p>
                                    <p className="font-medium">{ddFormData.bankName || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-bold text-primary">
                                        {ddFormData.amount ? `₹${parseFloat(ddFormData.amount).toLocaleString("en-IN")}` : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="p-3 bg-yellow-500/10 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                This action will record the DD and update the financial ledger. Please ensure all details are correct before submitting.
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Link href="/accountant/dd ">
                            <Button variant="outline" data-testid="button-cancel">
                                Cancel
                            </Button>
                        </Link>
                        <Button onClick={handleSubmit} disabled={!isFormValid() || isSubmitting} data-testid="button-submit-dd">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Submit & Record DD
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

        </div>
    );
}
