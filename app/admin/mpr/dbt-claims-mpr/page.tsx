"use client";

import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileText, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Type definitions for API response
interface DistrictData {
    cow_count: number;
    buffalo_count: number;
    quantity: number;
    beneficiary_share: number;
    subsidy: number;
    total: number;
    financial_target: number;
    physical_target: number;
    financial_balance: number;
    physical_balance: number;
}

interface Totals {
    total_cows: number;
    total_buffaloes: number;
    total_quantity: number;
    total_beneficiary_share: number;
    total_subsidy: number;
    grand_total: number;
    total_financial_target: number;
    total_physical_target: number;
    total_financial_balance: number;
    total_physical_balance: number;
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
                financial_target: 0,
                physical_target: 0,
                financial_balance: 0,
                physical_balance: 0,
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
        total_financial_target: 0,
        total_physical_target: 0,
        total_financial_balance: 0,
        total_physical_balance: 0,
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        if (amount === 0) return "0";
        return new Intl.NumberFormat('en-IN').format(amount);
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
                method: "vmddp_app.api.v1.accountant.dbt_claims_mpr_export",
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                    ...(selectedComponent !== "all" && { component: selectedComponent }),
                },
                format,
                filename: `dbt_claims_mpr_${selectedComponent !== "all" ? selectedComponent + "_" : ""}${selectedMonth}_${selectedYear}`,
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">DBT Claims MPR</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Direct Benefit Transfer Claims Monthly Progress Report
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                        <SelectTrigger className="w-[160px] sm:w-[200px]">
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
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
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
                        <SelectTrigger className="w-[90px] sm:w-[100px]">
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
            {!isLoading && districtData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Districts</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{districtData.filter(d => d.data.total > 0).length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Quantity</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-amber-600">{formatCurrency(totals.total_quantity)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Beneficiary Share</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600">
                                ₹{formatCurrency(totals.total_beneficiary_share)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Subsidy</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-orange-600">
                                ₹{formatCurrency(totals.total_subsidy)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Grand Total</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-green-600">
                                ₹{formatCurrency(totals.grand_total)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Physical Balance</CardDescription>
                            <CardTitle className={`text-xl sm:text-2xl ${totals.total_physical_balance < 0 ? 'text-red-600' : 'text-purple-600'}`}>
                                {formatCurrency(totals.total_physical_balance)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Financial Balance</CardDescription>
                            <CardTitle className={`text-xl sm:text-2xl ${totals.total_financial_balance < 0 ? 'text-red-600' : 'text-purple-600'}`}>
                                ₹{formatCurrency(totals.total_financial_balance)}
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
                        <div className="border rounded-lg overflow-hidden flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted sticky top-0 z-30">
                                        {/* First header row - Main categories */}
                                        <tr className="bg-muted/50">
                                            <th rowSpan={3} className="border text-center font-bold sticky left-0 bg-muted/50 z-20 min-w-[50px] p-2">
                                                Sr. No.
                                            </th>
                                            <th rowSpan={3} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-20 min-w-[120px] p-2">
                                                Name of District
                                            </th>
                                            <th rowSpan={3} className="border text-center font-bold min-w-[70px] p-2">

                                            </th>
                                            <th colSpan={6} className="border text-center font-bold bg-blue-50 p-2">
                                                DBT Claims - {selectedComponent !== "all" ? (components.find(c => c.name === selectedComponent)?.component_name || selectedComponent) : "All Components"}
                                            </th>
                                        </tr>
                                        {/* Second header row - Sub categories */}
                                        <tr className="bg-muted/30">
                                            <th colSpan={1} className="border text-center font-bold min-w-[100px] bg-yellow-50 p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[240px] bg-green-50 p-2">
                                                Financial Achievement
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold bg-purple-100 min-w-[100px] p-2">
                                                Physical Balance
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold bg-orange-100 min-w-[100px] p-2">
                                                Financial Balance
                                            </th>
                                        </tr>
                                        {/* Third header row - Detail columns */}
                                        <tr className="bg-muted/20">
                                            {/* Physical Achievement */}
                                            <th className="border text-center text-[9px] min-w-[80px] bg-yellow-50 p-2">
                                                Quantity (No.)
                                            </th>
                                            {/* Financial Achievement */}
                                            <th className="border text-center text-[9px] min-w-[100px] bg-green-50 p-2">
                                                Beneficiary Share (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] bg-green-50 p-2">
                                                Subsidy (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] bg-green-50 p-2">
                                                Total (Rs.)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {districtData.map(({ name, data }, index) => (
                                            <Fragment key={name}>
                                                {/* Monthly Row */}
                                                <tr className="hover:bg-muted/30">
                                                    <td rowSpan={2} className="border text-center font-medium sticky left-0 bg-background z-10 p-2">
                                                        {index + 1}
                                                    </td>
                                                    <td rowSpan={2} className="border font-medium sticky left-[50px] bg-background z-10 p-2">
                                                        {name}
                                                    </td>
                                                    <td className="border text-center text-[10px] p-2">Monthly</td>
                                                    {/* Physical Achievement */}
                                                    <td className="border text-center bg-yellow-50/50 p-2">{data.quantity || 0}</td>
                                                    {/* Financial Achievement */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.beneficiary_share || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.subsidy || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(data.total || 0)}</td>
                                                    {/* Physical Balance */}
                                                    <td className="border text-right bg-purple-50/50 font-semibold p-2">{formatCurrency(data.physical_balance || 0)}</td>
                                                    {/* Financial Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">{formatCurrency(data.financial_balance || 0)}</td>
                                                </tr>
                                                {/* Progress Row */}
                                                <tr className="hover:bg-muted/30 bg-muted/10">
                                                    <td className="border text-center text-[10px] p-2">Progressive</td>
                                                    {/* Physical Achievement */}
                                                    <td className="border text-center bg-yellow-50/50 p-2">{data.quantity || 0}</td>
                                                    {/* Financial Achievement */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.beneficiary_share || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.subsidy || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(data.total || 0)}</td>
                                                    {/* Physical Balance */}
                                                    <td className="border text-right bg-purple-50/50 font-semibold p-2">{formatCurrency(data.physical_balance || 0)}</td>
                                                    {/* Financial Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">{formatCurrency(data.financial_balance || 0)}</td>
                                                </tr>
                                            </Fragment>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold">
                                            <td className="border text-center sticky left-0 bg-muted z-10 p-2" colSpan={1}></td>
                                            <td className="border sticky left-[50px] bg-muted z-10 p-2">TOTAL</td>
                                            <td className="border p-2"></td>
                                            {/* Physical Achievement */}
                                            <td className="border text-center bg-yellow-100 p-2">{totals.total_quantity}</td>
                                            {/* Financial Achievement */}
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.total_beneficiary_share)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.total_subsidy)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.grand_total)}</td>
                                            {/* Physical Balance */}
                                            <td className="border text-right bg-purple-100 font-bold p-2">{formatCurrency(totals.total_physical_balance)}</td>
                                            {/* Financial Balance */}
                                            <td className="border text-right bg-orange-100 font-bold p-2">{formatCurrency(totals.total_financial_balance)}</td>
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
