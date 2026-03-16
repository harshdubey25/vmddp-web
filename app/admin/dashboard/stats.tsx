"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
                <Card key={i} className="border-2 border-muted">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                            <Skeleton className="h-5 w-14" />
                        </div>
                        <div>
                            <Skeleton className="h-8 sm:h-10 w-16 mb-1" />
                            <Skeleton className="h-3 sm:h-4 w-20 mt-0.5 sm:mt-1" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function AdminDashboardStats() {
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
            color: "text-blue-600",
            bgColor: "bg-blue-500/20",
            gradient: "from-blue-500/20 to-blue-600/10",
            borderColor: "border-blue-500/30",
            iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
        },
        {
            title: "Approved",
            value: (statsData?.approved_applications || 0).toString(),
            change: "+5.1%",
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-500/20",
            gradient: "from-green-500/20 to-green-600/10",
            borderColor: "border-green-500/30",
            iconBg: "bg-gradient-to-br from-green-500 to-green-600",
        },
        {
            title: "Pending Review",
            value: (statsData?.pending_applications || 0).toString(),
            change: "+12.5%",
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-500/20",
            gradient: "from-yellow-500/20 to-orange-600/10",
            borderColor: "border-yellow-500/30",
            iconBg: "bg-gradient-to-br from-yellow-500 to-orange-600",
        },
        {
            title: "Rejected",
            value: (statsData?.rejected_applications || 0).toString(),
            change: "-3.2%",
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-500/20",
            gradient: "from-red-500/20 to-red-600/10",
            borderColor: "border-red-500/30",
            iconBg: "bg-gradient-to-br from-red-500 to-red-600",
        },
        {
            title: "Selected",
            value: (statsData?.selected_applications || 0).toString(),
            change: "+2.1%",
            icon: CheckCircle,
            color: "text-purple-600",
            bgColor: "bg-purple-500/20",
            gradient: "from-purple-500/20 to-purple-600/10",
            borderColor: "border-purple-500/30",
            iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card 
                        key={index} 
                        data-testid={`stat-card-${index}`}
                        className={`relative overflow-hidden border-2 ${stat.borderColor} bg-gradient-to-br ${stat.gradient} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm`}
                    >
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${stat.gradient} opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110`} />
                        <CardContent className="p-3 sm:p-4 lg:p-6 relative">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                              
                            </div>
                            <div>
                                <p className={`text-2xl sm:text-3xl font-bold tracking-tight mb-1 ${stat.color} drop-shadow-sm`}>{stat.value}</p>
                                <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground line-clamp-2">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}