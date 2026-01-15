"use client";

import { useState, useMemo } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { frappeBrowser } from "@/lib/frappe";
import * as XLSX from "xlsx";

// Type definitions for API response
interface ComponentData {
    beneficiary_share: number;
    subsidy: number;
}

interface DistrictData {
    [componentName: string]: ComponentData;
}

interface MPRApiResponse {
    message: {
        [districtName: string]: DistrictData;
    };
}

export default function MPRReportPage() {
    const { toast } = useToast();
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("2025-26");
    const [isExporting, setIsExporting] = useState(false);

    // Fetch MPR report data
    const { data: apiResponse, isLoading: isLoadingReport, mutate } = useFrappeGetCall<MPRApiResponse>(
        'vmddp_app.api.v1.accountant.mpr_report',
        {}
    );

    // Fetch districts from District Master
    const { data: districtDocs, isLoading: isLoadingDistricts } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });

    // Fetch components from Component doctype
    const { data: componentDocs, isLoading: isLoadingComponents } = useFrappeGetDocList("Component", {
        fields: ["component_name"],
        limit: 100,
    });

    const isLoading = isLoadingReport || isLoadingDistricts || isLoadingComponents;

    const reportData = apiResponse?.message || {};

    // Get all districts from District Master
    const allDistricts = useMemo(() => {
        return (districtDocs ?? [])
            .map((doc: any) => doc?.name1)
            .filter((name: string | undefined): name is string => Boolean(name))
            .sort();
    }, [districtDocs]);

    // Get all components from Component doctype
    const allComponents = useMemo(() => {
        return (componentDocs ?? [])
            .map((doc: any) => doc?.component_name)
            .filter((name: string | undefined): name is string => Boolean(name))
            .sort();
    }, [componentDocs]);

    // Calculate totals for each component
    const componentTotals = useMemo(() => {
        const totals: { [key: string]: { subsidy: number; beneficiary_share: number } } = {};

        allComponents.forEach((component) => {
            totals[component] = { subsidy: 0, beneficiary_share: 0 };
        });

        Object.values(reportData).forEach((districtData) => {
            Object.entries(districtData).forEach(([componentName, data]) => {
                if (totals[componentName]) {
                    totals[componentName].subsidy += data.subsidy || 0;
                    totals[componentName].beneficiary_share += data.beneficiary_share || 0;
                }
            });
        });

        return totals;
    }, [reportData, allComponents]);

    // Calculate grand totals
    const grandTotals = useMemo(() => {
        let totalSubsidy = 0;
        let totalBeneficiaryShare = 0;

        Object.values(componentTotals).forEach((data) => {
            totalSubsidy += data.subsidy;
            totalBeneficiaryShare += data.beneficiary_share;
        });

        return { subsidy: totalSubsidy, beneficiary_share: totalBeneficiaryShare };
    }, [componentTotals]);

    // Calculate row totals for each district
    const getDistrictTotals = (districtData: DistrictData | undefined) => {
        let totalSubsidy = 0;
        let totalBeneficiaryShare = 0;

        if (districtData) {
            Object.values(districtData).forEach((data) => {
                totalSubsidy += data.subsidy || 0;
                totalBeneficiaryShare += data.beneficiary_share || 0;
            });
        }

        return { subsidy: totalSubsidy, beneficiary_share: totalBeneficiaryShare };
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "-";
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Export to Excel
    const handleExport = async () => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: "Generating MPR report...",
        });

        try {
            // Prepare data for Excel
            const headers = ["Sr. No.", "District/Taluka"];
            allComponents.forEach((component) => {
                headers.push(`${component} - Subsidy`);
                headers.push(`${component} - Beneficiary Share`);
            });
            headers.push("Total Subsidy", "Total Beneficiary Share", "Grand Total");

            const rows: (string | number)[][] = [];

            allDistricts.forEach((district, index) => {
                const districtData = reportData[district];
                const row: (string | number)[] = [index + 1, district];

                allComponents.forEach((component) => {
                    const data = districtData[component] || { subsidy: 0, beneficiary_share: 0 };
                    row.push(data.subsidy);
                    row.push(data.beneficiary_share);
                });

                const districtTotals = getDistrictTotals(districtData);
                row.push(districtTotals.subsidy);
                row.push(districtTotals.beneficiary_share);
                row.push(districtTotals.subsidy + districtTotals.beneficiary_share);

                rows.push(row);
            });

            // Add totals row
            const totalsRow: (string | number)[] = ["", "TOTAL"];
            allComponents.forEach((component) => {
                totalsRow.push(componentTotals[component].subsidy);
                totalsRow.push(componentTotals[component].beneficiary_share);
            });
            totalsRow.push(grandTotals.subsidy);
            totalsRow.push(grandTotals.beneficiary_share);
            totalsRow.push(grandTotals.subsidy + grandTotals.beneficiary_share);
            rows.push(totalsRow);

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "MPR Report");

            // Download file
            XLSX.writeFile(wb, `MPR_Report_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: "Export completed",
                description: "MPR report downloaded successfully.",
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

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle refresh
    const handleRefresh = () => {
        mutate();
        toast({
            title: "Refreshing",
            description: "Fetching latest data...",
        });
    };

    const months = [
        { value: "all", label: "All Months" },
        { value: "04", label: "April" },
        { value: "05", label: "May" },
        { value: "06", label: "June" },
        { value: "07", label: "July" },
        { value: "08", label: "August" },
        { value: "09", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
        { value: "01", label: "January" },
        { value: "02", label: "February" },
        { value: "03", label: "March" },
    ];

    const years = [
        { value: "2024-25", label: "2024-25" },
        { value: "2025-26", label: "2025-26" },
        { value: "2026-27", label: "2026-27" },
    ];

    return (
        <div className="p-6 space-y-6 print:p-0 overflow-scroll">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold">Monthly Progress Report (MPR)</h1>
                    <p className="text-muted-foreground">
                        District-wise component progress report
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year.value} value={year.value}>
                                    {year.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting || isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exporting..." : "Export"}
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-xl font-bold">VIDARBHA MILK DEVELOPMENT PROJECT</h1>
                <h2 className="text-lg font-semibold mt-2">Monthly Progress Report (MPR)</h2>
                <p className="text-sm mt-1">
                    Year: {selectedYear} | Month: {months.find(m => m.value === selectedMonth)?.label || "All Months"}
                </p>
                <p className="text-sm">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
            </div>

            {/* Report Card */}
            <Card className="print:shadow-none print:border-0">
                <CardHeader className="print:pb-2">
                    <CardTitle className="flex items-center gap-2 print:text-lg">
                        <FileText className="h-5 w-5 print:hidden" />
                        Component-wise Progress Report
                    </CardTitle>
                    <CardDescription className="print:hidden">
                        Showing subsidy and beneficiary share by district and component
                    </CardDescription>
                </CardHeader>
                <CardContent className="print:p-0">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : allDistricts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No data available for the selected period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[50px]">
                                            Sr. No.
                                        </TableHead>
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-10 min-w-[120px]">
                                            District/Taluka
                                        </TableHead>
                                        {allComponents.map((component) => (
                                            <TableHead key={component} colSpan={2} className="border text-center font-bold min-w-[180px]">
                                                {component}
                                            </TableHead>
                                        ))}
                                        <TableHead colSpan={3} className="border text-center font-bold bg-primary/10 min-w-[240px]">
                                            Total
                                        </TableHead>
                                    </TableRow>
                                    <TableRow className="bg-muted/30">
                                        {allComponents.map((component) => (
                                            <>
                                                <TableHead key={`${component}-subsidy`} className="border text-center text-[10px] min-w-[90px]">
                                                    Subsidy (₹)
                                                </TableHead>
                                                <TableHead key={`${component}-beneficiary`} className="border text-center text-[10px] min-w-[90px]">
                                                    Beneficiary Share (₹)
                                                </TableHead>
                                            </>
                                        ))}
                                        <TableHead className="border text-center text-[10px] bg-primary/10 min-w-[80px]">
                                            Subsidy (₹)
                                        </TableHead>
                                        <TableHead className="border text-center text-[10px] bg-primary/10 min-w-[80px]">
                                            Beneficiary Share (₹)
                                        </TableHead>
                                        <TableHead className="border text-center text-[10px] bg-primary/10 min-w-[80px]">
                                            Grand Total (₹)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allDistricts.map((district, index) => {
                                        const districtData = reportData[district] || {};
                                        const districtTotals = getDistrictTotals(districtData);

                                        return (
                                            <TableRow key={district} className="hover:bg-muted/30">
                                                <TableCell className="border text-center font-medium sticky left-0 bg-background z-10">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="border font-medium sticky left-[50px] bg-background z-10">
                                                    {district}
                                                </TableCell>
                                                {allComponents.map((component) => {
                                                    const data = districtData[component] || { subsidy: 0, beneficiary_share: 0 };
                                                    return (
                                                        <>
                                                            <TableCell key={`${district}-${component}-subsidy`} className="border text-right">
                                                                {formatCurrency(data.subsidy)}
                                                            </TableCell>
                                                            <TableCell key={`${district}-${component}-beneficiary`} className="border text-right">
                                                                {formatCurrency(data.beneficiary_share)}
                                                            </TableCell>
                                                        </>
                                                    );
                                                })}
                                                <TableCell className="border text-right font-semibold bg-primary/5">
                                                    {formatCurrency(districtTotals.subsidy)}
                                                </TableCell>
                                                <TableCell className="border text-right font-semibold bg-primary/5">
                                                    {formatCurrency(districtTotals.beneficiary_share)}
                                                </TableCell>
                                                <TableCell className="border text-right font-bold bg-primary/10">
                                                    {formatCurrency(districtTotals.subsidy + districtTotals.beneficiary_share)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted font-bold">
                                        <TableCell className="border text-center sticky left-0 bg-muted z-10" colSpan={1}>

                                        </TableCell>
                                        <TableCell className="border sticky left-[50px] bg-muted z-10">
                                            TOTAL
                                        </TableCell>
                                        {allComponents.map((component) => (
                                            <>
                                                <TableCell key={`total-${component}-subsidy`} className="border text-right">
                                                    {formatCurrency(componentTotals[component]?.subsidy || 0)}
                                                </TableCell>
                                                <TableCell key={`total-${component}-beneficiary`} className="border text-right">
                                                    {formatCurrency(componentTotals[component]?.beneficiary_share || 0)}
                                                </TableCell>
                                            </>
                                        ))}
                                        <TableCell className="border text-right bg-primary/10">
                                            {formatCurrency(grandTotals.subsidy)}
                                        </TableCell>
                                        <TableCell className="border text-right bg-primary/10">
                                            {formatCurrency(grandTotals.beneficiary_share)}
                                        </TableCell>
                                        <TableCell className="border text-right bg-primary/20 text-base">
                                            {formatCurrency(grandTotals.subsidy + grandTotals.beneficiary_share)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {!isLoading && allDistricts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Districts</CardDescription>
                            <CardTitle className="text-2xl">{allDistricts.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Components</CardDescription>
                            <CardTitle className="text-2xl">{allComponents.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Subsidy</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {formatCurrency(grandTotals.subsidy)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Beneficiary Share</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">
                                {formatCurrency(grandTotals.beneficiary_share)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0.5cm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    table {
                        font-size: 8px !important;
                    }
                    th, td {
                        padding: 2px 4px !important;
                    }
                }
            `}</style>
        </div>
    );
}
