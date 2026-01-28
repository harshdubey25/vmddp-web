"use client"
export const runtime = 'edge';
import Link from "next/link";
import { ArrowLeft, FileText, Upload, Check, User, Building2, MapPin, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { parseFrappeError } from "@/lib/frappe-error-parser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFrappeGetCall, useFrappeFileUpload, useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { use, useState, useRef } from 'react'
import { ApplicationDetails, FrappeCustomApiResponse, QuotaDetails, DBTClaim } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

// Helper to get status badge based on docstatus
const getDocstatusBadge = (docstatus: number) => {
    const statusMap: Record<number, { label: string; style: string }> = {
        0: { label: "Draft", style: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
        1: { label: "Submitted", style: "bg-green-500/10 text-green-600 border-green-500/20" },
        2: { label: "Cancelled", style: "bg-red-500/10 text-red-600 border-red-500/20" },
    };
    const status = statusMap[docstatus] || statusMap[0];
    return <Badge variant="outline" className={status.style}>{status.label}</Badge>;
};

export default function ClaimForm({
    params
}: {
    params: Promise<{ app_id: string }>;
}) {
    const { app_id } = use(params)
    const searchParams = useSearchParams();
    const component = decodeURIComponent(searchParams.get("component") || "");
    console.log("component", component)
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        invoiceNumber: "",
        purchaseDate: "",
        quantity: "",
        totalAmount: "",
        acknowledgement: false,
        component: component,
        typeOfAnimal: "",
        numberOfAnimalsBenefitted: "",
    });
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Frappe SDK hooks
    const { data: beneficiaryData, isLoading: loading, error } = useFrappeGetCall<FrappeCustomApiResponse<ApplicationDetails[]>>(
        "vmddp_app.api.v1.accountant.get_application_details",
        { app_form: app_id, for_component_allocation: 0 },
        undefined,
        { revalidateOnFocus: false }
    );

    // Fetch quota details
    const { data: quotaData, isLoading: quotaLoading } = useFrappeGetCall<FrappeCustomApiResponse<QuotaDetails>>(
        "vmddp_app.api.v1.accountant.get_quota",
        { app_form: app_id, component: component },
        component ? undefined : null, // Only fetch if component is available
        { revalidateOnFocus: false }
    );

    // Fetch claim history from DBT Claims doctype
    const { data: claimHistory, isLoading: claimsLoading } = useFrappeGetDocList<DBTClaim>(
        "DBT Claims",
        {
            fields: ["name", "creation", "invoice_number", "invoice_upload", "purchase_date", "quantity", "total_amount", "subsidy_given", "docstatus"],
            filters: [
                ["app_form", "=", app_id],
                ["component", "=", component]
            ],
            orderBy: { field: "creation", order: "desc" }
        },
        component ? undefined : null // Only fetch if component is available
    );

    const { upload, loading: uploadLoading } = useFrappeFileUpload();
    const { createDoc, loading: createLoading } = useFrappeCreateDoc();

    // Get beneficiary from API response
    const beneficiary = beneficiaryData?.message?.[0];
    const quota = quotaData?.message;

    // Computed values from quota
    const usagePercent = quota
        ? quota.max_quantity > 0
            ? Math.min(100, ((quota.used_quantity) / quota.max_quantity) * 100)
            : quota.maximum_subsidy_amount > 0
                ? Math.min(100, ((quota.used_amount) / quota.maximum_subsidy_amount) * 100)
                : 0
        : 0;

    const isQuotaExhausted = quota
        ? (quota.max_quantity > 0 && quota.remaining_quantity <= 0) || quota.remaining_subsidy <= 0
        : false;

    // Calculate eligible DBT amount based on form input and subsidy percent
    const eligibleDbtAmount = quota && formData.totalAmount
        ? Math.min(
            parseFloat(formData.totalAmount) * (parseFloat(quota.subsidy_percent) / 100),
            quota.remaining_subsidy
        )
        : 0;

    // Helper to get full name
    const getFullName = (b: ApplicationDetails) => {
        return [b.first_name, b.mid_name, b.last_name].filter(Boolean).join(" ");
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInvoiceFile(file);
        }
    };

    // Handle form field changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Clear form
    const handleClear = () => {
        setFormData({
            invoiceNumber: "",
            purchaseDate: "",
            quantity: "",
            totalAmount: "",
            acknowledgement: false,
            component: component,
            typeOfAnimal: "",
            numberOfAnimalsBenefitted: "",
        });
        setInvoiceFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Submit claim
    const handleSubmit = async () => {
        // Check if quota is exhausted
        if (isQuotaExhausted) {
            toast({
                title: "Quota Exhausted",
                description: "Maximum quantity or subsidy amount has been reached. No more claims can be submitted.",
                variant: "destructive",
            });
            return;
        }

        // Validate required fields
        if (!formData.invoiceNumber || !formData.purchaseDate || !formData.quantity || !formData.totalAmount || !formData.typeOfAnimal || !formData.numberOfAnimalsBenefitted) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        if (!formData.acknowledgement) {
            toast({
                title: "Acknowledgement Required",
                description: "Please acknowledge the declaration.",
                variant: "destructive",
            });
            return;
        }

        if (!beneficiary) {
            toast({
                title: "Error",
                description: "Beneficiary data not loaded.",
                variant: "destructive",
            });
            return;
        }
        if (!component) {
            toast({
                title: "Error",
                description: "Component not selected.",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);

        try {
            let invoiceUploadUrl = "";

            // Upload invoice file if present
            if (invoiceFile) {
                const uploadResult = await upload(invoiceFile, {
                    isPrivate: false,
                    doctype: "DBT Claims",
                    fieldname: "invoice_upload",
                });
                invoiceUploadUrl = uploadResult.file_url;
            }

            // Create DBT Claims document
            await createDoc("DBT Claims", {
                app_form: beneficiary.name,
                component: component,
                invoice_number: formData.invoiceNumber,
                invoice_upload: invoiceUploadUrl || undefined,
                purchase_date: formData.purchaseDate,
                quantity: parseFloat(formData.quantity),
                total_amount: parseFloat(formData.totalAmount),
                type_of_animal: formData.typeOfAnimal,
                number_of_animals_benefitted: parseInt(formData.numberOfAnimalsBenefitted),
            });

            toast({
                title: "Claim Submitted",
                description: "DBT claim has been submitted successfully.",
            });

            // Navigate back to claims list
            router.push("/accountant/dbt-claims");

        } catch (err: any) {
            const { title, message } = parseFrappeError(err, "Submission Failed", "Failed to submit claim. Please try again.");
            toast({
                title,
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen bg-background w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading application details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !beneficiary) {
        return (
            <div className="h-screen bg-background w-full">
                <div className="overflow-auto h-screen">
                    <div className="p-6">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">
                                    {error ? "Failed to load application details" : "Application not found"}
                                </p>
                                <Link href="/accountant/dbt-claims">
                                    <Button className="mt-4">Back to DBT Claims</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background w-full">


            <div className=" overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/accountant/dbt-claims">
                            <Button variant="ghost" size="icon" data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Submit DBT Claim</h1>
                            <p className="text-muted-foreground">{beneficiary.component_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2" data-testid="card-beneficiary-details">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Beneficiary Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Name</p>
                                        <p className="font-medium">{getFullName(beneficiary)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Aadhaar</p>
                                        <p className="font-medium">{beneficiary.aadhar_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Application ID</p>
                                        <p className="font-medium">{beneficiary.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                            {beneficiary.component_status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{beneficiary.village}</p>
                                            <p className="text-sm text-muted-foreground">{beneficiary.taluka}, {beneficiary.district}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bank Account</p>
                                            <p className="font-medium">****{beneficiary.account_number.slice(-4)}</p>
                                            <p className="text-sm text-muted-foreground">{beneficiary.ifsc_code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bank</p>
                                            <p className="font-medium">{beneficiary.bank_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-quota-status">
                            <CardHeader>
                                <CardTitle>Quota Status</CardTitle>
                                <CardDescription>{component}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {quotaLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : quota ? (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Usage</span>
                                                <span>{usagePercent.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={usagePercent} className="h-3" />
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {quota.max_quantity > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Remaining Quantity</span>
                                                    <span className="font-medium">{quota.remaining_quantity} units</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Remaining Subsidy</span>
                                                <span className="font-medium">₹{quota.remaining_subsidy.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Used Amount</span>
                                                <span className="font-medium">₹{quota.used_amount.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Max Subsidy</span>
                                                <span className="font-medium">₹{quota.maximum_subsidy_amount.toLocaleString("en-IN")}</span>
                                            </div>
                                        </div>
                                        {isQuotaExhausted && (
                                            <Badge variant="outline" className="w-full justify-center bg-red-500/10 text-red-600 border-red-500/20">
                                                Quota Exhausted
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">Unable to load quota</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Claim History Section */}
                    <Card data-testid="card-claim-history">
                        <CardHeader>
                            <CardTitle>Claim History</CardTitle>
                            <CardDescription>Previous claims for {component}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {claimsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : claimHistory && claimHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Subsidy</TableHead>
                                            <TableHead>Claim ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Invoice</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claimHistory.map((claim) => (
                                            <TableRow key={claim.name} data-testid={`row-history-${claim.name}`}>
                                                <TableCell>{new Date(claim.creation).toLocaleDateString("en-IN")}</TableCell>
                                                <TableCell>{claim.invoice_number}</TableCell>
                                                <TableCell className="text-right">{claim.quantity}</TableCell>
                                                <TableCell className="text-right">₹{claim.total_amount.toLocaleString("en-IN")}</TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">
                                                    {claim.subsidy_given ? `₹${parseFloat(claim.subsidy_given).toLocaleString("en-IN")}` : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">{claim.name}</span>
                                                </TableCell>
                                                <TableCell>{getDocstatusBadge(claim.docstatus)}</TableCell>
                                                <TableCell>
                                                    {claim.invoice_upload ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => window.open(claim.invoice_upload!, "_blank")}
                                                            data-testid={`button-view-invoice-${claim.name}`}
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">N/A</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No previous claims found</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card data-testid="card-claim-form">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Claim Details
                            </CardTitle>
                            <CardDescription>Enter purchase details for subsidy claim</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Invoice Number *</Label>
                                    <Input
                                        type="text"
                                        placeholder="Enter invoice number"
                                        value={formData.invoiceNumber}
                                        onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                                        data-testid="input-invoice-number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Invoice Upload</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            data-testid="input-invoice-file"
                                        />
                                    </div>
                                    {invoiceFile && (
                                        <p className="text-xs text-muted-foreground">{invoiceFile.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Purchase Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                                        data-testid="input-purchase-date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity *</Label>
                                    <Input
                                        type="number"
                                        placeholder={quota?.max_quantity ? `Max: ${quota.remaining_quantity} units` : "Enter quantity"}
                                        value={formData.quantity}
                                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                                        data-testid="input-quantity"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Amount *</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter total amount"
                                        value={formData.totalAmount}
                                        onChange={(e) => handleInputChange("totalAmount", e.target.value)}
                                        data-testid="input-total-amount"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type of Animal *</Label>
                                    <Select
                                        value={formData.typeOfAnimal}
                                        onValueChange={(value) => handleInputChange("typeOfAnimal", value)}
                                    >
                                        <SelectTrigger data-testid="select-type-of-animal">
                                            <SelectValue placeholder="Select animal type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cow">Cow</SelectItem>
                                            <SelectItem value="Buffalo">Buffalo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Number of Animals Benefitted *</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter number of animals"
                                        value={formData.numberOfAnimalsBenefitted}
                                        onChange={(e) => handleInputChange("numberOfAnimalsBenefitted", e.target.value)}
                                        min="1"
                                        data-testid="input-number-of-animals"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Eligible DBT Amount</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{eligibleDbtAmount.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                        {quota?.subsidy_percent || 0}% Subsidy
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Auto-calculated based on {quota?.subsidy_percent || 0}% subsidy rate and remaining quota
                                </p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="acknowledgement"
                                        checked={formData.acknowledgement}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acknowledgement: !!checked }))}
                                        data-testid="checkbox-acknowledgement"
                                    />
                                    <Label htmlFor="acknowledgement" className="text-sm leading-relaxed">
                                        I hereby declare that the information provided is true and correct. The invoice submitted is genuine and the purchase was made for dairy development purposes under VMDDP scheme.
                                    </Label>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isQuotaExhausted || isSubmitting || uploadLoading || createLoading}
                                        data-testid="button-submit-claim"
                                    >
                                        {(isSubmitting || uploadLoading || createLoading) ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : isQuotaExhausted ? (
                                            "Quota Exhausted"
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Submit Claim
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={isSubmitting}
                                        data-testid="button-clear-form"
                                    >
                                        Clear
                                    </Button>
                                    <Link href="/accountant/dbt-claims">
                                        <Button variant="ghost" data-testid="button-cancel">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
