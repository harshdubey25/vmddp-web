"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2, Sprout, Coins, Leaf, ClipboardList } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useExport } from "@/hooks/use-export";

interface StockItem {
    item: string;
    item_name: string;
    rate: number;
    allocated_quantity: number;
    allocated_amount: number;
    consumed_quantity: number;
    consumed_amount: number;
    remaining_quantity: number;
    remaining_amount: number;
}

interface DistrictConsumption {
    district: string;
    total_allocated_quantity: number;
    total_allocated_amount: number;
    total_consumed_quantity: number;
    total_consumed_amount: number;
    total_remaining_quantity: number;
    total_remaining_amount: number;
    items: StockItem[];
}

type ConsumptionResponse =
    | DistrictConsumption[]
    | { message: DistrictConsumption[] };

export default function FodderSeedStockConsumptionReport() {
    const router = useRouter();
    const { isExporting, handleExport } = useExport({
        method: "vmddp_app.api.v1.stock.export_fodder_seed_stock_consumption",
        filename: "fodder-seed-district-wise-report",
    });

    const { data, isLoading, error } = useFrappeGetCall<ConsumptionResponse>(
        "vmddp_app.api.v1.stock.get_fodder_seed_stock_consumption"
    );

    const districts: DistrictConsumption[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.message)
            ? data.message
            : [];

    // Collect all unique item names across districts dynamically
    const allItemNames = Array.from(
        new Set(districts.flatMap((d) => (d.items || []).map((i) => i.item_name)))
    ).sort();

    const fmtQty = (val: number | null | undefined) => {
        if (val === undefined || val === null) return "-";
        return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const fmtAmt = (val: number | null | undefined) => {
        if (val === undefined || val === null) return "-";
        return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // Compute totals per item dynamically
    const itemTotals = allItemNames.reduce<Record<string, {
        allocated_quantity: number;
        allocated_amount: number;
        consumed_quantity: number;
        consumed_amount: number;
        remaining_quantity: number;
        remaining_amount: number;
    }>>(
        (acc, name) => {
            acc[name] = {
                allocated_quantity: 0,
                allocated_amount: 0,
                consumed_quantity: 0,
                consumed_amount: 0,
                remaining_quantity: 0,
                remaining_amount: 0
            };
            districts.forEach((d) => {
                const item = d.items?.find((i) => i.item_name === name);
                if (item) {
                    acc[name].allocated_quantity += item.allocated_quantity ?? 0;
                    acc[name].allocated_amount += item.allocated_amount ?? 0;
                    acc[name].consumed_quantity += item.consumed_quantity ?? 0;
                    acc[name].consumed_amount += item.consumed_amount ?? 0;
                    acc[name].remaining_quantity += item.remaining_quantity ?? 0;
                    acc[name].remaining_amount += item.remaining_amount ?? 0;
                }
            });
            return acc;
        },
        {}
    );

    // Compute grand totals dynamically
    const grandTotals = districts.reduce(
        (acc, d) => ({
            allocated_quantity: acc.allocated_quantity + (d.total_allocated_quantity ?? 0),
            allocated_amount: acc.allocated_amount + (d.total_allocated_amount ?? 0),
            consumed_quantity: acc.consumed_quantity + (d.total_consumed_quantity ?? 0),
            consumed_amount: acc.consumed_amount + (d.total_consumed_amount ?? 0),
            remaining_quantity: acc.remaining_quantity + (d.total_remaining_quantity ?? 0),
            remaining_amount: acc.remaining_amount + (d.total_remaining_amount ?? 0),
        }),
        {
            allocated_quantity: 0,
            allocated_amount: 0,
            consumed_quantity: 0,
            consumed_amount: 0,
            remaining_quantity: 0,
            remaining_amount: 0,
        }
    );

    if (isLoading) {
        return (
            <div className="p-6 flex justify-center items-center h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading stock consumption data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-lg mx-auto text-center space-y-4">
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <p className="font-semibold">Error Loading Report</p>
                    <p className="text-xs text-red-600/90 mt-1">Failed to load fodder seed stock consumption data. Please try again later.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock-report")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stock Reports
                </Button>
            </div>
        );
    }

    if (!districts.length) {
        return (
            <div className="p-6 max-w-lg mx-auto text-center space-y-4">
                <div className="p-8 bg-slate-50 text-muted-foreground rounded-lg border border-slate-200">
                    <Sprout className="h-12 w-12 mx-auto mb-3 text-slate-400 opacity-60" />
                    <p className="font-medium">No Data Available</p>
                    <p className="text-xs mt-1 text-muted-foreground/80">No fodder seed stock consumption records were found in the database.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock-report")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stock Reports
                </Button>
            </div>
        );
    }

    const cellBorderClass = "border-r border-slate-200 dark:border-slate-800 text-center px-3 py-2 text-xs";
    const itemGroupBorderClass = "border-r-2 border-slate-300 dark:border-slate-700 text-center px-3 py-2 text-xs";

    return (
        <div className="p-6 space-y-6 w-full max-w-full overflow-hidden">
            {/* Header section with back navigation and export button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push("/admin/stock-report")} className="h-9 w-9 p-0 flex-shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <Leaf className="h-6 w-6 text-emerald-600 animate-pulse" />
                            Fodder Seed District Wise Report
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            District-wise fodder seed stock allocation &amp; consumption report.
                        </p>
                    </div>
                </div>
                <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm hover:shadow"
                    onClick={() => handleExport({ format: "excel" })}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export Excel
                </Button>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-sm bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/5">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
                            Total Allocated
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {fmtQty(grandTotals.allocated_quantity)} kg
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{fmtAmt(grandTotals.allocated_amount)}</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-white to-sky-50/20 dark:from-slate-900 dark:to-sky-950/5">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sprout className="h-3.5 w-3.5 text-sky-600" />
                            Total Consumed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {fmtQty(grandTotals.consumed_quantity)} kg
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{fmtAmt(grandTotals.consumed_amount)}</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/5">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Coins className="h-3.5 w-3.5 text-amber-600" />
                            Total Remaining
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {fmtQty(grandTotals.remaining_quantity)} kg
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{fmtAmt(grandTotals.remaining_amount)}</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/5">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Leaf className="h-3.5 w-3.5 text-indigo-600" />
                            Seed Varieties
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {allItemNames.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Distinct types registered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Matrix Data Table Card */}
            <Card className="border shadow-md rounded-xl overflow-hidden">
                <CardHeader className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-emerald-600" />
                        District-Wise Fodder Seed Consumption Matrix
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Detailed breakdown per seed variety and overall totals. Scroll horizontally to view all columns.
                    </p>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="border-collapse min-w-[1200px]">
                        <TableHeader>
                            <TableRow className="bg-slate-100/80 dark:bg-slate-900/50 hover:bg-slate-100/80">
                                <TableHead
                                    className={`${itemGroupBorderClass} font-bold text-center align-middle text-slate-800 dark:text-slate-200`}
                                    rowSpan={2}
                                >
                                    Sr. No.
                                </TableHead>
                                <TableHead
                                    className={`${itemGroupBorderClass} font-bold text-center align-middle text-slate-800 dark:text-slate-200`}
                                    rowSpan={2}
                                >
                                    District
                                </TableHead>
                                {allItemNames.map((name) => (
                                    <TableHead
                                        key={name}
                                        className={`${itemGroupBorderClass} font-bold text-center bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300`}
                                        colSpan={6}
                                    >
                                        {name}
                                    </TableHead>
                                ))}
                                <TableHead
                                    className={`${itemGroupBorderClass} font-bold text-center bg-slate-200/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100`}
                                    colSpan={6}
                                >
                                    District Total
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/30">
                                {allItemNames.map((name) => (
                                    <React.Fragment key={`${name}-sub`}>
                                        <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/10`}>Alloc Qty</TableHead>
                                        <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/10`}>Alloc Amt</TableHead>
                                        <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/10`}>Cons Qty</TableHead>
                                        <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/10`}>Cons Amt</TableHead>
                                        <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/10`}>Bal Qty</TableHead>
                                        <TableHead className={`${itemGroupBorderClass} font-semibold text-[10px] text-slate-600 dark:text-slate-400 bg-emerald-50/15`}>Bal Amt</TableHead>
                                    </React.Fragment>
                                ))}
                                <React.Fragment key="total-sub">
                                    <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50`}>Alloc Qty</TableHead>
                                    <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50`}>Alloc Amt</TableHead>
                                    <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50`}>Cons Qty</TableHead>
                                    <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50`}>Cons Amt</TableHead>
                                    <TableHead className={`${cellBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/50`}>Bal Qty</TableHead>
                                    <TableHead className={`${itemGroupBorderClass} font-semibold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-900/70`}>Bal Amt</TableHead>
                                </React.Fragment>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {districts.map((d, index) => (
                                <TableRow key={d.district} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/20 transition-all">
                                    <TableCell className={`${itemGroupBorderClass} text-center font-medium`}>{index + 1}</TableCell>
                                    <TableCell className={`${itemGroupBorderClass} font-semibold text-slate-800 dark:text-slate-200`}>{d.district}</TableCell>
                                    {allItemNames.map((name) => {
                                        const item = d.items?.find((i) => i.item_name === name);
                                        return (
                                            <React.Fragment key={`${d.district}-${name}`}>
                                                <TableCell className={`${cellBorderClass} text-right font-mono font-medium text-slate-800 dark:text-slate-200 bg-emerald-50/5 dark:bg-emerald-950/5`}>
                                                    {fmtQty(item?.allocated_quantity)}
                                                </TableCell>
                                                <TableCell className={`${cellBorderClass} text-right font-mono text-slate-500 bg-emerald-50/5 dark:bg-emerald-950/5`}>
                                                    {fmtAmt(item?.allocated_amount)}
                                                </TableCell>
                                                <TableCell className={`${cellBorderClass} text-right font-mono text-slate-800 dark:text-slate-200 bg-emerald-50/5 dark:bg-emerald-950/5`}>
                                                    {fmtQty(item?.consumed_quantity)}
                                                </TableCell>
                                                <TableCell className={`${cellBorderClass} text-right font-mono text-slate-500 bg-emerald-50/5 dark:bg-emerald-950/5`}>
                                                    {fmtAmt(item?.consumed_amount)}
                                                </TableCell>
                                                <TableCell className={`${cellBorderClass} text-right font-mono text-slate-800 dark:text-slate-200 bg-emerald-50/5 dark:bg-emerald-950/5`}>
                                                    {fmtQty(item?.remaining_quantity)}
                                                </TableCell>
                                                <TableCell className={`${itemGroupBorderClass} text-right font-mono text-slate-500 bg-emerald-50/10 dark:bg-emerald-950/10`}>
                                                    {fmtAmt(item?.remaining_amount)}
                                                </TableCell>
                                            </React.Fragment>
                                        );
                                    })}
                                    <React.Fragment key={`${d.district}-total`}>
                                        <TableCell className={`${cellBorderClass} text-right font-mono font-bold text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900/40`}>
                                            {fmtQty(d.total_allocated_quantity)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40`}>
                                            {fmtAmt(d.total_allocated_amount)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono font-bold text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900/40`}>
                                            {fmtQty(d.total_consumed_quantity)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40`}>
                                            {fmtAmt(d.total_consumed_amount)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono font-bold text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-900/40`}>
                                            {fmtQty(d.total_remaining_quantity)}
                                        </TableCell>
                                        <TableCell className={`${itemGroupBorderClass} text-right font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/70`}>
                                            {fmtAmt(d.total_remaining_amount)}
                                        </TableCell>
                                    </React.Fragment>
                                </TableRow>
                            ))}
                            {/* Totals row */}
                            <TableRow className="font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700">
                                <TableCell className={`${itemGroupBorderClass} text-center`} colSpan={2}>
                                    Total
                                </TableCell>
                                {allItemNames.map((name) => (
                                    <React.Fragment key={`total-${name}`}>
                                        <TableCell className={`${cellBorderClass} text-right font-mono text-slate-900 dark:text-slate-50 bg-emerald-50/20 dark:bg-emerald-950/20`}>
                                            {fmtQty(itemTotals[name].allocated_quantity)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-950/20`}>
                                            {fmtAmt(itemTotals[name].allocated_amount)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono text-slate-900 dark:text-slate-50 bg-emerald-50/20 dark:bg-emerald-950/20`}>
                                            {fmtQty(itemTotals[name].consumed_quantity)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-950/20`}>
                                            {fmtAmt(itemTotals[name].consumed_amount)}
                                        </TableCell>
                                        <TableCell className={`${cellBorderClass} text-right font-mono text-slate-900 dark:text-slate-50 bg-emerald-50/20 dark:bg-emerald-950/20`}>
                                            {fmtQty(itemTotals[name].remaining_quantity)}
                                        </TableCell>
                                        <TableCell className={`${itemGroupBorderClass} text-right font-mono text-slate-600 dark:text-slate-400 bg-emerald-50/30 dark:bg-emerald-950/30`}>
                                            {fmtAmt(itemTotals[name].remaining_amount)}
                                        </TableCell>
                                    </React.Fragment>
                                ))}
                                <React.Fragment key="total-grand">
                                    <TableCell className={`${cellBorderClass} text-right font-mono bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50`}>
                                        {fmtQty(grandTotals.allocated_quantity)}
                                    </TableCell>
                                    <TableCell className={`${cellBorderClass} text-right font-mono text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50`}>
                                        {fmtAmt(grandTotals.allocated_amount)}
                                    </TableCell>
                                    <TableCell className={`${cellBorderClass} text-right font-mono bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50`}>
                                        {fmtQty(grandTotals.consumed_quantity)}
                                    </TableCell>
                                    <TableCell className={`${cellBorderClass} text-right font-mono text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50`}>
                                        {fmtAmt(grandTotals.consumed_amount)}
                                    </TableCell>
                                    <TableCell className={`${cellBorderClass} text-right font-mono bg-slate-200/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50`}>
                                        {fmtQty(grandTotals.remaining_quantity)}
                                    </TableCell>
                                    <TableCell className={`${itemGroupBorderClass} text-right font-mono text-slate-700 dark:text-slate-300 bg-slate-300/60 dark:bg-slate-700/60`}>
                                        {fmtAmt(grandTotals.remaining_amount)}
                                    </TableCell>
                                </React.Fragment>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
