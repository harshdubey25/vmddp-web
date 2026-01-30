"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { frappeBrowser } from "@/lib/frappe";

interface DashboardData {
    total_applications?: number;
    approved_applications?: number;
    pending_applications?: number;
    rejected_applications?: number;
    selected_applications?: number;
}

function StatsLoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <div>
                            <Skeleton className="h-6 sm:h-7 lg:h-8 w-16 mb-1" />
                            <Skeleton className="h-3 sm:h-4 w-20 mt-0.5 sm:mt-1" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function SecretaryDashboardStats() {
    const [statsData, setStatsData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const statsResponse = await frappeBrowser.call().get('vmddp_app.api.v1.dashboard.subadmin_dashboard_data');
                setStatsData(statsResponse?.message || {});
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
                setStatsData({});
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (isLoading) {
        return <StatsLoadingSkeleton />;
    }

    const stats = [
        {
            title: "Total Applications",
            value: (statsData?.total_applications || 0).toString(),
            change: "+8.2%",
            icon: FileText,
            color: "text-chart-2",
            bgColor: "bg-chart-2/10",
        },
        {
            title: "Approved",
            value: (statsData?.approved_applications || 0).toString(),
            change: "+5.1%",
            icon: CheckCircle,
            color: "text-chart-3",
            bgColor: "bg-chart-3/10",
        },
        {
            title: "Pending Review",
            value: (statsData?.pending_applications || 0).toString(),
            change: "+12.5%",
            icon: Clock,
            color: "text-chart-4",
            bgColor: "bg-chart-4/10",
        },
        {
            title: "Rejected",
            value: (statsData?.rejected_applications || 0).toString(),
            change: "-3.2%",
            icon: XCircle,
            color: "text-chart-5",
            bgColor: "bg-chart-5/10",
        },
        {
            title: "Selected",
            value: (statsData?.selected_applications || 0).toString(),
            change: "+4.8%",
            icon: TrendingUp,
            color: "text-chart-1",
            bgColor: "bg-chart-1/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1">
                                    {stat.value}
                                </h3>
                                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                                    {stat.title}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
