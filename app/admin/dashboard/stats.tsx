import {
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { frappeServer } from "@/lib/frappe";

export default async function AdminDashboardStats() {
    const statsResponse = await frappeServer.call().get('vmddp_app.api.v1.dashboard.subadmin_dashboard_data');

    const stats = [
        {
            title: "Total Applications",
            value: (statsResponse?.message?.total_applications || 0).toString(),
            change: "+8.2%",
            icon: FileText,
            color: "text-chart-2",
            bgColor: "bg-chart-2/10",
        },
        {
            title: "Approved",
            value: (statsResponse?.message?.approved_applications || 0).toString(),
            change: "+5.1%",
            icon: CheckCircle,
            color: "text-chart-3",
            bgColor: "bg-chart-3/10",
        },
        {
            title: "Pending Review",
            value: (statsResponse?.message?.pending_applications || 0).toString(),
            change: "+12.5%",
            icon: Clock,
            color: "text-chart-4",
            bgColor: "bg-chart-4/10",
        },
        {
            title: "Rejected",
            value: (statsResponse?.message?.rejected_applications || 0).toString(),
            change: "-3.2%",
            icon: XCircle,
            color: "text-chart-5",
            bgColor: "bg-chart-5/10",
        },
        {
            title: "Selected",
            value: (statsResponse?.message?.selected_applications || 0).toString(),
            change: "+2.1%",
            icon: CheckCircle,
            color: "text-chart-1",
            bgColor: "bg-chart-1/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} data-testid={`stat-card-${index}`}>
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-chart-3 flex items-center gap-0.5 sm:gap-1">
                                    <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3" />
                                    {stat.change}
                                </span>
                            </div>
                            <div>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stat.value}</p>
                                <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}