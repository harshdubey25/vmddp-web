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
            color: "text-chart-2",
            bgColor: "bg-chart-2/10",
        },
        {
            title: "Approved",
            value: response?.message?.approved_applications?.toString() ?? "0",
            change: "+5.1%",
            icon: CheckCircle,
            color: "text-chart-3",
            bgColor: "bg-chart-3/10",
        },
        {
            title: "Pending Review",
            value: response?.message?.pending_applications?.toString() ?? "0",
            change: "+12.5%",
            icon: Clock,
            color: "text-chart-4",
            bgColor: "bg-chart-4/10",
        },
        {
            title: "Rejected",
            value: response?.message?.rejected_applications?.toString() ?? "0",
            change: "-3.2%",
            icon: XCircle,
            color: "text-chart-5",
            bgColor: "bg-chart-5/10",
        },
        {
            title: "Selected",
            value: response?.message?.selected_applications?.toString() ?? "0",
            change: "+2.1%",
            icon: CheckCircle,
            color: "text-chart-1",
            bgColor: "bg-chart-1/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} data-testid={`stat-card-${index}`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <span className="text-xs font-medium text-chart-3 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {stat.change}
                                </span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}