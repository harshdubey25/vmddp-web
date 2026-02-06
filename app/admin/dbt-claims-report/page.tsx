"use client"
import { useState } from "react";
import {
    Download,
    CheckCircle,
    Banknote,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFrappeGetCall } from "frappe-react-sdk";
import { DBTClaim } from "@/types";
import DisbursedClaimsTable from "@/components/DisbursedClaimsTable";
import * as XLSX from "xlsx";

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

    const stats = {
        total_disbursed_amount: disbursedClaims.reduce((sum, claim) => sum + (claim.total_amount || 0), 0),
        total_claims_processed: disbursedClaims.length,
        total_beneficiaries: new Set(disbursedClaims.map(c => c.app_form)).size,
        total_components: new Set(disbursedClaims.map(c => c.component)).size,
    };

    const handleExport = () => {
        if (!disbursedClaims || disbursedClaims.length === 0) return;

        const exportData = disbursedClaims.map((claim) => {
            const beneficiaryName = [claim.first_name, claim.mid_name, claim.last_name].filter(Boolean).join(' ');
            return {
                "Date": new Date(claim.creation).toLocaleDateString("en-IN"),
                "Claim ID": claim.dbt_claim_id,
                "Application ID": claim.application_id,
                "Beneficiary Name": beneficiaryName,
                "Aadhar Number": claim.aadhar_number,
                "District": claim.district,
                "Component": claim.component,
                "Invoice Number": claim.invoice_number,
                "Purchase Date": claim.purchase_date,
                "Quantity": claim.quantity,
                "Total Amount": claim.total_amount,
                "Subsidy Given": claim.subsidy_given ? parseFloat(claim.subsidy_given) : 0,
                "Status": "Disbursed",
            };
        });

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
        XLSX.writeFile(workbook, `dbt_claims_report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                    <Button
                        variant="outline"
                        data-testid="button-export"
                        onClick={handleExport}
                        disabled={!disbursedClaims || disbursedClaims.length === 0}
                        className="w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card data-testid="card-total-disbursed">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total Disbursed</p>
                                    <p className="text-lg sm:text-2xl font-bold">₹{stats.total_disbursed_amount?.toLocaleString("en-IN") || 0}</p>
                                    <p className="text-xs text-muted-foreground">{stats.total_claims_processed || 0} claims</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-claims-processed">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Claims Processed</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_claims_processed || 0}</p>
                                    <p className="text-xs text-muted-foreground">Disbursed successfully</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-beneficiaries">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10 flex-shrink-0">
                                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_beneficiaries || 0}</p>
                                    <p className="text-xs text-muted-foreground">Received benefits</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-dbt-components">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10 flex-shrink-0">
                                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-muted-foreground">DBT Components</p>
                                    <p className="text-lg sm:text-2xl font-bold">{stats.total_components || 0}</p>
                                    <p className="text-xs text-muted-foreground">Available components</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Claims List - Using DisbursedClaimsTable Component */}
                <DisbursedClaimsTable
                    title="Disbursed Claims"
                    description="Complete history of processed DBT payments"
                />
            </div>
        </div>
    );
}