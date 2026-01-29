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
import { Download, FileText, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import * as XLSX from "xlsx";
import Link from "next/link";

// Type definitions for API response
interface DistrictData {
    cow_count: number;
    buffalo_count: number;
    quantity: number;
    beneficiary_share: number;
    subsidy: number;
    total: number;
    financial_balance: number;
}

interface Totals {
    total_cows: number;
    total_buffaloes: number;
    total_quantity: number;
    total_beneficiary_share: number;
    total_subsidy: number;
    grand_total: number;
    total_financial_balance: number;
}

interface DBTClaimsMPRResponse {
    message: {
        districts: {
            [districtName: string]: DistrictData;
        };
        totals: Totals;
    };
}

interface Component {
    name: string;
    component_name: string;
}

interface District {
    name: string;
}

export default function DBTClaimsMPRPage() {
    const { toast } = useToast();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
    const [selectedComponent, setSelectedComponent] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);

    // Fetch components (for_component_allocation: false)
    const { data: componentsData } = useFrappeGetDocList<Component>("Component", {
        fields: ["name", "component_name"],
        filters: [["for_component_allocation", "=", 0], ["subadmin_component", "=", 0], ["for_dbt_claims", "=", 1]],
        limit: 100,
    });

    // Fetch districts
    const { data: districtsData } = useFrappeGetDocList<District>("District Master", {
        fields: ["name"],
        limit: 100,
    });

    const components = componentsData || [];
    const allDistricts = districtsData?.map(d => d.name) || [];

    // Fetch DBT Claims MPR data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<DBTClaimsMPRResponse>(
        'vmddp_app.api.v1.accountant.dbt_claims_mpr',
        {
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            component: selectedComponent === "all" ? undefined : selectedComponent,
        },
        undefined,
        { revalidateOnFocus: false }
    );

    const reportData = apiResponse?.message || { districts: {}, totals: {} as Totals };

    // Extract district data and merge with all districts (show 0 for missing)
    const districtData = useMemo(() => {
        const districts: { name: string; data: DistrictData }[] = [];

        // Use all districts from District Master
        allDistricts.forEach((districtName) => {
            const data = reportData.districts?.[districtName] || {
                cow_count: 0,
                buffalo_count: 0,
                quantity: 0,
                beneficiary_share: 0,
                subsidy: 0,
                total: 0,
                financial_balance: 0,
            };
            districts.push({ name: districtName, data });
        });

        // Also include any districts from API that might not be in District Master
        if (reportData.districts) {
            Object.entries(reportData.districts).forEach(([key, value]) => {
                if (!allDistricts.includes(key)) {
                    districts.push({ name: key, data: value });
                }
            });
        }

        return districts.sort((a, b) => a.name.localeCompare(b.name));
    }, [reportData, allDistricts]);

    // Get totals from API
    const totals = reportData.totals || {
        total_cows: 0,
        total_buffaloes: 0,
        total_quantity: 0,
        total_beneficiary_share: 0,
        total_subsidy: 0,
        grand_total: 0,
        total_financial_balance: 0,
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "0";
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    // Export to Excel
    const handleExport = async () => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: "Generating report...",
        });

        try {
            const headers = [
                "Sr. No.",
                "Name of District",
                "Type",
                "Quantity (No.)",
                "Beneficiary Share (Rs.)",
                "Subsidy (Rs.)",
                "Total (Rs.)",
            ];

            const rows: (string | number)[][] = [];

            districtData.forEach(({ name, data }, index) => {
                // Monthly row
                rows.push([
                    index + 1,
                    name,
                    "Monthly",
                    data.quantity || 0,
                    data.beneficiary_share || 0,
                    data.subsidy || 0,
                    data.total || 0,
                ]);
                // Progress row
                rows.push([
                    "",
                    "",
                    "Progress",
                    data.quantity || 0,
                    data.beneficiary_share || 0,
                    data.subsidy || 0,
                    data.total || 0,
                ]);
            });

            // Total row
            rows.push([
                "",
                "TOTAL",
                "",
                totals.total_quantity,
                totals.total_beneficiary_share,
                totals.total_subsidy,
                totals.grand_total,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DBT Claims MPR");

            const componentName = selectedComponent === "all" ? "All" : selectedComponent;
            XLSX.writeFile(wb, `DBT_Claims_MPR_${componentName}_${selectedMonth}_${selectedYear}.xlsx`);

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

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const years = [
        { value: "2024", label: "2024" },
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" },
    ];

    return (
        <div className="p-6 space-y-6 overflow-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/accountant/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">DBT Claims MPR</h1>
                        <p className="text-muted-foreground">
                            Direct Benefit Transfer Claims Monthly Progress Report
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Components" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Components</SelectItem>
                            {components.map((comp) => (
                                <SelectItem key={comp.name} value={comp.name}>
                                    {comp.component_name || comp.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
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
                    <Button onClick={handleExport} disabled={isExporting || isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? "Exporting..." : "Export Excel"}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {!isLoading && districtData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Districts</CardDescription>
                            <CardTitle className="text-2xl">{districtData.filter(d => d.data.total > 0).length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Quantity</CardDescription>
                            <CardTitle className="text-2xl text-amber-600">{formatCurrency(totals.total_quantity)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Beneficiary Share</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">
                                ₹{formatCurrency(totals.total_beneficiary_share)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Subsidy</CardDescription>
                            <CardTitle className="text-2xl text-orange-600">
                                ₹{formatCurrency(totals.total_subsidy)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Grand Total</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                ₹{formatCurrency(totals.grand_total)}
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
                        DBT Claims - Financial Achievement Report
                        {selectedComponent !== "all" && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({components.find(c => c.name === selectedComponent)?.component_name || selectedComponent})
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        District-wise breakdown of physical and financial achievement for DBT claims
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : districtData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No data available for the selected period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    {/* First header row - Main categories */}
                                    <TableRow className="bg-muted/50">
                                        <TableHead rowSpan={3} className="border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[50px]">
                                            Sr. No.
                                        </TableHead>
                                        <TableHead rowSpan={3} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-10 min-w-[120px]">
                                            Name of District
                                        </TableHead>
                                        <TableHead rowSpan={3} className="border text-center font-bold min-w-[70px]">

                                        </TableHead>
                                        <TableHead colSpan={5} className="border text-center font-bold bg-blue-50">
                                            DBT Claims - {selectedComponent !== "all" ? (components.find(c => c.name === selectedComponent)?.component_name || selectedComponent) : "All Components"}
                                        </TableHead>
                                    </TableRow>
                                    {/* Second header row - Sub categories */}
                                    <TableRow className="bg-muted/30">
                                        <TableHead colSpan={1} className="border text-center font-bold min-w-[100px] bg-yellow-50">
                                            Physical Achievement
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold min-w-[240px] bg-green-50">
                                            Financial Achievement
                                        </TableHead>
                                        <TableHead rowSpan={2} className="border text-center font-bold bg-orange-100 min-w-[100px]">
                                            Balance
                                        </TableHead>
                                    </TableRow>
                                    {/* Third header row - Detail columns */}
                                    <TableRow className="bg-muted/20">
                                        {/* Physical Achievement */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px] bg-yellow-50">
                                            Quantity (No.)
                                        </TableHead>
                                        {/* Financial Achievement */}
                                        <TableHead className="border text-center text-[9px] min-w-[100px] bg-green-50">
                                            Beneficiary Share (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px] bg-green-50">
                                            Subsidy (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px] bg-green-50">
                                            Total (Rs.)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districtData.map(({ name, data }, index) => (
                                        <Fragment key={name}>
                                            {/* Monthly Row */}
                                            <TableRow className="hover:bg-muted/30">
                                                <TableCell rowSpan={2} className="border text-center font-medium sticky left-0 bg-background z-10">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell rowSpan={2} className="border font-medium sticky left-[50px] bg-background z-10">
                                                    {name}
                                                </TableCell>
                                                <TableCell className="border text-center text-[10px]">Monthly</TableCell>
                                                {/* Physical Achievement */}
                                                <TableCell className="border text-center bg-yellow-50/50">{data.quantity || 0}</TableCell>
                                                {/* Financial Achievement */}
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.subsidy || 0)}</TableCell>
                                                <TableCell className="border text-right font-bold bg-green-50/50">{formatCurrency(data.total || 0)}</TableCell>
                                                {/* Balance */}
                                                <TableCell className="border text-right bg-orange-50/50 font-semibold">{formatCurrency(data.financial_balance || 0)}</TableCell>
                                            </TableRow>
                                            {/* Progress Row */}
                                            <TableRow className="hover:bg-muted/30 bg-muted/10">
                                                <TableCell className="border text-center text-[10px]">Progress</TableCell>
                                                {/* Physical Achievement */}
                                                <TableCell className="border text-center bg-yellow-50/50">{data.quantity || 0}</TableCell>
                                                {/* Financial Achievement */}
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.subsidy || 0)}</TableCell>
                                                <TableCell className="border text-right font-bold bg-green-50/50">{formatCurrency(data.total || 0)}</TableCell>
                                                {/* Balance */}
                                                <TableCell className="border text-right bg-orange-50/50 font-semibold">{formatCurrency(data.financial_balance || 0)}</TableCell>
                                            </TableRow>
                                        </Fragment>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted font-bold">
                                        <TableCell className="border text-center sticky left-0 bg-muted z-10" colSpan={1}></TableCell>
                                        <TableCell className="border sticky left-[50px] bg-muted z-10">TOTAL</TableCell>
                                        <TableCell className="border"></TableCell>
                                        {/* Physical Achievement */}
                                        <TableCell className="border text-center bg-yellow-100">{totals.total_quantity}</TableCell>
                                        {/* Financial Achievement */}
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.total_beneficiary_share)}</TableCell>
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.total_subsidy)}</TableCell>
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.grand_total)}</TableCell>
                                        {/* Balance */}
                                        <TableCell className="border text-right bg-orange-100 font-bold">{formatCurrency(totals.total_financial_balance)}</TableCell>
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
