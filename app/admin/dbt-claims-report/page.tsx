"use client"
import { useRef } from "react";
import {
    Download,
    CheckCircle,
    Banknote,
    ArrowLeft,
    TrendingUp,
    Users,
    Package
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFrappeGetCall } from "frappe-react-sdk";
import { DBTClaim } from "@/types";
import DisbursedClaimsTable from "@/components/DisbursedClaimsTable";
import { useExport } from "@/hooks/use-export";
import { type ExportFormat } from "@/lib/export-report";

export default function DBTClaimsReport() {
    // Fetch disbursed claims for stats only
    const { data: disbursedClaimsResponse } = useFrappeGetCall<{ message: DBTClaim[] }>(
        "vmddp_app.api.v1.accountant.dbt_completed_list",
        {
            limit_start: 0,
            limit_page_length: 1000, // Get more for stats
        },
        `dbt_completed_list_stats_admin`
    );
    const disbursedClaims = disbursedClaimsResponse?.message || [];

    const filtersRef = useRef<{ component: string | null; district: string | null; searchText: string }>({
        component: null,
        district: null,
        searchText: "",
    });

    const { isExporting, handleExport } = useExport({
        method: "vmddp_app.api.v1.accountant.export_dbt_completed_list",
        filename: "dbt-claims-report",
    });

    const onExport = (format: ExportFormat) => {
        const { district, searchText, component } = filtersRef.current;
        handleExport({
            format,
            params: {
                ...(district ? { district } : {}),
                ...(searchText ? { search_text: searchText } : {}),
                ...(component ? { component_filter: component } : {}),
            },
        });
    };

    const stats = {
        total_disbursed_amount: disbursedClaims.reduce((sum, claim) => sum + (claim.total_amount || 0), 0),
        total_claims_processed: disbursedClaims.length,
        total_beneficiaries: new Set(disbursedClaims.map(c => c.app_form)).size,
        total_components: new Set(disbursedClaims.map(c => c.component)).size,
    };

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports">
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                DBT Claims Report
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">View all processed Direct Benefit Transfer claims</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card data-testid="card-total-disbursed" className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Disbursed</p>
                                    <p className="text-lg sm:text-2xl font-bold text-green-600 drop-shadow-sm">₹{stats.total_disbursed_amount?.toLocaleString("en-IN") || 0}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">{stats.total_claims_processed || 0} claims</span>

                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-claims-processed" className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Claims Processed</p>
                                    <p className="text-lg sm:text-2xl font-bold text-blue-600 drop-shadow-sm">{stats.total_claims_processed || 0}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">Disbursed successfully</span>

                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-beneficiaries" className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</p>
                                    <p className="text-lg sm:text-2xl font-bold text-purple-600 drop-shadow-sm">{stats.total_beneficiaries || 0}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">Received benefits</span>

                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-dbt-components" className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">DBT Components</p>
                                    <p className="text-lg sm:text-2xl font-bold text-orange-600 drop-shadow-sm">{stats.total_components || 0}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">Available components</span>

                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Claims List - Using DisbursedClaimsTable Component */}
                <DisbursedClaimsTable
                    title="Disbursed Claims"
                    description="Complete history of processed DBT payments"
                    onFiltersChange={(filters) => { filtersRef.current = filters; }}
                    onExport={onExport}
                    isExporting={isExporting}
                />
            </div>
        </div>
    );
}