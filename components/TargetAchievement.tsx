"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, TrendingUp, IndianRupee, BarChart3, RefreshCw, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";

import { ExportFormat } from "@/lib/export-report";
import { useExport } from "@/hooks/use-export";

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Components } from "@/constants";

interface DistrictData {
    district: string;
    physical_target: number;
    financial_target: number;
    physical_achievement: number;
    financial_achievement: number;
    beneficiary_share: number;
    subsidy_share: number;
    admin_expense: number;
    physical_balance: number;
    financial_balance: number;
    number_of_applications: number;
}

interface Totals {
    physical_target: number;
    financial_target: number;
    physical_achievement: number;
    financial_achievement: number;
    beneficiary_share: number;
    subsidy_share: number;
    admin_expense: number;
    physical_balance: number;
    financial_balance: number;
    number_of_applications: number;
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

    const { isExporting, handleExport: exportData } = useExport({
        method: "vmddp_app.api.v1.accountant.export_target_and_achievement",
    });

    const { isExporting: isExportingFarmerTraining, handleExport: exportFarmerTrainingData } = useExport({
        method: "vmddp_app.api.v1.accountant.export_farmer_training_target_and_achievement",
    });

    const { data: componentsData } = useFrappeGetDocList<Component>("Component", {
        fields: ["name"],
        orderBy: { field: "name", order: "asc" },
    });

    const { data: districtsData } = useFrappeGetDocList<District>("District Master", {
        fields: ["name"],
        orderBy: { field: "name", order: "asc" },
    });

