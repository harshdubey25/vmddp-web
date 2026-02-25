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
import { Download, FileText, FileSpreadsheet, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetCall } from "frappe-react-sdk";
import { exportReport, type ExportFormat } from "@/lib/export-report";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Type definitions for API response
interface CostBreakdown {
    beneficiary_share: number;
    subsidy_share: number;
    total: number;
}

interface TotalExpenditure {
    benenficiary_share_total: number;
    subsidy_share_total: number;
    total: number;
}

interface Target {
    financial_target: number;
    physical_target: number;
}

interface Balance {
    financial_balance: number;
    physical_balance: number;
}

interface DistrictData {
    cow_count: number;
    buffalo_count: number;
    crossbreed_count: number;
    animal_cost: CostBreakdown;
    collar_cost: CostBreakdown;
    premium_paid: CostBreakdown;
    transportation_cost: CostBreakdown;
    total_expenditure: TotalExpenditure;
    target: Target;
    balance: Balance;
}

interface AnimalInductionMPRResponse {
    message: {
        [districtName: string]: DistrictData | number;
        total_cows: number;
        total_buffaloes: number;
    };
}

export default function AnimalInductionMPRPage() {
    const { toast } = useToast();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
    const [isExporting, setIsExporting] = useState(false);

    // Fetch Animal Induction MPR data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<AnimalInductionMPRResponse>(
        'vmddp_app.api.v1.accountant.animal_induction_mpr',
        {
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
        },
        undefined,
        { revalidateOnFocus: false }
    );

    const reportData = apiResponse?.message || {};

    // Extract district data (exclude total_cows and total_buffaloes)
    const districtData = useMemo(() => {
        const districts: { name: string; data: DistrictData }[] = [];
        Object.entries(reportData).forEach(([key, value]) => {
            if (key !== "total_cows" && key !== "total_buffaloes" && typeof value === "object" && value !== null) {
                districts.push({ name: key, data: value as DistrictData });
            }
        });
        return districts.sort((a, b) => a.name.localeCompare(b.name));
    }, [reportData]);

    // Calculate totals
    const totals = useMemo(() => {
        const result = {
            cow_count: 0,
            buffalo_count: 0,
            crossbreed_count: 0,
            animal_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            collar_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            premium_paid: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            transportation_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            total_expenditure: { benenficiary_share_total: 0, subsidy_share_total: 0, total: 0 },
            balance: { financial_balance: 0, physical_balance: 0 },
        };

        districtData.forEach(({ data }) => {
            result.cow_count += data.cow_count || 0;
            result.buffalo_count += data.buffalo_count || 0;
            result.crossbreed_count += data.crossbreed_count || 0;
            result.animal_cost.beneficiary_share += data.animal_cost?.beneficiary_share || 0;
            result.animal_cost.subsidy_share += data.animal_cost?.subsidy_share || 0;
            result.animal_cost.total += data.animal_cost?.total || 0;

            result.collar_cost.beneficiary_share += data.collar_cost?.beneficiary_share || 0;
            result.collar_cost.subsidy_share += data.collar_cost?.subsidy_share || 0;
            result.collar_cost.total += data.collar_cost?.total || 0;

            result.premium_paid.beneficiary_share += data.premium_paid?.beneficiary_share || 0;
            result.premium_paid.subsidy_share += data.premium_paid?.subsidy_share || 0;
            result.premium_paid.total += data.premium_paid?.total || 0;

            result.transportation_cost.beneficiary_share += data.transportation_cost?.beneficiary_share || 0;
            result.transportation_cost.subsidy_share += data.transportation_cost?.subsidy_share || 0;
            result.transportation_cost.total += data.transportation_cost?.total || 0;

            result.total_expenditure.benenficiary_share_total += data.total_expenditure?.benenficiary_share_total || 0;
            result.total_expenditure.subsidy_share_total += data.total_expenditure?.subsidy_share_total || 0;
            result.total_expenditure.total += data.total_expenditure?.total || 0;

            result.balance.financial_balance += data.balance?.financial_balance || 0;
            result.balance.physical_balance += data.balance?.physical_balance || 0;
        });

        return result;
    }, [districtData]);

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
                method: "vmddp_app.api.v1.accountant.animal_induction_mpr_export",
                params: {
                    month: selectedMonth,
                    year: selectedYear,
                },
                format,
                filename: `Animal_Induction_MPR_${selectedMonth}_${selectedYear}`,
            });

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
                        <h1 className="text-xl sm:text-2xl font-bold">Animal Induction MPR</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Induction of High Genetic Merit Dairy Animals
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
                            <Button disabled={isExporting || isLoading} className="w-full sm:w-auto">
                                {isExporting
                                    ? <><Download className="h-4 w-4 sm:mr-2 animate-pulse" /><span className="hidden sm:inline">Exporting...</span></>
                                    : <><Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></>}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Districts</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl">{districtData.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Cows</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600">{totals.cow_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Buffaloes</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-purple-600">{totals.buffalo_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs sm:text-sm">Total Expenditure</CardDescription>
                            <CardTitle className="text-xl sm:text-2xl text-green-600">
                                ₹{formatCurrency(totals.total_expenditure.total)}
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
                        Animal Induction - Financial Achievement Report
                    </CardTitle>
                    <CardDescription>
                        District-wise breakdown of costs and physical achievement
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
                                            <th rowSpan={4} className="border text-center font-bold sticky left-0 bg-muted/50 z-30 min-w-[50px] p-2">
                                                Sr. No.
                                            </th>
                                            <th rowSpan={4} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-30 min-w-[120px] p-2">
                                                Name of District
                                            </th>
                                            <th rowSpan={4} className="border text-center font-bold min-w-[70px] p-2">

                                            </th>
                                            <th colSpan={19} className="border text-center font-bold bg-blue-50 p-2">
                                                Induction of High Genetic Merit Dairy Animals
                                            </th>
                                        </tr>
                                        {/* Second header row - Physical & Financial Achievement */}
                                        <tr className="bg-muted/40">
                                            <th colSpan={3} className="border text-center font-bold bg-yellow-100 p-2">
                                                Physical Achievement
                                            </th>
                                            <th colSpan={15} className="border text-center font-bold bg-purple-100 p-2">
                                                Financial Achievement
                                            </th>
                                            <th rowSpan={3} className="border text-center font-bold bg-orange-100 min-w-[100px] p-2">
                                                Balance
                                            </th>
                                        </tr>
                                        {/* Third header row - Sub categories */}
                                        <tr className="bg-muted/30">
                                            <th rowSpan={2} className="border text-center font-bold min-w-[60px] bg-yellow-50 p-2">
                                                No. of Cow
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold min-w-[60px] bg-yellow-50 p-2">
                                                No. of Cross-breed
                                            </th>
                                            <th rowSpan={2} className="border text-center font-bold min-w-[60px] bg-yellow-50 p-2">
                                                No. of Buffalo
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[200px] p-2">
                                                ANIMAL COST
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[200px] p-2">
                                                DIGITAL COLLAR
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[200px] p-2">
                                                INSURANCE
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold min-w-[200px] p-2">
                                                TRANSPORTATION
                                            </th>
                                            <th colSpan={3} className="border text-center font-bold bg-green-50 min-w-[300px] p-2">
                                                TOTAL EXPENDITURE (ANIMAL INDUCTION)
                                            </th>
                                        </tr>
                                        {/* Fourth header row - Financial Achievement labels */}
                                        <tr className="bg-muted/20">
                                            {/* Animal Cost */}
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Beneficiary Share (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Subsidy (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Total (Rs.)
                                            </th>
                                            {/* Digital Collar */}
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Beneficiary Share (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Subsidy (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Total (Rs.)
                                            </th>
                                            {/* Insurance */}
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Beneficiary Share (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Subsidy (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Total (Rs.)
                                            </th>
                                            {/* Transportation */}
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Beneficiary Share (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Subsidy (Rs.)
                                            </th>
                                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                                Total (Rs.)
                                            </th>
                                            {/* Total Expenditure Financial */}
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
                                                    <td className="border text-center bg-yellow-50 p-2">{data.cow_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50 p-2">{data.crossbreed_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50 p-2">{data.buffalo_count || 0}</td>
                                                    {/* Animal Cost */}
                                                    <td className="border text-right p-2">{formatCurrency(data.animal_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.animal_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.animal_cost?.total || 0)}</td>
                                                    {/* Collar Cost */}
                                                    <td className="border text-right p-2">{formatCurrency(data.collar_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.collar_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.collar_cost?.total || 0)}</td>
                                                    {/* Insurance */}
                                                    <td className="border text-right p-2">{formatCurrency(data.premium_paid?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.premium_paid?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.premium_paid?.total || 0)}</td>
                                                    {/* Transportation */}
                                                    <td className="border text-right p-2">{formatCurrency(data.transportation_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.transportation_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.transportation_cost?.total || 0)}</td>
                                                    {/* Total Expenditure */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.benenficiary_share_total || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.subsidy_share_total || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.total || 0)}</td>
                                                    {/* Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">
                                                        {formatCurrency(data.balance?.financial_balance || 0)}
                                                    </td>
                                                </tr>
                                                {/* Progress Row */}
                                                <tr className="hover:bg-muted/30 bg-muted/10">
                                                    <td className="border text-center text-[10px] p-2">Progressive</td>
                                                    {/* Physical Achievement */}
                                                    <td className="border text-center bg-yellow-50/50 p-2">{data.cow_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50/50 p-2">{data.crossbreed_count || 0}</td>
                                                    <td className="border text-center bg-yellow-50/50 p-2">{data.buffalo_count || 0}</td>
                                                    {/* Animal Cost */}
                                                    <td className="border text-right p-2">{formatCurrency(data.animal_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.animal_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.animal_cost?.total || 0)}</td>
                                                    {/* Collar Cost */}
                                                    <td className="border text-right p-2">{formatCurrency(data.collar_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.collar_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.collar_cost?.total || 0)}</td>
                                                    {/* Insurance */}
                                                    <td className="border text-right p-2">{formatCurrency(data.premium_paid?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.premium_paid?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.premium_paid?.total || 0)}</td>
                                                    {/* Transportation */}
                                                    <td className="border text-right p-2">{formatCurrency(data.transportation_cost?.beneficiary_share || 0)}</td>
                                                    <td className="border text-right p-2">{formatCurrency(data.transportation_cost?.subsidy_share || 0)}</td>
                                                    <td className="border text-right font-medium p-2">{formatCurrency(data.transportation_cost?.total || 0)}</td>
                                                    {/* Total Expenditure */}
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.benenficiary_share_total || 0)}</td>
                                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.subsidy_share_total || 0)}</td>
                                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(data.total_expenditure?.total || 0)}</td>
                                                    {/* Balance */}
                                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">
                                                        {formatCurrency(data.balance?.financial_balance || 0)}
                                                    </td>
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
                                            <td className="border text-center bg-yellow-100 p-2">{totals.cow_count}</td>
                                            <td className="border text-center bg-yellow-100 p-2">{totals.crossbreed_count || 0}</td>
                                            <td className="border text-center bg-yellow-100 p-2">{totals.buffalo_count}</td>
                                            {/* Animal Cost */}
                                            <td className="border text-right p-2">{formatCurrency(totals.animal_cost.beneficiary_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.animal_cost.subsidy_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.animal_cost.total)}</td>
                                            {/* Collar Cost */}
                                            <td className="border text-right p-2">{formatCurrency(totals.collar_cost.beneficiary_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.collar_cost.subsidy_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.collar_cost.total)}</td>
                                            {/* Insurance */}
                                            <td className="border text-right p-2">{formatCurrency(totals.premium_paid.beneficiary_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.premium_paid.subsidy_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.premium_paid.total)}</td>
                                            {/* Transportation */}
                                            <td className="border text-right p-2">{formatCurrency(totals.transportation_cost.beneficiary_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.transportation_cost.subsidy_share)}</td>
                                            <td className="border text-right p-2">{formatCurrency(totals.transportation_cost.total)}</td>
                                            {/* Total Expenditure */}
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.total_expenditure.benenficiary_share_total)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.total_expenditure.subsidy_share_total)}</td>
                                            <td className="border text-right bg-green-100 p-2">{formatCurrency(totals.total_expenditure.total)}</td>
                                            {/* Balance */}
                                            <td className="border text-right bg-orange-100 font-bold p-2">
                                                {formatCurrency(totals.balance.financial_balance)}
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
