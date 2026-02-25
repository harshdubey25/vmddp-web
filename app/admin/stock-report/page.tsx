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
import { Loader2, Package } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

interface StockSummaryItem {
    item: string;
    unit_of_measure: string;
    rate: number;
    total_quantity: number;
    total_amount: number;
}

interface DistrictItemAllocation {
    item: string;
    unit_of_measure: string;
    rate: number;
    total_quantity: number;
    total_amount: number;
    allocated_quantity: number;
    allocated_amount: number;
    balance_quantity: number;
    balance_amount: number;
}

interface DistrictWiseData {
    district: string;
    items: DistrictItemAllocation[];
}

interface StockReportData {
    stock_summary: Record<string, StockSummaryItem>;
    district_wise: DistrictWiseData[];
}

export default function StockReport() {
    const { data, isLoading: loading, error } = useFrappeGetCall<StockReportData>(
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

    if (!data || !data.stock_summary) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No data available.
            </div>
        );
    }

    const items = Object.keys(data.stock_summary).sort();

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Report</h1>
                    <p className="text-muted-foreground">
                        District-wise stock allocation report.
                    </p>
                </div>
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
                                <TableHead className="border-r font-bold text-center align-middle" rowSpan={2}>
                                    District
                                </TableHead>
                                <TableHead className="border-r font-bold text-center" colSpan={2}>
                                    Total Stock (All Items)
                                </TableHead>
                                {items.map((item) => (
                                    <TableHead key={item} className="border-r font-bold text-center" colSpan={2}>
                                        {item} Allocated
                                    </TableHead>
                                ))}
                            </TableRow>
                            <TableRow className="bg-muted/50">
                                <TableHead className="border-r text-center">Quantity</TableHead>
                                <TableHead className="border-r text-center">Amount (₹)</TableHead>
                                {items.map((item) => (
                                    <React.Fragment key={`${item}-sub`}>
                                        <TableHead className="border-r text-center">Quantity</TableHead>
                                        <TableHead className="border-r text-center">Amount (₹)</TableHead>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Global Total Row */}
                            <TableRow className="bg-muted/20 font-semibold">
                                <TableCell className="border-r">Global Total Stock</TableCell>
                                <TableCell className="border-r text-right">
                                    {items.reduce((sum, item) => sum + (data.stock_summary[item]?.total_quantity || 0), 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="border-r text-right">
                                    {items.reduce((sum, item) => sum + (data.stock_summary[item]?.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                {items.map((item) => {
                                    const summary = data.stock_summary[item];
                                    return (
                                        <React.Fragment key={`${item}-global`}>
                                            <TableCell className="border-r text-right">
                                                {summary?.total_quantity?.toLocaleString() || 0}
                                            </TableCell>
                                            <TableCell className="border-r text-right">
                                                {summary?.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </TableCell>
                                        </React.Fragment>
                                    );
                                })}
                            </TableRow>

                            {/* District Rows */}
                            {data.district_wise.map((districtData) => {
                                const totalAllocatedQty = districtData.items.reduce((sum, item) => sum + (item.allocated_quantity || 0), 0);
                                const totalAllocatedAmt = districtData.items.reduce((sum, item) => sum + (item.allocated_amount || 0), 0);

                                return (
                                    <TableRow key={districtData.district}>
                                        <TableCell className="border-r font-medium">{districtData.district}</TableCell>
                                        <TableCell className="border-r text-right">{totalAllocatedQty.toLocaleString()}</TableCell>
                                        <TableCell className="border-r text-right">{totalAllocatedAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>

                                        {items.map((itemName) => {
                                            const itemData = districtData.items.find(i => i.item === itemName);
                                            return (
                                                <React.Fragment key={`${districtData.district}-${itemName}`}>
                                                    <TableCell className="border-r text-right">
                                                        {itemData?.allocated_quantity?.toLocaleString() || 0}
                                                    </TableCell>
                                                    <TableCell className="border-r text-right">
                                                        {itemData?.allocated_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
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
