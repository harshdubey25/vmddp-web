"use client";

import { useMemo, useState } from "react";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/use-export";
import { ExportFormat } from "@/lib/export-report";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, RefreshCw, Target, TrendingUp, IndianRupee, BarChart3 } from "lucide-react";


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
}

interface ApiResponse {
    message: {
        districts: DistrictData[];
        totals: Totals;
    };
}

interface District {
    name: string;
}


const EMPTY_TOTALS: Totals = {
    physical_target: 0,
    financial_target: 0,
    physical_achievement: 0,
    financial_achievement: 0,
    beneficiary_share: 0,
    subsidy_share: 0,
    admin_expense: 0,
    physical_balance: 0,
    financial_balance: 0,
};


export default function AllTargetAchievementReport() {
    const { toast } = useToast();

    const [selectedDistrict, setSelectedDistrict] = useState("all");

    const { isExporting, handleExport: exportData } = useExport({
        method: "vmddp_app.api.v1.accountant.export_all_components_target_and_achievement",
        filename: "Target_Achievement_All_Components",
    });

    const { data: districtsData } = useFrappeGetDocList<District>("District Master", {
        fields: ["name"],
        orderBy: { field: "name", order: "asc" },
    });

    const districts = districtsData || [];

    const apiParams = useMemo(() => {
        const p: Record<string, string | number> = {};
        if (selectedDistrict !== "all") p.district = selectedDistrict;
        return p;
    }, [selectedDistrict]);

    const swrKey = `all_target_achievement_${selectedDistrict}`;

    const { data: apiResponse, isLoading, mutate } = useFrappeGetCall<ApiResponse>(
        "vmddp_app.api.v1.accountant.all_components_target_and_achievement",
        apiParams,
        swrKey,
        { revalidateOnFocus: false }
    );

    const districtData = useMemo(() => apiResponse?.message?.districts || [], [apiResponse]);
    const totals = apiResponse?.message?.totals || EMPTY_TOTALS;


    const formatCurrency = (amount: number) => {
        if (amount === 0) return "₹0";
        if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
        if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
        return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
    };

    const getPct = (achieved: number, target: number) => {
        if (target === 0) return achieved > 0 ? 100 : 0;
        return Math.min(Math.round((achieved / target) * 100), 100);
    };

    const handleRefresh = () => {
        mutate();
        toast({ title: "Refreshing", description: "Fetching latest data..." });
    };

    const handleExport = (format: ExportFormat) => {
        const params: Record<string, string> = {};
        if (selectedDistrict !== "all") params.district = selectedDistrict;
        exportData({
            params,
            format,
            filename: "Target_Achievement_All_Components",
        });
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto">
                <div className="p-4 space-y-4">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                        <div>
                            <h1 className="text-xl font-bold">All Components — Target & Achievement</h1>
                            <p className="text-sm text-muted-foreground">
                                District-wise targets and achievements across all components
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* District filter */}
                            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Districts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Districts</SelectItem>
                                    {districts.map((d) => (
                                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button variant="outline" size="icon" onClick={handleRefresh}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="default" disabled={isExporting || isLoading}>
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExporting ? "Exporting..." : "Export"}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Physical Target</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <Target className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                                    <>
                                        <div className="text-2xl font-bold text-blue-600">{totals.physical_target.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground font-medium">Total target</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-green-500/20 blur-2xl" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Physical Achievement</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                                    <>
                                        <div className="text-2xl font-bold text-green-600">{totals.physical_achievement.toLocaleString()}</div>
                                        <Progress value={getPct(totals.physical_achievement, totals.physical_target)} className="mt-2" />
                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                            {getPct(totals.physical_achievement, totals.physical_target)}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Financial Target</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <IndianRupee className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                                    <>
                                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.financial_target)}</div>
                                        <p className="text-xs text-muted-foreground font-medium">Total budget allocation</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/20 blur-2xl" />
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
                                <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative">
                                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                                    <>
                                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(totals.financial_achievement)}</div>
                                        <Progress value={getPct(totals.financial_achievement, totals.financial_target)} className="mt-2" />
                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                            {getPct(totals.financial_achievement, totals.financial_target)}% achieved
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>District-wise Report — All Components</CardTitle>
                            <CardDescription>
                                Physical and financial targets and achievements aggregated across every component
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
                                    No data available for the selected filters.
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden flex flex-col">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-muted sticky top-0 z-30 border-b">
                                                <tr>
                                                    <th rowSpan={2} className="w-[50px] border-r align-middle px-2 py-1.5 text-xs sm:text-sm font-medium text-center">
                                                        #
                                                    </th>
                                                    <th rowSpan={2} className="w-[130px] border-r align-middle px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        District
                                                    </th>
                                                    <th colSpan={2} className="text-center bg-blue-50 dark:bg-blue-950/30 border-r border-b px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Target
                                                    </th>
                                                    <th colSpan={4} className="text-center bg-green-50 dark:bg-green-950/30 border-r border-b px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Achievement
                                                    </th>
                                                    <th colSpan={2} className="text-center bg-orange-50 dark:bg-orange-950/30 border-b px-2 py-1.5 text-xs sm:text-sm font-medium">
                                                        Balance
                                                    </th>
                                                </tr>
                                                <tr className="bg-muted border-b">
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 text-xs font-medium">Physical</th>
                                                    <th className="text-center bg-blue-50 dark:bg-blue-950/30 border-r px-2 py-1.5 text-xs font-medium">Financial</th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs font-medium">Physical</th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs font-medium">Beneficiary Share</th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs font-medium">Subsidy Share</th>
                                                    <th className="text-center bg-green-50 dark:bg-green-950/30 border-r px-2 py-1.5 text-xs font-medium">Admin Expense</th>
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-xs font-medium">Physical</th>
                                                    <th className="text-center bg-orange-50 dark:bg-orange-950/30 px-2 py-1.5 text-xs font-medium">Financial</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {districtData.map((item, index) => (
                                                    <tr key={item.district} className="hover:bg-muted/30 transition-colors border-b">
                                                        <td className="text-center text-muted-foreground border-r px-2 py-1.5 text-xs sm:text-sm">{index + 1}</td>
                                                        <td className="font-medium border-r px-2 py-1.5 text-xs sm:text-sm">{item.district}</td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 px-2 py-1.5 text-xs sm:text-sm">{item.physical_target.toLocaleString()}</td>
                                                        <td className="text-center bg-blue-50/50 dark:bg-blue-950/20 border-r px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(item.financial_target)}</td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">{item.physical_achievement.toLocaleString()}</td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(item.beneficiary_share)}</td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(item.subsidy_share)}</td>
                                                        <td className="text-center bg-green-50/50 dark:bg-green-950/20 text-green-600 font-semibold border-r px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(item.admin_expense)}</td>
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold px-2 py-1.5 text-xs sm:text-sm">{item.physical_balance.toLocaleString()}</td>
                                                        <td className="text-center bg-orange-50/50 dark:bg-orange-950/20 font-semibold px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(item.financial_balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-muted font-bold border-t">
                                                    <td className="border-r px-2 py-1.5 text-xs sm:text-sm"></td>
                                                    <td className="border-r px-2 py-1.5 text-xs sm:text-sm">TOTAL</td>
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">{totals.physical_target.toLocaleString()}</td>
                                                    <td className="text-center border-r px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(totals.financial_target)}</td>
                                                    <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">{totals.physical_achievement.toLocaleString()}</td>
                                                    <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(totals.beneficiary_share)}</td>
                                                    <td className="text-center text-green-600 px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(totals.subsidy_share)}</td>
                                                    <td className="text-center text-green-600 border-r px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(totals.admin_expense)}</td>
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">{totals.physical_balance.toLocaleString()}</td>
                                                    <td className="text-center px-2 py-1.5 text-xs sm:text-sm">{formatCurrency(totals.financial_balance)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}
