"use client"
import Link from "next/link";
import { parseFrappeError } from "@/lib/frappe-error-parser";
import { useFrappeGetCall, useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { useState, useEffect } from 'react'
import { ApplicationDetails, FrappeCustomApiResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Check, User, Building2, MapPin, CreditCard, Loader2, Sprout } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockItem {
    name: string;
    item_name: string;
    rate?: number;
    stock_item_group?: string;
}

interface FodderSeedDataResponse {
    message?: {
        max_quantity?: number;
        maximum_subsidy_amount?: number;
        rate_per_kg?: number;
        unit?: string;
        fodder_seed_variety?: string;
        Quantity?: string | number;
        price_per_unit?: number;
    };
}

export default function FodderSeedClaimForm({
    appId
}: {
    appId: string;
}) {
    const { toast } = useToast();
    const router = useRouter();

    // Form state
    const [selectedStockItem, setSelectedStockItem] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch beneficiary details
    const { data: beneficiaryData, isLoading: loading, error } = useFrappeGetCall<FrappeCustomApiResponse<ApplicationDetails[]>>(
        "vmddp_app.api.v1.accountant.get_application_details",
        { app_form: appId, for_component_allocation: 0, component: "Fodder Seed" },
        undefined,
        { revalidateOnFocus: false }
    );
    const beneficiary = beneficiaryData?.message?.[0];

    // Fetch fodder seed metadata (variety, quantity, rate, etc.)
    const { data: fodderSeedData, isLoading: loadingFodderSeed } = useFrappeGetCall<FodderSeedDataResponse>(
        "vmddp_app.api.v1.dpo.get_fodder_seed_data",
        { application_id: appId },
        `get_fodder_seed_data_${appId}`,
        { revalidateOnFocus: false }
    );
    const fodderSeedDetails = fodderSeedData?.message;

    // Fetch Stock Items matching Fodder Seed group
    const { data: stockItems, isLoading: loadingStock } = useFrappeGetDocList<StockItem>(
        "Stock Item",
        {
            fields: ["name", "item_name", "rate", "stock_item_group"],
            filters: [["stock_item_group", "=", "Fodder Seed"]],
            limit: 200,
        }
    );

    // Fetch all stock items as a fallback if the group filter yields nothing
    const { data: fallbackStockItems } = useFrappeGetDocList<StockItem>(
        "Stock Item",
        {
            fields: ["name", "item_name", "rate", "stock_item_group"],
            limit: 200,
        },
        stockItems && stockItems.length > 0 ? null : undefined
    );

    const availableItems = stockItems && stockItems.length > 0 ? stockItems : fallbackStockItems || [];

    // Ensure the pre-selected variety from the application is in the stock item dropdown list
    const finalAvailableItems = [...availableItems];
    if (fodderSeedDetails?.fodder_seed_variety) {
        const hasVariety = finalAvailableItems.some(item => item.name === fodderSeedDetails.fodder_seed_variety || item.item_name === fodderSeedDetails.fodder_seed_variety);
        if (!hasVariety) {
            finalAvailableItems.push({
                name: fodderSeedDetails.fodder_seed_variety,
                item_name: fodderSeedDetails.fodder_seed_variety,
                rate: fodderSeedDetails.price_per_unit || 0,
                stock_item_group: "Fodder Seed"
            });
        }
    }

    const selectedItemDetails = finalAvailableItems.find(item => item.name === selectedStockItem);
    const itemRate = (selectedStockItem === fodderSeedDetails?.fodder_seed_variety && (fodderSeedDetails?.price_per_unit || 0) > 0)
        ? (fodderSeedDetails.price_per_unit ?? 0)
        : (selectedItemDetails?.rate ?? 0);

    // Prefill form state when fodder seed data is fetched
    useEffect(() => {
        if (fodderSeedDetails) {
            if (fodderSeedDetails.fodder_seed_variety) {
                setSelectedStockItem(fodderSeedDetails.fodder_seed_variety);
            }
            if (fodderSeedDetails.Quantity) {
                setQuantity(String(fodderSeedDetails.Quantity));
            }
        }
    }, [fodderSeedDetails]);

    // Auto-calculate amount when quantity or item rate changes
    useEffect(() => {
        const qtyNum = parseFloat(quantity) || 0;
        if (qtyNum > 0 && itemRate > 0) {
            setAmount((itemRate * qtyNum).toFixed(2));
        }
    }, [quantity, itemRate]);

    const { createDoc, loading: createLoading } = useFrappeCreateDoc();

    const getFullName = (b: ApplicationDetails) => {
        return [b.first_name, b.mid_name, b.last_name].filter(Boolean).join(" ");
    };

    const isFormValid = () => {
        return !!(selectedStockItem && quantity && amount);
    };

    const handleSubmit = async () => {
        if (!selectedStockItem || !quantity || !amount) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Create Fodder Seed Claim document
            const maxSubsidy = fodderSeedDetails?.maximum_subsidy_amount ?? 6000;
            const subsidyAmount = Math.min(parseFloat(amount) || 0, maxSubsidy);

            await createDoc("Fodder Seed Claim", {
                application: appId,
                component: "Fodder Seed",
                stock_item: selectedStockItem,
                quantity: parseFloat(quantity),
                amount: parseFloat(amount),
                subsidy_amount: subsidyAmount,
            });

            toast({
                title: "Claim Submitted",
                description: "Fodder Seed claim has been submitted successfully.",
            });

            router.push("/subadmin/fodder-seed");
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

    if (loading || loadingFodderSeed) {
        return (
            <div className="h-screen bg-background w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
                    <p className="text-muted-foreground text-sm">Loading application details...</p>
                </div>
            </div>
        );
    }

    if (error || !beneficiary) {
        return (
            <div className="h-screen bg-background w-full flex items-center justify-center">
                <Card className="max-w-md w-full border-2 border-red-200">
                    <CardContent className="pt-6 text-center space-y-4">
                        <p className="text-muted-foreground text-sm font-semibold">
                            {error ? "Failed to load application details" : "Application not found"}
                        </p>
                        <Link href="/subadmin/fodder-seed">
                            <Button className="bg-lime-600 hover:bg-lime-700 text-white">Back to Fodder Seed List</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-screen overflow-auto bg-background">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <Link href="/subadmin/fodder-seed">
                        <Button variant="outline" size="icon" className="border-lime-200 text-lime-800 hover:bg-lime-50" data-testid="button-back">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-lime-900">
                            <Sprout className="h-6 w-6 text-lime-600" />
                            Register Fodder Seed Claim
                        </h1>
                        <p className="text-sm text-muted-foreground">Application ID: {appId}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Beneficiary details column */}
                    <Card className="lg:col-span-2 border-2 border-lime-200 shadow-md" data-testid="card-beneficiary-details">
                        <CardHeader className="bg-gradient-to-r from-lime-50/50 to-green-50/50 border-b border-lime-100 rounded-t-xl pb-4">
                            <CardTitle className="flex items-center gap-2 text-lime-800 text-base">
                                <User className="h-5 w-5 text-lime-600" />
                                Beneficiary Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">FullName</p>
                                    <p className="font-bold text-slate-800 text-sm">{getFullName(beneficiary)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Aadhaar Number</p>
                                    <p className="font-semibold text-slate-800 text-sm font-mono">{beneficiary.aadhar_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Application ID</p>
                                    <p className="font-semibold text-slate-850 text-sm font-mono">{beneficiary.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-medium mb-0.5">Status</p>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 py-0.5 px-2">
                                        {beneficiary.component_status || "Approved"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-lime-600 mt-0.5" />
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">Location</p>
                                        <p className="font-bold text-slate-800">{beneficiary.village || "-"}</p>
                                        <p className="text-muted-foreground">{beneficiary.taluka}, {beneficiary.district}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CreditCard className="h-4 w-4 text-lime-600 mt-0.5" />
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">Bank Account</p>
                                        <p className="font-bold text-slate-800">****{beneficiary.account_number.slice(-4)}</p>
                                        <p className="text-muted-foreground font-mono">{beneficiary.ifsc_code}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Building2 className="h-4 w-4 text-lime-600 mt-0.5" />
                                    <div>
                                        <p className="text-muted-foreground font-medium mb-0.5">Bank Name</p>
                                        <p className="font-bold text-slate-800">{beneficiary.bank_name}</p>
                                    </div>
                                </div>
                            </div>

                            {fodderSeedDetails && (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold uppercase tracking-wider text-lime-800 mb-2 flex items-center gap-1">
                                        <Sprout className="h-3.5 w-3.5 text-lime-600" />
                                        Fodder Seed Registration Metadata
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-lime-50/20 p-3 rounded-lg border border-lime-100/50">
                                        <div>
                                            <p className="text-muted-foreground font-medium mb-0.5">Applied Variety</p>
                                            <p className="font-bold text-slate-800">{fodderSeedDetails.fodder_seed_variety || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium mb-0.5">Applied Quantity</p>
                                            <p className="font-bold text-slate-800 font-mono">{fodderSeedDetails.Quantity || "0"} {fodderSeedDetails.unit || "Kg"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium mb-0.5">Rate per Unit</p>
                                            <p className="font-bold text-slate-800 font-mono">₹{fodderSeedDetails.price_per_unit || "0"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium mb-0.5">Max Subsidy Amount</p>
                                            <p className="font-bold text-slate-800 font-mono">₹{fodderSeedDetails.maximum_subsidy_amount || "0"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Claim form column */}
                    <Card className="border-2 border-lime-200 shadow-md" data-testid="card-claim-form">
                        <CardHeader className="bg-gradient-to-r from-lime-50/50 to-green-50/50 border-b border-lime-100 rounded-t-xl pb-4">
                            <CardTitle className="flex items-center gap-2 text-lime-800 text-base">
                                <FileText className="h-5 w-5 text-lime-600" />
                                Claim Register Form
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Record the fodder seed distribution details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Application field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="app_form" className="text-xs font-bold text-slate-700">Application</Label>
                                <Input
                                    id="app_form"
                                    type="text"
                                    value={appId}
                                    disabled
                                    className="bg-slate-50 text-slate-500 font-mono text-xs h-9 rounded-lg"
                                />
                            </div>

                            {/* Component field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="component" className="text-xs font-bold text-slate-700">Component</Label>
                                <Input
                                    id="component"
                                    type="text"
                                    value="Fodder Seed"
                                    disabled
                                    className="bg-slate-50 text-slate-500 font-semibold text-xs h-9 rounded-lg"
                                />
                            </div>

                            {/* Stock Item selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="stock_item" className="text-xs font-bold text-slate-700">Stock Item *</Label>
                                <Select
                                    value={selectedStockItem}
                                    onValueChange={setSelectedStockItem}
                                    disabled={true}
                                >
                                    <SelectTrigger id="stock_item" className="h-9 rounded-lg text-xs bg-slate-50 text-slate-500" data-testid="select-stock-item">
                                        <SelectValue placeholder="Select Fodder Seed stock item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingStock && finalAvailableItems.length === 0 ? (
                                            <SelectItem value="loading" disabled>Loading stock items...</SelectItem>
                                        ) : finalAvailableItems.length > 0 ? (
                                            finalAvailableItems.map((item) => (
                                                <SelectItem key={item.name} value={item.name} className="text-xs">
                                                    {item.item_name || item.name} {item.rate ? `(₹${item.rate}/${item.stock_item_group || 'unit'})` : ''}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no_items" disabled>No stock items found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedStockItem && (
                                    <div className="flex items-center justify-between text-[11px] bg-lime-50/50 p-2 rounded-lg border border-lime-100/85 mt-1.5">
                                        <span className="text-muted-foreground">Price per Unit:</span>
                                        <Badge variant="outline" className="bg-lime-500/10 text-lime-700 border-lime-200 font-semibold font-mono">
                                            ₹{itemRate} / {fodderSeedDetails?.unit || "Kg"}
                                        </Badge>
                                    </div>
                                )}
                                {selectedStockItem && (
                                    <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-1">
                                        <Check className="h-3.5 w-3.5 text-green-600" /> Locked to the pre-filled variety from applicant response
                                    </p>
                                )}
                            </div>

                            {/* Quantity field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="quantity" className="text-xs font-bold text-slate-700">Quantity *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    placeholder="Enter quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="h-9 rounded-lg text-xs"
                                    data-testid="input-quantity"
                                    hideSpinners
                                />
                            </div>

                            {/* Amount field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="amount" className="text-xs font-bold text-slate-700">Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-9 rounded-lg text-xs font-semibold"
                                    data-testid="input-amount"
                                    hideSpinners
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex gap-3">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isFormValid() || isSubmitting || createLoading}
                                    className="bg-lime-600 hover:bg-lime-700 text-white rounded-lg h-9 text-xs flex-1"
                                    data-testid="button-submit-claim"
                                >
                                    {(isSubmitting || createLoading) ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Submit Claim
                                        </>
                                    )}
                                </Button>
                                <Link href="/subadmin/fodder-seed">
                                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 rounded-lg h-9 text-xs" data-testid="button-cancel">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
