"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, IndianRupee, BarChart3, RefreshCw, Download } from "lucide-react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Types
interface DistrictData {
    physical_target: number;
    financial_target: number;
    physical_achievement: number;
    beneficiary_share: number;
    subsidy: number;
    financial_achievement: number;
}

interface Totals {
    total_physical_target: number;
    total_financial_target: number;
    total_physical_achievement: number;
    total_beneficiary_share: number;
    total_subsidy: number;
    total_financial_achievement: number;
}

interface TargetAchievementResponse {
    message: {
        component: string;
        is_hgm: number;
        districts: {
            [districtName: string]: DistrictData;
        };
        totals: Totals;
    };
}

interface Component {
    name: string;
}

export default function TargetAchievement() {
    const { toast } = useToast();
    const [selectedComponent, setSelectedComponent] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);

    // Fetch components list
    const { data: componentsData } = useFrappeGetDocList<Component>("Component", {
        fields: ["name"],
        orderBy: { field: "name", order: "asc" },
    });

    const components = componentsData || [];

    // Fetch target and achievement data
    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<TargetAchievementResponse>(
        'vmddp_app.api.v1.accountant.target_and_achievement',
        selectedComponent !== "all" ? { component: selectedComponent } : {},
        undefined,
        { revalidateOnFocus: false }
    );

    const reportData = apiResponse?.message || {
        component: "",
        is_hgm: 0,
        districts: {},
        totals: {
            total_physical_target: 0,
            total_financial_target: 0,
            total_physical_achievement: 0,
            total_beneficiary_share: 0,
            total_subsidy: 0,
            total_financial_achievement: 0,
        }
    };

    // Extract district data
    const districtData = useMemo(() => {
        const districts: { name: string; data: DistrictData }[] = [];
        if (reportData.districts) {
            Object.entries(reportData.districts).forEach(([key, value]) => {
                districts.push({ name: key, data: value });
            });
        }
        return districts.sort((a, b) => a.name.localeCompare(b.name));
    }, [reportData]);

    const totals = reportData.totals;

    const formatCurrency = (amount: number) => {
        if (amount === 0) return "₹0";
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
    };

    const getPercentage = (achieved: number, target: number) => {
        if (target === 0) return achieved > 0 ? 100 : 0;
        return Math.min(Math.round((achieved / target) * 100), 100);
    };

    const handleRefresh = () => {
        mutate();
        toast({
            title: "Refreshing",
            description: "Fetching latest data...",
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: "Generating report...",
        });

        try {
            const headers = [
                "Sr. No.",
                "District",
                "Physical Target",
                "Physical Achievement",
                "Financial Target (Rs.)",
                "Beneficiary Share (Rs.)",
                "Subsidy (Rs.)",
                "Financial Achievement (Rs.)",
            ];

            const rows: (string | number)[][] = [];

            districtData.forEach(({ name, data }, index) => {
                rows.push([
                    index + 1,
                    name,
                    data.physical_target,
                    data.physical_achievement,
                    data.financial_target,
                    data.beneficiary_share,
                    data.subsidy,
                    data.financial_achievement,
                ]);
            });

            // Total row
            rows.push([
                "",
                "TOTAL",
                totals.total_physical_target,
                totals.total_physical_achievement,
                totals.total_financial_target,
                totals.total_beneficiary_share,
                totals.total_subsidy,
                totals.total_financial_achievement,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Target & Achievement");

            const componentName = selectedComponent === "all" ? "All_Components" : selectedComponent.replace(/\s+/g, '_');
            XLSX.writeFile(wb, `Target_Achievement_${componentName}.xlsx`);

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

    return (
        <div className="min-h-screen bg-background overflow-y-scroll">
            <main className="overflow-auto min-h-screen">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="heading-target-achievement">
                                Target & Achievement
                            </h1>
                            <p className="text-muted-foreground">
                                Track physical and financial targets across all components
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                                <SelectTrigger className="w-[200px]" data-testid="select-component-filter">
                                    <SelectValue placeholder="Select Component" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Components</SelectItem>
                                    {components.map((c) => (
                                        <SelectItem key={c.name} value={c.name}>
                                            {c.name}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card data-testid="card-physical-target">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Physical Target</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{totals.total_physical_target.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">Total target</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-physical-achievement-summary">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Physical Achievement</CardTitle>
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-primary">
                                            {totals.total_physical_achievement.toLocaleString()}
                                        </div>
                                        <Progress
                                            value={getPercentage(totals.total_physical_achievement, totals.total_physical_target)}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {getPercentage(totals.total_physical_achievement, totals.total_physical_target)}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-target">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Financial Target</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{formatCurrency(totals.total_financial_target)}</div>
                                        <p className="text-xs text-muted-foreground">Total budget allocation</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-achievement-summary">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                                <BarChart3 className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-primary">
                                            {formatCurrency(totals.total_financial_achievement)}
                                        </div>
                                        <Progress
                                            value={getPercentage(totals.total_financial_achievement, totals.total_financial_target)}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {getPercentage(totals.total_financial_achievement, totals.total_financial_target)}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {selectedComponent === "all" ? "All Components" : reportData.component} - Target & Achievement
                            </CardTitle>
                            <CardDescription>
                                District-wise physical and financial targets and achievements
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : districtData.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    No data available for the selected component.
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center w-[60px]">Sr. No.</TableHead>
                                                <TableHead className="min-w-[150px]">District</TableHead>
                                                <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Physical Target</TableHead>
                                                <TableHead className="text-center bg-green-50 dark:bg-green-950/30">Physical Achievement</TableHead>
                                                <TableHead className="text-right bg-orange-50 dark:bg-orange-950/30">Financial Target</TableHead>
                                                <TableHead className="text-right bg-purple-50 dark:bg-purple-950/30">Beneficiary Share</TableHead>
                                                <TableHead className="text-right bg-purple-50 dark:bg-purple-950/30">Subsidy</TableHead>
                                                <TableHead className="text-right bg-purple-50 dark:bg-purple-950/30">Financial Achievement</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {districtData.map(({ name, data }, index) => {
                                                return (
                                                    <TableRow key={name}>
                                                        <TableCell className="text-center">{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{name}</TableCell>
                                                        <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/20">
                                                            {data.physical_target.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold">
                                                            {data.physical_achievement.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right bg-orange-50/50 dark:bg-orange-950/20">
                                                            {formatCurrency(data.financial_target)}
                                                        </TableCell>
                                                        <TableCell className="text-right bg-purple-50/50 dark:bg-purple-950/20">
                                                            {formatCurrency(data.beneficiary_share)}
                                                        </TableCell>
                                                        <TableCell className="text-right bg-purple-50/50 dark:bg-purple-950/20">
                                                            {formatCurrency(data.subsidy)}
                                                        </TableCell>
                                                        <TableCell className="text-right bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 font-semibold">
                                                            {formatCurrency(data.financial_achievement)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell></TableCell>
                                                <TableCell>TOTAL</TableCell>
                                                <TableCell className="text-center">
                                                    {totals.total_physical_target.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">
                                                    {totals.total_physical_achievement.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.total_financial_target)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.total_beneficiary_share)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(totals.total_subsidy)}
                                                </TableCell>
                                                <TableCell className="text-right text-purple-600">
                                                    {formatCurrency(totals.total_financial_achievement)}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Note */}
                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100">
                                        Auto-updating Values
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Achievement values are automatically updated when DD Collection, Component
                                        Allocation, Payments & DBT, or Refunds are processed. Admin can edit
                                        district-wise targets from the Admin Dashboard.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
