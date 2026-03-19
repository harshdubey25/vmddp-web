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
import { Download, FileText, FileSpreadsheet, RefreshCw, ArrowLeft, Building2, PawPrint, Wallet, Target, Maximize2 } from "lucide-react";
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

interface ReportSection {
    [districtName: string]: DistrictData | number;
    total_cows: number;
    total_buffaloes: number;
    total_crossbreed: number;
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

interface AnimalInductionMPRResponse {
    message: {
        progressive: ReportSection;
        current_month: ReportSection;
        filters: ReportFilters;
    };
}

const EMPTY_DISTRICT_DATA: DistrictData = {
    cow_count: 0,
    buffalo_count: 0,
    crossbreed_count: 0,
    animal_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
    collar_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
    premium_paid: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
    transportation_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
    total_expenditure: { benenficiary_share_total: 0, subsidy_share_total: 0, total: 0 },
    target: { financial_target: 0, physical_target: 0 },
    balance: { financial_balance: 0, physical_balance: 0 },
};

const extractDistrictData = (section: ReportSection | undefined) => {
    const districts: { name: string; data: DistrictData }[] = [];

    Object.entries(section || {}).forEach(([key, value]) => {
        if (
            key !== "total_cows" &&
            key !== "total_buffaloes" &&
            key !== "total_crossbreed" &&
            typeof value === "object" &&
            value !== null
        ) {
            districts.push({ name: key, data: value as DistrictData });
        }
    });

    return districts.sort((a, b) => a.name.localeCompare(b.name));
};

const calculateTotals = (districtData: { name: string; data: DistrictData }[]) => {
    const result = {
        cow_count: 0,
        buffalo_count: 0,
        crossbreed_count: 0,
        animal_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
        collar_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
        premium_paid: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
        transportation_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
        total_expenditure: { benenficiary_share_total: 0, subsidy_share_total: 0, total: 0 },
        target: { financial_target: 0, physical_target: 0 },
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

        result.target.financial_target += data.target?.financial_target || 0;
        result.target.physical_target += data.target?.physical_target || 0;

        result.balance.financial_balance += data.balance?.financial_balance || 0;
        result.balance.physical_balance += data.balance?.physical_balance || 0;
    });

    return result;
};

