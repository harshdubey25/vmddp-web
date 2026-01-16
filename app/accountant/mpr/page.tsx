"use client";

import { useState, useMemo, Fragment } from "react";
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
import { Download, FileText, Printer, RefreshCw, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { frappeBrowser } from "@/lib/frappe";
import * as XLSX from "xlsx";

// Type definitions for API response
interface ComponentData {
    beneficiary_share: number;
    subsidy: number;
    for_component_allocation?: number;
    animal_cost?: number;
    collar_cost?: number;
    insurance_cost?: number;
    transportation_cost?: number;
    total_allocation_subsidy?: number;
    physical_achievement?: number;
    is_hgm?: number;
}

interface ComponentTotalData {
    beneficiary_share: number;
    subsidy: number;
    animal_cost: number;
    collar_cost: number;
    insurance_cost: number;
    transportation_cost: number;
    total_allocation_subsidy: number;
    physical_achievement: number;
    for_component_allocation: number;
    is_hgm: number;
}

interface DistrictData {
    [componentName: string]: ComponentData;
}

interface MPRApiResponse {
    message: {
        district_data: {
            [districtName: string]: DistrictData;
        };
        component_totals: {
            [componentName: string]: ComponentTotalData;
        };
    };
}

// Type for component info including allocation flag
interface ComponentInfo {
    name: string;
    hasAllocation: boolean;
    isHgm: boolean;
}

export default function MPRReportPage() {
    const { toast } = useToast();
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("2025-26");
    const [isExporting, setIsExporting] = useState(false);
    const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

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

    const districtData = apiResponse?.message?.district_data || {};
    const apiComponentTotals = apiResponse?.message?.component_totals || {};

    // Get all districts from the API response (not from District Master)
    const allDistricts = useMemo(() => {
        return Object.keys(districtData).sort();
    }, [districtData]);

    // Get all components with their allocation info from the API response
    const allComponents = useMemo((): ComponentInfo[] => {
        const componentMap = new Map<string, ComponentInfo>();

        // Use component_totals to get component info
        Object.entries(apiComponentTotals).forEach(([componentName, data]) => {
            componentMap.set(componentName, {
                name: componentName,
                hasAllocation: data.for_component_allocation === 1,
                isHgm: data.is_hgm === 1
            });
        });

        return Array.from(componentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [apiComponentTotals]);

    // Filter components based on selection
    const filteredComponents = useMemo((): ComponentInfo[] => {
        if (selectedComponents.length === 0) {
            return allComponents;
        }
        return allComponents.filter(c => selectedComponents.includes(c.name));
    }, [allComponents, selectedComponents]);

    // Handle component selection toggle
    const toggleComponentSelection = (componentName: string) => {
        setSelectedComponents(prev => {
            if (prev.includes(componentName)) {
                return prev.filter(c => c !== componentName);
            } else {
                return [...prev, componentName];
            }
        });
    };

    // Clear all component filters
    const clearComponentFilters = () => {
        setSelectedComponents([]);
    };

    // Get component totals from API (filtered by selected components)
    const componentTotals = useMemo(() => {
        const totals: {
            [key: string]: ComponentTotalData;
        } = {};

        filteredComponents.forEach((component) => {
            const apiTotal = apiComponentTotals[component.name];
            if (apiTotal) {
                totals[component.name] = apiTotal;
            }
        });

        return totals;
    }, [apiComponentTotals, filteredComponents]);

    // Calculate grand totals from filtered component totals
    const grandTotals = useMemo(() => {
        let totalSubsidy = 0;
        let totalBeneficiaryShare = 0;
        let totalAnimalCost = 0;
        let totalCollarCost = 0;
        let totalInsuranceCost = 0;
        let totalTransportationCost = 0;
        let totalAllocationSubsidy = 0;
        let totalPhysicalAchievement = 0;

        Object.values(componentTotals).forEach((data) => {
            totalSubsidy += data.subsidy || 0;
            totalBeneficiaryShare += data.beneficiary_share || 0;
            totalAnimalCost += data.animal_cost || 0;
            totalCollarCost += data.collar_cost || 0;
            totalInsuranceCost += data.insurance_cost || 0;
            totalTransportationCost += data.transportation_cost || 0;
            totalAllocationSubsidy += data.total_allocation_subsidy || 0;
            totalPhysicalAchievement += data.physical_achievement || 0;
        });

        return {
            subsidy: totalSubsidy,
            beneficiary_share: totalBeneficiaryShare,
            animal_cost: totalAnimalCost,
            collar_cost: totalCollarCost,
            insurance_cost: totalInsuranceCost,
            transportation_cost: totalTransportationCost,
            total_allocation_subsidy: totalAllocationSubsidy,
            physical_achievement: totalPhysicalAchievement
        };
    }, [componentTotals]);

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

    // Format number without currency
    const formatNumber = (num: number) => {
        if (num === 0) return "-";
        return new Intl.NumberFormat('en-IN').format(num);
    };

    // Export to Excel
    const handleExport = async () => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: "Generating MPR report...",
        });

        try {
            // Prepare data for Excel - First row (component names)
            const headers1 = ["Sr. No.", "District/Taluka"];
            filteredComponents.forEach((component) => {
                if (component.hasAllocation) {
                    headers1.push(component.name, "", "", "", "", "", "");
                } else {
                    headers1.push(component.name, "");
                }
            });

            // Second row (sub-headers)
            const headers2 = ["", ""];
            filteredComponents.forEach((component) => {
                if (component.hasAllocation) {
                    headers2.push(
                        "Animal Cost",
                        "Collar Cost",
                        "Insurance Cost",
                        "Transportation Cost",
                        "Total",
                        "Physical Achievement",
                        "Beneficiary Share"
                    );
                } else {
                    headers2.push("Subsidy", "Beneficiary Share");
                }
            });

            const rows: (string | number)[][] = [];

            allDistricts.forEach((district, index) => {
                const districtInfo = districtData[district];
                const row: (string | number)[] = [index + 1, district];

                filteredComponents.forEach((component) => {
                    const data = districtInfo?.[component.name] || {
                        subsidy: 0,
                        beneficiary_share: 0,
                        animal_cost: 0,
                        collar_cost: 0,
                        insurance_cost: 0,
                        transportation_cost: 0,
                        total_allocation_subsidy: 0,
                        physical_achievement: 0
                    };

                    if (component.hasAllocation) {
                        row.push(
                            data.animal_cost || 0,
                            data.collar_cost || 0,
                            data.insurance_cost || 0,
                            data.transportation_cost || 0,
                            data.total_allocation_subsidy || 0,
                            data.physical_achievement || 0,
                            data.beneficiary_share
                        );
                    } else {
                        row.push(data.subsidy, data.beneficiary_share);
                    }
                });

                rows.push(row);
            });

            // Add totals row
            const totalsRow: (string | number)[] = ["", "TOTAL"];
            filteredComponents.forEach((component) => {
                const totals = componentTotals[component.name];
                if (component.hasAllocation) {
                    totalsRow.push(
                        totals?.animal_cost || 0,
                        totals?.collar_cost || 0,
                        totals?.insurance_cost || 0,
                        totals?.transportation_cost || 0,
                        totals?.total_allocation_subsidy || 0,
                        totals?.physical_achievement || 0,
                        totals?.beneficiary_share || 0
                    );
                } else {
                    totalsRow.push(totals?.subsidy || 0, totals?.beneficiary_share || 0);
                }
            });
            rows.push(totalsRow);

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers1, headers2, ...rows]);
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
        <div className="p-6 space-y-6 print:p-0 overflow-scroll w-full">
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

            {/* Component Filter */}
            <Card className="print:hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter by Components
                        {selectedComponents.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {selectedComponents.length} selected
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                        {allComponents.map((component) => (
                            <Badge
                                key={component.name}
                                variant={selectedComponents.includes(component.name) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/80 transition-colors"
                                onClick={() => toggleComponentSelection(component.name)}
                            >
                                {component.name}
                                {component.hasAllocation && (
                                    <span className="ml-1 text-[9px] opacity-70">●</span>
                                )}
                            </Badge>
                        ))}
                    </div>
                    {selectedComponents.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-muted-foreground"
                            onClick={clearComponentFilters}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear filters
                        </Button>
                    )}
                </CardContent>
            </Card>

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
                                    {/* First header row - Component names */}
                                    <TableRow className="bg-muted/50">
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[50px]">
                                            Sr. No.
                                        </TableHead>
                                        <TableHead rowSpan={2} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-10 min-w-[120px]">
                                            District/Taluka
                                        </TableHead>
                                        {filteredComponents.map((component) => (
                                            <TableHead
                                                key={component.name}
                                                colSpan={component.hasAllocation ? 7 : 2}
                                                className="border text-center font-bold min-w-[180px] bg-primary/5"
                                            >
                                                {component.name}
                                                {component.hasAllocation && (
                                                    <span className="ml-1 text-[9px] text-muted-foreground">
                                                        {component.isHgm ? "(HGM)" : "(Allocation)"}
                                                    </span>
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                    {/* Second header row - Sub-columns */}
                                    <TableRow className="bg-muted/30">
                                        {filteredComponents.map((component) => (
                                            component.hasAllocation ? (
                                                <Fragment key={`header-${component.name}`}>
                                                    <TableHead className="border text-center text-[9px] min-w-[80px] whitespace-nowrap">
                                                        Animal Cost (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[80px] whitespace-nowrap">
                                                        Collar Cost (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[80px] whitespace-nowrap">
                                                        Insurance Cost (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[80px] whitespace-nowrap">
                                                        Transport Cost (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[80px] whitespace-nowrap bg-green-50">
                                                        Total (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[60px] whitespace-nowrap">
                                                        Physical Achievement
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[90px] whitespace-nowrap bg-blue-50">
                                                        Beneficiary Share (₹)
                                                    </TableHead>
                                                </Fragment>
                                            ) : (
                                                <Fragment key={`header-${component.name}`}>
                                                    <TableHead className="border text-center text-[9px] min-w-[90px]">
                                                        Subsidy (₹)
                                                    </TableHead>
                                                    <TableHead className="border text-center text-[9px] min-w-[90px]">
                                                        Beneficiary Share (₹)
                                                    </TableHead>
                                                </Fragment>
                                            )
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allDistricts.map((district, index) => {
                                        const districtInfo = districtData[district] || {};

                                        return (
                                            <TableRow key={district} className="hover:bg-muted/30">
                                                <TableCell className="border text-center font-medium sticky left-0 bg-background z-10">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="border font-medium sticky left-[50px] bg-background z-10">
                                                    {district}
                                                </TableCell>
                                                {filteredComponents.map((component) => {
                                                    const data = districtInfo[component.name] || {
                                                        subsidy: 0,
                                                        beneficiary_share: 0,
                                                        animal_cost: 0,
                                                        collar_cost: 0,
                                                        insurance_cost: 0,
                                                        transportation_cost: 0,
                                                        total_allocation_subsidy: 0,
                                                        physical_achievement: 0
                                                    };

                                                    if (component.hasAllocation) {
                                                        return (
                                                            <Fragment key={`${district}-${component.name}`}>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.animal_cost || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.collar_cost || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.insurance_cost || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.transportation_cost || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-right font-semibold bg-green-50/50">
                                                                    {formatCurrency(data.total_allocation_subsidy || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-center">
                                                                    {formatNumber(data.physical_achievement || 0)}
                                                                </TableCell>
                                                                <TableCell className="border text-right bg-blue-50/50">
                                                                    {formatCurrency(data.beneficiary_share)}
                                                                </TableCell>
                                                            </Fragment>
                                                        );
                                                    } else {
                                                        return (
                                                            <Fragment key={`${district}-${component.name}`}>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.subsidy)}
                                                                </TableCell>
                                                                <TableCell className="border text-right">
                                                                    {formatCurrency(data.beneficiary_share)}
                                                                </TableCell>
                                                            </Fragment>
                                                        );
                                                    }
                                                })}
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
                                        {filteredComponents.map((component) => {
                                            const totals = componentTotals[component.name];
                                            if (component.hasAllocation) {
                                                return (
                                                    <Fragment key={`total-${component.name}`}>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.animal_cost || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.collar_cost || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.insurance_cost || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.transportation_cost || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right font-bold bg-green-50">
                                                            {formatCurrency(totals?.total_allocation_subsidy || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-center">
                                                            {formatNumber(totals?.physical_achievement || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right bg-blue-50">
                                                            {formatCurrency(totals?.beneficiary_share || 0)}
                                                        </TableCell>
                                                    </Fragment>
                                                );
                                            } else {
                                                return (
                                                    <Fragment key={`total-${component.name}`}>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.subsidy || 0)}
                                                        </TableCell>
                                                        <TableCell className="border text-right">
                                                            {formatCurrency(totals?.beneficiary_share || 0)}
                                                        </TableCell>
                                                    </Fragment>
                                                );
                                            }
                                        })}
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {!isLoading && allDistricts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Districts</CardDescription>
                            <CardTitle className="text-2xl">{allDistricts.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>
                                {selectedComponents.length > 0 ? "Filtered Components" : "Total Components"}
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {filteredComponents.length}
                                {selectedComponents.length > 0 && (
                                    <span className="text-sm text-muted-foreground ml-1">/ {allComponents.length}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Allocation Subsidy</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {formatCurrency(grandTotals.total_allocation_subsidy)}
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
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Animal Cost</CardDescription>
                            <CardTitle className="text-xl">
                                {formatCurrency(grandTotals.animal_cost)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Insurance Cost</CardDescription>
                            <CardTitle className="text-xl">
                                {formatCurrency(grandTotals.insurance_cost)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Collar Cost</CardDescription>
                            <CardTitle className="text-xl">
                                {formatCurrency(grandTotals.collar_cost)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Physical Achievement</CardDescription>
                            <CardTitle className="text-xl">
                                {formatNumber(grandTotals.physical_achievement)}
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
