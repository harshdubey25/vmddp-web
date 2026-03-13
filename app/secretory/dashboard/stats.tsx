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
                const colors = [
                    "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600",
                    "from-green-500/20 to-green-600/10 border-green-500/30 text-green-600",
                    "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-600",
                    "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-600",
                    "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-600",
                ];
                const iconGradients = [
                    "from-blue-500 to-blue-600",
                    "from-green-500 to-green-600",
                    "from-amber-500 to-amber-600",
                    "from-rose-500 to-rose-600",
                    "from-indigo-500 to-indigo-600",
                ];
                
                const cardColor = colors[index % colors.length];
                const iconGradient = iconGradients[index % iconGradients.length];

                return (
                    <Card key={index} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`} className={`relative overflow-hidden border-2 bg-gradient-to-br hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm ${cardColor}`}>
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${cardColor.split(' ')[0]} ${cardColor.split(' ')[1]} opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110`} />
                        <CardContent className="p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 drop-shadow-sm">
                                    {stat.value}
                                </h3>
                                <p className="text-xs sm:text-sm font-medium text-foreground/80">
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
