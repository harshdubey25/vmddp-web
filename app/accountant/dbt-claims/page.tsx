"use client"
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    User,
    Download,
    CheckCircle,
    Banknote,
    Info,
    Loader2,
    ExternalLink,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFrappeGetCall, useFrappeGetDocCount, useFrappeGetDocList } from "frappe-react-sdk";
import { Component, DBTClaim } from "@/types";
import * as XLSX from "xlsx";
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
}

const PAGE_SIZE = 20;

export default function DBTClaims() {
    const { data: components } = useFrappeGetDocList<Pick<Component, 'name' | 'subsidy_percent' | 'maximum_subsidy_amount' | 'rate_per_kg' | 'max_quantity'>>("Component", { fields: ['name', 'subsidy_percent', 'maximum_subsidy_amount', 'rate_per_kg', 'max_quantity'], filters: [['for_dbt_claims', '=', '1']] });
    const [selectedComponent, setSelectedComponent] = useState<{ name: string, subsidy_percent: number, maximum_subsidy_amount: number, rate_per_kg: number, max_quantity: number } | null>(null);

    // Filter and pagination state
    const [searchText, setSearchText] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", { fields: ["name"], limit: 100 });

    const { data: beneficiariesResponse, isLoading: beneficiariesLoading } = useFrappeGetCall<{ message: DBTBeneficiary[] }>(
        "vmddp_app.api.v1.accountant.dbt_application_list",
        {
            component_filter: selectedComponent?.name,
            district: selectedDistrict || undefined,
            search_text: searchText || undefined,
            limit_start: (currentPage - 1) * PAGE_SIZE,
            limit_page_length: PAGE_SIZE,
        },
        selectedComponent ? `dbt_application_list_${selectedComponent.name}_${selectedDistrict || 'all'}_${searchText}_${currentPage}` : null
    );
    const beneficiaries = beneficiariesResponse?.message || [];

    // Reset pagination when filters change
    const handleFilterChange = () => {
        setCurrentPage(1);
    };

    // Fetch disbursed claims (docstatus=1 means submitted)
    const { data: disbursedClaims, isLoading: disbursedLoading } = useFrappeGetDocList<DBTClaim>(
        "DBT Claims",
        {
            fields: ["name", "creation", "app_form", "component", "invoice_number", "invoice_upload", "purchase_date", "quantity", "total_amount", "subsidy_given", "docstatus"],
            filters: [["docstatus", "=", 1]],
            orderBy: { field: "creation", order: "desc" },
            limit: 50
        }
    );

    const handleSelectedComponentChange = (componentName: string) => {
        const component = components?.find(c => c.name === componentName) || null;
        setSelectedComponent(component);
        setCurrentPage(1);
    }

    const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value === "all" ? null : value);
        handleFilterChange();
    }

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        handleFilterChange();
    }

    const stats = {
        total_disbursed_amount: (disbursedClaims || []).reduce((sum, claim) => sum + (claim.total_amount || 0), 0),
        total_claims_processed: disbursedClaims?.length || 0,
        total_beneficiaries: new Set((disbursedClaims || []).map(c => c.app_form)).size,
        total_components: new Set((disbursedClaims || []).map(c => c.component)).size,
    };

    const handleExport = () => {
        if (!disbursedClaims || disbursedClaims.length === 0) return;

        const exportData = disbursedClaims.map((claim) => ({
            "Date": new Date(claim.creation).toLocaleDateString("en-IN"),
            "Claim ID": claim.name,
            "Application ID": claim.app_form,
            "Component": claim.component,
            "Invoice Number": claim.invoice_number,
            "Purchase Date": claim.purchase_date,
            "Quantity": claim.quantity,
            "Total Amount": claim.total_amount,
            "Subsidy Given": claim.subsidy_given ? parseFloat(claim.subsidy_given) : 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        const maxWidth = 50;
        const colWidths = Object.keys(exportData[0] || {}).map(key => {
            const maxLength = Math.max(
                key.length,
                ...exportData.map(row => String(row[key as keyof typeof row] || "").length)
            );
            return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DBT Claims");
        XLSX.writeFile(workbook, `dbt_claims_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="h-screen bg-background  w-full">

            <div className="overflow-auto h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    DBT Claims
                                </h1>
                                <p className="text-muted-foreground">Process Direct Benefit Transfer claims for beneficiaries</p>
                            </div>
                        </div>
                        <Button variant="outline" data-testid="button-export" onClick={handleExport} disabled={!disbursedClaims || disbursedClaims.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-dbt-disbursed">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Disbursed</p>
                                        <p className="text-2xl font-bold">₹{stats.total_disbursed_amount}</p>
                                        <p className="text-xs text-muted-foreground">{stats.total_claims_processed} claims processed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-components-count">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <Banknote className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">DBT Components</p>
                                        <p className="text-2xl font-bold">5</p>
                                        <p className="text-xs text-muted-foreground">Available for claims</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-beneficiaries-count">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Eligible Beneficiaries</p>
                                        <p className="text-2xl font-bold">{stats.total_beneficiaries}</p>
                                        <p className="text-xs text-muted-foreground">From disbursed claims</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="new-claim" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="new-claim">New Claim</TabsTrigger>
                            <TabsTrigger value="history">Disbursed History ({disbursedClaims?.length || 0})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new-claim">
                            <Card data-testid="card-beneficiary-selector">
                                <CardHeader>
                                    <CardTitle>New Claim - Select Beneficiary</CardTitle>
                                    <CardDescription>Select a component to view eligible beneficiaries, then click &quot;View Form&quot; to submit a claim</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-4 items-center">
                                        <Select onValueChange={handleSelectedComponentChange} data-testid="select-component">
                                            <SelectTrigger className="w-52" data-testid="select-beneficiary-component">
                                                <SelectValue placeholder="Select Component" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {components?.map((c) => (
                                                    <SelectItem key={c.name} value={c.name}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={selectedDistrict || "all"} onValueChange={handleDistrictChange}>
                                            <SelectTrigger className="w-44" data-testid="select-district">
                                                <SelectValue placeholder="All Districts" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Districts</SelectItem>
                                                {districts?.map((d) => (
                                                    <SelectItem key={d.name} value={d.name}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search name, Aadhaar..."
                                                className="pl-9"
                                                value={searchText}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                data-testid="input-search"
                                            />
                                        </div>
                                    </div>

                                    {selectedComponent && (
                                        <Card className="border-primary/30 bg-primary/5">
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Info className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="font-semibold text-primary">{selectedComponent?.name} - Subsidy Rules</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-muted-foreground">Subsidy Percentage</p>
                                                                <p className="font-bold text-lg">{selectedComponent?.subsidy_percent ? `${selectedComponent.subsidy_percent}%` : 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Rate per kg</p>
                                                                <p className="font-bold text-lg">{selectedComponent?.rate_per_kg ? `₹${selectedComponent.rate_per_kg}` : 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Maximum Subsidy</p>
                                                                <p className="font-bold text-lg">₹{selectedComponent?.maximum_subsidy_amount}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Maximum Quantity</p>
                                                                <p className="font-bold text-lg">{selectedComponent?.max_quantity ? `${selectedComponent.max_quantity} kg` : 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 mt-2">
                                                            Multiple Claims Allowed
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Beneficiary</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Bank Details</TableHead>
                                                <TableHead>Quota Usage</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {beneficiariesLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : beneficiaries.length > 0 ? (
                                                beneficiaries.map((beneficiary) => (
                                                    <TableRow key={beneficiary.name} data-testid={`row-beneficiary-${beneficiary.name}`}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{beneficiary.first_name} {beneficiary.mid_name} {beneficiary.last_name}</p>
                                                                <p className="text-xs text-muted-foreground">{beneficiary.aadhar_number}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="text-sm">{beneficiary.district}</p>
                                                                <p className="text-xs text-muted-foreground">{beneficiary.taluka}, {beneficiary.village}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="text-sm">Account: {beneficiary.account_number}</p>
                                                                <p className="text-xs text-muted-foreground">{beneficiary.ifsc_code}</p>
                                                                <p className="text-xs text-muted-foreground">{beneficiary.bank_name}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="w-28">
                                                                {selectedComponent?.max_quantity ? (
                                                                    <>
                                                                        <Progress value={(beneficiary.used_quantity / beneficiary.max_quantity) * 100} className="h-2" />
                                                                        <p className="text-xs text-muted-foreground mt-1">{beneficiary.remaining_quantity} kg left</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Progress value={(beneficiary.used_amount / beneficiary.maximum_subsidy_amount) * 100} className="h-2" />
                                                                        <p className="text-xs text-muted-foreground mt-1">₹{beneficiary.remaining_subsidy} left</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link href={`/accountant/dbt-claims/claim/${beneficiary.name}?component=${beneficiary.component_name}`}>
                                                                <Button
                                                                    size="sm"
                                                                    data-testid={`button-view-form-${beneficiary.name}`}
                                                                >
                                                                    <FileText className="h-4 w-4 mr-1" />
                                                                    View Form
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        {selectedComponent ? "No eligible beneficiaries found" : "Select a component to view beneficiaries"}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination */}
                                    {beneficiaries.length > 0 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Page {currentPage} • Showing {beneficiaries.length} results
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    data-testid="button-prev-page"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => p + 1)}
                                                    disabled={beneficiaries.length < PAGE_SIZE}
                                                    data-testid="button-next-page"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history">
                            {/* Disbursed Claims History */}
                            <Card data-testid="card-disbursed-history">
                                <CardHeader>
                                    <CardTitle>Disbursed Claims History</CardTitle>
                                    <CardDescription>Recently processed DBT payments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {disbursedLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : disbursedClaims && disbursedClaims.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Claim ID</TableHead>
                                                    <TableHead>Application</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Invoice</TableHead>
                                                    <TableHead className="text-right">Qty</TableHead>
                                                    <TableHead className="text-right">Total Amt</TableHead>
                                                    <TableHead className="text-right">Subsidy</TableHead>
                                                    <TableHead>Invoice</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {disbursedClaims.map((claim) => (
                                                    <TableRow key={claim.name} data-testid={`row-disbursed-${claim.name}`}>
                                                        <TableCell>
                                                            {new Date(claim.creation).toLocaleDateString("en-IN")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-mono text-xs">{claim.name}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm">{claim.app_form}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="font-medium">{claim.component}</p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{claim.invoice_number}</p>
                                                                <p className="text-xs text-muted-foreground">{claim.purchase_date}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {claim.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            ₹{claim.total_amount.toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-medium text-green-600">
                                                                {claim.subsidy_given ? `₹${parseFloat(claim.subsidy_given).toLocaleString("en-IN")}` : "-"}
                                                            </span>
                                                        </TableCell>
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
                                        <p className="text-center text-muted-foreground py-8">No disbursed claims found</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </div>
    );
}
