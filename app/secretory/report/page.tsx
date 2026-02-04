"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, RefreshCw, Download, Filter } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface DistrictData {
    district_name: string;
    target_farmers: number;
    target_financial: number;
    no_of_farmers_monthly: number;
    achievement_total_monthly: number;
    land_covered_hect_monthly: number;
    beneficiary_share_monthly: number;
    subsidy_monthly: number;
    total_monthly: number;
    no_of_farmers_progressive: number;
    achievement_total_progressive: number;
    land_covered_progressive: number;
    beneficiary_share_progressive: number;
    subsidy_progressive: number;
    total_progressive: number;
    balance_physical: number;
    balance_financial: number;
}

interface Totals {
    target_farmers: number;
    target_financial: number;
    no_of_farmers_monthly: number;
    achievement_total_monthly: number;
    land_covered_hect_monthly: number;
    beneficiary_share_monthly: number;
    subsidy_monthly: number;
    total_monthly: number;
    no_of_farmers_progressive: number;
    achievement_total_progressive: number;
    land_covered_progressive: number;
    beneficiary_share_progressive: number;
    subsidy_progressive: number;
    total_progressive: number;
    balance_physical: number;
    balance_financial: number;
}

interface ReportResponse {
    message: {
        districts: Record<string, DistrictData>;
        totals: Totals;
        month: number | null;
        year: number;
        component: string;
    };
}

