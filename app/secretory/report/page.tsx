"use client";

import { useState } from "react";
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
import { FileText, RefreshCw, Download } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface DistrictData {
    district: string;
    target_farmers: number;
    no_of_farmers: number;
    achievement_thombe: number;
    achievement_seeds: number;
    achievement_total: number;
    land_covered: number;
    beneficiary_share: number;
    subsidy: number;
    total_amount: number;
}

interface ReportResponse {
    message: {
        districts: DistrictData[];
        totals: {
            target_farmers: number;
            no_of_farmers: number;
            achievement_thombe: number;
            achievement_seeds: number;
            achievement_total: number;
            land_covered: number;
            beneficiary_share: number;
            subsidy: number;
            total_amount: number;
        };
    };
}

export default function SecretaryReport() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const {
        data: reportData,
        isLoading,
        error,
        mutate: refetch,
    } = useFrappeGetCall<ReportResponse>(
        "vmddp_app.api.v1.secretory.get_fodder_seeds_report",
        undefined,
        undefined,
        {
            revalidateOnFocus: false,
        }
    );

    const districts = reportData?.message?.districts || [];
    const totals = reportData?.message?.totals || {
        target_farmers: 0,
        no_of_farmers: 0,
        achievement_thombe: 0,
        achievement_seeds: 0,
        achievement_total: 0,
        land_covered: 0,
        beneficiary_share: 0,
        subsidy: 0,
        total_amount: 0,
    };

    const formatCurrency = (value: number) => {
        return `₹${value.toLocaleString("en-IN")}`;
    };

    const handleRefresh = () => {
        refetch();
        toast({
            title: "Data refreshed",
            description: "Report data has been updated.",
        });
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const headers = [
                "Sr. No.",
                "District",
                "Target (Farmers)",
                "No. of Farmers",
                "Achievement (Thombe)",
                "Achievement (Seeds)",
                "Achievement (Total)",
                "Land Covered (Hect.)",
                "Beneficiary Share (Rs.)",
                "Subsidy (Rs.)",
                "Total (Rs.)",
            ];

            const rows = districts.map((item, index) => [
                index + 1,
                item.district,
                item.target_farmers,
                item.no_of_farmers,
                item.achievement_thombe,
                item.achievement_seeds,
                item.achievement_total,
                item.land_covered,
                item.beneficiary_share,
                item.subsidy,
                item.total_amount,
            ]);

            rows.push([
                "",
                "TOTAL",
                totals.target_farmers,
                totals.no_of_farmers,
                totals.achievement_thombe,
                totals.achievement_seeds,
                totals.achievement_total,
                totals.land_covered,
                totals.beneficiary_share,
                totals.subsidy,
                totals.total_amount,
            ]);

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Fodder Seeds Report");

            XLSX.writeFile(wb, `Fodder_Seeds_Report_${new Date().toLocaleDateString("en-IN")}.xlsx`);

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
                            <CardDescription>District-wise achievement breakdown</CardDescription>
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
                                                <TableHead rowSpan={2} className="text-center border-r align-middle bg-blue-50 dark:bg-blue-950/20">
                                                    Target<br />(No. of Farmers)
                                                </TableHead>
                                                <TableHead colSpan={5} className="text-center border-r bg-yellow-50 dark:bg-yellow-950/20">
                                                    Physical
                                                </TableHead>
                                                <TableHead colSpan={3} className="text-center bg-green-50 dark:bg-green-950/20">
                                                    Financial Achievement
                                                </TableHead>
                                            </TableRow>
                                            {/* Second header row */}
                                            <TableRow>
                                                <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    No. of Farmers
                                                </TableHead>
                                                <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    Achievement<br />(Thombe)
                                                </TableHead>
                                                <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    Achievement<br />(Seeds)
                                                </TableHead>
                                                <TableHead className="text-center bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    Achievement<br />(total)
                                                </TableHead>
                                                <TableHead className="text-center border-r bg-yellow-50/50 dark:bg-yellow-950/10">
                                                    Land Covered<br />(Hect.)
                                                </TableHead>
                                                <TableHead className="text-center bg-green-50/50 dark:bg-green-950/10">
                                                    Beneficiary Share<br />(Rs.)
                                                </TableHead>
                                                <TableHead className="text-center bg-green-50/50 dark:bg-green-950/10">
                                                    Subsidy<br />(Rs.)
                                                </TableHead>
                                                <TableHead className="text-center bg-green-50/50 dark:bg-green-950/10">
                                                    Total<br />(Rs.)
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {districts.map((item, index) => (
                                                <TableRow key={item.district}>
                                                    <TableCell className="text-center border-r">{index + 1}</TableCell>
                                                    <TableCell className="font-medium border-r">{item.district}</TableCell>
                                                    <TableCell className="text-center border-r bg-blue-50/30 dark:bg-blue-950/10">
                                                        {item.target_farmers}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-yellow-50/30 dark:bg-yellow-950/10">
                                                        {item.no_of_farmers}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-yellow-50/30 dark:bg-yellow-950/10">
                                                        {item.achievement_thombe}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-yellow-50/30 dark:bg-yellow-950/10">
                                                        {item.achievement_seeds}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-yellow-50/30 dark:bg-yellow-950/10 font-semibold">
                                                        {item.achievement_total}
                                                    </TableCell>
                                                    <TableCell className="text-center border-r bg-yellow-50/30 dark:bg-yellow-950/10">
                                                        {item.land_covered.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10">
                                                        {formatCurrency(item.beneficiary_share)}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10">
                                                        {formatCurrency(item.subsidy)}
                                                    </TableCell>
                                                    <TableCell className="text-center bg-green-50/30 dark:bg-green-950/10 font-semibold">
                                                        {formatCurrency(item.total_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell className="border-r"></TableCell>
                                                <TableCell className="border-r">TOTAL</TableCell>
                                                <TableCell className="text-center border-r">
                                                    {totals.target_farmers}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.no_of_farmers}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.achievement_thombe}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {totals.achievement_seeds}
                                                </TableCell>
                                                <TableCell className="text-center text-primary">
                                                    {totals.achievement_total}
                                                </TableCell>
                                                <TableCell className="text-center border-r">
                                                    {totals.land_covered.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">
                                                    {formatCurrency(totals.beneficiary_share)}
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">
                                                    {formatCurrency(totals.subsidy)}
                                                </TableCell>
                                                <TableCell className="text-center text-green-600">
                                                    {formatCurrency(totals.total_amount)}
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
                                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p className="font-medium text-blue-600">Report Information</p>
                                    <p>
                                        This report shows the district-wise physical and financial achievement for the
                                        Supply of Fodder Seeds/Planting Materials component.
                                    </p>
                                    <p>
                                        <strong>Physical Achievement:</strong> Includes number of farmers benefited,
                                        achievement in Thombe and Seeds, and total land covered in hectares.
                                    </p>
                                    <p>
                                        <strong>Financial Achievement:</strong> Shows beneficiary share, subsidy amount,
                                        and total expenditure in rupees.
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
