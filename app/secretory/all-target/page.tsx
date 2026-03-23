"use client";

import { useMemo, useState, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall } from "frappe-react-sdk";
import * as XLSX from "xlsx";
import Link from "next/link";

// Type definitions for all_targets API response
interface DistrictComponentData {
    components: {
        [componentName: string]: number;
    };
    total: number;
}

interface AllTargetsResponse {
    message: {
        physical_target: {
            [districtName: string]: DistrictComponentData;
        };
        financial_target: {
            [districtName: string]: DistrictComponentData;
        };
        totals: {
            total_physical_target: number;
            total_financial_target: number;
        };
    };
}

export default function AllTargetsReportPage() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    // Fetch all targets data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<AllTargetsResponse>(
        'vmddp_app.api.v1.accountant.all_targets',
        {},
        undefined,
        { revalidateOnFocus: false }
    );

    const targetsData = apiResponse?.message || {
        physical_target: {},
        financial_target: {},
        totals: { total_physical_target: 0, total_financial_target: 0 }
    };

    // Extract all unique component names from both physical and financial targets
    const componentNames = useMemo(() => {
        const names = new Set<string>();

        // Get component names from physical_target
        if (targetsData.physical_target) {
            Object.values(targetsData.physical_target).forEach((district) => {
                Object.keys(district.components || {}).forEach((name) => names.add(name));
            });
        }

        // Also check financial_target for any additional components
        if (targetsData.financial_target) {
            Object.values(targetsData.financial_target).forEach((district) => {
                Object.keys(district.components || {}).forEach((name) => names.add(name));
            });
        }

        return Array.from(names).sort();
    }, [targetsData]);

    // Extract district names (from financial_target as primary source)
    const districtNames = useMemo(() => {
        const names = new Set<string>();

        if (targetsData.financial_target) {
            Object.keys(targetsData.financial_target).forEach((name) => names.add(name));
        }
        if (targetsData.physical_target) {
            Object.keys(targetsData.physical_target).forEach((name) => names.add(name));
        }

        return Array.from(names).sort();
    }, [targetsData]);

    // Calculate component-wise totals
    const componentTotals = useMemo(() => {
        const totals: { [key: string]: { physical: number; financial: number } } = {};
        componentNames.forEach((name) => {
            totals[name] = { physical: 0, financial: 0 };
        });

        // Sum up physical targets
        if (targetsData.physical_target) {
            Object.values(targetsData.physical_target).forEach((district) => {
                Object.entries(district.components || {}).forEach(([compName, value]) => {
                    if (totals[compName]) {
                        totals[compName].physical += value || 0;
                    }
                });
            });
        }

        // Sum up financial targets
        if (targetsData.financial_target) {
            Object.values(targetsData.financial_target).forEach((district) => {
                Object.entries(district.components || {}).forEach(([compName, value]) => {
                    if (totals[compName]) {
                        totals[compName].financial += value || 0;
                    }
                });
            });
        }

        return totals;
    }, [targetsData, componentNames]);

    // Format currency in lakhs
    const formatInLakhs = (amount: number) => {
        if (amount === 0) return "0";
        const inLakhs = amount / 100000;
        return inLakhs.toFixed(3);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "₹0";
        return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
    };

    // Export to Excel
    const handleExport = async () => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: "Generating report...",
        });

        try {
            // Build headers with Physical/Financial sub-columns
            const headers1 = [
                "Sr. No.",
                "Name of District",
            ];
            const headers2 = ["", ""];

            componentNames.forEach((compName) => {
                headers1.push(compName, "");
                headers2.push("Physical", "Financial (₹ Lakhs)");
            });
            headers1.push("TOTAL", "");
            headers2.push("Physical", "Financial (₹ Lakhs)");

            const rows: (string | number)[][] = [];

            districtNames.forEach((districtName, index) => {
                const row: (string | number)[] = [
                    index + 1,
                    districtName,
                ];

                componentNames.forEach((compName) => {
                    const physicalData = targetsData.physical_target?.[districtName];
                    const financialData = targetsData.financial_target?.[districtName];
                    row.push(physicalData?.components?.[compName] || 0);
                    row.push((financialData?.components?.[compName] || 0) / 100000); // Convert to Lakhs
                });

                const physicalTotal = targetsData.physical_target?.[districtName]?.total || 0;
                const financialTotal = targetsData.financial_target?.[districtName]?.total || 0;
                row.push(physicalTotal);
                row.push(financialTotal / 100000); // Convert to Lakhs
                rows.push(row);
            });

            // Total row
            const totalRow: (string | number)[] = ["", "TOTAL"];
            componentNames.forEach((compName) => {
                totalRow.push(componentTotals[compName]?.physical || 0);
                totalRow.push((componentTotals[compName]?.financial || 0) / 100000); // Convert to Lakhs
            });
            totalRow.push(targetsData.totals?.total_physical_target || 0);
            totalRow.push((targetsData.totals?.total_financial_target || 0) / 100000); // Convert to Lakhs
            rows.push(totalRow);

            const ws = XLSX.utils.aoa_to_sheet([headers1, headers2, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "All Targets");

            XLSX.writeFile(wb, `All_Targets_Report.xlsx`);

            toast({
                title: "Export completed",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export failed",
                description: "Failed to generate report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRefresh = () => {
        mutate();
        toast({
            title: "Refreshing",
            description: "Fetching latest data...",
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">All Targets Report</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            District-wise physical and financial targets for all components
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting || isLoading} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export Excel"}</span>
                        <span className="sm:hidden">{isExporting ? "Export" : "Export"}</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {!isLoading && districtNames.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-xs sm:text-sm font-medium text-indigo-700/80 dark:text-indigo-300">Total Districts</CardDescription>
                            <CardTitle className="text-2xl sm:text-3xl text-indigo-900 dark:text-indigo-100 drop-shadow-sm">{districtNames.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-xs sm:text-sm font-medium text-blue-700/80 dark:text-blue-300">Total Components</CardDescription>
                            <CardTitle className="text-2xl sm:text-3xl text-blue-900 dark:text-blue-100 drop-shadow-sm">{componentNames.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-xs sm:text-sm font-medium text-orange-700/80 dark:text-orange-300">Total Physical Target</CardDescription>
                            <CardTitle className="text-2xl sm:text-3xl text-orange-900 dark:text-orange-100 drop-shadow-sm">
                                {targetsData.totals?.total_physical_target || 0}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-xs sm:text-sm font-medium text-green-700/80 dark:text-green-300">Total Financial Target</CardDescription>
                            <CardTitle className="text-2xl sm:text-3xl text-green-900 dark:text-green-100 drop-shadow-sm">
                                {formatCurrency(targetsData.totals?.total_financial_target || 0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card className="border-t-4 border-t-blue-500 shadow-md">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
                    <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <FileText className="h-5 w-5" />
                        Physical & Financial Targets - All Components
                    </CardTitle>
                    <CardDescription className="text-blue-700/80 dark:text-blue-400">
                        District-wise breakdown of physical and financial targets for all components (Financial values in Lakhs)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : districtNames.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No target data available.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                <table className="w-full min-w-[1200px] text-xs">
                                    <thead className="sticky top-0 z-30 bg-muted">
                                        {/* Component names header row */}
                                        <tr className="bg-muted border-b">
                                            <th rowSpan={2} className="border text-center font-bold sticky left-0 bg-muted z-30 min-w-[50px] align-middle p-2">
                                                Sr. No.
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold sticky left-[50px] bg-muted z-30 min-w-[120px] align-middle p-2">
                                                Name of District
                                            </th>
                                            {componentNames.map((name) => (
                                                <th key={name} colSpan={2} className="border text-center font-bold min-w-[160px] bg-blue-50 p-2">
                                                    {name}
                                                </th>
                                            ))}
                                            <th colSpan={2} className="border text-center font-bold min-w-[160px] bg-green-100 p-2">
                                                TOTAL
                                            </th>
                                        </tr>
                                        {/* Physical/Financial sub-header row */}
                                        <tr className="bg-muted border-b">
                                            {componentNames.map((name) => (
                                                <Fragment key={`${name}-header`}>
                                                    <th className="border text-center font-semibold min-w-[80px] bg-orange-50 p-2">
                                                        Physical
                                                    </th>
                                                    <th className="border text-center font-semibold min-w-[80px] bg-blue-50 p-2">
                                                        Financial (₹ Lakhs)
                                                    </th>
                                                </Fragment>
                                            ))}
                                            <th className="border text-center font-semibold min-w-[80px] bg-orange-100 p-2">
                                                Physical
                                            </th>
                                            <th className="border text-center font-semibold min-w-[80px] bg-green-100 p-2">
                                                Financial (₹ Lakhs)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {districtNames.map((districtName, index) => {
                                            const physicalData = targetsData.physical_target?.[districtName];
                                            const financialData = targetsData.financial_target?.[districtName];
                                            return (
                                                <tr key={districtName} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="border text-center font-medium sticky left-0 bg-background z-20 p-2">
                                                        {index + 1}
                                                    </td>
                                                    <td className="border font-medium sticky left-[50px] bg-background z-20 p-2">
                                                        {districtName}
                                                    </td>
                                                    {componentNames.map((compName) => {
                                                        const physicalValue = physicalData?.components?.[compName] || 0;
                                                        const financialValue = financialData?.components?.[compName] || 0;
                                                        return (
                                                            <Fragment key={`${districtName}-${compName}`}>
                                                                <td className="border text-right bg-orange-50/30 p-2">
                                                                    {physicalValue}
                                                                </td>
                                                                <td className="border text-right p-2">
                                                                    {formatInLakhs(financialValue)}
                                                                </td>
                                                            </Fragment>
                                                        );
                                                    })}
                                                    <td className="border text-right font-bold bg-orange-50 p-2">
                                                        {physicalData?.total || 0}
                                                    </td>
                                                    <td className="border text-right font-bold bg-green-50 p-2">
                                                        {formatInLakhs(financialData?.total || 0)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold border-t">
                                            <td className="border text-center sticky left-0 bg-muted z-20 p-2"></td>
                                            <td className="border sticky left-[50px] bg-muted z-20 p-2">TOTAL</td>
                                            {componentNames.map((compName) => (
                                                <Fragment key={`${compName}-total`}>
                                                    <td className="border text-right bg-orange-100 p-2">
                                                        {componentTotals[compName]?.physical || 0}
                                                    </td>
                                                    <td className="border text-right p-2">
                                                        {formatInLakhs(componentTotals[compName]?.financial || 0)}
                                                    </td>
                                                </Fragment>
                                            ))}
                                            <td className="border text-right bg-orange-100 p-2">
                                                {targetsData.totals?.total_physical_target || 0}
                                            </td>
                                            <td className="border text-right bg-green-100 p-2">
                                                {formatInLakhs(targetsData.totals?.total_financial_target || 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>


        </div>
    );
}
