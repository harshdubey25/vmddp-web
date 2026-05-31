"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Sprout,
    MapPin,
    User,
    Banknote,
    Info,
    Loader2,
    RefreshCw,
    FileText,
    Package,
    Calendar,
    CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeAuth, useFrappeGetDoc, useFrappeGetCall } from "frappe-react-sdk";
import { Component } from "@/types";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DBTBeneficiary {
    name: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    component_name: string;
    max_quantity: number;
    maximum_subsidy_amount: number;
    rate_per_kg: number;
    remaining_quantity: number;
    remaining_subsidy: number;
    used_quantity: number;
    used_amount: number;
    unit: string;
    fodder_seed_variety?: string;
    Quantity?: string;
    subsidy_amount?: number;
}

interface CompletedFodderSeedClaim {
    claim_id: string;
    application: string;
    component: string;
    stock_item: string;
    quantity: number;
    amount: number;
    subsidy_amount: number;
    modified: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    aadhar_number: string;
    district: string;
    taluka: string;
    village: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
}

const PAGE_SIZE = 20;

const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return "N/A";
    if (accountNumber.length <= 4) return accountNumber;
    return "X".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
};


export default function SubAdminFodderSeedPage() {
    const { toast } = useToast();
    const { currentUser } = useFrappeAuth();

    // Fetch logged in Sub-Admin's DPO details to get their assigned district
    const { data: dpoData, isLoading: isDpoLoading } = useFrappeGetDoc("DPO", currentUser || undefined);
    const assignedDistrict = dpoData?.district;

    // Fetch Fodder Seed component details for rules display
    const { data: fodderSeedComponent, isLoading: isComponentLoading } = useFrappeGetDoc<Pick<Component, 'name' | 'subsidy_percent' | 'maximum_subsidy_amount' | 'rate_per_kg' | 'max_quantity' | 'multiple_claims_allowed' | 'unit'>>(
        "Component",
        "Fodder Seed",
        {
            fields: ['name', 'subsidy_percent', 'maximum_subsidy_amount', 'rate_per_kg', 'max_quantity', 'multiple_claims_allowed', 'unit']
        }
    );

    // Filter and pagination state
    const [searchText, setSearchText] = useState("");
    const [applicationId, setApplicationId] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Tab state
    const [activeTab, setActiveTab] = useState<string>("active");

    // Filter and pagination state for completed claims
    const [completedPage, setCompletedPage] = useState(1);

    // Committed search filters
    const [committedSearch, setCommittedSearch] = useState("");
    const [committedApplicationId, setCommittedApplicationId] = useState("");

    // Details Modal Dialog State
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<DBTBeneficiary | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Details Modal Dialog State for completed claims
    const [selectedCompletedClaim, setSelectedCompletedClaim] = useState<CompletedFodderSeedClaim | null>(null);
    const [isCompletedDetailsOpen, setIsCompletedDetailsOpen] = useState(false);

    // Fetch applications list (district and component filtering is handled in backend)
    const cacheKey = `fodder_seed_application_list_${committedSearch}_${committedApplicationId}_${currentPage}`;

    const { data: applicationsResponse, isLoading: isReportLoading, mutate } = useFrappeGetCall<{ message: DBTBeneficiary[] }>(
        "vmddp_app.api.v1.dpo.fodder_seed_application_list",
        {
            search_text: committedSearch || undefined,
            application_id: committedApplicationId || undefined,
            limit_start: (currentPage - 1) * PAGE_SIZE,
            limit_page_length: PAGE_SIZE,
        },
        cacheKey
    );

    // Fetch completed fodder seed claims list
    const completedCacheKey = `fodder_seed_completed_list_${committedSearch}_${completedPage}`;

    const { data: completedResponse, isLoading: isCompletedLoading, mutate: mutateCompleted } = useFrappeGetCall<{ message: CompletedFodderSeedClaim[] }>(
        "vmddp_app.api.v1.dpo.fodder_seed_completed_list",
        {
            search_text: committedSearch || undefined,
            limit_start: (completedPage - 1) * PAGE_SIZE,
            limit_page_length: PAGE_SIZE,
        },
        completedCacheKey
    );

    // Fetch district fodder seed stock from API
    const stockCacheKey = `district_fodder_seed_stock_${assignedDistrict}`;
    const { data: stockResponse, isLoading: isStockLoading, mutate: mutateStock } = useFrappeGetCall<{
        message: {
            district: string;
            total_quantity: number;
            items: Array<{
                item_id: string;
                item_name: string;
                quantity: number;
            }>;
        }
    }>(
        "vmddp_app.api.v1.dpo.get_district_fodder_seed_stock",
        assignedDistrict ? { district: assignedDistrict } : {},
        assignedDistrict ? stockCacheKey : undefined
    );

    const isLoading = isComponentLoading || isReportLoading;
    const beneficiaries = applicationsResponse?.message || [];
    const completedClaims = completedResponse?.message || [];

    const handleSearch = () => {
        setCommittedSearch(searchText);
        setCommittedApplicationId(applicationId);
        setCurrentPage(1);
        setCompletedPage(1);
    };

    const handleRefresh = () => {
        mutate();
        mutateCompleted();
        mutateStock();
        toast({ title: "Refreshing", description: "Fetching latest data..." });
    };

    const handleViewDetails = (beneficiary: DBTBeneficiary) => {
        setSelectedBeneficiary(beneficiary);
        setIsDetailsOpen(true);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-auto bg-background">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
                {/* Gradient hero header */}
                <div className="relative rounded-2xl bg-gradient-to-br from-lime-500 via-green-500 to-emerald-600 p-4 sm:p-6 overflow-hidden shadow-lg">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                    <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Sprout className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Fodder Seed Applications</h1>
                                <p className="text-sm text-white/80">
                                    {assignedDistrict ? `${assignedDistrict} District` : "Loading assigned district..."} • Fodder seed and DBT application list
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-white hover:bg-white/20 self-end sm:self-center">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Card className="relative overflow-hidden border-2 border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-sky-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="p-4 relative">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Fodder Seed Stock</p>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Package className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-lg font-bold text-sky-700 truncate">
                                    {isStockLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin inline-block text-sky-600" />
                                    ) : (
                                        `${stockResponse?.message?.total_quantity || 0} ${fodderSeedComponent?.unit || "Kg"}`
                                    )}
                                </p>
                                <div className="mt-1 space-y-1 max-h-[60px] overflow-y-auto pr-1">
                                    {stockResponse?.message?.items && stockResponse.message.items.length > 0 ? (
                                        stockResponse.message.items.map((item) => (
                                            <div key={item.item_id} className="flex items-center justify-between text-[10px] text-sky-855 bg-sky-50/50 backdrop-blur rounded px-1.5 py-0.5 border border-sky-100/50">
                                                <span className="font-medium truncate max-w-[100px]" title={item.item_name}>
                                                    {item.item_name}
                                                </span>
                                                <span className="font-bold">{item.quantity} {fodderSeedComponent?.unit || "Kg"}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">No varieties assigned</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="p-4 relative">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Total Loaded</p>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-indigo-700">{beneficiaries.length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Table Card */}
                <Card className="border-2 border-lime-200 shadow-md">
                    <CardHeader className="p-3 sm:p-4 bg-gradient-to-r from-lime-50/50 to-green-50/50 border-b border-lime-100 rounded-t-xl">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base sm:text-lg text-lime-800">
                                    {activeTab === "active" ? "Search and Filter Applications" : "Search and View Completed Claims"}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Pre-filtered for {assignedDistrict} District
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            {activeTab === "active" && (
                                <div className="flex flex-col gap-1 w-full sm:w-44">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Application ID</label>
                                    <Input
                                        placeholder="Application ID"
                                        value={applicationId}
                                        onChange={(e) => setApplicationId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        data-testid="input-application-id"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1 w-full sm:w-64">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Search Beneficiary</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search name, Aadhaar..."
                                        className="pl-9"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        data-testid="input-search"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSearch} className="mt-5 w-full sm:w-auto bg-green-600 hover:bg-green-700" data-testid="button-search">
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        {fodderSeedComponent && (
                            <Card className="border-lime-200 bg-lime-50/20">
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-lime-100/80">
                                            <Info className="h-4 w-4 text-lime-800" />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <p className="font-semibold text-lime-900 text-xs">{fodderSeedComponent.name} Rules</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                <div>
                                                    <p className="text-muted-foreground">Subsidy %</p>
                                                    <p className="font-bold text-lime-900">{fodderSeedComponent.subsidy_percent ? `${fodderSeedComponent.subsidy_percent}%` : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Rate / {fodderSeedComponent.unit || 'kg'}</p>
                                                    <p className="font-bold text-lime-900">{fodderSeedComponent.rate_per_kg ? `₹${fodderSeedComponent.rate_per_kg}` : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Max Subsidy</p>
                                                    <p className="font-bold text-lime-900">₹{fodderSeedComponent.maximum_subsidy_amount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Max Quantity</p>
                                                    <p className="font-bold text-lime-900">{fodderSeedComponent.max_quantity ? `${fodderSeedComponent.max_quantity} ${fodderSeedComponent.unit || 'kg'}` : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Tabs value={activeTab} onValueChange={(val) => {
                            setActiveTab(val);
                        }} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md border-2 border-lime-200 bg-lime-50/50 p-1 mb-4">
                                <TabsTrigger value="active" className="flex items-center justify-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold" data-testid="tab-active">
                                    <FileText className="w-4 h-4" />
                                    Active Applications
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="flex items-center justify-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold" data-testid="tab-completed">
                                    <CheckCircle className="w-4 h-4" />
                                    Completed Claims
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="space-y-4">
                                <div className="border rounded-lg overflow-hidden flex flex-col shadow-sm">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)]">
                                        <table className="w-full min-w-[900px] text-xs">
                                            <thead className="bg-muted sticky top-0 z-30 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Beneficiary Name</th>
                                                    <th className="text-left p-3 font-semibold">Location</th>
                                                    <th className="text-left p-3 font-semibold">Claim Progress</th>
                                                    <th className="text-left p-3 font-semibold">Fodder Seed Variety</th>
                                                    <th className="text-left p-3 font-semibold">Quantity</th>
                                                    <th className="text-left p-3 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-12">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Loader2 className="h-6 w-6 animate-spin text-lime-600" />
                                                                <p className="text-xs text-muted-foreground">Loading applications...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : beneficiaries.length > 0 ? (
                                                    beneficiaries.map((beneficiary) => (
                                                        <tr key={beneficiary.name} data-testid={`row-beneficiary-${beneficiary.name}`} className="border-b last:border-0 hover:bg-muted/30 transition-all">
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-semibold text-lime-900">{beneficiary.first_name} {beneficiary.mid_name} {beneficiary.last_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">Aadhaar: {beneficiary.aadhar_number || "N/A"}</p>
                                                                    <Badge variant="secondary" className="mt-1 text-[9px] px-1 py-0 bg-lime-100 text-lime-800 border-none">
                                                                        ID: {beneficiary.name}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{beneficiary.district}</p>
                                                                    <p className="text-muted-foreground text-[10px]">{beneficiary.taluka}, {beneficiary.village}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="space-y-1 w-full max-w-[160px]">
                                                                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                                                        <span>₹{(beneficiary.subsidy_amount || 0).toLocaleString('en-IN')}</span>
                                                                        <span>₹{(beneficiary.maximum_subsidy_amount || 0).toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                    <Progress 
                                                                        value={
                                                                            (beneficiary.maximum_subsidy_amount || 0) > 0 
                                                                                ? ((beneficiary.subsidy_amount || 0) / (beneficiary.maximum_subsidy_amount || 0)) * 100 
                                                                                : 0
                                                                        } 
                                                                        className="h-2 bg-slate-100" 
                                                                    />
                                                                    <span className="text-[9px] text-muted-foreground block text-right font-medium">
                                                                        {((beneficiary.maximum_subsidy_amount || 0) > 0 
                                                                            ? ((beneficiary.subsidy_amount || 0) / (beneficiary.maximum_subsidy_amount || 0)) * 100 
                                                                            : 0
                                                                        ).toFixed(1)}% claimed
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <p className="font-semibold text-slate-800">{beneficiary.fodder_seed_variety || "N/A"}</p>
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-200 font-bold font-mono">
                                                                    {beneficiary.Quantity || "0"} {beneficiary.unit || "Kg"}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3">
                                                                <Link href={`/subadmin/fodder-seed/claim/${beneficiary.name}`}>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 border-lime-300 text-lime-800 hover:bg-lime-50"
                                                                        data-testid={`button-view-details-${beneficiary.name}`}
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5 mr-1" />
                                                                        Form
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                                            <Sprout className="h-10 w-10 mx-auto mb-2 text-lime-300" />
                                                            No applications found matching your criteria.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination controls */}
                                {beneficiaries.length > 0 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            Page {currentPage} • Showing {beneficiaries.length} records
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 text-xs border-lime-200"
                                                data-testid="button-prev-page"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                disabled={beneficiaries.length < PAGE_SIZE}
                                                className="h-8 text-xs border-lime-200"
                                                data-testid="button-next-page"
                                            >
                                                Next
                                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="completed" className="space-y-4">
                                <div className="border rounded-lg overflow-hidden flex flex-col shadow-sm">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)]">
                                        <table className="w-full min-w-[900px] text-xs">
                                            <thead className="bg-muted sticky top-0 z-30 border-b">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Claim Info</th>
                                                    <th className="text-left p-3 font-semibold">Location</th>
                                                    <th className="text-left p-3 font-semibold">Bank Details</th>
                                                    <th className="text-left p-3 font-semibold">Seed Variety</th>
                                                    <th className="text-left p-3 font-semibold">Quantity</th>
                                                    <th className="text-left p-3 font-semibold">Financials</th>
                                                    <th className="text-left p-3 font-semibold">Date Completed</th>
                                                    <th className="text-left p-3 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isCompletedLoading ? (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-12">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Loader2 className="h-6 w-6 animate-spin text-lime-600" />
                                                                <p className="text-xs text-muted-foreground">Loading completed claims...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : completedClaims.length > 0 ? (
                                                    completedClaims.map((claim) => (
                                                        <tr key={claim.claim_id} data-testid={`row-claim-${claim.claim_id}`} className="border-b last:border-0 hover:bg-muted/30 transition-all">
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-semibold text-lime-900">{claim.first_name} {claim.mid_name} {claim.last_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">Aadhaar: {claim.aadhar_number || "N/A"}</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-lime-100 text-lime-800 border-none">
                                                                            Claim: {claim.claim_id}
                                                                        </Badge>
                                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                                                            App: {claim.application}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{claim.district}</p>
                                                                    <p className="text-muted-foreground text-[10px]">{claim.taluka}, {claim.village}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-medium">Acct: {maskAccountNumber(claim.account_number)}</p>
                                                                    <p className="text-muted-foreground text-[10px]">{claim.bank_name}</p>
                                                                    <p className="text-muted-foreground text-[10px] font-mono">{claim.ifsc_code}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <p className="font-semibold text-slate-800">{claim.stock_item || "N/A"}</p>
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-200 font-bold font-mono">
                                                                    {claim.quantity || "0"} {fodderSeedComponent?.unit || "Kg"}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-medium text-slate-700">Total: ₹{claim.amount?.toLocaleString('en-IN')}</p>
                                                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold mt-0.5">
                                                                        Subsidy: ₹{claim.subsidy_amount?.toLocaleString('en-IN')}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-slate-600 font-mono text-[11px]">
                                                                {formatDate(claim.modified)}
                                                            </td>
                                                            <td className="p-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedCompletedClaim(claim);
                                                                        setIsCompletedDetailsOpen(true);
                                                                    }}
                                                                    className="h-8 border-lime-300 text-lime-800 hover:bg-lime-50"
                                                                    data-testid={`button-view-claim-${claim.claim_id}`}
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                                                    View Receipt
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                                            <Sprout className="h-10 w-10 mx-auto mb-2 text-lime-300" />
                                                            No completed claims found matching your criteria.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination controls */}
                                {completedClaims.length > 0 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            Page {completedPage} • Showing {completedClaims.length} records
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                                                disabled={completedPage === 1}
                                                className="h-8 text-xs border-lime-200"
                                                data-testid="button-completed-prev-page"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompletedPage(p => p + 1)}
                                                disabled={completedClaims.length < PAGE_SIZE}
                                                className="h-8 text-xs border-lime-200"
                                                data-testid="button-completed-next-page"
                                            >
                                                Next
                                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Details Modal Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-md rounded-2xl overflow-hidden p-0 gap-0 border-2 border-lime-500/30">
                    {selectedBeneficiary && (
                        <>
                            <div className="bg-gradient-to-br from-lime-500 via-green-500 to-emerald-600 p-5 text-white relative">
                                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                                <DialogHeader className="space-y-1 relative z-10">
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Application Details
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-xs">
                                        Application ID: {selectedBeneficiary.name}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Personal Info Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-lime-600" />
                                        Beneficiary Information
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Full Name:</span>
                                            <span className="font-semibold text-slate-800">{selectedBeneficiary.first_name} {selectedBeneficiary.mid_name} {selectedBeneficiary.last_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Aadhaar Number:</span>
                                            <span className="font-mono text-slate-800">{selectedBeneficiary.aadhar_number || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">District:</span>
                                            <span className="font-semibold text-slate-800">{selectedBeneficiary.district}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Taluka & Village:</span>
                                            <span className="font-medium text-slate-800">{selectedBeneficiary.taluka}, {selectedBeneficiary.village}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Info Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Banknote className="h-3.5 w-3.5 text-green-600" />
                                        Bank Account Details
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bank Name:</span>
                                            <span className="font-semibold text-slate-800">{selectedBeneficiary.bank_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Account Number:</span>
                                            <span className="font-mono text-slate-800">{maskAccountNumber(selectedBeneficiary.account_number)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IFSC Code:</span>
                                            <span className="font-mono text-slate-800">{selectedBeneficiary.ifsc_code}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fodder Seed Details Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Sprout className="h-3.5 w-3.5 text-lime-600" />
                                        Fodder Seed Details
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-2.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Component:</span>
                                            <span className="font-bold text-lime-900">{selectedBeneficiary.component_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fodder Seed Variety:</span>
                                            <span className="font-semibold text-slate-850">{selectedBeneficiary.fodder_seed_variety || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Quantity:</span>
                                            <span className="font-bold text-lime-700">{selectedBeneficiary.Quantity || "0"} {selectedBeneficiary.unit || "Kg"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border-t p-3 flex justify-end">
                                <Button onClick={() => setIsDetailsOpen(false)} className="bg-lime-600 hover:bg-lime-700 text-white rounded-xl h-9 text-xs">
                                    Close Details
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Completed Claim Details Modal Dialog */}
            <Dialog open={isCompletedDetailsOpen} onOpenChange={setIsCompletedDetailsOpen}>
                <DialogContent className="max-w-md rounded-2xl overflow-hidden p-0 gap-0 border-2 border-emerald-500/30">
                    {selectedCompletedClaim && (
                        <>
                            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-5 text-white relative">
                                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                                <DialogHeader className="space-y-1 relative z-10">
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Completed Seed Claim Receipt
                                    </DialogTitle>
                                    <DialogDescription className="text-white/80 text-xs">
                                        Claim ID: {selectedCompletedClaim.claim_id}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Beneficiary Info Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-emerald-600" />
                                        Beneficiary Information
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Full Name:</span>
                                            <span className="font-semibold text-slate-800">{selectedCompletedClaim.first_name} {selectedCompletedClaim.mid_name} {selectedCompletedClaim.last_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Aadhaar Number:</span>
                                            <span className="font-mono text-slate-800">{selectedCompletedClaim.aadhar_number || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">District:</span>
                                            <span className="font-semibold text-slate-800">{selectedCompletedClaim.district}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Taluka & Village:</span>
                                            <span className="font-medium text-slate-800">{selectedCompletedClaim.taluka}, {selectedCompletedClaim.village}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Info Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                                        Bank Account Details
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bank Name:</span>
                                            <span className="font-semibold text-slate-800">{selectedCompletedClaim.bank_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Account Number:</span>
                                            <span className="font-mono text-slate-800">{maskAccountNumber(selectedCompletedClaim.account_number)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IFSC Code:</span>
                                            <span className="font-mono text-slate-800">{selectedCompletedClaim.ifsc_code}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Claim & Seed Details Section */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                                        Claim & Seed Transaction
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Application ID:</span>
                                            <span className="font-mono text-slate-800">{selectedCompletedClaim.application}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Seed Variety:</span>
                                            <span className="font-semibold text-slate-850">{selectedCompletedClaim.stock_item || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Distributed Quantity:</span>
                                            <span className="font-bold text-slate-800">{selectedCompletedClaim.quantity || "0"} {fodderSeedComponent?.unit || "Kg"}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 mt-1">
                                            <span className="text-muted-foreground font-semibold">Invoice Amount:</span>
                                            <span className="font-bold text-slate-800">₹{selectedCompletedClaim.amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100/50 mt-1">
                                            <span className="text-emerald-800 font-bold">Subsidy Disbursed:</span>
                                            <span className="font-extrabold text-emerald-700 text-sm">₹{selectedCompletedClaim.subsidy_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground pt-1.5 font-mono">
                                            <span>Completed Date:</span>
                                            <span>{formatDate(selectedCompletedClaim.modified)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border-t p-3 flex justify-end">
                                <Button onClick={() => setIsCompletedDetailsOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs">
                                    Close Receipt
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
