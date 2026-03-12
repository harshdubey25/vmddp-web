"use client"
import {
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFrappeGetCall } from "frappe-react-sdk";
import { CardSkeleton } from "@/components/LoadingSkeletons";

interface DashboardData {
    total_applications: number;
    approved_applications: number;
    pending_applications: number;
    rejected_applications: number;
    selected_applications: number;
}

export default function SubAdminDashboardStats() {
    const { data: response, isLoading } = useFrappeGetCall<{ message: DashboardData }>(
        'vmddp_app.api.v1.dashboard.subadmin_dashboard_data',
        undefined,
        undefined,
        { revalidateOnFocus: false }
    );

    if (isLoading) {
        return <CardSkeleton />;
    }

    const stats = [
        {
            title: "Total Applications",
            value: response?.message?.total_applications?.toString() ?? "0",
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
            value: response?.message?.approved_applications?.toString() ?? "0",
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
            value: response?.message?.pending_applications?.toString() ?? "0",
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
            value: response?.message?.rejected_applications?.toString() ?? "0",
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
            value: response?.message?.selected_applications?.toString() ?? "0",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card 
                        key={index} 
                        data-testid={`stat-card-${index}`}
                        className={`relative overflow-hidden border-2 ${stat.borderColor} bg-gradient-to-br ${stat.gradient} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm`}
                    >
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${stat.gradient} opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110`} />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} flex items-center gap-1 shadow-sm`}>
                                    <TrendingUp className={`w-3 h-3 ${stat.change.startsWith('-') ? 'rotate-180' : ''}`} />
                                    {stat.change}
                                </span>
                            </div>
                            <div>
                                <p className={`text-3xl font-bold tracking-tight mb-1 ${stat.color} drop-shadow-sm`}>{stat.value}</p>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}