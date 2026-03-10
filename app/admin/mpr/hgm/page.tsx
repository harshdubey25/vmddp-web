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
import { useFrappeGetCall } from "frappe-react-sdk";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Type definitions for API response
interface DistrictData {
    cow_count: number;
    buffalo_count: number;
    crossbreed_count?: number;
    beneficiary_share: number;
    subsidy: number;
    total: number;
    financial_target: number;
    physical_target: number;
    financial_achievement: number;
    physical_achievement: number;
    financial_balance: number;
    physical_balance: number;
}

interface Totals {
    total_cows: number;
    total_buffaloes: number;
    total_crossbreeds?: number;
    total_beneficiary_share: number;
    total_subsidy: number;
    grand_total: number;
    total_financial_target: number;
    total_physical_target: number;
    total_financial_achievement: number;
    total_physical_achievement: number;
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
    financial_year_start: string;
    progressive_start_date: string;
    progressive_end_date: string;
    current_month_start_date: string;
    current_month_end_date: string;
}

interface HGMMPRResponse {
    message: {
        progressive: ReportSection;
        current_month: ReportSection;
        filters: ReportFilters;
    };
}

const EMPTY_DISTRICT_DATA: DistrictData = {
    cow_count: 0,
    buffalo_count: 0,
    beneficiary_share: 0,
    subsidy: 0,
    total: 0,
    financial_target: 0,
    physical_target: 0,
    financial_achievement: 0,
    physical_achievement: 0,
    financial_balance: 0,
    physical_balance: 0,
};

const EMPTY_TOTALS: Totals = {
    total_cows: 0,
    total_crossbreeds: 0,
    total_buffaloes: 0,
    total_beneficiary_share: 0,
    total_subsidy: 0,
    grand_total: 0,
    total_financial_target: 0,
    total_physical_target: 0,
    total_financial_achievement: 0,
    total_physical_achievement: 0,
    total_financial_balance: 0,
    total_physical_balance: 0,
};

const extractDistrictData = (districts?: DistrictMap) => {
    const entries: { name: string; data: DistrictData }[] = [];
    if (districts) {
        Object.entries(districts).forEach(([key, value]) => {
            entries.push({ name: key, data: value });
        });
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name));
};

