"use client";

import { useMemo, useState, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
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

            // Admin Expense Target row
            const adminRow: (string | number)[] = ["", "Admin Expense Target"];
            componentNames.forEach(() => {
                adminRow.push("", "");
            });
            adminRow.push("");
            adminRow.push((targetsData.totals?.admin_expense_target || 0) / 100000); // Convert to Lakhs
            rows.push(adminRow);

            // Grand Total row
            const grandTotalRow: (string | number)[] = ["", "GRAND TOTAL (Financial)"];
            componentNames.forEach(() => {
                grandTotalRow.push("", "");
            });
            grandTotalRow.push("");
            grandTotalRow.push(((targetsData.totals?.total_financial_target || 0) + (targetsData.totals?.admin_expense_target || 0)) / 100000);
            rows.push(grandTotalRow);

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Districts</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{districtNames.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Components</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600">{componentNames.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Physical Target</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-orange-600">
                                {targetsData.totals?.total_physical_target || 0}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Financial Target</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-green-600">
                                {formatCurrency(targetsData.totals?.total_financial_target || 0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Admin Expense Target</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-purple-600">
                                {formatCurrency(targetsData.totals?.admin_expense_target || 0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Physical & Financial Targets - All Components
                    </CardTitle>
                    <CardDescription>
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
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    {/* Component names header row */}
                                    <TableRow className="bg-muted/50">
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[50px] align-middle">
                                            Sr. No.
                                        </TableHead>
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-10 min-w-[120px] align-middle">
                                            Name of District
                                        </TableHead>
                                        {componentNames.map((name) => (
                                            <TableHead key={name} colSpan={2} className="border text-center font-bold min-w-[160px] bg-blue-50">
                                                {name}
                                            </TableHead>
                                        ))}
                                        <TableHead colSpan={2} className="border text-center font-bold min-w-[160px] bg-green-100">
                                            TOTAL
                                        </TableHead>
                                    </TableRow>
                                    {/* Physical/Financial sub-header row */}
                                    <TableRow className="bg-muted/30">
                                        {componentNames.map((name) => (
                                            <Fragment key={`${name}-header`}>
                                                <TableHead className="border text-center font-semibold min-w-[80px] bg-orange-50">
                                                    Physical
                                                </TableHead>
                                                <TableHead className="border text-center font-semibold min-w-[80px] bg-blue-50">
                                                    Financial (₹ Lakhs)
                                                </TableHead>
                                            </Fragment>
                                        ))}
                                        <TableHead className="border text-center font-semibold min-w-[80px] bg-orange-100">
                                            Physical
                                        </TableHead>
                                        <TableHead className="border text-center font-semibold min-w-[80px] bg-green-100">
                                            Financial (₹ Lakhs)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districtNames.map((districtName, index) => {
                                        const physicalData = targetsData.physical_target?.[districtName];
                                        const financialData = targetsData.financial_target?.[districtName];
                                        return (
                                            <TableRow key={districtName} className="hover:bg-muted/30">
                                                <TableCell className="border text-center font-medium sticky left-0 bg-background z-10">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="border font-medium sticky left-[50px] bg-background z-10">
                                                    {districtName}
                                                </TableCell>
                                                {componentNames.map((compName) => {
                                                    const physicalValue = physicalData?.components?.[compName] || 0;
                                                    const financialValue = financialData?.components?.[compName] || 0;
                                                    return (
                                                        <Fragment key={`${districtName}-${compName}`}>
                                                            <TableCell className="border text-right bg-orange-50/30">
                                                                {physicalValue}
                                                            </TableCell>
                                                            <TableCell className="border text-right">
                                                                {formatInLakhs(financialValue)}
                                                            </TableCell>
                                                        </Fragment>
                                                    );
                                                })}
                                                <TableCell className="border text-right font-bold bg-orange-50">
                                                    {physicalData?.total || 0}
                                                </TableCell>
                                                <TableCell className="border text-right font-bold bg-green-50">
                                                    {formatInLakhs(financialData?.total || 0)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted font-bold">
                                        <TableCell className="border text-center sticky left-0 bg-muted z-10"></TableCell>
                                        <TableCell className="border sticky left-[50px] bg-muted z-10">TOTAL</TableCell>
                                        {componentNames.map((compName) => (
                                            <Fragment key={`${compName}-total`}>
                                                <TableCell className="border text-right bg-orange-100">
                                                    {componentTotals[compName]?.physical || 0}
                                                </TableCell>
                                                <TableCell className="border text-right">
                                                    {formatInLakhs(componentTotals[compName]?.financial || 0)}
                                                </TableCell>
                                            </Fragment>
                                        ))}
                                        <TableCell className="border text-right bg-orange-100">
                                            {targetsData.totals?.total_physical_target || 0}
                                        </TableCell>
                                        <TableCell className="border text-right bg-green-100">
                                            {formatInLakhs(targetsData.totals?.total_financial_target || 0)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="bg-purple-50 font-bold">
                                        <TableCell className="border text-center sticky left-0 bg-purple-50 z-10"></TableCell>
                                        <TableCell className="border sticky left-[50px] bg-purple-50 z-10">Admin Expense Target</TableCell>
                                        {componentNames.map((compName) => (
                                            <Fragment key={`${compName}-admin`}>
                                                <TableCell className="border text-right" colSpan={2}></TableCell>
                                            </Fragment>
                                        ))}
                                        <TableCell className="border text-right"></TableCell>
                                        <TableCell className="border text-right bg-purple-100">
                                            {formatInLakhs(targetsData.totals?.admin_expense_target || 0)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="bg-green-50 font-bold text-sm">
                                        <TableCell className="border text-center sticky left-0 bg-green-50 z-10"></TableCell>
                                        <TableCell className="border sticky left-[50px] bg-green-50 z-10">GRAND TOTAL (Financial)</TableCell>
                                        {componentNames.map((compName) => (
                                            <Fragment key={`${compName}-grand`}>
                                                <TableCell className="border text-right" colSpan={2}></TableCell>
                                            </Fragment>
                                        ))}
                                        <TableCell className="border text-right"></TableCell>
                                        <TableCell className="border text-right bg-green-200">
                                            {formatInLakhs((targetsData.totals?.total_financial_target || 0) + (targetsData.totals?.admin_expense_target || 0))}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>


        </div>
    );
}
