"use client"
import { useState, useEffect } from "react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { DBTClaim, Component } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";

const PAGE_SIZE = 20;

interface DisbursedClaimsTableProps {
    title?: string;
    description?: string;
    showFilters?: boolean;
    defaultDistrict?: string | null;
    defaultComponent?: string | null;
    onFiltersChange?: (filters: { component: string | null; district: string | null; searchText: string }) => void;
}

export default function DisbursedClaimsTable({
    title = "Disbursed Claims History",
    description = "Recently processed DBT payments",
    showFilters = true,
    defaultDistrict = null,
    defaultComponent = null,
    onFiltersChange,
}: DisbursedClaimsTableProps) {
    // Disbursed claims filters
    const [disbursedSearchText, setDisbursedSearchText] = useState("");
    const [disbursedDistrict, setDisbursedDistrict] = useState<string | null>(defaultDistrict);
    const [disbursedComponent, setDisbursedComponent] = useState<string | null>(defaultComponent);
    const [disbursedPage, setDisbursedPage] = useState(1);

    useEffect(() => {
        if (onFiltersChange) {
            onFiltersChange({
                component: disbursedComponent,
                district: disbursedDistrict,
                searchText: disbursedSearchText,
            });
        }
    }, [disbursedComponent, disbursedDistrict, disbursedSearchText]);

    // Fetch components for filter
    const { data: components } = useFrappeGetDocList<Pick<Component, 'name' | 'subsidy_percent' | 'maximum_subsidy_amount' | 'rate_per_kg' | 'max_quantity' | 'multiple_claims_allowed'>>("Component", {
        fields: ['name', 'subsidy_percent', 'maximum_subsidy_amount', 'rate_per_kg', 'max_quantity', 'multiple_claims_allowed'],
        filters: [['for_dbt_claims', '=', '1']]
    });

    // Fetch districts for filter
    const { data: districts } = useFrappeGetDocList<{ name: string }>("District Master", {
        fields: ["name"],
        limit: 100
    });

    // Fetch disbursed claims
    const { data: disbursedClaimsResponse, isLoading: disbursedLoading } = useFrappeGetCall<{ message: DBTClaim[] }>(
        "vmddp_app.api.v1.accountant.dbt_completed_list",
        {
            district: disbursedDistrict || undefined,
            search_text: disbursedSearchText || undefined,
            component_filter: disbursedComponent || undefined,
            limit_start: (disbursedPage - 1) * PAGE_SIZE,
            limit_page_length: PAGE_SIZE,
        },
        `dbt_completed_list_${disbursedDistrict || 'all'}_${disbursedSearchText}_${disbursedComponent || 'all'}_${disbursedPage}`
    );
    const disbursedClaims = disbursedClaimsResponse?.message || [];

    return (
        <Card data-testid="card-disbursed-history">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by application ID, name, or aadhar..."
                                value={disbursedSearchText}
                                onChange={(e) => {
                                    setDisbursedSearchText(e.target.value);
                                    setDisbursedPage(1);
                                }}
                                className="pl-10"
                                data-testid="input-disbursed-search"
                            />
                        </div>

                        <Select value={disbursedDistrict || "all"} onValueChange={(value) => {
                            setDisbursedDistrict(value === "all" ? null : value);
                            setDisbursedPage(1);
                        }}>
                            <SelectTrigger className="w-44" data-testid="select-disbursed-district">
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

                        <Select value={disbursedComponent || "all"} onValueChange={(value) => {
                            setDisbursedComponent(value === "all" ? null : value);
                            setDisbursedPage(1);
                        }}>
                            <SelectTrigger className="w-52" data-testid="select-disbursed-component">
                                <SelectValue placeholder="All Components" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Components</SelectItem>
                                {components?.map((c) => (
                                    <SelectItem key={c.name} value={c.name}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {disbursedLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : disbursedClaims && disbursedClaims.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden flex flex-col">
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-muted border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Claim ID</th>
                                        <th className="text-left p-3 font-medium">Application</th>
                                        <th className="text-left p-3 font-medium">District</th>
                                        <th className="text-left p-3 font-medium">Component</th>
                                        <th className="text-left p-3 font-medium">Invoice</th>
                                        <th className="text-right p-3 font-medium">Qty</th>
                                        <th className="text-right p-3 font-medium">Total Amt</th>
                                        <th className="text-right p-3 font-medium">Subsidy</th>
                                        <th className="text-left p-3 font-medium">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disbursedClaims.map((claim) => {
                                        const beneficiaryName = [claim.first_name, claim.mid_name, claim.last_name].filter(Boolean).join(' ');
                                        return (
                                            <tr key={claim.dbt_claim_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-disbursed-${claim.dbt_claim_id}`}>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    <span className="font-mono">{claim.dbt_claim_id}</span>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    <div>
                                                        <span className="font-medium">{claim.application_id}</span>
                                                        <p className="text-xs text-muted-foreground">{beneficiaryName}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    <span>{claim.district}</span>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    <p className="font-medium">{claim.component}</p>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    <div>
                                                        <p className="font-medium">{claim.invoice_number}</p>
                                                        <p className="text-xs text-muted-foreground">{claim.purchase_date}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm text-right">
                                                    {claim.quantity}
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm text-right">
                                                    ₹{claim.total_amount.toLocaleString("en-IN")}
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm text-right">
                                                    <span className="font-medium text-green-600">
                                                        {claim.subsidy_given ? `₹${parseFloat(claim.subsidy_given).toLocaleString("en-IN")}` : "-"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs sm:text-sm">
                                                    {claim.invoice_upload ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => window.open(claim.invoice_upload!, "_blank")}
                                                            data-testid={`button-view-invoice-${claim.dbt_claim_id}`}
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">N/A</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No disbursed claims found</p>
                )}

                {/* Pagination for disbursed claims */}
                {disbursedClaims.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-muted-foreground">
                            Page {disbursedPage} • Showing {disbursedClaims.length} results
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDisbursedPage(p => Math.max(1, p - 1))}
                                disabled={disbursedPage === 1}
                                data-testid="button-disbursed-prev-page"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDisbursedPage(p => p + 1)}
                                disabled={disbursedClaims.length < PAGE_SIZE}
                                data-testid="button-disbursed-next-page"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