    const components = componentsData || [];
    const districts = districtsData || [];
    const isFarmerTraining = selectedComponent === Components.FARMER_TRAINING;

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
        return [...data]
    }, [apiResponse]);

    const totals = apiResponse?.message?.totals || {
        physical_target: 0,
        financial_target: 0,
        physical_achievement: 0,
        financial_achievement: 0,
        beneficiary_share: 0,
        subsidy_share: 0,
        admin_expense: 0,
        physical_balance: 0,
        financial_balance: 0,
        number_of_applications: 0,
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

    const handleExport = (format: ExportFormat, allComponents = false) => {
        if (isFarmerTraining && !allComponents) {
            const params: Record<string, string> = {};
            if (selectedDistrict !== "all") {
                params.district = selectedDistrict;
            }
            exportFarmerTrainingData({
                params,
                format,
                filename: "Target_Achievement_Farmer_Training",
            });
            return;
        }
        const params: Record<string, string> = {};
        if (!allComponents && selectedComponent) {
            params.component = selectedComponent;
        }
        if (selectedDistrict !== "all") {
            params.district = selectedDistrict;
        }
        exportData({
            params,
            format,
            filename: allComponents
                ? "Target_Achievement_All_Components"
                : `Target_Achievement_${selectedComponent.replace(/\s+/g, "_")}`,
        });
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="default"
                                        disabled={isExporting || isExportingFarmerTraining || isLoading}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExporting || isExportingFarmerTraining ? "Exporting..." : "Export"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => handleExport("excel")}
                                        disabled={!selectedComponent}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleExport("pdf")}
                                        disabled={!selectedComponent}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleExport("excel", true)}>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        All Components (Excel)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("pdf", true)}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        All Components (PDF)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card data-testid="card-physical-target" className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Physical Target</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <Target className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-blue-600 drop-shadow-sm">
                                            {totals.physical_target.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">Total target</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-physical-achievement-summary" className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Physical Achievement</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-green-600 drop-shadow-sm">
                                            {totals.physical_achievement.toLocaleString()}
                                        </div>
                                        <Progress
                                            value={getPercentage(
                                                totals.physical_achievement,
                                                totals.physical_target
                                            )}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                            {getPercentage(
                                                totals.physical_achievement,
                                                totals.physical_target
                                            )}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-target" className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Financial Target</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <IndianRupee className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-purple-600 drop-shadow-sm">
                                            {formatCurrency(totals.financial_target)}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">Total budget allocation</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-achievement-summary" className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-orange-600 drop-shadow-sm">
                                            {formatCurrency(totals.financial_achievement)}
                                        </div>
                                        <Progress
                                            value={getPercentage(
                                                totals.financial_achievement,
                                                totals.financial_target
                                            )}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground font-medium mt-1">
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
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-muted sticky top-0 z-30 border-b">
                                                <tr>
                                                    <th
                                                        rowSpan={2}
                                                        className="w-[120px] border-r align-middle px-2 py-1.5 text-xs sm:text-sm font-medium"
                                                    >
                                                        District
                                                    </th>
                                                    <th
                                                        colSpan={2}
                                                        className="text-center bg-blue-50 dark:bg-blue-950/30 border-r border-b px-2 py-1.5 text-xs sm:text-sm font-medium"
                                                    >
                                                        Target
                                                    </th>
                                                    <th
                                                        colSpan={isFarmerTraining ? 3 : 4}
                                                        className="text-center bg-green-50 dark:bg-green-950/30 border-r border-b px-2 py-1.5 text-xs sm:text-sm font-medium"
                                                    >
                                                        Achievement
                                                    </th>
                                                    <th
                                                        colSpan={2}
                                                        className="text-center bg-orange-50 dark:bg-orange-950/30 border-b px-2 py-1.5 text-xs sm:text-sm font-medium"
                                                    >
                                                        Balance
                                                    </th>
                                                </tr>
                                                <tr className="bg-muted sticky top-[40px] z-30 border-b">
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Physical
                                                    </th>
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 border-r px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Financial
                                                    </th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Physical
                                                    </th>
                                                    {isFarmerTraining ? (
                                                        <>
                                                            <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                                Financial
                                                            </th>
                                                            <th className="text-center bg-green-50 dark:bg-green-950/30 border-r px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                                No. of Trainings
                                                            </th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                                Beneficiary Share
                                                            </th>
                                                            <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                                Subsidy Share
                                                            </th>
                                                            <th className="text-center bg-green-50 dark:bg-green-950/30 border-r px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                                Admin Expense
                                                            </th>
                                                        </>
                                                    )}
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Physical
                                                    </th>
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Financial
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {districtData.map((item, index) => (
                                                    <tr key={item.district} className="hover:bg-muted/30 transition-colors border-b">
                                                        <td className="font-medium border-r px-2 py-1.5 text-xs sm:text-sm">
                                                            {item.district}
                                                        </td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 px-2 py-1.5 text-xs sm:text-sm">
                                                            {item.physical_target.toLocaleString()}
                                                        </td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 border-r px-2 py-1.5 text-xs sm:text-sm">
                                                            {formatCurrency(item.financial_target)}
                                                        </td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                            {item.physical_achievement.toLocaleString()}
                                                        </td>
                                                        {isFarmerTraining ? (
                                                            <>
                                                                <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                                    {formatCurrency(item.financial_achievement)}
                                                                </td>
                                                                <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold border-r px-2 py-1.5 text-xs sm:text-sm">
                                                                    {item.number_of_applications?.toLocaleString() ?? 0}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                                    {formatCurrency(item.beneficiary_share)}
                                                                </td>
                                                                <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                                    {formatCurrency(item.subsidy_share)}
                                                                </td>
                                                                <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold border-r px-2 py-1.5 text-xs sm:text-sm">
                                                                    {formatCurrency(item.admin_expense)}
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                            {item.physical_balance.toLocaleString()}
                                                        </td>
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold px-2 py-1.5 text-xs sm:text-sm">
                                                            {formatCurrency(item.financial_balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-muted font-bold border-t">
                                                    <td className="border-r px-2 py-1.5 text-xs sm:text-sm">TOTAL</td>
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">
                                                        {totals.physical_target.toLocaleString()}
                                                    </td>
                                                    <td className="text-center border-r px-2 py-1.5 text-xs sm:text-sm">
                                                        {formatCurrency(totals.financial_target)}
                                                    </td>
                                                    <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">
                                                        {totals.physical_achievement.toLocaleString()}
                                                    </td>
                                                    {isFarmerTraining ? (
                                                        <>
                                                            <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">
                                                                {formatCurrency(totals.financial_achievement)}
                                                            </td>
                                                            <td className="text-center text-green-600 border-r px-2 py-1.5 text-xs sm:text-sm">
                                                                {totals.number_of_applications?.toLocaleString() ?? 0}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">
                                                                {formatCurrency(totals.beneficiary_share)}
                                                            </td>
                                                            <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">
                                                                {formatCurrency(totals.subsidy_share)}
                                                            </td>
                                                            <td className="text-center text-green-600 border-r px-2 py-1.5 text-xs sm:text-sm">
                                                                {formatCurrency(totals.admin_expense)}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">
                                                        {totals.physical_balance.toLocaleString()}
                                                    </td>
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">
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