export default function SecretaryReport() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    
    const selectedComponent = "Fodder Seed";
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const queryParams: Record<string, string> = {
        component: selectedComponent,
        year: selectedYear,
    };
    
    if (selectedMonth && selectedMonth !== "all") {
        queryParams.month = selectedMonth;
    }

    const {
        data: reportData,
        isLoading,
        error,
        mutate: refetch,
    } = useFrappeGetCall<ReportResponse>(
        "vmddp_app.api.v1.secretory.get_fodder_seeds_report",
        queryParams,
        `fodder-report-${selectedComponent}-${selectedMonth || "all"}-${selectedYear}`,
        {
            revalidateOnFocus: false,
        }
    );

    const districts = reportData?.message?.districts 
        ? Object.values(reportData.message.districts) 
        : [];
    
    const totals = reportData?.message?.totals || {
        target_farmers: 0,
        target_financial: 0,
        no_of_farmers_monthly: 0,
        achievement_total_monthly: 0,
        land_covered_hect_monthly: 0,
        beneficiary_share_monthly: 0,
        subsidy_monthly: 0,
        total_monthly: 0,
        no_of_farmers_progressive: 0,
        achievement_total_progressive: 0,
        land_covered_progressive: 0,
        beneficiary_share_progressive: 0,
        subsidy_progressive: 0,
        total_progressive: 0,
        balance_physical: 0,
        balance_financial: 0,
    };

    const formatCurrency = (value: number) => {
        return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleRefresh = () => {
        refetch();
        toast({
            title: "Data refreshed",
            description: "Report data has been updated.",
        });
    };

    const getMonthName = (monthNum: number | null) => {
        if (!monthNum) return "Progressive";
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[monthNum - 1];
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const headers = [
                "Sr. No.",
                "District",
                "Target (Farmers)",
                "Target (Rs.)",

                "Monthly - Farmers",
                "Monthly - Quantity",
                "Monthly - Land (Ha)",
                "Monthly - Ben. Share",
                "Monthly - Subsidy",
                "Monthly - Total",

                "Prog. - Farmers",
                "Prog. - Quantity",
                "Prog. - Land (Ha)",
                "Prog. - Ben. Share",
                "Prog. - Subsidy",
                "Prog. - Total",

                "Balance - Physical",
                "Balance - Financial",
            ];

            const rows = districts.map((item, index) => [
                index + 1,
                item.district_name,
                item.target_farmers,
                item.target_financial,

                item.no_of_farmers_monthly,
                item.achievement_total_monthly,
                item.land_covered_hect_monthly,
                item.beneficiary_share_monthly,
                item.subsidy_monthly,
                item.total_monthly,

                item.no_of_farmers_progressive,
                item.achievement_total_progressive,
                item.land_covered_progressive,
                item.beneficiary_share_progressive,
                item.subsidy_progressive,
                item.total_progressive,

                item.balance_physical,
                item.balance_financial,
            ]);

            rows.push([
                "",
                "TOTAL",
                totals.target_farmers,
                totals.target_financial,

                totals.no_of_farmers_monthly,
                totals.achievement_total_monthly,
                totals.land_covered_hect_monthly,
                totals.beneficiary_share_monthly,
                totals.subsidy_monthly,
                totals.total_monthly,

                totals.no_of_farmers_progressive,
                totals.achievement_total_progressive,
                totals.land_covered_progressive,
                totals.beneficiary_share_progressive,
                totals.subsidy_progressive,
                totals.total_progressive,

                totals.balance_physical,
                totals.balance_financial,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Fodder Seeds Report");

            const fileName = `Fodder_Seeds_Report_${getMonthName(reportData?.message?.month || null)}_${selectedYear}.xlsx`;
            XLSX.writeFile(wb, fileName);

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

    return (
        <div className="min-h-screen bg-background overflow-y-scroll">
            <main className="overflow-auto min-h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold">
                                Supply of Fodder Seeds/Planting Materials - Report
                            </h1>
                            <p className="text-muted-foreground">
                                Physical and Financial Achievement Report
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={isExporting || isLoading || districts.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isExporting ? "Exporting..." : "Export Excel"}
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Filter className="h-5 w-5" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Month Select */}
                                <div className="space-y-2">
                                    <Label htmlFor="month">Month</Label>
                                    <Select
                                        value={selectedMonth || "all"}
                                        onValueChange={(val) => setSelectedMonth(val === "all" ? null : val)}
                                    >
                                        <SelectTrigger id="month">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Progressive (All Time)</SelectItem>
                                            <SelectItem value="1">January</SelectItem>
                                            <SelectItem value="2">February</SelectItem>
                                            <SelectItem value="3">March</SelectItem>
                                            <SelectItem value="4">April</SelectItem>
                                            <SelectItem value="5">May</SelectItem>
                                            <SelectItem value="6">June</SelectItem>
                                            <SelectItem value="7">July</SelectItem>
                                            <SelectItem value="8">August</SelectItem>
                                            <SelectItem value="9">September</SelectItem>
                                            <SelectItem value="10">October</SelectItem>
                                            <SelectItem value="11">November</SelectItem>
                                            <SelectItem value="12">December</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Select
                                        value={selectedYear}
                                        onValueChange={setSelectedYear}
                                    >
                                        <SelectTrigger id="year">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 5 }, (_, i) => {
                                                const year = new Date().getFullYear() - i;
                                                return (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error State */}
                    {error && (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                            <CardContent className="pt-6">
                                <p className="text-red-600">Failed to load report data. Please try again.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Supply of Fodder Seeds/Planting Materials
                            </CardTitle>
                            <CardDescription>
                                District-wise achievement breakdown for {getMonthName(reportData?.message?.month || null)} {selectedYear}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : districts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No data available for this component.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            {/* Main header row */}
                                            <TableRow>
                                                <TableHead rowSpan={2} className="text-center border-r align-middle">
                                                    Sr. No.
                                                </TableHead>
                                                <TableHead rowSpan={2} className="text-center border-r align-middle">
                                                    District
                                                </TableHead>
                                                <TableHead colSpan={2} className="text-center border-r bg-blue-50 dark:bg-blue-950/20">
                                                    Target
                                                </TableHead>
                                                <TableHead colSpan={6} className="text-center border-r bg-amber-50 dark:bg-amber-950/20">
                                                    Monthly Achievement
                                                </TableHead>
                                                <TableHead colSpan={6} className="text-center border-r bg-green-50 dark:bg-green-950/20">
                                                    Progressive (Till Date)
                                                </TableHead>
                                                <TableHead colSpan={2} className="text-center bg-red-50 dark:bg-red-950/20">
                                                    Balance
                                                </TableHead>
                                            </TableRow>
                                            {/* Second header row */}
                                            <TableRow>
                                                {/* Target */}
                                                <TableHead className="text-center text-xs bg-blue-50/50 dark:bg-blue-950/10">
                                                    Farmers
                                                </TableHead>
                                                <TableHead className="text-center text-xs border-r bg-blue-50/50 dark:bg-blue-950/10">
                                                    Financial (₹)
                                                </TableHead>
                                                
                                                {/* Monthly */}
                                                <TableHead className="text-center text-xs bg-amber-50/50 dark:bg-amber-950/10">
                                                    Farmers
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-amber-50/50 dark:bg-amber-950/10">
                                                    Quantity
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-amber-50/50 dark:bg-amber-950/10">
                                                    Land (Ha)
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-amber-50/50 dark:bg-amber-950/10">
                                                    Ben. Share (₹)
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-amber-50/50 dark:bg-amber-950/10">
                                                    Subsidy (₹)
                                                </TableHead>
                                                <TableHead className="text-center text-xs border-r bg-amber-50/50 dark:bg-amber-950/10">
                                                    Total (₹)
                                                </TableHead>
                                                
                                                {/* Progressive */}
                                                <TableHead className="text-center text-xs bg-green-50/50 dark:bg-green-950/10">
                                                    Farmers
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-green-50/50 dark:bg-green-950/10">
                                                    Quantity
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-green-50/50 dark:bg-green-950/10">
                                                    Land (Ha)
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-green-50/50 dark:bg-green-950/10">
                                                    Ben. Share (₹)
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-green-50/50 dark:bg-green-950/10">
                                                    Subsidy (₹)
                                                </TableHead>
                                                <TableHead className="text-center text-xs border-r bg-green-50/50 dark:bg-green-950/10">
                                                    Total (₹)
                                                </TableHead>
                                                
                                                {/* Balance */}
                                                <TableHead className="text-center text-xs bg-red-50/50 dark:bg-red-950/10">
                                                    Physical
                                                </TableHead>
                                                <TableHead className="text-center text-xs bg-red-50/50 dark:bg-red-950/10">
                                                    Financial (₹)
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {districts.map((item, index) => (
                                                <TableRow key={item.district_name}>
                                                    <TableCell className="text-center border-r">{index + 1}</TableCell>
                                                    <TableCell className="font-medium border-r">{item.district_name}</TableCell>
                                                    
                                                    {/* Target */}
                                                    <TableCell className="text-center bg-blue-50/30 dark:bg-blue-950/10">
                                                        {item.target_farmers}
                                                    </TableCell>
                                                    <TableCell className="text-right border-r bg-blue-50/30 dark:bg-blue-950/10">
                                                        {formatCurrency(item.target_financial)}
                                                    </TableCell>
                                                    
                                                    {/* Monthly Achievement */}
                                                    <TableCell className="text-center bg-amber-50/30 dark:bg-amber-950/10">
                                                        {item.no_of_farmers_monthly}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-amber-50/30 dark:bg-amber-950/10">
                                                        {item.achievement_total_monthly.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-amber-50/30 dark:bg-amber-950/10">
                                                        {item.land_covered_hect_monthly.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right bg-amber-50/30 dark:bg-amber-950/10">
                                                        {formatCurrency(item.beneficiary_share_monthly)}
                                                    </TableCell>
                                                    <TableCell className="text-right bg-amber-50/30 dark:bg-amber-950/10">
                                                        {formatCurrency(item.subsidy_monthly)}
                                                    </TableCell>
                                                    <TableCell className="text-right border-r bg-amber-50/30 dark:bg-amber-950/10 font-semibold">
                                                        {formatCurrency(item.total_monthly)}
                                                    </TableCell>
                                                    
                                                    {/* Progressive */}
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10">
                                                        {item.no_of_farmers_progressive}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10">
                                                        {item.achievement_total_progressive.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10">
                                                        {item.land_covered_progressive.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right bg-green-50/30 dark:bg-green-950/10">
                                                        {formatCurrency(item.beneficiary_share_progressive)}
                                                    </TableCell>
                                                    <TableCell className="text-right bg-green-50/30 dark:bg-green-950/10">
                                                        {formatCurrency(item.subsidy_progressive)}
                                                    </TableCell>
                                                    <TableCell className="text-right border-r bg-green-50/30 dark:bg-green-950/10 font-semibold">
                                                        {formatCurrency(item.total_progressive)}
                                                    </TableCell>
                                                    
                                                    {/* Balance */}
                                                    <TableCell className="text-center bg-red-50/30 dark:bg-red-950/10">
                                                        {item.balance_physical}
                                                    </TableCell>
                                                    <TableCell className="text-right bg-red-50/30 dark:bg-red-950/10">
                                                        {formatCurrency(item.balance_financial)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell className="border-r"></TableCell>
                                                <TableCell className="border-r">TOTAL</TableCell>
                                                
                                                {/* Target Totals */}
                                                <TableCell className="text-center">
                                                    {totals.target_farmers}
                                                </TableCell>
                                                <TableCell className="text-right border-r">
                                                    {formatCurrency(totals.target_financial)}
                                                </TableCell>
                                                
                                                {/* Monthly Totals */}
                                                <TableCell className="text-center">
                                                    {totals.no_of_farmers_monthly}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.achievement_total_monthly.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.land_covered_hect_monthly.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.beneficiary_share_monthly)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.subsidy_monthly)}
                                                </TableCell>
                                                <TableCell className="text-right border-r text-primary">
                                                    {formatCurrency(totals.total_monthly)}
                                                </TableCell>
                                                
                                                {/* Progressive Totals */}
                                                <TableCell className="text-center">
                                                    {totals.no_of_farmers_progressive}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.achievement_total_progressive.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.land_covered_progressive.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.beneficiary_share_progressive)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.subsidy_progressive)}
                                                </TableCell>
                                                <TableCell className="text-right border-r text-green-600 dark:text-green-400">
                                                    {formatCurrency(totals.total_progressive)}
                                                </TableCell>
                                                
                                                {/* Balance Totals */}
                                                <TableCell className="text-center">
                                                    {totals.balance_physical}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 dark:text-red-400">
                                                    {formatCurrency(totals.balance_financial)}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
