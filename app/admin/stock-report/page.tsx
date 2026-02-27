"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const stockReportPages = [
    {
        href: "/admin/stock-report/district-allocation-summary",
        title: "District Allocation Summary",
        description: "View district-wise admin, allocated, and balance stock.",
    },
];

export default function StockReport() {
    return (
        <div className="p-6 space-y-6 w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Stock Reports</h1>
                <p className="text-muted-foreground">Select a stock report page.</p>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-3">Report Pages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stockReportPages.map((report) => (
                        <Link key={report.href} href={report.href} className="block h-full">
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                <CardContent className="p-4 flex items-center gap-3 h-full">
                                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                        <BarChart3 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm">{report.title}</h3>
                                        <p className="text-xs text-muted-foreground">{report.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
