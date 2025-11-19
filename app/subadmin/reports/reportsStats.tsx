"use client"
import { Card, CardContent } from "@/components/ui/card";
import {
    FileText,
    TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

export default function ReportsStats() {
    const { currentUser } = useFrappeAuth();
    const { data: response, isLoading, error } = useFrappeGetCall('vmddp_app.api.v1.dashboard.subadmin_dashboard_data', undefined, undefined, {
        revalidateOnFocus: false,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-3 sm:h-4 bg-muted animate-pulse rounded w-16 sm:w-20"></div>
                                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-muted animate-pulse rounded"></div>
                            </div>
                            <div className="h-6 sm:h-8 bg-muted animate-pulse rounded w-10 sm:w-12 mb-2"></div>
                            <div className="h-2 sm:h-3 bg-muted animate-pulse rounded w-20 sm:w-24"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs sm:text-sm text-muted-foreground">Error loading data</p>
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-chart-2" />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold">--</p>
                            <p className="text-xs text-muted-foreground mt-2">Unable to fetch</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Applications</p>
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-chart-2" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{response?.message?.total_applications?.toString() ?? "0"}</p>
                    <p className="text-xs text-chart-3 flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3" />
                        +8.2% from last month
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-chart-3" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{response?.message?.approved_applications?.toString() ?? "0"}</p>
                    <p className="text-xs text-muted-foreground mt-2">57% approval rate</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-chart-4" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{response?.message?.pending_applications?.toString() ?? "0"}</p>
                    <p className="text-xs text-muted-foreground mt-2">Needs review</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-chart-5" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{response?.message?.rejected_applications?.toString() ?? "0"}</p>
                    <p className="text-xs text-muted-foreground mt-2">9.6% rejection rate</p>
                </CardContent>
            </Card>
        </div>
    );
}