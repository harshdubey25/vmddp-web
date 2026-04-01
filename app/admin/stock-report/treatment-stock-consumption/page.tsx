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
import { ArrowLeft, Loader2, Pill } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
interface StockItem {
    item: string;
    item_name: string;
    total_quantity: number;
    used_quantity: number;
    remaining_quantity: number;
}

interface DistrictConsumption {
    district: string;
    items: StockItem[];
}

type ConsumptionResponse =
    | DistrictConsumption[]
    | { message: DistrictConsumption[] };

export default function TreatmentStockConsumptionReport() {
    const router = useRouter();
    const { data, isLoading, error } = useFrappeGetCall<ConsumptionResponse>(
        "vmddp_app.api.v1.stock.get_treatment_of_infertile_animal_stock_consumption"
    );

    const districts: DistrictConsumption[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.message)
            ? data.message
            : [];

    // Collect all unique item names across districts
    const allItemNames = Array.from(
        new Set(districts.flatMap((d) => d.items.map((i) => i.item_name)))
    ).sort();

    const fmt = (value: number) =>
        value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    // Compute totals per item
    const itemTotals = allItemNames.reduce<Record<string, { total: number; used: number; remaining: number }>>(
        (acc, name) => {
            acc[name] = { total: 0, used: 0, remaining: 0 };
            districts.forEach((d) => {
                const item = d.items.find((i) => i.item_name === name);
                if (item) {
                    acc[name].total += item.total_quantity ?? 0;
                    acc[name].used += item.used_quantity ?? 0;
                    acc[name].remaining += item.remaining_quantity ?? 0;
                }
            });
            return acc;
        },
        {}
    );

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

    if (!districts.length) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No data available.
            </div>
        );
    }

    const cellBorderClass = "border-r border-r-border";
    const itemGroupBorderClass = "border-r-2 border-r-foreground/40";

    return (
        <div className="p-6 space-y-6 w-full">
            <div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock-report")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Treatment of Infertile Animals — Medicine Consumption
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    District-wise consumption of medicines / stock items
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Medicine Stock Consumption
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="border">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead
                                    className={`${itemGroupBorderClass} font-bold text-center align-middle`}
                                    rowSpan={2}
                                >
                                    Sr. No.
                                </TableHead>
                                <TableHead
                                    className={`${itemGroupBorderClass} font-bold text-center align-middle`}
                                    rowSpan={2}
                                >
                                    District
                                </TableHead>
                                {allItemNames.map((name) => (
                                    <TableHead
                                        key={name}
                                        className={`${itemGroupBorderClass} font-bold text-center`}
                                        colSpan={3}
                                    >
                                        {name}
                                    </TableHead>
                                ))}
                            </TableRow>
                            <TableRow className="bg-muted/50">
                                {allItemNames.map((name) => (
                                    <React.Fragment key={`${name}-sub`}>
                                        <TableHead className={`${cellBorderClass} text-center`}>Total Qty</TableHead>
                                        <TableHead className={`${cellBorderClass} text-center`}>Used Qty</TableHead>
                                        <TableHead className={`${itemGroupBorderClass} text-center`}>Remaining Qty</TableHead>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {districts.map((d, index) => (
                                <TableRow key={d.district}>
                                    <TableCell className={`${itemGroupBorderClass} text-center`}>{index + 1}</TableCell>
                                    <TableCell className={`${itemGroupBorderClass} font-medium`}>{d.district}</TableCell>
                                    {allItemNames.map((name) => {
                                        const item = d.items.find((i) => i.item_name === name);
                                        return (
                                            <React.Fragment key={`${d.district}-${name}`}>
                                                <TableCell className={`${cellBorderClass} text-right`}>
                                                    {fmt(item?.total_quantity ?? 0)}
                                                </TableCell>
                                                <TableCell className={`${cellBorderClass} text-right`}>
                                                    {fmt(item?.used_quantity ?? 0)}
                                                </TableCell>
                                                <TableCell className={`${itemGroupBorderClass} text-right`}>
                                                    {fmt(item?.remaining_quantity ?? 0)}
                                                </TableCell>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableRow>
                            ))}
                            {/* Totals row */}
                            <TableRow className="font-bold bg-muted/30">
                                <TableCell className={itemGroupBorderClass} colSpan={2}>
                                    Total
                                </TableCell>
                                {allItemNames.map((name) => (
                                    <React.Fragment key={`total-${name}`}>
                                        <TableCell className={`${cellBorderClass} text-right`}>
                                            {fmt(itemTotals[name].total)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right`}>
                                            {fmt(itemTotals[name].used)}
                                        </TableCell>
                                        <TableCell className={`${itemGroupBorderClass} text-right`}>
                                            {fmt(itemTotals[name].remaining)}
                                        </TableCell>
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
