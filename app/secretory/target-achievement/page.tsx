"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, TrendingUp, IndianRupee, BarChart3, RefreshCw, Download } from "lucide-react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import * as XLSX from "xlsx";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DistrictData {
    district: string;
    physical_target: number;
    financial_target: number;
    physical_achievement: number;
    financial_achievement: number;
    beneficiary_share: number;
    subsidy_share: number;
    physical_balance: number;
    financial_balance: number;
}

interface Totals {
    physical_target: number;
    financial_target: number;
    physical_achievement: number;
    financial_achievement: number;
    beneficiary_share: number;
    subsidy_share: number;
    physical_balance: number;
    financial_balance: number;
}

interface TargetAchievementResponse {
    message: {
        districts: DistrictData[];
        totals: Totals;
    };
}

interface Component {
    name: string;
}

interface District {
    name: string;
}

export default function TargetAchievement() {
    const { toast } = useToast();
    const [selectedComponent, setSelectedComponent] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [isExporting, setIsExporting] = useState(false);

    const { data: componentsData } = useFrappeGetDocList<Component>("Component", {
        fields: ["name"],
        filters: [["subadmin_component", "=", 0]],
        orderBy: { field: "name", order: "asc" },
    });

    const { data: districtsData } = useFrappeGetDocList<District>("District Master", {
        fields: ["name"],
        orderBy: { field: "name", order: "asc" },
    });

    const components = componentsData || [];
    const districts = districtsData || [];

    useEffect(() => {
        if (components.length > 0 && !selectedComponent) {
            setSelectedComponent(components[0].name);
        }
    }, [components, selectedComponent]);

    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<TargetAchievementResponse>(
        "vmddp_app.api.v1.accountant.target_and_achievement",
        selectedComponent
            ? {
                component: selectedComponent,
                ...(selectedDistrict !== "all" && { district: selectedDistrict }),
            }
            : undefined,
        undefined,
        { revalidateOnFocus: false }
    );

    const districtData = useMemo(() => {
        const data = apiResponse?.message?.districts || [];
        return [...data].sort((a, b) => a.district.localeCompare(b.district));
    }, [apiResponse]);

    const totals = apiResponse?.message?.totals || {
        physical_target: 0,
        financial_target: 0,
        physical_achievement: 0,
        financial_achievement: 0,
        beneficiary_share: 0,
        subsidy_share: 0,
        physical_balance: 0,
        financial_balance: 0,
    };

    const formatCurrency = (amount: number) => {
        if (amount === 0) return "₹0";
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
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
                "Financial Target (Rs.)",
                "Physical Achievement",
                "Beneficiary Share (Rs.)",
                "Subsidy Share (Rs.)",
                "Physical Balance",
                "Financial Balance",
            ];

            const rows: (string | number)[][] = [];

            districtData.forEach((item, index) => {
                rows.push([
                    index + 1,
                    item.district,
                    item.physical_target,
                    item.financial_target,
                    item.physical_achievement,
                    item.beneficiary_share,
                    item.subsidy_share,
                    item.physical_balance,
                    item.financial_balance,
                ]);
            });

            rows.push([
                "",
                "TOTAL",
                totals.physical_target,
                totals.financial_target,
                totals.physical_achievement,
                totals.beneficiary_share,
                totals.subsidy_share,
                totals.physical_balance,
                totals.financial_balance,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Target & Achievement");

            const componentName = selectedComponent ? selectedComponent.replace(/\s+/g, "_") : "Component";
            XLSX.writeFile(wb, `Target_Achievement_${componentName}.xlsx`);

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
                                    {components.map((c) => (
                                        <SelectItem key={c.name} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                <SelectTrigger className="w-[180px]" data-testid="select-district-filter">
                                    <SelectValue placeholder="Select District" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Districts</SelectItem>
                                    {districts.map((d) => (
                                        <SelectItem key={d.name} value={d.name}>
                                            {d.name}
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
                                        <div className="text-2xl font-bold">
                                            {totals.physical_target.toLocaleString()}
                                        </div>
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
                                            {totals.physical_achievement.toLocaleString()}
                                        </div>
                                        <Progress
                                            value={getPercentage(
                                                totals.physical_achievement,
                                                totals.physical_target
                                            )}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {getPercentage(
                                                totals.physical_achievement,
                                                totals.physical_target
                                            )}% achieved
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
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(totals.financial_target)}
                                        </div>
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
                                            {formatCurrency(totals.financial_achievement)}
                                        </div>
                                        <Progress
                                            value={getPercentage(
                                                totals.financial_achievement,
                                                totals.financial_target
                                            )}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {getPercentage(
                                                totals.financial_achievement,
                                                totals.financial_target
                                            )}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {selectedComponent || "Select Component"} - Target & Achievement
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
                                <div className="border rounded-lg overflow-hidden flex flex-col">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                        <table className="w-full min-w-[1200px]">
                                            <thead className="bg-muted sticky top-0 z-30 border-b">
                                                <tr>
                                                    <th
                                                        rowSpan={2}
                                                        className="text-center w-[60px] border-r align-middle p-3 text-xs sm:text-sm font-medium"
                                                    >
                                                        Sr. No.
                                                    </th>
                                                    <th
                                                        rowSpan={2}
                                                        className="min-w-[150px] border-r align-middle p-3 text-xs sm:text-sm font-medium"
                                                    >
                                                        District
                                                    </th>
                                                    <th
                                                        colSpan={2}
                                                        className="text-center bg-blue-50 dark:bg-blue-950/30 border-r border-b p-3 text-xs sm:text-sm font-medium"
                                                    >
                                                        Target
                                                    </th>
                                                    <th
                                                        colSpan={3}
                                                        className="text-center bg-green-50 dark:bg-green-950/30 border-r border-b p-3 text-xs sm:text-sm font-medium"
                                                    >
                                                        Achievement
                                                    </th>
                                                    <th
                                                        colSpan={2}
                                                        className="text-center bg-orange-50 dark:bg-orange-950/30 border-b p-3 text-xs sm:text-sm font-medium"
                                                    >
                                                        Balance
                                                    </th>
                                                </tr>
                                                <tr className="bg-muted sticky top-[48px] z-30 border-t-2 border-b">
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 p-3 text-xs sm:text-sm font-medium border-r">
                                                        Physical
                                                    </th>
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 border-r p-3 text-xs sm:text-sm font-medium">
                                                        Financial
                                                    </th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 p-3 text-xs sm:text-sm font-medium border-r">
                                                        Physical
                                                    </th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 p-3 text-xs sm:text-sm font-medium">
                                                        Beneficiary Share
                                                    </th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 border-r p-3 text-xs sm:text-sm font-medium">
                                                        Subsidy Share
                                                    </th>
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 p-3 text-xs sm:text-sm font-medium border-r">
                                                        Physical
                                                    </th>
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 p-3 text-xs sm:text-sm font-medium">
                                                        Financial
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {districtData.map((item, index) => (
                                                    <tr key={item.district} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                        <td className="text-center border-r p-3 text-xs sm:text-sm">
                                                            {index + 1}
                                                        </td>
                                                        <td className="font-medium border-r p-3 text-xs sm:text-sm">
                                                            {item.district}
                                                        </td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs sm:text-sm">
                                                            {item.physical_target.toLocaleString()}
                                                        </td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 border-r p-3 text-xs sm:text-sm">
                                                            {formatCurrency(item.financial_target)}
                                                        </td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold p-3 text-xs sm:text-sm">
                                                            {item.physical_achievement.toLocaleString()}
                                                        </td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold p-3 text-xs sm:text-sm">
                                                            {formatCurrency(item.beneficiary_share)}
                                                        </td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold border-r p-3 text-xs sm:text-sm">
                                                            {formatCurrency(item.subsidy_share)}
                                                        </td>
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold p-3 text-xs sm:text-sm">
                                                            {item.physical_balance.toLocaleString()}
                                                        </td>
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold p-3 text-xs sm:text-sm">
                                                            {formatCurrency(item.financial_balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-muted font-bold border-t">
                                                    <td className="border-r p-3 text-xs sm:text-sm"></td>
                                                    <td className="border-r p-3 text-xs sm:text-sm">TOTAL</td>
                                                    <td className="text-center p-3 text-xs sm:text-sm">
                                                        {totals.physical_target.toLocaleString()}
                                                    </td>
                                                    <td className="text-center border-r p-3 text-xs sm:text-sm">
                                                        {formatCurrency(totals.financial_target)}
                                                    </td>
                                                    <td className="text-center text-green-600 p-3 text-xs sm:text-sm">
                                                        {totals.physical_achievement.toLocaleString()}
                                                    </td>
                                                    <td className="text-center text-green-600 p-3 text-xs sm:text-sm">
                                                        {formatCurrency(totals.beneficiary_share)}
                                                    </td>
                                                    <td className="text-center text-green-600 border-r p-3 text-xs sm:text-sm">
                                                        {formatCurrency(totals.subsidy_share)}
                                                    </td>
                                                    <td className="text-center p-3 text-xs sm:text-sm">
                                                        {totals.physical_balance.toLocaleString()}
                                                    </td>
                                                    <td className="text-center p-3 text-xs sm:text-sm">
                                                        {formatCurrency(totals.financial_balance)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
