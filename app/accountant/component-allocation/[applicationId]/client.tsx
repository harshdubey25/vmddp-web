"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FrappeCustomApiResponse, ComponentStatus } from "@/types";
import { parseFrappeError } from "@/lib/frappe-error-parser";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeCreateDoc, useFrappeGetDocList, useFrappeFileUpload, useFrappeUpdateDoc, useFrappePostCall } from "frappe-react-sdk";
import { ArrowLeft, User, Package, Check, AlertCircle, Tag, FileText, IndianRupee, MapPin, Upload, Shield, Truck, Loader2, X, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type AppFormResponse = FrappeCustomApiResponse<{
    name: string;
    first_name: string;
    last_name: string;
    mid_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    dd_amount: string;
    component_status: ComponentStatus;
}>

// Component Allocation Create Type for useFrappeCreateDoc
type ComponentAllocationCreate = {
    application: string;
    component: string;
    dd?: string;
    invoice_upload?: string;
    date_of_purchase?: string;
    type_of_animal?: string;
    vendor?: string;
    tag_number?: string;
    digital_collar_number?: string;
    collar_cost?: number;
    collar_invoice_upload?: string;
    animal_cost?: number;
    insurance_company_name?: string;
    policy_no?: string;
    insurance_start_date?: string;
    insurance_end_date?: string;
    sum_assured?: number;
    premium_paid?: number;
    transportation_cost?: number;
    transportation_invoice_upload?: string;
}
// Animal Induction Types
type AnimalInductionData = {
    // Animal Purchase Details
    invoiceFile: File | null;
    dateOfPurchase: string;
    animalType: string;
    vendorName: string;
    tagNumber: string;
    digitalCollarNumber: string;
    collarCost: string;
    collarInvoiceFile: File | null;
    animalCost: string;
    // Insurance Details
    insuranceCompanyName: string;
    policyNumber: string;
    insuranceStartDate: string;
    insuranceEndDate: string;
    sumAssured: string;
    premiumPaid: string;
    // Transportation
    transportCost: string;
    transportInvoiceFile: File | null;
};

// HGM Types
type HGMData = {
    invoiceFile: File | null;
    dateOfPurchase: string;
    animalType: string;
    vendorName: string;
    tagNumber: string;
    digitalCollarNumber: string;
    collarCost: string;
    collarInvoiceFile: File | null;
    animalCost: string;
    // Insurance Details
    insuranceCompanyName: string;
    policyNumber: string;
    insuranceStartDate: string;
    insuranceEndDate: string;
    sumAssured: string;
    premiumPaid: string;
    // Cheque Details
    chequeNumber: string;
    chequeAmount: string;
    chequeDate: string;
};



const animalTypes = ["Crossbreed", "Desi Cow", "Buffalo"];
const hgmAnimalTypes = ["Cow", "Buffalo"];




const HGM_MAX_COST = 210000; // Maximum eligible expenditure
const HGM_MAX_SUBSIDY = 157000; // Maximum subsidy (75% of max);
const HGM_DD_AMOUNT = 52500; // Fixed DD amount (25% of max)
const HGM_PREGNANT_COW = "HGM (Pregnant cow)";
const ANIMAL_INDUCTION = "Animal Induction";

export default function AllocationForm({
    applicationId
}: {
    applicationId: string;
}) {

    const router = useRouter();
    const { upload, isCompleted, loading, error: fileUploadError, progress, reset } = useFrappeFileUpload()
    const { data, isLoading, error } = useFrappeGetCall<AppFormResponse>('vmddp_app.api.v1.accountant.get_application_data_and_dd_amount', { application_id: applicationId })
    console.log("overall data:", data);

    const { createDoc, loading: createLoading } = useFrappeCreateDoc<ComponentAllocationCreate>();
    const { createDoc: createInsuranceDoc, loading: creatingInsurance } = useFrappeCreateDoc<{ insurance_company_name: string }>();
    const { updateDoc } = useFrappeUpdateDoc();
    const { data: insuranceCompaniesList, isLoading: insuranceLoading, mutate: mutateInsuranceList } = useFrappeGetDocList<{ name: string, insurance_company_name: string }>('Insurance Company', { fields: ['name', 'insurance_company_name'], });
    const { data: vendorsData, isLoading: isLoadingFilteredVendors } = useFrappeGetCall<{
        message: { data: Array<{ vendor_name: string; vendor_label: string }> }
    }>(
        'vmddp_app.api.components.get_vendors_by_component',
        data?.message?.component ? { component: data.message.component } : undefined,
        data?.message?.component ? `vendors_${data.message.component}` : null
    );
    const { call: updateComponentStatus } = useFrappePostCall<void>('vmddp_app.api.v1.accountant.update_component_status');
    const filteredVendors = vendorsData?.message?.data ?? [];
    const { toast } = useToast();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tagError, setTagError] = useState("");
    const [sumAssuredError, setSumAssuredError] = useState("");
    const [showNewInsuranceDialog, setShowNewInsuranceDialog] = useState(false);
    const [newInsuranceCompanyName, setNewInsuranceCompanyName] = useState("");
    const [creatingInsuranceFor, setCreatingInsuranceFor] = useState<"animal" | "hgm">("animal");

    // File upload state tracking
    const [uploadingFiles, setUploadingFiles] = useState<{
        animalInvoice: boolean;
        animalCollarInvoice: boolean;
        animalTransportInvoice: boolean;
        hgmInvoice: boolean;
        hgmCollarInvoice: boolean;
    }>({
        animalInvoice: false,
        animalCollarInvoice: false,
        animalTransportInvoice: false,
        hgmInvoice: false,
        hgmCollarInvoice: false,
    });

    // Uploaded file URLs
    const [uploadedUrls, setUploadedUrls] = useState<{
        animalInvoice: string | null;
        animalCollarInvoice: string | null;
        animalTransportInvoice: string | null;
        hgmInvoice: string | null;
        hgmCollarInvoice: string | null;
    }>({
        animalInvoice: null,
        animalCollarInvoice: null,
        animalTransportInvoice: null,
        hgmInvoice: null,
        hgmCollarInvoice: null,
    });

    // Animal Induction State
    const [animalData, setAnimalData] = useState<AnimalInductionData>({
        invoiceFile: null,
        dateOfPurchase: "",
        animalType: "",
        vendorName: "",
        tagNumber: "",
        digitalCollarNumber: "",
        collarCost: "",
        collarInvoiceFile: null,
        animalCost: "",
        insuranceCompanyName: "",
        policyNumber: "",
        insuranceStartDate: "",
        insuranceEndDate: "",
        sumAssured: "",
        premiumPaid: "",
        transportCost: "",
        transportInvoiceFile: null,
    });

    // HGM State
    const [hgmData, setHgmData] = useState<HGMData>({
        invoiceFile: null,
        dateOfPurchase: "",
        animalType: "",
        vendorName: "",
        tagNumber: "",
        digitalCollarNumber: "",
        collarCost: "",
        collarInvoiceFile: null,
        animalCost: "",
        insuranceCompanyName: "",
        policyNumber: "",
        insuranceStartDate: "",
        insuranceEndDate: "",
        sumAssured: "",
        premiumPaid: "",
        chequeNumber: "",
        chequeAmount: "",
        chequeDate: "",
    });


    // Handle file upload with progress
    type FileUploadKey = 'animalInvoice' | 'animalCollarInvoice' | 'animalTransportInvoice' | 'hgmInvoice' | 'hgmCollarInvoice';

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        fileKey: FileUploadKey,
        dataType: 'animal' | 'hgm',
        dataField: keyof AnimalInductionData | keyof HGMData
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload a file smaller than 5MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingFiles(prev => ({ ...prev, [fileKey]: true }));

        try {
            const uploadedFile = await upload(file, { isPrivate: false });

            if (uploadedFile?.file_url) {
                const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '';
                const fullUrl = uploadedFile.file_url.startsWith('http')
                    ? uploadedFile.file_url
                    : `${baseUrl}${uploadedFile.file_url}`;

                setUploadedUrls(prev => ({ ...prev, [fileKey]: fullUrl }));

                // Update the corresponding data state
                if (dataType === 'animal') {
                    setAnimalData(prev => ({ ...prev, [dataField]: file }));
                } else {
                    setHgmData(prev => ({ ...prev, [dataField]: file }));
                }

                toast({
                    title: "File uploaded",
                    description: "File has been uploaded successfully",
                });
            }
        } catch (error: any) {
            console.error("File upload error:", error);
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
        }
    };

    const removeFile = (fileKey: FileUploadKey, dataType: 'animal' | 'hgm', dataField: keyof AnimalInductionData | keyof HGMData) => {
        setUploadedUrls(prev => ({ ...prev, [fileKey]: null }));
        if (dataType === 'animal') {
            setAnimalData(prev => ({ ...prev, [dataField]: null }));
        } else {
            setHgmData(prev => ({ ...prev, [dataField]: null }));
        }
    };


    const getComponentIcon = (component: string) => {
        if (component === ANIMAL_INDUCTION) return <Tag className="h-5 w-5" />;
        if (component === HGM_PREGNANT_COW) return <Package className="h-5 w-5" />;

        return <Package className="h-5 w-5" />;
    };

    // Validate 12-digit tag number
    const validateTagNumber = (tag: string): boolean => {
        const cleanTag = tag.replace(/\D/g, "");
        return cleanTag.length === 12;
    };

    // Animal Induction Calculations


    // HGM Calculations - 75% of actual cost (max ₹2,10,000), DD fixed at ₹52,500
    // Refund escalated after Parantage Confirmation when DD + Vendor Payment > Animal Cost
    const calculateHGMPayment = () => {
        const animalCost = parseFloat(hgmData.animalCost) || 0;
        const eligibleCost = Math.min(animalCost, HGM_MAX_COST); // Cap at max ₹2,10,000
        const vendorPayment = Math.round(eligibleCost * 0.75); // 75% of eligible cost
        const ddCollected = HGM_DD_AMOUNT; // Fixed DD amount ₹52,500
        const subsidyAmount = Math.min(animalCost * 0.75, HGM_MAX_SUBSIDY)
        const amountPaidByUser = animalCost - subsidyAmount;
        const ddAmount = data ? data.message.dd_amount ? parseFloat(data.message.dd_amount) : 0 : 0
        const refundAmount = ddAmount > amountPaidByUser ? ddAmount - amountPaidByUser : 0;
        // Calculate refund when DD + Vendor Paym8ent exceeds Animal Cost


        return {
            animalCost,
            eligibleCost,
            vendorPayment,
            ddCollected,
            refundAmount,
            physicalAchievement: 1,
        };
    };

    function calculateAnimalSubsidy() {
        const animalCost = parseFloat(animalData.animalCost) || 0;
        const collarCost = parseFloat(animalData.collarCost) || 0;
        const premiumPaid = parseFloat(animalData.premiumPaid) || 0;
        const transportCost = parseFloat(animalData.transportCost) || 0;
        const totalCost = animalCost + collarCost + premiumPaid + transportCost;
        const subsidyAmount = Math.min(totalCost * 0.5, 50000)
        const dd_amount = parseFloat(data?.message.dd_amount || "0");
        const refundAmount = dd_amount > subsidyAmount ? dd_amount - subsidyAmount : 0;
        return {
            totalCost,
            subsidyAmount,
            refundAmount
        }
    }
    function calculateNewHgmSubsidy() {
        const animalCost = parseFloat(hgmData.animalCost) || 0;
        const collarCost = parseFloat(hgmData.collarCost) || 0;
        const premiumPaid = parseFloat(hgmData.premiumPaid) || 0;

        const subsidyAmount = Math.min(animalCost * 0.75, HGM_MAX_SUBSIDY) + premiumPaid + collarCost;
        const amount_paid_by_user = animalCost * 0.25;
        const dd_amount = parseFloat(data?.message.dd_amount || "0");
        const refundAmount = dd_amount > amount_paid_by_user ? dd_amount - amount_paid_by_user : 0;
        const currentVendorPayment = subsidyAmount;
        const afterParantageVendorPayment = animalCost * 0.25;
        return {
            subsidyAmount,
            currentVendorPayment,
            refundAmount,
            afterParantageVendorPayment,
        }
    }
    const isFormValid = () => {
        if (!data?.message) return false;
        if (data.message.component === ANIMAL_INDUCTION) {
            const tagValid = validateTagNumber(animalData.tagNumber);
            return !!(
                animalData.dateOfPurchase &&
                animalData.animalType &&
                animalData.vendorName &&
                animalData.tagNumber &&
                tagValid &&
                animalData.animalCost
            );
        }
        if (data.message.component === HGM_PREGNANT_COW) {
            const tagValid = validateTagNumber(hgmData.tagNumber);
            return !!(
                hgmData.dateOfPurchase &&
                hgmData.animalType &&
                hgmData.vendorName &&
                hgmData.tagNumber &&
                tagValid &&
                hgmData.animalCost
            );
        }

        return false;
    };

    const handleTagChange = (value: string, type: "animal" | "hgm") => {
        if (type === "animal") {
            setAnimalData({ ...animalData, tagNumber: value });
        } else {
            setHgmData({ ...hgmData, tagNumber: value });
        }

        if (value && !validateTagNumber(value)) {
            setTagError("Tag number must be exactly 12 digits");
        } else {
            setTagError("");
        }
    };

    const handleSubmit = () => {
        if (!isFormValid()) {
            toast({
                title: "Missing or Invalid Fields",
                description: "Please fill all required fields correctly",
                variant: "destructive",
            });
            return;
        }

        // Validate that animal cost equals sum assured
        if (data?.message.component === ANIMAL_INDUCTION) {
            const animalCost = parseFloat(animalData.animalCost) || 0;
            const sumAssured = parseFloat(animalData.sumAssured) || 0;
            if (animalData.sumAssured && animalCost !== sumAssured) {
                setSumAssuredError("Animal Cost and Sum Assured must be the same");
                toast({
                    title: "Validation Error",
                    description: "Animal Cost and Sum Assured must be the same",
                    variant: "destructive",
                });
                return;
            }
        }

        if (data?.message.component === HGM_PREGNANT_COW) {
            const animalCost = parseFloat(hgmData.animalCost) || 0;
            const sumAssured = parseFloat(hgmData.sumAssured) || 0;
            if (hgmData.sumAssured && animalCost !== sumAssured) {
                setSumAssuredError("Animal Cost and Sum Assured must be the same");
                toast({
                    title: "Validation Error",
                    description: "Animal Cost and Sum Assured must be the same",
                    variant: "destructive",
                });
                return;
            }
        }

        setSumAssuredError("");
        setShowConfirmation(true);
    };

    const handleConfirmAllocation = async () => {
        if (!data?.message) return;
        setIsSubmitting(true);

        try {
            const isAnimalInduction = data.message.component === ANIMAL_INDUCTION;
            const formData = isAnimalInduction ? animalData : hgmData;

            // Use already uploaded file URLs from uploadedUrls state
            let invoiceUploadUrl: string | undefined;
            let collarInvoiceUploadUrl: string | undefined;
            let transportationInvoiceUploadUrl: string | undefined;

            if (isAnimalInduction) {
                invoiceUploadUrl = uploadedUrls.animalInvoice || undefined;
                collarInvoiceUploadUrl = uploadedUrls.animalCollarInvoice || undefined;
                transportationInvoiceUploadUrl = uploadedUrls.animalTransportInvoice || undefined;
            } else {
                invoiceUploadUrl = uploadedUrls.hgmInvoice || undefined;
                collarInvoiceUploadUrl = uploadedUrls.hgmCollarInvoice || undefined;
            }

            // Prepare the document data with file URLs
            const componentAllocationData: ComponentAllocationCreate = {
                application: applicationId,
                component: data.message.component,
                date_of_purchase: formData.dateOfPurchase || undefined,
                type_of_animal: formData.animalType || undefined,
                vendor: formData.vendorName || undefined,
                tag_number: formData.tagNumber || undefined,
                digital_collar_number: formData.digitalCollarNumber || undefined,
                animal_cost: formData.animalCost ? parseFloat(formData.animalCost) : undefined,
                insurance_company_name: formData.insuranceCompanyName || undefined,
                policy_no: formData.policyNumber || undefined,
                insurance_start_date: formData.insuranceStartDate || undefined,
                insurance_end_date: formData.insuranceEndDate || undefined,
                sum_assured: formData.sumAssured ? parseFloat(formData.sumAssured) : undefined,
                premium_paid: formData.premiumPaid ? parseFloat(formData.premiumPaid) : undefined,
                // Attach uploaded file URLs
                invoice_upload: invoiceUploadUrl,
                collar_invoice_upload: collarInvoiceUploadUrl,
            };

            // Add Animal Induction specific fields
            if (isAnimalInduction) {
                componentAllocationData.collar_cost = animalData.collarCost ? parseFloat(animalData.collarCost) : undefined;
                componentAllocationData.transportation_cost = animalData.transportCost ? parseFloat(animalData.transportCost) : undefined;
                componentAllocationData.transportation_invoice_upload = transportationInvoiceUploadUrl;
            }

            // Create the document (Draft state - docstatus: 0)
            const createdDoc = await createDoc("Component Allocation", componentAllocationData);

            // Submit the document (Submitted state - docstatus: 1)
            await updateDoc("Component Allocation", createdDoc.name, { docstatus: 1 });

            await updateComponentStatus({ application_id: applicationId, component: data.message.component, new_status: 'Component Allocated' });
            toast({
                title: "Component Allocated Successfully",
                description: `Allocation recorded for ${data.message.first_name}. Ledger updated automatically.`,
            });
            setShowConfirmation(false);

            setTimeout(() => {
                router.push("/accountant/component-allocation");
                router.refresh();
            }, 1000);
        } catch (err) {
            console.error("Error creating component allocation:", err);
            const { title, message } = parseFrappeError(err, "Allocation Failed", "Failed to create component allocation. Please try again.");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return <Skeleton className="w-full h-64" />
    }
    if (!applicationId || error || !data?.message) {
        return (
            <div className="h-screen bg-background">

                <div className="ml-72 flex items-center justify-center h-screen">
                    <Card className="w-96">
                        <CardContent className="pt-6 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-lg mb-2">
                                Application Not Found
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                The requested application could not be found.
                            </p>
                            <Link href="/accountant/component-allocation">
                                <Button>Back to Allocations</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-background overflow-scroll ">
            <div className=" w-full  bg-background">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/accountant/component-allocation">
                            <Button variant="ghost" size="icon" data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1
                                className="text-2xl font-display font-bold"
                                data-testid="text-page-title"
                            >
                                Allocate Component
                            </h1>
                            <p className="text-muted-foreground">
                                Complete allocation for {data.message.first_name} {data.message.mid_name} {data.message.last_name}
                            </p>
                        </div>
                        <Badge
                            variant={'default'}
                        > {data.message.component_status}</Badge>
                    </div>

                    {/* Beneficiary Info Card */}
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
                                        <p className="font-medium">{data.message.first_name} {data.message.mid_name} {data.message.last_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Aadhaar Number
                                        </p>
                                        <p className="font-medium font-mono">
                                            {data.message.aadhar_number && data.message.aadhar_number.replace(/(\d{4})/g, "$1 ").trim()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <MapPin className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="font-medium">
                                            {data.message.district}, {data.message.taluka}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Application ID
                                        </p>
                                        <p className="font-medium">{data.message.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    {data.message.component && getComponentIcon(data.message.component)}
                                    <div>
                                        <p className="text-xs text-muted-foreground">Component</p>
                                        <Badge variant="outline" className="mt-1">
                                            {data.message.component}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IndianRupee className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            DD Collected
                                        </p>
                                        <p className="font-medium text-green-600">
                                            ₹{data.message.dd_amount}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 mt-1">
                                            {data.message.component_status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ==================== ANIMAL INDUCTION FORM ==================== */}
                    {data.message?.component === ANIMAL_INDUCTION && (
                        <Card data-testid="card-animal-form">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Animal Induction Details
                                </CardTitle>
                                <CardDescription>
                                    Enter animal purchase, insurance, and transportation details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Animal Purchase Details Section */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Animal Purchase Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Invoice Upload</Label>
                                            <div className="border-2 border-dashed rounded-lg p-2" data-testid="upload-animal-invoice-area">
                                                {uploadingFiles.animalInvoice ? (
                                                    <div className="flex flex-col items-center gap-1 py-1">
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : uploadedUrls.animalInvoice ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-full bg-green-500/10">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-green-600">Uploaded</p>
                                                                <p className="text-xs text-muted-foreground truncate">{animalData.invoiceFile?.name}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => removeFile('animalInvoice', 'animal', 'invoiceFile')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="animalInvoice" className="cursor-pointer block">
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-xs">Click to upload</span>
                                                        </div>
                                                        <input
                                                            id="animalInvoice"
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'animalInvoice', 'animal', 'invoiceFile')}
                                                            className="hidden"
                                                            data-testid="input-animal-invoice"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Purchase *</Label>
                                            <Input
                                                type="date"
                                                value={animalData.dateOfPurchase}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        dateOfPurchase: e.target.value,
                                                    })
                                                }
                                                data-testid="input-animal-purchase-date"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type of Animal *</Label>
                                            <Select
                                                value={animalData.animalType}
                                                onValueChange={(value) =>
                                                    setAnimalData({ ...animalData, animalType: value })
                                                }
                                            >
                                                <SelectTrigger data-testid="select-animal-type">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {animalTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vendor Name *</Label>
                                            <Select
                                                value={animalData.vendorName}
                                                onValueChange={(value) =>
                                                    setAnimalData({ ...animalData, vendorName: value })
                                                }
                                            >
                                                <SelectTrigger data-testid="select-animal-vendor">
                                                    <SelectValue placeholder={isLoadingFilteredVendors ? "Loading..." : "Select vendor"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredVendors?.map((vendor) => (
                                                        <SelectItem key={vendor.vendor_name} value={vendor.vendor_name}>
                                                            {vendor.vendor_label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tag Number * (12 digits)</Label>
                                            <Input
                                                placeholder="Enter 12-digit tag number"
                                                value={animalData.tagNumber}
                                                onChange={(e) =>
                                                    handleTagChange(e.target.value, "animal")
                                                }
                                                maxLength={12}
                                                data-testid="input-tag-number"
                                            />
                                            {tagError && (
                                                <p className="text-xs text-destructive">{tagError}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Digital Collar Number</Label>
                                            <Input
                                                placeholder="Enter collar number"
                                                value={animalData.digitalCollarNumber}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        digitalCollarNumber: e.target.value,
                                                    })
                                                }
                                                data-testid="input-collar-number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Collar Cost (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter collar cost"
                                                value={animalData.collarCost}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        collarCost: e.target.value,
                                                    })
                                                }
                                                data-testid="input-collar-cost"
                                                hideSpinners
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Collar Invoice Upload</Label>
                                            <div className="border-2 border-dashed rounded-lg p-2" data-testid="upload-collar-invoice-area">
                                                {uploadingFiles.animalCollarInvoice ? (
                                                    <div className="flex flex-col items-center gap-1 py-1">
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : uploadedUrls.animalCollarInvoice ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-full bg-green-500/10">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-green-600">Uploaded</p>
                                                                <p className="text-xs text-muted-foreground truncate">{animalData.collarInvoiceFile?.name}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => removeFile('animalCollarInvoice', 'animal', 'collarInvoiceFile')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="animalCollarInvoice" className="cursor-pointer block">
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-xs">Click to upload</span>
                                                        </div>
                                                        <input
                                                            id="animalCollarInvoice"
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'animalCollarInvoice', 'animal', 'collarInvoiceFile')}
                                                            className="hidden"
                                                            data-testid="input-collar-invoice"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Animal Cost (₹) *</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter animal cost"
                                                value={animalData.animalCost}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        animalCost: e.target.value,
                                                    })
                                                }
                                                data-testid="input-animal-cost"
                                                hideSpinners
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Insurance Details Section */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Insurance Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Insurance Company Name</Label>
                                            <Select
                                                value={animalData.insuranceCompanyName}
                                                onValueChange={(value) => {
                                                    if (value === "__add_new__") {
                                                        setCreatingInsuranceFor("animal");
                                                        setShowNewInsuranceDialog(true);
                                                        return;
                                                    }
                                                    setAnimalData({
                                                        ...animalData,
                                                        insuranceCompanyName: value,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger data-testid="select-insurance-company">
                                                    <SelectValue placeholder={insuranceLoading ? "Loading..." : "Select company"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {insuranceCompaniesList?.map((company) => (
                                                        <SelectItem key={company.name} value={company.name}>
                                                            {company.insurance_company_name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="__add_new__">
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <Plus className="h-3 w-3" /> Add New Company
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Policy Number</Label>
                                            <Input
                                                placeholder="Enter policy number"
                                                value={animalData.policyNumber}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        policyNumber: e.target.value,
                                                    })
                                                }
                                                data-testid="input-policy-number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={animalData.insuranceStartDate}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        insuranceStartDate: e.target.value,
                                                    })
                                                }
                                                data-testid="input-insurance-start"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={animalData.insuranceEndDate}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        insuranceEndDate: e.target.value,
                                                    })
                                                }
                                                data-testid="input-insurance-end"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sum Assured (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter sum assured"
                                                value={animalData.sumAssured}
                                                onChange={(e) => {
                                                    setAnimalData({
                                                        ...animalData,
                                                        sumAssured: e.target.value,
                                                    });
                                                    // Clear error when user modifies the field
                                                    if (sumAssuredError) setSumAssuredError("");
                                                }}
                                                data-testid="input-sum-assured"
                                                hideSpinners
                                            />
                                            {sumAssuredError && (
                                                <p className="text-xs text-destructive">{sumAssuredError}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Premium Paid (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter premium paid"
                                                value={animalData.premiumPaid}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        premiumPaid: e.target.value,
                                                    })
                                                }
                                                data-testid="input-premium-paid"
                                                hideSpinners
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Transportation Section */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Transportation
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Transport Cost (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter transport cost"
                                                value={animalData.transportCost}
                                                onChange={(e) =>
                                                    setAnimalData({
                                                        ...animalData,
                                                        transportCost: e.target.value,
                                                    })
                                                }
                                                data-testid="input-transport-cost"
                                                hideSpinners
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Transport Invoice Upload</Label>
                                            <div className="border-2 border-dashed rounded-lg p-2" data-testid="upload-transport-invoice-area">
                                                {uploadingFiles.animalTransportInvoice ? (
                                                    <div className="flex flex-col items-center gap-1 py-1">
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : uploadedUrls.animalTransportInvoice ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-full bg-green-500/10">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-green-600">Uploaded</p>
                                                                <p className="text-xs text-muted-foreground truncate">{animalData.transportInvoiceFile?.name}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => removeFile('animalTransportInvoice', 'animal', 'transportInvoiceFile')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="animalTransportInvoice" className="cursor-pointer block">
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-xs">Click to upload</span>
                                                        </div>
                                                        <input
                                                            id="animalTransportInvoice"
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'animalTransportInvoice', 'animal', 'transportInvoiceFile')}
                                                            className="hidden"
                                                            data-testid="input-transport-invoice"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subsidy Calculation */}
                                {animalData.animalCost && (
                                    <div
                                        className="p-4 bg-muted/30 rounded-lg mt-4"
                                        data-testid="subsidy-calculation"
                                    >
                                        <h4 className="font-semibold mb-3">System Calculations</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Total Expenditure
                                                </p>
                                                <p className="font-medium">
                                                    ₹
                                                    {calculateAnimalSubsidy().totalCost.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Subsidy (50%, Max ₹50,000)
                                                </p>
                                                <p className="font-medium text-green-600">
                                                    ₹
                                                    {calculateAnimalSubsidy().subsidyAmount.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Refund to Beneficiary
                                                </p>
                                                <p className="font-medium text-blue-600">
                                                    ₹
                                                    {calculateAnimalSubsidy().refundAmount.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Physical Achievement
                                                </p>
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                                    +1
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-3">
                                            * Refund value automatically pushed to Refund module
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4">
                                <Link href="/accountant/allocation">
                                    <Button variant="outline" data-testid="button-cancel">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormValid()}
                                    data-testid="button-submit-allocation"
                                >
                                    Submit Allocation
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* ==================== HGM FORM ==================== */}
                    {data.message?.component === HGM_PREGNANT_COW && (
                        <Card data-testid="card-hgm-form">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    High Genetic Merit (HGM) Details
                                </CardTitle>
                                <CardDescription>
                                    Vendor Payment: 75% of actual cost (max ₹2,10,000). DD
                                    Collected: ₹52,500 (fixed). No Refund allowed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Details */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Animal Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Invoice Upload</Label>
                                            <div className="border-2 border-dashed rounded-lg p-2" data-testid="upload-hgm-invoice-area">
                                                {uploadingFiles.hgmInvoice ? (
                                                    <div className="flex flex-col items-center gap-1 py-1">
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : uploadedUrls.hgmInvoice ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-full bg-green-500/10">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-green-600">Uploaded</p>
                                                                <p className="text-xs text-muted-foreground truncate">{hgmData.invoiceFile?.name}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => removeFile('hgmInvoice', 'hgm', 'invoiceFile')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="hgmInvoice" className="cursor-pointer block">
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-xs">Click to upload</span>
                                                        </div>
                                                        <input
                                                            id="hgmInvoice"
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'hgmInvoice', 'hgm', 'invoiceFile')}
                                                            className="hidden"
                                                            data-testid="input-hgm-invoice"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Purchase *</Label>
                                            <Input
                                                type="date"
                                                value={hgmData.dateOfPurchase}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        dateOfPurchase: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-purchase-date"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type of Animal *</Label>
                                            <Select
                                                value={hgmData.animalType}
                                                onValueChange={(value) =>
                                                    setHgmData({ ...hgmData, animalType: value })
                                                }
                                            >
                                                <SelectTrigger data-testid="select-hgm-animal-type">
                                                    <SelectValue placeholder="Cow / Buffalo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {hgmAnimalTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vendor Name *</Label>
                                            <Select
                                                value={hgmData.vendorName}
                                                onValueChange={(value) =>
                                                    setHgmData({ ...hgmData, vendorName: value })
                                                }
                                            >
                                                <SelectTrigger data-testid="select-hgm-vendor">
                                                    <SelectValue placeholder={isLoadingFilteredVendors ? "Loading..." : "Select vendor"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredVendors.map((vendor) => (
                                                        <SelectItem key={vendor.vendor_name} value={vendor.vendor_name}>
                                                            {vendor.vendor_label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tag Number *</Label>
                                            <Input
                                                placeholder="Enter 12-character tag number"
                                                value={hgmData.tagNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12).toLocaleUpperCase();
                                                    handleTagChange(value, "hgm");
                                                }}
                                                maxLength={12}
                                                data-testid="input-hgm-tag"
                                            />
                                            {tagError && (
                                                <p className="text-xs text-destructive">{tagError}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Digital Collar Number</Label>
                                            <Input
                                                placeholder="Enter collar number"
                                                value={hgmData.digitalCollarNumber}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        digitalCollarNumber: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-collar"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Collar Cost (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter collar cost"
                                                value={hgmData.collarCost}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        collarCost: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-collar-cost"
                                                hideSpinners
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Collar Invoice Upload</Label>
                                            <div className="border-2 border-dashed rounded-lg p-2" data-testid="upload-hgm-collar-invoice-area">
                                                {uploadingFiles.hgmCollarInvoice ? (
                                                    <div className="flex flex-col items-center gap-1 py-1">
                                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                                    </div>
                                                ) : uploadedUrls.hgmCollarInvoice ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 rounded-full bg-green-500/10">
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-green-600">Uploaded</p>
                                                                <p className="text-xs text-muted-foreground truncate">{hgmData.collarInvoiceFile?.name}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => removeFile('hgmCollarInvoice', 'hgm', 'collarInvoiceFile')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="hgmCollarInvoice" className="cursor-pointer block">
                                                        <div className="flex items-center justify-center gap-2 py-1">
                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-xs">Click to upload</span>
                                                        </div>
                                                        <input
                                                            id="hgmCollarInvoice"
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileUpload(e, 'hgmCollarInvoice', 'hgm', 'collarInvoiceFile')}
                                                            className="hidden"
                                                            data-testid="input-hgm-collar-invoice"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Animal Cost (₹) *</Label>
                                            <Input
                                                type="number"
                                                value={hgmData.animalCost}
                                                onChange={(e) =>
                                                    setHgmData({ ...hgmData, animalCost: e.target.value })
                                                }
                                                placeholder="Enter actual cost"
                                                data-testid="input-hgm-cost"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Max eligible: ₹2,10,000
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Insurance Details */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Insurance Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Insurance Company Name</Label>
                                            <Select
                                                value={hgmData.insuranceCompanyName}
                                                onValueChange={(value) => {
                                                    if (value === "__add_new__") {
                                                        setCreatingInsuranceFor("hgm");
                                                        setShowNewInsuranceDialog(true);
                                                        return;
                                                    }
                                                    setHgmData({
                                                        ...hgmData,
                                                        insuranceCompanyName: value,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger data-testid="select-hgm-insurance">
                                                    <SelectValue placeholder={insuranceLoading ? "Loading..." : "Select company"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {insuranceCompaniesList?.map((company) => (
                                                        <SelectItem key={company.name} value={company.name}>
                                                            {company.insurance_company_name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="__add_new__">
                                                        <span className="flex items-center gap-1 text-primary">
                                                            <Plus className="h-3 w-3" /> Add New Company
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Policy Number</Label>
                                            <Input
                                                placeholder="Enter policy number"
                                                value={hgmData.policyNumber}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        policyNumber: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-policy"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={hgmData.insuranceStartDate}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        insuranceStartDate: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-insurance-start"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={hgmData.insuranceEndDate}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        insuranceEndDate: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-insurance-end"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sum Assured (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter sum assured"
                                                value={hgmData.sumAssured}
                                                onChange={(e) => {
                                                    setHgmData({ ...hgmData, sumAssured: e.target.value });
                                                    // Clear error when user modifies the field
                                                    if (sumAssuredError) setSumAssuredError("");
                                                }}
                                                data-testid="input-hgm-sum-assured"
                                            />
                                            {sumAssuredError && (
                                                <p className="text-xs text-destructive">{sumAssuredError}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Premium Paid (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter premium"
                                                value={hgmData.premiumPaid}
                                                onChange={(e) =>
                                                    setHgmData({
                                                        ...hgmData,
                                                        premiumPaid: e.target.value,
                                                    })
                                                }
                                                data-testid="input-hgm-premium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />



                                {/* HGM Payment Calculation */}
                                {hgmData.animalCost && (
                                    <div
                                        className="p-4 bg-muted/30 rounded-lg mt-4"
                                        data-testid="hgm-calculation"
                                    >
                                        <h4 className="font-semibold mb-3">Payment Calculation</h4>
                                        <div className={`grid grid-cols-2 gap-4 ${calculateNewHgmSubsidy().refundAmount ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Animal Cost
                                                </p>
                                                <p className="font-medium">
                                                    ₹
                                                    {parseFloat(hgmData.animalCost).toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Current Vendor Payment
                                                </p>
                                                <p className="font-medium text-green-600">
                                                    ₹
                                                    {calculateNewHgmSubsidy().currentVendorPayment.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    After Parantage Payment
                                                </p>
                                                <p className="font-medium text-blue-600">
                                                    ₹
                                                    {calculateNewHgmSubsidy().afterParantageVendorPayment.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    DD Collected
                                                </p>
                                                <p className="font-medium text-orange-600">
                                                    ₹{data.message.dd_amount}
                                                </p>
                                            </div>
                                            {calculateNewHgmSubsidy().refundAmount > 0 && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Refund Amount
                                                    </p>
                                                    <p className="font-medium text-red-600">
                                                        ₹
                                                        {calculateNewHgmSubsidy().refundAmount.toLocaleString(
                                                            "en-IN",
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                No Transportation Cost
                                            </span>
                                            {calculateNewHgmSubsidy().refundAmount ? (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Refund escalated after Parantage Confirmation
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    No Refund Required
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4">
                                <Link href="/accountant/allocation">
                                    <Button variant="outline" data-testid="button-hgm-cancel">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormValid()}
                                    data-testid="button-hgm-submit"
                                >
                                    Submit Allocation
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="max-w-md" data-testid="dialog-confirmation">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Confirm Allocation
                        </DialogTitle>
                        <DialogDescription>
                            Please review the allocation details before confirming
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Beneficiary</span>
                                <span className="font-medium">
                                    {data.message.first_name} {data.message.mid_name} {data.message.last_name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Component</span>
                                <span className="font-medium">{data.message?.component}</span>
                            </div>
                            {data.message?.component === ANIMAL_INDUCTION &&
                                animalData.animalType && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Animal Type</span>
                                            <span className="font-medium">
                                                {animalData.animalType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Vendor</span>
                                            <span className="font-medium">
                                                {animalData.vendorName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg">
                                            <span className="text-muted-foreground">Subsidy</span>
                                            <span className="font-bold text-green-600">
                                                ₹
                                                {calculateAnimalSubsidy().subsidyAmount.toLocaleString(
                                                    "en-IN",
                                                )}
                                            </span>
                                        </div>

                                    </>
                                )}
                            {data.message?.component === HGM_PREGNANT_COW && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Vendor</span>
                                        <span className="font-medium">{hgmData.vendorName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Animal Cost</span>
                                        <span className="font-medium">
                                            ₹
                                            {parseFloat(hgmData.animalCost || "0").toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            DD Collected
                                        </span>
                                        <span className="font-medium text-orange-600">
                                            ₹{data.message.dd_amount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg">
                                        <span className="text-muted-foreground">
                                            Current Vendor Payment
                                        </span>
                                        <span className="font-bold text-primary">
                                            ₹
                                            {calculateNewHgmSubsidy().currentVendorPayment.toLocaleString(
                                                "en-IN",
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            After Parantage Payment
                                        </span>
                                        <span className="font-medium text-blue-600">
                                            ₹
                                            {calculateNewHgmSubsidy().afterParantageVendorPayment.toLocaleString(
                                                "en-IN",
                                            )}
                                        </span>
                                    </div>
                                    {calculateNewHgmSubsidy().refundAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Refund (after Parantage)
                                            </span>
                                            <span className="font-medium text-red-600">
                                                ₹
                                                {calculateNewHgmSubsidy().refundAmount.toLocaleString(
                                                    "en-IN",
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-3 bg-yellow-500/10 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                This action will record the allocation and update both physical
                                and financial ledgers.
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmation(false)}
                            data-testid="button-cancel-confirm"
                        >
                            Go Back
                        </Button>
                        <Button
                            onClick={handleConfirmAllocation}
                            disabled={isSubmitting || createLoading}
                            data-testid="button-confirm-allocation"
                        >
                            {isSubmitting || createLoading ? "Processing..." : "Confirm Allocation"}
                        </Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

            {/* Create New Insurance Company Dialog */}
            <Dialog open={showNewInsuranceDialog} onOpenChange={(open) => {
                if (!open) { setShowNewInsuranceDialog(false); setNewInsuranceCompanyName(""); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Insurance Company</DialogTitle>
                        <DialogDescription>Enter the name of the new insurance company to add it to the list.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Insurance Company Name *</Label>
                        <Input
                            placeholder="e.g. National Insurance Co."
                            value={newInsuranceCompanyName}
                            onChange={(e) => setNewInsuranceCompanyName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowNewInsuranceDialog(false); setNewInsuranceCompanyName(""); }}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!newInsuranceCompanyName.trim() || creatingInsurance}
                            onClick={async () => {
                                try {
                                    const created = await createInsuranceDoc("Insurance Company", {
                                        insurance_company_name: newInsuranceCompanyName.trim(),
                                    });
                                    await mutateInsuranceList();
                                    // Auto-select the newly created company
                                    if (creatingInsuranceFor === "animal") {
                                        setAnimalData((prev) => ({ ...prev, insuranceCompanyName: created.name }));
                                    } else {
                                        setHgmData((prev) => ({ ...prev, insuranceCompanyName: created.name }));
                                    }
                                    toast({ title: "Insurance company added", description: newInsuranceCompanyName.trim() });
                                    setShowNewInsuranceDialog(false);
                                    setNewInsuranceCompanyName("");
                                } catch (err: any) {
                                    toast({ title: "Error", description: err?.message || "Failed to create", variant: "destructive" });
                                }
                            }}
                        >
                            {creatingInsurance ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {creatingInsurance ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
