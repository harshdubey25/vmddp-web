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
import { useFrappeGetCall } from "frappe-react-sdk";
import * as XLSX from "xlsx";
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

interface DistrictData {
    cow_count: number;
    buffalo_count: number;
    animal_cost: CostBreakdown;
    collar_cost: CostBreakdown;
    premium_paid: CostBreakdown;
    transportation_cost: CostBreakdown;
    total_expenditure: TotalExpenditure;
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
            animal_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            collar_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            premium_paid: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            transportation_cost: { beneficiary_share: 0, subsidy_share: 0, total: 0 },
            total_expenditure: { benenficiary_share_total: 0, subsidy_share_total: 0, total: 0 },
        };

        districtData.forEach(({ data }) => {
            result.cow_count += data.cow_count || 0;
            result.buffalo_count += data.buffalo_count || 0;

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
        });

        return result;
    }, [districtData]);

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
                "Animal Cost - Beneficiary Share (Rs.)",
                "Animal Cost - Subsidy (Rs.)",
                "Animal Cost - Total (Rs.)",
                "Digital Collar - Beneficiary Share (Rs.)",
                "Digital Collar - Subsidy (Rs.)",
                "Digital Collar - Total (Rs.)",
                "Insurance - Beneficiary Share (Rs.)",
                "Insurance - Subsidy (Rs.)",
                "Insurance - Total (Rs.)",
                "Transportation - Beneficiary Share (Rs.)",
                "Transportation - Subsidy (Rs.)",
                "Transportation - Total (Rs.)",
                "No. of Cow",
                "No. of Buffalo",
                "Total Expenditure - Beneficiary Share (Rs.)",
                "Total Expenditure - Subsidy (Rs.)",
                "Total Expenditure - Total (Rs.)",
            ];

            const rows: (string | number)[][] = [];

            districtData.forEach(({ name, data }, index) => {
                // Monthly row
                rows.push([
                    index + 1,
                    name,
                    "Monthly",
                    data.animal_cost?.beneficiary_share || 0,
                    data.animal_cost?.subsidy_share || 0,
                    data.animal_cost?.total || 0,
                    data.collar_cost?.beneficiary_share || 0,
                    data.collar_cost?.subsidy_share || 0,
                    data.collar_cost?.total || 0,
                    data.premium_paid?.beneficiary_share || 0,
                    data.premium_paid?.subsidy_share || 0,
                    data.premium_paid?.total || 0,
                    data.transportation_cost?.beneficiary_share || 0,
                    data.transportation_cost?.subsidy_share || 0,
                    data.transportation_cost?.total || 0,
                    data.cow_count || 0,
                    data.buffalo_count || 0,
                    data.total_expenditure?.benenficiary_share_total || 0,
                    data.total_expenditure?.subsidy_share_total || 0,
                    data.total_expenditure?.total || 0,
                ]);
                // Progress row (same as monthly for now)
                rows.push([
                    "",
                    "",
                    "Progress",
                    data.animal_cost?.beneficiary_share || 0,
                    data.animal_cost?.subsidy_share || 0,
                    data.animal_cost?.total || 0,
                    data.collar_cost?.beneficiary_share || 0,
                    data.collar_cost?.subsidy_share || 0,
                    data.collar_cost?.total || 0,
                    data.premium_paid?.beneficiary_share || 0,
                    data.premium_paid?.subsidy_share || 0,
                    data.premium_paid?.total || 0,
                    data.transportation_cost?.beneficiary_share || 0,
                    data.transportation_cost?.subsidy_share || 0,
                    data.transportation_cost?.total || 0,
                    data.cow_count || 0,
                    data.buffalo_count || 0,
                    data.total_expenditure?.benenficiary_share_total || 0,
                    data.total_expenditure?.subsidy_share_total || 0,
                    data.total_expenditure?.total || 0,
                ]);
            });

            // Total row
            rows.push([
                "",
                "TOTAL",
                "",
                totals.animal_cost.beneficiary_share,
                totals.animal_cost.subsidy_share,
                totals.animal_cost.total,
                totals.collar_cost.beneficiary_share,
                totals.collar_cost.subsidy_share,
                totals.collar_cost.total,
                totals.premium_paid.beneficiary_share,
                totals.premium_paid.subsidy_share,
                totals.premium_paid.total,
                totals.transportation_cost.beneficiary_share,
                totals.transportation_cost.subsidy_share,
                totals.transportation_cost.total,
                totals.cow_count,
                totals.buffalo_count,
                totals.total_expenditure.benenficiary_share_total,
                totals.total_expenditure.subsidy_share_total,
                totals.total_expenditure.total,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Animal Induction MPR");

            XLSX.writeFile(wb, `Animal_Induction_MPR_${selectedMonth}_${selectedYear}.xlsx`);

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
        <div className="p-6 space-y-6 overflow-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/accountant/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Animal Induction MPR</h1>
                        <p className="text-muted-foreground">
                            Induction of High Genetic Merit Dairy Animals
                        </p>
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Districts</CardDescription>
                            <CardTitle className="text-2xl">{districtData.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Cows</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">{totals.cow_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Buffaloes</CardDescription>
                            <CardTitle className="text-2xl text-purple-600">{totals.buffalo_count}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Expenditure</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
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
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    {/* First header row - Main categories */}
                                    <TableRow className="bg-muted/50">
                                        <TableHead rowSpan={4} className="border text-center font-bold sticky left-0 bg-muted/50 z-10 min-w-[50px]">
                                            Sr. No.
                                        </TableHead>
                                        <TableHead rowSpan={4} className="border text-center font-bold sticky left-[50px] bg-muted/50 z-10 min-w-[120px]">
                                            Name of District
                                        </TableHead>
                                        <TableHead rowSpan={4} className="border text-center font-bold min-w-[70px]">

                                        </TableHead>
                                        <TableHead colSpan={17} className="border text-center font-bold bg-blue-50">
                                            Induction of High Genetic Merit Dairy Animals
                                        </TableHead>
                                    </TableRow>
                                    {/* Second header row - Physical & Financial Achievement */}
                                    <TableRow className="bg-muted/40">
                                        <TableHead colSpan={2} className="border text-center font-bold bg-yellow-100">
                                            Physical Achievement
                                        </TableHead>
                                        <TableHead colSpan={15} className="border text-center font-bold bg-purple-100">
                                            Financial Achievement
                                        </TableHead>
                                    </TableRow>
                                    {/* Third header row - Sub categories */}
                                    <TableRow className="bg-muted/30">
                                        <TableHead rowSpan={2} className="border text-center font-bold min-w-[60px] bg-yellow-50">
                                            No. of Cow
                                        </TableHead>
                                        <TableHead rowSpan={2} className="border text-center font-bold min-w-[60px] bg-yellow-50">
                                            No. of Buffalo
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold min-w-[200px]">
                                            ANIMAL COST
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold min-w-[200px]">
                                            DIGITAL COLLAR
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold min-w-[200px]">
                                            INSURANCE
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold min-w-[200px]">
                                            TRANSPORTATION
                                        </TableHead>
                                        <TableHead colSpan={3} className="border text-center font-bold bg-green-50 min-w-[300px]">
                                            TOTAL EXPENDITURE (ANIMAL INDUCTION)
                                        </TableHead>
                                    </TableRow>
                                    {/* Fourth header row - Financial Achievement labels */}
                                    <TableRow className="bg-muted/20">
                                        {/* Animal Cost */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Beneficiary Share (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Subsidy (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Total (Rs.)
                                        </TableHead>
                                        {/* Digital Collar */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Beneficiary Share (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Subsidy (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Total (Rs.)
                                        </TableHead>
                                        {/* Insurance */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Beneficiary Share (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Subsidy (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Total (Rs.)
                                        </TableHead>
                                        {/* Transportation */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Beneficiary Share (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Subsidy (Rs.)
                                        </TableHead>
                                        <TableHead className="border text-center text-[9px] min-w-[80px]">
                                            Total (Rs.)
                                        </TableHead>
                                        {/* Total Expenditure Financial */}
                                        <TableHead className="border text-center text-[9px] min-w-[80px] bg-green-50">
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
                                                <TableCell className="border text-center bg-yellow-50">{data.cow_count || 0}</TableCell>
                                                <TableCell className="border text-center bg-yellow-50">{data.buffalo_count || 0}</TableCell>
                                                {/* Animal Cost */}
                                                <TableCell className="border text-right">{formatCurrency(data.animal_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.animal_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.animal_cost?.total || 0)}</TableCell>
                                                {/* Collar Cost */}
                                                <TableCell className="border text-right">{formatCurrency(data.collar_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.collar_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.collar_cost?.total || 0)}</TableCell>
                                                {/* Insurance */}
                                                <TableCell className="border text-right">{formatCurrency(data.premium_paid?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.premium_paid?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.premium_paid?.total || 0)}</TableCell>
                                                {/* Transportation */}
                                                <TableCell className="border text-right">{formatCurrency(data.transportation_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.transportation_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.transportation_cost?.total || 0)}</TableCell>
                                                {/* Total Expenditure */}
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.total_expenditure?.benenficiary_share_total || 0)}</TableCell>
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.total_expenditure?.subsidy_share_total || 0)}</TableCell>
                                                <TableCell className="border text-right font-bold bg-green-50/50">{formatCurrency(data.total_expenditure?.total || 0)}</TableCell>
                                            </TableRow>
                                            {/* Progress Row */}
                                            <TableRow className="hover:bg-muted/30 bg-muted/10">
                                                <TableCell className="border text-center text-[10px]">Progress</TableCell>
                                                {/* Physical Achievement */}
                                                <TableCell className="border text-center bg-yellow-50/50">{data.cow_count || 0}</TableCell>
                                                <TableCell className="border text-center bg-yellow-50/50">{data.buffalo_count || 0}</TableCell>
                                                {/* Animal Cost */}
                                                <TableCell className="border text-right">{formatCurrency(data.animal_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.animal_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.animal_cost?.total || 0)}</TableCell>
                                                {/* Collar Cost */}
                                                <TableCell className="border text-right">{formatCurrency(data.collar_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.collar_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.collar_cost?.total || 0)}</TableCell>
                                                {/* Insurance */}
                                                <TableCell className="border text-right">{formatCurrency(data.premium_paid?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.premium_paid?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.premium_paid?.total || 0)}</TableCell>
                                                {/* Transportation */}
                                                <TableCell className="border text-right">{formatCurrency(data.transportation_cost?.beneficiary_share || 0)}</TableCell>
                                                <TableCell className="border text-right">{formatCurrency(data.transportation_cost?.subsidy_share || 0)}</TableCell>
                                                <TableCell className="border text-right font-medium">{formatCurrency(data.transportation_cost?.total || 0)}</TableCell>
                                                {/* Total Expenditure */}
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.total_expenditure?.benenficiary_share_total || 0)}</TableCell>
                                                <TableCell className="border text-right bg-green-50/50">{formatCurrency(data.total_expenditure?.subsidy_share_total || 0)}</TableCell>
                                                <TableCell className="border text-right font-bold bg-green-50/50">{formatCurrency(data.total_expenditure?.total || 0)}</TableCell>
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
                                        <TableCell className="border text-center bg-yellow-100">{totals.cow_count}</TableCell>
                                        <TableCell className="border text-center bg-yellow-100">{totals.buffalo_count}</TableCell>
                                        {/* Animal Cost */}
                                        <TableCell className="border text-right">{formatCurrency(totals.animal_cost.beneficiary_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.animal_cost.subsidy_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.animal_cost.total)}</TableCell>
                                        {/* Collar Cost */}
                                        <TableCell className="border text-right">{formatCurrency(totals.collar_cost.beneficiary_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.collar_cost.subsidy_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.collar_cost.total)}</TableCell>
                                        {/* Insurance */}
                                        <TableCell className="border text-right">{formatCurrency(totals.premium_paid.beneficiary_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.premium_paid.subsidy_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.premium_paid.total)}</TableCell>
                                        {/* Transportation */}
                                        <TableCell className="border text-right">{formatCurrency(totals.transportation_cost.beneficiary_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.transportation_cost.subsidy_share)}</TableCell>
                                        <TableCell className="border text-right">{formatCurrency(totals.transportation_cost.total)}</TableCell>
                                        {/* Total Expenditure */}
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.total_expenditure.benenficiary_share_total)}</TableCell>
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.total_expenditure.subsidy_share_total)}</TableCell>
                                        <TableCell className="border text-right bg-green-100">{formatCurrency(totals.total_expenditure.total)}</TableCell>
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