export default function AnimalInductionMPRPage() {
    const { toast } = useToast();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
    const [isExporting, setIsExporting] = useState(false);
    const [isTableFullscreen, setIsTableFullscreen] = useState(false);

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

    const reportData = apiResponse?.message;
    const progressiveReport = reportData?.progressive;
    const currentMonthReport = reportData?.current_month;
    const filters = reportData?.filters;

    const progressiveDistrictData = useMemo(() => extractDistrictData(progressiveReport), [progressiveReport]);
    const currentMonthDistrictData = useMemo(() => extractDistrictData(currentMonthReport), [currentMonthReport]);

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

    const currentMonthTotals = useMemo(() => calculateTotals(currentMonthDistrictData), [currentMonthDistrictData]);
    const progressiveTotals = useMemo(() => calculateTotals(progressiveDistrictData), [progressiveDistrictData]);

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

    const selectedMonthLabel = months.find((month) => month.value === selectedMonth)?.label || "Current Month";

    const renderReportTable = (containerClassName: string) => (
        <div className="border rounded-lg overflow-hidden flex flex-col">
            <div className={containerClassName}>
                <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0 z-30">
                        <tr className="bg-muted/50">
                            <th rowSpan={4} className="border text-center font-bold sticky left-0 bg-muted z-30 min-w-[50px] p-2">
                                Sr. No.
                            </th>
                            <th rowSpan={4} className="border text-center font-bold sticky left-[50px] bg-muted z-30 min-w-[120px] p-2">
                                Name of District
                            </th>
                            <th rowSpan={4} className="border text-center font-bold min-w-[70px] p-2">

                            </th>
                            <th colSpan={19} className="border text-center font-bold bg-blue-50 p-2">
                                Induction of High Genetic Merit Dairy Animals
                            </th>
                        </tr>
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
                        <tr className="bg-muted/20">
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Beneficiary Share (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Subsidy (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Total (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Beneficiary Share (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Subsidy (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Total (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Beneficiary Share (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Subsidy (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Total (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Beneficiary Share (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Subsidy (Rs.)
                            </th>
                            <th className="border text-center text-[9px] min-w-[80px] p-2">
                                Total (Rs.)
                            </th>
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
                                <tr className="hover:bg-muted/30">
                                    <td rowSpan={2} className="border text-center font-medium sticky left-0 bg-background z-10 p-2">
                                        {index + 1}
                                    </td>
                                    <td rowSpan={2} className="border font-medium sticky left-[50px] bg-background z-10 p-2">
                                        {name}
                                    </td>
                                    <td className="border text-center text-[10px] p-2">Current Month</td>
                                    <td className="border text-center bg-yellow-50 p-2">{currentMonth.cow_count || 0}</td>
                                    <td className="border text-center bg-yellow-50 p-2">{currentMonth.crossbreed_count || 0}</td>
                                    <td className="border text-center bg-yellow-50 p-2">{currentMonth.buffalo_count || 0}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.animal_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.animal_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(currentMonth.animal_cost?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.collar_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.collar_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(currentMonth.collar_cost?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.premium_paid?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.premium_paid?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(currentMonth.premium_paid?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.transportation_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(currentMonth.transportation_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(currentMonth.transportation_cost?.total || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(currentMonth.total_expenditure?.benenficiary_share_total || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(currentMonth.total_expenditure?.subsidy_share_total || 0)}</td>
                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(currentMonth.total_expenditure?.total || 0)}</td>
                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">
                                        {formatCurrency(currentMonth.balance?.financial_balance || 0)}
                                    </td>
                                </tr>
                                <tr className="hover:bg-muted/30 bg-muted/10">
                                    <td className="border text-center text-[10px] p-2">Progressive</td>
                                    <td className="border text-center bg-yellow-50/50 p-2">{progressive.cow_count || 0}</td>
                                    <td className="border text-center bg-yellow-50/50 p-2">{progressive.crossbreed_count || 0}</td>
                                    <td className="border text-center bg-yellow-50/50 p-2">{progressive.buffalo_count || 0}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.animal_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.animal_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(progressive.animal_cost?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.collar_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.collar_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(progressive.collar_cost?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.premium_paid?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.premium_paid?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(progressive.premium_paid?.total || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.transportation_cost?.beneficiary_share || 0)}</td>
                                    <td className="border text-right p-2">{formatCurrency(progressive.transportation_cost?.subsidy_share || 0)}</td>
                                    <td className="border text-right font-medium p-2">{formatCurrency(progressive.transportation_cost?.total || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(progressive.total_expenditure?.benenficiary_share_total || 0)}</td>
                                    <td className="border text-right bg-green-50/50 p-2">{formatCurrency(progressive.total_expenditure?.subsidy_share_total || 0)}</td>
                                    <td className="border text-right font-bold bg-green-50/50 p-2">{formatCurrency(progressive.total_expenditure?.total || 0)}</td>
                                    <td className="border text-right bg-orange-50/50 font-semibold p-2">
                                        {formatCurrency(progressive.balance?.financial_balance || 0)}
                                    </td>
                                </tr>
                            </Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-muted font-bold">
                            <td rowSpan={2} className="border text-center sticky left-0 bg-muted z-10 p-2" colSpan={1}></td>
                            <td rowSpan={2} className="border sticky left-[50px] bg-muted z-10 p-2">TOTAL</td>
                            <td className="border p-2">Current Month</td>
                            <td className="border text-center bg-yellow-100 p-2">{currentMonthTotals.cow_count}</td>
                            <td className="border text-center bg-yellow-100 p-2">{currentMonthTotals.crossbreed_count || 0}</td>
                            <td className="border text-center bg-yellow-100 p-2">{currentMonthTotals.buffalo_count}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.animal_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.animal_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.animal_cost.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.collar_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.collar_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.collar_cost.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.premium_paid.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.premium_paid.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.premium_paid.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.transportation_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.transportation_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(currentMonthTotals.transportation_cost.total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.total_expenditure.benenficiary_share_total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.total_expenditure.subsidy_share_total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(currentMonthTotals.total_expenditure.total)}</td>
                            <td className="border text-right bg-orange-100 font-bold p-2">
                                {formatCurrency(currentMonthTotals.balance.financial_balance)}
                            </td>
                        </tr>
                        <tr className="bg-muted font-bold">
                            <td className="border p-2">Progressive</td>
                            <td className="border text-center bg-yellow-100 p-2">{progressiveTotals.cow_count}</td>
                            <td className="border text-center bg-yellow-100 p-2">{progressiveTotals.crossbreed_count || 0}</td>
                            <td className="border text-center bg-yellow-100 p-2">{progressiveTotals.buffalo_count}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.animal_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.animal_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.animal_cost.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.collar_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.collar_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.collar_cost.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.premium_paid.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.premium_paid.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.premium_paid.total)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.transportation_cost.beneficiary_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.transportation_cost.subsidy_share)}</td>
                            <td className="border text-right p-2">{formatCurrency(progressiveTotals.transportation_cost.total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.total_expenditure.benenficiary_share_total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.total_expenditure.subsidy_share_total)}</td>
                            <td className="border text-right bg-green-100 p-2">{formatCurrency(progressiveTotals.total_expenditure.total)}</td>
                            <td className="border text-right bg-orange-100 font-bold p-2">
                                {formatCurrency(progressiveTotals.balance.financial_balance)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

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
            {!isLoading && mergedDistrictData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 print:hidden">
                    <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Current Month Districts</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-xl sm:text-2xl text-blue-600 drop-shadow-sm">{currentMonthDistrictData.length}</CardTitle>

                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Current Month Animals</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl text-cyan-600 drop-shadow-sm">
                                {currentMonthTotals.cow_count + currentMonthTotals.crossbreed_count + currentMonthTotals.buffalo_count}
                            </CardTitle>

                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">{selectedMonthLabel} Expenditure</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl text-green-600 drop-shadow-sm">
                                ₹{formatCurrency(currentMonthTotals.total_expenditure.subsidy_share_total)}
                            </CardTitle>

                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Districts</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl text-blue-600 drop-shadow-sm">{currentMonthDistrictData.length}</CardTitle>

                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-pink-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Animals</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl text-pink-600 drop-shadow-sm">
                                {progressiveTotals.cow_count + progressiveTotals.crossbreed_count + progressiveTotals.buffalo_count}
                            </CardTitle>

                        </CardHeader>
                    </Card>
                    <Card className="relative overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 relative">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-[10px] sm:text-xs md:text-sm">Progressive Expenditure</CardDescription>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl text-emerald-600 drop-shadow-sm">
                                ₹{formatCurrency(progressiveTotals.total_expenditure.subsidy_share_total)}
                            </CardTitle>

                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Report Card */}
            <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                Animal Induction - Financial Achievement Report
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                District-wise breakdown of current month and progressive costs and physical achievement
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
                            <span className="sm:inline">Full Screen</span>
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
                        renderReportTable("overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]")
                    )}
                </CardContent>
            </Card>

            <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
                <DialogContent className="h-[96vh] w-[98vw] max-w-none overflow-hidden p-0">
                    <div className="flex h-full flex-col overflow-hidden">
                        <DialogHeader className="border-b px-4 py-4 pr-12 sm:px-6">
                            <DialogTitle className="text-base sm:text-lg md:text-xl">
                                Animal Induction - Financial Achievement Report
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Full screen view for the district-wise MPR table.
                                {filters && ` Current month: ${filters.current_month_start_date} to ${filters.current_month_end_date} • Progressive: ${filters.progressive_start_date} to ${filters.progressive_end_date}`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden p-4 sm:p-6">
                            {renderReportTable("h-full overflow-x-auto overflow-y-auto")}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>


        </div>
    );
}
