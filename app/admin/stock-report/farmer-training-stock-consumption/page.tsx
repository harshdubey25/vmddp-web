"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, BookOpen } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

interface StockConsumptionItem {
    district: string;
    total_quantity: number;
    used_quantity: number;
    remaining_quantity: number;
}

type StockConsumptionResponse =
    | StockConsumptionItem[]
    | { message: StockConsumptionItem[] };

export default function FarmerTrainingStockConsumptionReport() {
    const { data, isLoading, error } = useFrappeGetCall<StockConsumptionResponse>(
        "vmddp_app.api.v1.stock.get_farmer_training_stock_consumption"
    );

    const items: StockConsumptionItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.message)
            ? data.message
            : [];

    const totals = items.reduce(
        (acc, item) => ({
            total_quantity: acc.total_quantity + (item.total_quantity ?? 0),
            used_quantity: acc.used_quantity + (item.used_quantity ?? 0),
            remaining_quantity: acc.remaining_quantity + (item.remaining_quantity ?? 0),
        }),
        { total_quantity: 0, used_quantity: 0, remaining_quantity: 0 }
    );

    const fmt = (value: number) =>
        value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    if (isLoading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-destructive">
                Failed to load stock consumption data. Please try again.
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No data available.
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Consumption of Books and Certificates
                </h1>
                <p className="text-muted-foreground">
                    District-wise farmer training stock consumption report
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Stock Consumption Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="border">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Sr. No.</TableHead>
                                <TableHead className="font-bold">District</TableHead>
                                <TableHead className="font-bold text-right">Total Quantity</TableHead>
                                <TableHead className="font-bold text-right">Used Quantity</TableHead>
                                <TableHead className="font-bold text-right">Remaining Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item.district}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{item.district}</TableCell>
                                    <TableCell className="text-right">{fmt(item.total_quantity)}</TableCell>
                                    <TableCell className="text-right">{fmt(item.used_quantity)}</TableCell>
                                    <TableCell className="text-right">{fmt(item.remaining_quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold">
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell className="text-right">{fmt(totals.total_quantity)}</TableCell>
                                <TableCell className="text-right">{fmt(totals.used_quantity)}</TableCell>
                                <TableCell className="text-right">{fmt(totals.remaining_quantity)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
