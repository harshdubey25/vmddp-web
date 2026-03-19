"use client";

import { useState, useMemo, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileText, RefreshCw, ArrowLeft, Loader2, Building2, Package, Users, Wallet, Target, Maximize2 } from "lucide-react";
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

interface DistrictMap {
    [districtName: string]: DistrictData;
}

interface ReportSection {
    districts: DistrictMap;
    totals: Totals;
}

interface ReportFilters {
    month: number;
    year: number;
    component: string;
    financial_year_start: string;
    progressive_start_date: string;
    progressive_end_date: string;
    current_month_start_date: string;
    current_month_end_date: string;
}

interface DBTClaimsMPRResponse {
    message: {
        progressive: ReportSection;
        current_month: ReportSection;
        filters: ReportFilters;
    };
}

interface Component {
    name: string;
    component_name: string;
}

interface District {
    name: string;
}

const EMPTY_DISTRICT_DATA: DistrictData = {
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

const EMPTY_TOTALS: Totals = {
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

const buildDistrictData = (districts: DistrictMap | undefined, allDistricts: string[]) => {
    const entries: { name: string; data: DistrictData }[] = [];

    allDistricts.forEach((districtName) => {
        entries.push({
            name: districtName,
            data: districts?.[districtName] || EMPTY_DISTRICT_DATA,
        });
    });

    if (districts) {
        Object.entries(districts).forEach(([key, value]) => {
            if (!allDistricts.includes(key)) {
                entries.push({ name: key, data: value });
            }
        });
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name));
};

export default function DBTClaimsMPRPage() {
    const { toast } = useToast();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
    const [selectedComponent, setSelectedComponent] = useState<string>("Fertility Feed");
    const [isExporting, setIsExporting] = useState(false);
    const [isTableFullscreen, setIsTableFullscreen] = useState(false);

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
    const allDistricts = useMemo(() => districtsData?.map(d => d.name) || [], [districtsData]);

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

    const reportData = apiResponse?.message;
    const progressiveReport = reportData?.progressive;
    const currentMonthReport = reportData?.current_month;
    const filters = reportData?.filters;

    const currentMonthDistrictData = useMemo(
        () => buildDistrictData(currentMonthReport?.districts, allDistricts),
        [currentMonthReport?.districts, allDistricts]
    );
    const progressiveDistrictData = useMemo(
        () => buildDistrictData(progressiveReport?.districts, allDistricts),
        [progressiveReport?.districts, allDistricts]
    );

    const mergedDistrictData = useMemo(() => {
        const districtNames = Array.from(
            new Set([
                ...currentMonthDistrictData.map(({ name }) => name),
                ...progressiveDistrictData.map(({ name }) => name),
            ])
        ).sort((a, b) => a.localeCompare(b));

        const currentMonthMap = new Map(currentMonthDistrictData.map(({ name, data }) => [name, data]));
        const progressiveMap = new Map(progressiveDistrictData.map(({ name, data }) => [name, data]));

        return districtNames.map((name) => ({
            name,
            currentMonth: currentMonthMap.get(name) || EMPTY_DISTRICT_DATA,
            progressive: progressiveMap.get(name) || EMPTY_DISTRICT_DATA,
        }));
    }, [currentMonthDistrictData, progressiveDistrictData]);

    const currentMonthTotals = currentMonthReport?.totals || EMPTY_TOTALS;
    const progressiveTotals = progressiveReport?.totals || EMPTY_TOTALS;

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

    const selectedMonthLabel = months.find((month) => month.value === selectedMonth)?.label || "Current Month";
    const selectedComponentLabel = selectedComponent !== "all"
        ? (components.find(c => c.name === selectedComponent)?.component_name || selectedComponent)
        : "All Components";

    const renderReportTable = (containerClassName: string) => (
        <div className="border rounded-lg overflow-hidden flex flex-col">
            <div className={containerClassName}>
                <table className="w-full min-w-[700px] text-[11px] sm:text-xs md:text-sm">
                    <thead className="bg-muted sticky top-0 z-30">
                        <tr className="bg-muted/50">
                            <th rowSpan={3} className="border text-center font-bold sticky left-0 bg-muted/50 z-20 min-w-[50px] p-1 sm:p-2">
                                Sr. No.
                            </th>
                            <th rowSpan={3} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-20 min-w-[120px] p-1 sm:p-2">
                                Name of District
                            </th>
                            <th rowSpan={3} className="border text-center font-bold min-w-[70px] p-1 sm:p-2">

                            </th>
                            <th colSpan={6} className="border text-center font-bold bg-blue-50 p-1 sm:p-2">
                                DBT Claims - {selectedComponentLabel}
                            </th>
                        </tr>
                        <tr className="bg-muted/30">
                            <th colSpan={1} className="border text-center font-bold min-w-[100px] bg-yellow-50 p-1 sm:p-2">
                                Physical Achievement
                            </th>
                            <th colSpan={3} className="border text-center font-bold min-w-[240px] bg-green-50 p-1 sm:p-2">
                                Financial Achievement
                            </th>
                            <th rowSpan={2} className="border text-center font-bold bg-purple-100 min-w-[100px] p-1 sm:p-2">
                                Physical Balance
                            </th>
                            <th rowSpan={2} className="border text-center font-bold bg-orange-100 min-w-[100px] p-1 sm:p-2">
                                Financial Balance
                            </th>
                        </tr>
                        <tr className="bg-muted/20">
                            <th className="border text-center text-[9px] min-w-[80px] bg-yellow-50 p-1 sm:p-2">
                                Quantity (No.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[100px] bg-green-50 p-1 sm:p-2">
                                Beneficiary Share (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] bg-green-50 p-1 sm:p-2">
                                Subsidy (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] bg-green-50 p-1 sm:p-2">
                                Total (Rs.)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {mergedDistrictData.map(({ name, currentMonth, progressive }, index) => (
                            <Fragment key={name}>
                                <tr className="hover:bg-muted/30">
                                    <td rowSpan={2} className="border text-center font-medium sticky left-0 bg-background z-10 p-1 sm:p-2">
                                        {index + 1}
                                    </td>
                                    <td rowSpan={2} className="border font-medium sticky left-[50px] bg-background z-10 p-1 sm:p-2">
                                        {name}
                                    </td>
                                    <td className="border text-center text-[10px] p-1 sm:p-2">Current Month</td>
                                    <td className="border text-center bg-yellow-50/50 p-1 sm:p-2">{currentMonth.quantity || 0}</td>
                                    <td className="border text-right bg-green-50/50 p-1 sm:p-2">{formatCurrency(currentMonth.beneficiary_share || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-1 sm:p-2">{formatCurrency(currentMonth.subsidy || 0)}</td>
                                    <td className="border text-right font-bold bg-green-50/50 p-1 sm:p-2">{formatCurrency(currentMonth.total || 0)}</td>
                                    <td className="border text-right bg-purple-50/50 font-semibold p-1 sm:p-2">{formatCurrency(currentMonth.physical_balance || 0)}</td>
                                    <td className="border text-right bg-orange-50/50 font-semibold p-1 sm:p-2">{formatCurrency(currentMonth.financial_balance || 0)}</td>
                                </tr>
                                <tr className="hover:bg-muted/30 bg-muted/10">
                                    <td className="border text-center text-[10px] p-1 sm:p-2">Progressive</td>
                                    <td className="border text-center bg-yellow-50/50 p-1 sm:p-2">{progressive.quantity || 0}</td>
                                    <td className="border text-right bg-green-50/50 p-1 sm:p-2">{formatCurrency(progressive.beneficiary_share || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-1 sm:p-2">{formatCurrency(progressive.subsidy || 0)}</td>
                                    <td className="border text-right font-bold bg-green-50/50 p-1 sm:p-2">{formatCurrency(progressive.total || 0)}</td>
                                    <td className="border text-right bg-purple-50/50 font-semibold p-1 sm:p-2">{formatCurrency(progressive.physical_balance || 0)}</td>
                                    <td className="border text-right bg-orange-50/50 font-semibold p-1 sm:p-2">{formatCurrency(progressive.financial_balance || 0)}</td>
                                </tr>
                            </Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-muted font-bold">
                            <td rowSpan={2} className="border text-center sticky left-0 bg-muted z-10 p-1 sm:p-2" colSpan={1}></td>
                            <td rowSpan={2} className="border sticky left-[50px] bg-muted z-10 p-1 sm:p-2">TOTAL</td>
                            <td className="border p-1 sm:p-2">Current Month</td>
                            <td className="border text-center bg-yellow-100 p-1 sm:p-2">{currentMonthTotals.total_quantity}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(currentMonthTotals.total_beneficiary_share)}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(currentMonthTotals.total_subsidy)}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(currentMonthTotals.grand_total)}</td>
                            <td className="border text-right bg-purple-100 font-bold p-1 sm:p-2">{formatCurrency(currentMonthTotals.total_physical_balance)}</td>
                            <td className="border text-right bg-orange-100 font-bold p-1 sm:p-2">{formatCurrency(currentMonthTotals.total_financial_balance)}</td>
                        </tr>
                        <tr className="bg-muted font-bold">
                            <td className="border p-1 sm:p-2">Progressive</td>
                            <td className="border text-center bg-yellow-100 p-1 sm:p-2">{progressiveTotals.total_quantity}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(progressiveTotals.total_beneficiary_share)}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(progressiveTotals.total_subsidy)}</td>
                            <td className="border text-right bg-green-100 p-1 sm:p-2">{formatCurrency(progressiveTotals.grand_total)}</td>
                            <td className="border text-right bg-purple-100 font-bold p-1 sm:p-2">{formatCurrency(progressiveTotals.total_physical_balance)}</td>
                            <td className="border text-right bg-orange-100 font-bold p-1 sm:p-2">{formatCurrency(progressiveTotals.total_financial_balance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex flex-col gap-3 sm:gap-4 border-b p-3 sm:p-4 md:p-6 bg-background">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/admin/reports">
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-base sm:text-xl md:text-2xl font-bold">DBT Claims MPR</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                            Direct Benefit Transfer Claims Monthly Progress Report
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
                    <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                        <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] text-sm">
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
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="flex-1 sm:w-[120px] md:w-[140px] text-sm">
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
                            <SelectTrigger className="w-[90px] sm:w-[100px] text-sm">
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
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="h-9">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isExporting || isLoading} variant="default" size="sm" className="flex-1 sm:flex-initial h-9">
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
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6">

                    {/* Summary Cards*/}
                    {!isLoading && mergedDistrictData.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">{selectedMonthLabel} Districts</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-600 drop-shadow-sm">
                                        {currentMonthDistrictData.filter(d => d.data.total > 0).length}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">{selectedMonthLabel} Quantity</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-amber-600 drop-shadow-sm">
                                        {formatCurrency(currentMonthTotals.total_quantity)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">{selectedMonthLabel} Beneficiary Share</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-cyan-600 drop-shadow-sm">
                                        ₹{formatCurrency(currentMonthTotals.total_beneficiary_share)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">{selectedMonthLabel} Subsidy</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-orange-600 drop-shadow-sm">
                                        ₹{formatCurrency(currentMonthTotals.total_subsidy)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Districts</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-600 drop-shadow-sm">
                                        {progressiveDistrictData.filter(d => d.data.total > 0).length}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Quantity</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-yellow-600 drop-shadow-sm">
                                        {formatCurrency(progressiveTotals.total_quantity)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/20 to-teal-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Beneficiary Share</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-teal-600 drop-shadow-sm">
                                        ₹{formatCurrency(progressiveTotals.total_beneficiary_share)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                            <Card className="relative overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6 relative">
                                    <div className="flex items-center justify-between">
                                        <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Subsidy</CardDescription>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-emerald-600 drop-shadow-sm">
                                        ₹{formatCurrency(progressiveTotals.total_subsidy)}
                                    </CardTitle>

                                </CardHeader>
                            </Card>
                        </div>
                    )}

                    {/* Report Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg md:text-xl">
                                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                        <span>DBT Claims - Financial Achievement Report</span>
                                        {selectedComponent !== "all" && (
                                            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                                                ({selectedComponentLabel})
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        District-wise breakdown of current month and progressive achievement for DBT claims
                                        {filters && ` • Current month: ${filters.current_month_start_date} to ${filters.current_month_end_date} • Progressive: ${filters.progressive_start_date} to ${filters.progressive_end_date}`}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => setIsTableFullscreen(true)}
                                    disabled={isLoading || mergedDistrictData.length === 0}
                                >
                                    <Maximize2 className="h-4 w-4 sm:mr-2" />
                                    <span>Full Screen</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-64 w-full" />
                                </div>
                            ) : mergedDistrictData.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No data available for the selected period.</p>
                                </div>
                            ) : (
                                renderReportTable("w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-[calc(100vh-400px)]")
                            )}
                        </CardContent>
                    </Card>

                    <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
                        <DialogContent className="h-[96vh] w-[98vw] max-w-none overflow-hidden p-0">
                            <div className="flex h-full flex-col overflow-hidden">
                                <DialogHeader className="border-b px-4 py-4 pr-12 sm:px-6">
                                    <DialogTitle className="text-base sm:text-lg md:text-xl">
                                        DBT Claims - Financial Achievement Report
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm">
                                        Full screen view for the district-wise DBT claims MPR table.
                                        {filters && ` Current month: ${filters.current_month_start_date} to ${filters.current_month_end_date} • Progressive: ${filters.progressive_start_date} to ${filters.progressive_end_date}`}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-hidden p-4 sm:p-6">
                                    {renderReportTable("h-full w-full overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100")}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </main>
        </div>
    );
}
