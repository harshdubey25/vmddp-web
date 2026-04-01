"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2, Package } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useExport } from "@/hooks/use-export";

interface StockItem {
    item: string;
    item_price: number;
    quantity: number;
}

interface DistrictStockSummary {
    District: string;
    admin_stock: StockItem[];
    allocated_stock: StockItem[];
    balance_stock: StockItem[];
}

type StockSummaryResponse = DistrictStockSummary[] | { message: DistrictStockSummary[] };

export default function StockReport() {

    const router = useRouter();
    const { isExporting, handleExport } = useExport({
        method: "vmddp_app.api.v1.stock.export_stock_summary",
        filename: "district-allocation-summary",
    });
    const { data, isLoading: loading, error } = useFrappeGetCall<StockSummaryResponse>(
        "vmddp_app.api.v1.stock.get_stock_summary"
    );

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-destructive">
                Failed to load stock report data. Please try again.
            </div>
        );
    }

    const districtData = Array.isArray(data)
        ? data
        : Array.isArray(data?.message)
            ? data.message
            : [];

    if (!districtData.length) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No data available.
            </div>
        );
    }

    const itemNames = Array.from(
        new Set(
            districtData.flatMap((district) => [
                ...district.admin_stock.map((stock) => stock.item),
                ...district.allocated_stock.map((stock) => stock.item),
                ...district.balance_stock.map((stock) => stock.item),
            ])
        )
    ).sort();

    const formatQuantity = (value: number) =>
        value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const formatPrice = (value: number) =>
        value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const cellBorderClass = "border-r border-r-border";
    const itemGroupBorderClass = "border-r-2 border-r-foreground/40";

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock-report")} className="ml-auto">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">District Allocation Summary</h1>
                    </div>
                    <p className="text-muted-foreground">
                        District-wise admin, allocated, and balance stock.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport({ format: "excel" })}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Export Excel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        District Allocation Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="border">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className={`${itemGroupBorderClass} font-bold text-center align-middle`} rowSpan={2}>
                                    District
                                </TableHead>
                                {itemNames.map((item) => (
                                    <TableHead key={item} className={`${itemGroupBorderClass} font-bold text-center`} colSpan={4}>
                                        {item}
                                    </TableHead>
                                ))}
                            </TableRow>
                            <TableRow className="bg-muted/50">
                                {itemNames.map((item) => (
                                    <React.Fragment key={`${item}-sub`}>
                                        <TableHead className={`${cellBorderClass} text-center`}>Price (₹)</TableHead>
                                        <TableHead className={`${cellBorderClass} text-center`}>Admin Qty</TableHead>
                                        <TableHead className={`${cellBorderClass} text-center`}>Allocated Qty</TableHead>
                                        <TableHead className={`${itemGroupBorderClass} text-center`}>Balance Qty</TableHead>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {districtData.map((district) => {
                                return (
                                    <TableRow key={district.District}>
                                        <TableCell className={`${itemGroupBorderClass} font-medium`}>{district.District}</TableCell>
                                        {itemNames.map((itemName) => {
                                            const adminData = district.admin_stock.find((stock) => stock.item === itemName);
                                            const allocatedData = district.allocated_stock.find((stock) => stock.item === itemName);
                                            const balanceData = district.balance_stock.find((stock) => stock.item === itemName);
                                            const itemPrice =
                                                adminData?.item_price ??
                                                allocatedData?.item_price ??
                                                balanceData?.item_price ??
                                                0;
                                            return (
                                                <React.Fragment key={`${district.District}-${itemName}`}>
                                                    <TableCell className={`${cellBorderClass} text-right`}>
                                                        {formatPrice(itemPrice)}
                                                    </TableCell>
                                                    <TableCell className={`${cellBorderClass} text-right`}>
                                                        {formatQuantity(adminData?.quantity ?? 0)}
                                                    </TableCell>
                                                    <TableCell className={`${cellBorderClass} text-right`}>
                                                        {formatQuantity(allocatedData?.quantity ?? 0)}
                                                    </TableCell>
                                                    <TableCell className={`${itemGroupBorderClass} text-right`}>
                                                        {formatQuantity(balanceData?.quantity ?? 0)}
                                                    </TableCell>
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