export default function HGMMPRPage() {
    const { toast } = useToast();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
    const [isExporting, setIsExporting] = useState(false);

    // Fetch HGM MPR data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<HGMMPRResponse>(
        'vmddp_app.api.v1.accountant.hgm_mpr',
        {
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
        },
        undefined,
        { revalidateOnFocus: false }
    );

    const reportData = apiResponse?.message;
    const progressiveReport = reportData?.progressive;
    const currentMonthReport = reportData?.current_month;
    const filters = reportData?.filters;

    const progressiveDistrictData = useMemo(
        () => extractDistrictData(progressiveReport?.districts),
        [progressiveReport?.districts]
    );
    const currentMonthDistrictData = useMemo(
        () => extractDistrictData(currentMonthReport?.districts),
        [currentMonthReport?.districts]
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
                method: "vmddp_app.api.v1.accountant.hgm_mpr_export",
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                },
                format,
                filename: `hgm_mpr_${selectedMonth}_${selectedYear}`,
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
        { value: "2025", label: "2025" },
        { value: "2026", label: "2026" },
    ];

    const selectedMonthLabel = months.find((month) => month.value === selectedMonth)?.label || "Current Month";

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
                        <h1 className="text-xl sm:text-2xl font-bold">HGM (Pregnant Cow) MPR</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Supply Of High Genetic Merit Pregnant Heifers (IVF/ETT)
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
            {!isLoading && mergedDistrictData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">{selectedMonthLabel} Physical Achievement</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600">
                                {currentMonthTotals.total_physical_achievement}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">{selectedMonthLabel} Financial Achievement</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-green-600">
                                ₹{formatCurrency(currentMonthTotals.total_financial_achievement)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Progressive Physical Achievement</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600">
                                {progressiveTotals.total_physical_achievement}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Progressive Financial Achievement</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-emerald-600">
                                ₹{formatCurrency(progressiveTotals.total_financial_achievement)}
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
                        HGM (Pregnant Cow) - Financial Achievement Report
                    </CardTitle>
                    <CardDescription>
                        District-wise breakdown of current month and progressive physical and financial achievement
                        {filters && ` • Current month: ${filters.current_month_start_date} to ${filters.current_month_end_date} • Progressive: ${filters.progressive_start_date} to ${filters.progressive_end_date}`}
                    </CardDescription>
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
                        <div className="border rounded-lg overflow-hidden flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted sticky top-0 z-30">
                                        {/* First header row - Main categories */}
                                        <tr className="bg-muted/50">
                                            <th rowSpan={3} className="border text-center font-bold sticky left-0 bg-muted/50 z-30 min-w-[50px] p-2">
                                                Sr. No.
                                            </th>
                                            <th rowSpan={3} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-30 min-w-[120px] p-2">
                                                Name of District
                                            </th>
                                            <th rowSpan={3} className="border text-center font-bold min-w-[70px] p-2">

                                            </th>
                                            <th colSpan={11} className="border text-center font-bold bg-blue-50 p-2">
                                                Supply Of High Genetic Merit Pregnant Heifers (IVF/ETT)
                                            </th>
                                        </tr>
                                        {/* Second header row - Sub categories */}
                                        <tr className="bg-muted/30">
                                            <th rowSpan={2} className="border text-center font-bold min-w-[80px] bg-blue-100 p-2">
                                                Physical Target
                                            </th>
                                            <th colSpan={2} className="border text-center font-bold min-w-[140px] bg-yellow-50 p-2">
                                                Physical Achievement
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold min-w-[80px] bg-orange-100 p-2">
                                                Physical Balance
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold min-w-[80px] bg-blue-100 p-2">
                                                Financial Target
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[240px] bg-green-50 p-2">
                                                Financial Achievement
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold bg-orange-100 min-w-[100px] p-2">
                                                Financial Balance
                                            </th>
                                        </tr>
                                        {/* Third header row - Detail columns */}
                                        <tr className="bg-muted/20">
                                            {/* Physical Achievement */}
                                            <th className="border text-center text-[9px] min-w-[70px] bg-yellow-50 p-2">
                                                No. of Cow
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[70px] bg-yellow-50 p-2">
                                                No. of Buffalo
                                            </th>
                                            {/* Financial Achievement */}
                                            <th className="border text-center text-[9px] min-w-[80px] bg-green-50 p-2">
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
                                        {mergedDistrictData.map(({ name, currentMonth, progressive }, index) => (
                                            <Fragment key={name}>
                                                {/* Current Month Row */}
                                                <tr className="hover:bg-muted/30">
                                                    <td rowSpan={2} className="border text-center font-medium sticky left-0 bg-background z-10 p-2">
                                                        {index + 1}
                                                    </td>
                                                    <td rowSpan={2} className="border font-medium sticky left-[50px] bg-background z-10 p-2">
                                                        {name}
                                                    </td>
                                                    <td className="border text-center text-[10px] p-2">Current Month</td>
                                                    {/* Physical Target */}
                                                    <td className="border text-center bg-blue-50 p-2">N/A</td>
                                                    {/* Physical Achievement */}
                                                    <td className="border text-center bg-yellow-50/50 p-2">{currentMonth.cow_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50/50 p-2">{currentMonth.buffalo_count || 0}</td>
                                                    {/* Physical Balance */}
                                                    <td className="border text-center bg-orange-50/50 font-semibold p-2">{currentMonth.physical_balance || 0}</td>
                                                    {/* Financial Target */}
                                                    <td className="border text-right bg-blue-50 p-2">N/A</td>
                                                    {/* Financial Achievement */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(currentMonth.beneficiary_share || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(currentMonth.subsidy || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(currentMonth.total || 0)}</td>
                                                    {/* Financial Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">{formatCurrency(currentMonth.financial_balance || 0)}</td>
                                                </tr>
                                                {/* Progress Row */}
                                                <tr className="hover:bg-muted/30 bg-muted/10">
                                                    <td className="border text-center text-[10px] p-2">Progressive</td>
                                                    {/* Physical Target */}
                                                    <td className="border text-center bg-blue-50 p-2">{progressive.physical_target || 0}</td>
                                                    {/* Physical Achievement */}
                                                    <td className="border text-center bg-yellow-50/50 p-2">{progressive.cow_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50/50 p-2">{progressive.buffalo_count || 0}</td>
                                                    {/* Physical Balance */}
                                                    <td className="border text-center bg-orange-50/50 font-semibold p-2">{progressive.physical_balance || 0}</td>
                                                    {/* Financial Target */}
                                                    <td className="border text-right bg-blue-50 p-2">{formatCurrency(progressive.financial_target || 0)}</td>
                                                    {/* Financial Achievement */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(progressive.beneficiary_share || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(progressive.subsidy || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(progressive.total || 0)}</td>
                                                    {/* Financial Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">{formatCurrency(progressive.financial_balance || 0)}</td>
                                                </tr>
                                            </Fragment>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold">
                                            <td rowSpan={2} className="border text-center sticky left-0 bg-muted z-10 p-2" colSpan={1}></td>
                                            <td rowSpan={2} className="border sticky left-[50px] bg-muted z-10 p-2">TOTAL</td>
                                            <td className="border p-2">Current Month</td>
                                            {/* Physical Target */}
                                            <td className="border text-center bg-blue-100 p-2">N/A</td>
                                            {/* Physical Achievement */}
                                            <td className="border text-center bg-yellow-100 p-2">{currentMonthTotals.total_cows}</td>
                                            <td className="border text-center bg-yellow-100 p-2">{currentMonthTotals.total_buffaloes}</td>
                                            {/* Physical Balance */}
                                            <td className="border text-center bg-orange-100 font-bold p-2">{currentMonthTotals.total_physical_balance}</td>
                                            {/* Financial Target */}
                                            <td className="border text-right bg-blue-100 p-2">N/A</td>
                                            {/* Financial Achievement */}
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.total_beneficiary_share)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.total_subsidy)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.grand_total)}</td>
                                            {/* Financial Balance */}
                                            <td className="border text-right bg-orange-100 font-bold p-2">{formatCurrency(currentMonthTotals.total_financial_balance)}</td>
                                        </tr>
                                        <tr className="bg-muted font-bold">
                                            <td className="border p-2">Progressive</td>
                                            {/* Physical Target */}
                                            <td className="border text-center bg-blue-100 p-2">{progressiveTotals.total_physical_target}</td>
                                            {/* Physical Achievement */}
                                            <td className="border text-center bg-yellow-100 p-2">{progressiveTotals.total_cows}</td>
                                            <td className="border text-center bg-yellow-100 p-2">{progressiveTotals.total_buffaloes}</td>
                                            {/* Physical Balance */}
                                            <td className="border text-center bg-orange-100 font-bold p-2">{progressiveTotals.total_physical_balance}</td>
                                            {/* Financial Target */}
                                            <td className="border text-right bg-blue-100 p-2">{formatCurrency(progressiveTotals.total_financial_target)}</td>
                                            {/* Financial Achievement */}
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.total_beneficiary_share)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.total_subsidy)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.grand_total)}</td>
                                            {/* Financial Balance */}
                                            <td className="border text-right bg-orange-100 font-bold p-2">{formatCurrency(progressiveTotals.total_financial_balance)}</td>
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
