"use client";

import { useMemo, useState, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, FileText, RefreshCw, ArrowLeft, Loader2, Building2, Package, Target, Wallet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall } from "frappe-react-sdk";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
        admin_expense_target: number;
        totals: {
            total_physical_target: number;
            total_financial_target: number;
            admin_expense_target: number;
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
        admin_expense_target: 0,
        totals: { total_physical_target: 0, total_financial_target: 0, admin_expense_target: 0 }
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

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "₹0";
        return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
    };

    // Export report
    const handleExport = async (format: ExportFormat = "excel") => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: `Generating ${format.toUpperCase()} report...`,
        });

        try {
            await exportReport({
                method: "vmddp_app.api.v1.accountant.all_targets_export",
                params: {},
                format,
                filename: "all_targets",
            });

            toast({
                title: "Export completed",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error("Export error:", error);
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isExporting || isLoading} variant="default" size="sm" className="w-full sm:w-auto">
                                {isExporting ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting...</>
                                ) : (
                                    <><FileSpreadsheet className="h-4 w-4 mr-2" />Export</>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("excel")}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary Cards */}
            {!isLoading && districtNames.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-300" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">Total Districts</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl text-blue-600 drop-shadow-sm">{districtNames.length}</CardTitle>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Building2 className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                          
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-300" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">Total Components</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl text-purple-600 drop-shadow-sm">{componentNames.length}</CardTitle>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Package className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                          
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all duration-300" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">Total Physical Target</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl text-orange-600 drop-shadow-sm">
                                        {targetsData.totals?.total_physical_target || 0}
                                    </CardTitle>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Target className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                          
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:bg-green-500/30 transition-all duration-300" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">Total Financial Target</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl text-green-600 drop-shadow-sm">
                                        {formatCurrency(targetsData.totals?.total_financial_target || 0)}
                                    </CardTitle>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Wallet className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                        
                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-300" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">Admin Expense Target</CardDescription>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl text-indigo-600 drop-shadow-sm">
                                        {formatCurrency(targetsData.totals?.admin_expense_target || 0)}
                                    </CardTitle>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Wallet className="h-4 w-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                         
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Physical & Financial Targets - All Components
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        District-wise breakdown of physical and financial targets for all components
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
                                <table className="w-full min-w-[900px] text-xs">
                                    <thead className="bg-muted sticky top-0 z-30">
                                        {/* Component names header row */}
                                        <tr className="bg-muted/50">
                                            <th rowSpan={2} className="border text-center font-bold sticky left-0 bg-muted/50 z-30 min-w-[50px] align-middle p-2">
                                                Sr. No.
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-30 min-w-[120px] align-middle p-2">
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
                                        <tr className="bg-muted/30">
                                            {componentNames.map((name) => (
                                                <Fragment key={`${name}-header`}>
                                                    <th className="border text-center font-semibold min-w-[80px] bg-orange-50 p-2">
                                                        Physical
                                                    </th>
                                                    <th className="border text-center font-semibold min-w-[80px] bg-blue-50 p-2">
                                                        Financial (₹)
                                                    </th>
                                                </Fragment>
                                            ))}
                                            <th className="border text-center font-semibold min-w-[80px] bg-orange-100 p-2">
                                                Physical
                                            </th>
                                            <th className="border text-center font-semibold min-w-[80px] bg-green-100 p-2">
                                                Financial (₹)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {districtNames.map((districtName, index) => {
                                            const physicalData = targetsData.physical_target?.[districtName];
                                            const financialData = targetsData.financial_target?.[districtName];
                                            return (
                                                <tr key={districtName} className="hover:bg-muted/30">
                                                    <td className="border text-center font-medium sticky left-0 bg-background z-10 p-2">
                                                        {index + 1}
                                                    </td>
                                                    <td className="border font-medium sticky left-[50px] bg-background z-10 p-2">
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
                                                                    {formatCurrency(financialValue)}
                                                                </td>
                                                            </Fragment>
                                                        );
                                                    })}
                                                    <td className="border text-right font-bold bg-orange-50 p-2">
                                                        {physicalData?.total || 0}
                                                    </td>
                                                    <td className="border text-right font-bold bg-green-50 p-2">
                                                        {formatCurrency(financialData?.total || 0)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold">
                                            <td className="border text-center sticky left-0 bg-muted z-10 p-2"></td>
                                            <td className="border sticky left-[50px] bg-muted z-10 p-2">TOTAL</td>
                                            {componentNames.map((compName) => (
                                                <Fragment key={`${compName}-total`}>
                                                    <td className="border text-right bg-orange-100 p-2">
                                                        {componentTotals[compName]?.physical || 0}
                                                    </td>
                                                    <td className="border text-right p-2">
                                                        {formatCurrency(componentTotals[compName]?.financial || 0)}
                                                    </td>
                                                </Fragment>
                                            ))}
                                            <td className="border text-right bg-orange-100 p-2">
                                                {targetsData.totals?.total_physical_target || 0}
                                            </td>
                                            <td className="border text-right bg-green-100 p-2">
                                                {formatCurrency(targetsData.totals?.total_financial_target || 0)}
                                            </td>
                                        </tr>
                                        <tr className="bg-purple-50 font-bold">
                                            <td className="border text-center sticky left-0 bg-purple-50 z-10 p-2"></td>
                                            <td className="border sticky left-[50px] bg-purple-50 z-10 p-2">Admin Expense Target</td>
                                            {componentNames.map((compName) => (
                                                <Fragment key={`${compName}-admin`}>
                                                    <td className="border text-right p-2" colSpan={2}></td>
                                                </Fragment>
                                            ))}
                                            <td className="border text-right p-2"></td>
                                            <td className="border text-right bg-purple-100 p-2">
                                                {formatCurrency(targetsData.totals?.admin_expense_target || 0)}
                                            </td>
                                        </tr>
                                        <tr className="bg-green-50 font-bold text-sm">
                                            <td className="border text-center sticky left-0 bg-green-50 z-10 p-2"></td>
                                            <td className="border sticky left-[50px] bg-green-50 z-10 p-2">GRAND TOTAL (Financial)</td>
                                            {componentNames.map((compName) => (
                                                <Fragment key={`${compName}-grand`}>
                                                    <td className="border text-right p-2" colSpan={2}></td>
                                                </Fragment>
                                            ))}
                                            <td className="border text-right p-2"></td>
                                            <td className="border text-right bg-green-200 p-2">
                                                {formatCurrency((targetsData.totals?.total_financial_target || 0) + (targetsData.totals?.admin_expense_target || 0))}
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
