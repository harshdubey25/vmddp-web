"use client"
import Link from "next/link";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { ArrowLeft, Package, Download, Calendar, Banknote, Shield, Truck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

interface ComponentAllocationDoc {
    insurance_vendor: string;
    name: string;
    application: string;
    component: string;
    dd: string;
    vendor: string;
    date_of_purchase: string;
    type_of_animal: string;
    tag_number: string;
    digital_collar_number: string;
    collar_cost: number;
    collar_invoice_upload: string;
    animal_cost: number;
    invoice_upload: string;
    insurance_company_name: string;
    policy_no: string;
    insurance_start_date: string;
    insurance_end_date: string;
    sum_assured: number;
    premium_paid: number;
    transportation_cost: number;
    transportation_invoice_upload: string;
    docstatus: number;
    creation: string;
    modified: string;
}

const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN");
};

const formatCurrency = (amount: number) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
};

const getDocstatus = (status: number) => {
    const statusMap = {
        0: { label: "Draft", variant: "secondary" as const },
        1: { label: "Submitted", variant: "default" as const },
        2: { label: "Cancelled", variant: "destructive" as const },
    };
    return statusMap[status as keyof typeof statusMap] || { label: "Unknown", variant: "secondary" as const };
};

export default function ComponentAllocationDetails({
    applicationId
}: {
    applicationId: string;
}) {
    const router = useRouter();
    const decodedComponentAllocationId = decodeURIComponent(applicationId);
    const { data: allocationDoc, isLoading, error } = useFrappeGetDoc<ComponentAllocationDoc>(
        "Component Allocation",
        decodedComponentAllocationId
    );

    if (isLoading) {
        return (
            <div className="h-screen bg-background w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading allocation details...</p>
                </div>
            </div>
        );
    }

    if (error || !allocationDoc) {
        return (
            <div className="h-screen bg-background w-full">
                <div className="p-6">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-muted-foreground mb-4">
                                {error ? "Failed to load allocation details" : "Allocation not found"}
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

    const totalCost =
        (allocationDoc.animal_cost || 0) +
        (allocationDoc.collar_cost || 0) +
        (allocationDoc.premium_paid || 0) +
        (allocationDoc.transportation_cost || 0);    

    return (
        <div className="min-h-screen bg-background w-full overflow-y-auto">
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className= "flex itemms-center">
                            <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{allocationDoc.name}</h1>
                            <p className="text-muted-foreground">Component Allocation Details</p>
                        </div>
                    </div>
                    <Badge variant={getDocstatus(allocationDoc.docstatus).variant}>
                        {getDocstatus(allocationDoc.docstatus).label}
                    </Badge>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Application ID</p>
                            <p className="text-lg font-semibold">{allocationDoc.application}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Component</p>
                            <p className="text-lg font-semibold">{allocationDoc.component}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Vendor</p>
                            <p className="text-lg font-semibold">{allocationDoc.vendor || "N/A"}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Animal Purchase Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Animal Purchase Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Date of Purchase</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(allocationDoc.date_of_purchase)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Type of Animal</p>
                                    <p className="font-medium mt-1">{allocationDoc.type_of_animal || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Animal Cost</p>
                                    <p className="font-bold text-lg text-green-600 mt-1">{formatCurrency(allocationDoc.animal_cost)}</p>
                                </div>

                                {allocationDoc.invoice_upload && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Animal Invoice</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(allocationDoc.invoice_upload, "_blank")}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tag Number</p>
                                    <p className="font-medium mt-1">{allocationDoc.tag_number || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Digital Collar Number</p>
                                    <p className="font-medium mt-1">{allocationDoc.digital_collar_number || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Collar Cost</p>
                                    <p className="font-bold text-lg text-green-600 mt-1">{formatCurrency(allocationDoc.collar_cost)}</p>
                                </div>

                                {allocationDoc.collar_invoice_upload && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Collar Invoice</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(allocationDoc.collar_invoice_upload, "_blank")}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Insurance Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Insurance Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Insurance Company</p>
                                    <p className="font-medium mt-1">{allocationDoc.insurance_vendor || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Policy Number</p>
                                    <p className="font-medium mt-1 font-mono">{allocationDoc.policy_no || "N/A"}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Start Date</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(allocationDoc.insurance_start_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">End Date</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(allocationDoc.insurance_end_date)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Sum Assured</p>
                                    <p className="font-bold text-lg text-blue-600 mt-1">{formatCurrency(allocationDoc.sum_assured)}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Premium Paid</p>
                                    <p className="font-bold text-lg text-blue-600 mt-1">{formatCurrency(allocationDoc.premium_paid)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transportation Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Transportation Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Transportation Cost</p>
                            <p className="font-bold text-lg text-green-600 mt-2">{formatCurrency(allocationDoc.transportation_cost)}</p>
                        </div>

                        {allocationDoc.transportation_invoice_upload && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Transportation Invoice</p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(allocationDoc.transportation_invoice_upload, "_blank")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cost Summary */}
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5" />
                            Cost Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Animal Cost</span>
                                <span className="font-medium">{formatCurrency(allocationDoc.animal_cost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Collar Cost</span>
                                <span className="font-medium">{formatCurrency(allocationDoc.collar_cost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Premium Paid</span>
                                <span className="font-medium">{formatCurrency(allocationDoc.premium_paid)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Transportation Cost</span>
                                <span className="font-medium">{formatCurrency(allocationDoc.transportation_cost)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Total Cost</span>
                                <span className="font-bold text-lg text-primary">{formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                    <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                        <p>Created: {formatDate(allocationDoc.creation)}</p>
                        <p>Last Modified: {formatDate(allocationDoc.modified)}</p>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Link href="/accountant/component-allocation">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Allocations
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
