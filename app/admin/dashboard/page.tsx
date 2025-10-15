// ...existing code...
// Content from src/pages/admin/Dashboard.tsx
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/AdminSidebar";
import {
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Users,
    Package,
    ArrowUpRight,
} from "lucide-react";
import { frappeServer } from "@/app/lib/frappe";
import Link from "next/link";

export default async function AdminDashboard() {
    const response = await frappeServer.call().get('vmddp_app.api.api.get_all_docs_with_children', { doctype: 'App Form' });
    type FrappeApp = {
        name: string;
        first_name?: string;
        mid_name?: string;
        last_name?: string;
        component_name?: string;
        components?: { component_name?: string; name: string; component?: string }[];
        district?: string;
        status?: string;
        creation?: string;
    };


    const recentApplications = (response.message || []).map((app: FrappeApp) => ({
        id: app.name,
        applicant: `${app.first_name ?? ''} ${app.mid_name ?? ''} ${app.last_name ?? ''}`.trim(),
        component: Array.isArray(app.components)
            ? app.components.map(c => c.component_name || c.component).join(', ')
            : '',
        district: app.district ?? '',
        status: app.status ?? '',
        date: app.creation ? app.creation.split(' ')[0] : '',
    })).slice(0, 4);
    const totalApplications = recentApplications.length;
    const approvedCount = recentApplications.filter((app: FrappeApp) => app.status === "approved").length;
    const pendingCount = recentApplications.filter((app: FrappeApp) => app.status === "pending").length;
    const rejectedCount = recentApplications.filter((app: FrappeApp) => app.status === "rejected").length;

    const stats = [
        {
            title: "Total Applications",
            value: totalApplications.toLocaleString(),
            change: "+12.5%",
            icon: FileText,
            color: "text-chart-2",
            bgColor: "bg-chart-2/10",
        },
        {
            title: "Approved",
            value: approvedCount.toLocaleString(),
            change: "+8.2%",
            icon: CheckCircle,
            color: "text-chart-3",
            bgColor: "bg-chart-3/10",
        },
        {
            title: "Pending Review",
            value: pendingCount.toLocaleString(),
            change: "+4.1%",
            icon: Clock,
            color: "text-chart-4",
            bgColor: "bg-chart-4/10",
        },
        {
            title: "Rejected",
            value: rejectedCount.toLocaleString(),
            change: "-2.3%",
            icon: XCircle,
            color: "text-chart-5",
            bgColor: "bg-chart-5/10",
        },
    ];

    const topComponents = [
        { name: "Animal Induction", count: 342, percentage: 27 },
        { name: "HGM Purchase", count: 298, percentage: 24 },
        { name: "Fertility Feed", count: 215, percentage: 17 },
        { name: "Chaff Cutter", count: 187, percentage: 15 },
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="admin" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                    <div>
                        <h1 className="font-display font-semibold text-xl" data-testid="text-dashboard-title">
                            Dashboard Overview
                        </h1>
                        <p className="text-sm text-muted-foreground">Welcome back, Administrator</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            System Active
                        </Badge>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <Card key={index} data-testid={`stat-card-${index}`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                                </div>
                                                <Badge variant="secondary" className="gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {stat.change}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                                            <p className="font-display font-bold text-2xl">{stat.value}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle data-testid="text-recent-applications">Recent Applications</CardTitle>
                                        <CardDescription>Latest submissions from farmers</CardDescription>
                                    </div>
                                    <Link href={'/admin/applications'}>
                                        <Button variant="outline" size="sm" data-testid="button-view-all">
                                            View All
                                            <ArrowUpRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentApplications.map((app: {
                                            id: string;
                                            applicant: string;
                                            component: string;
                                            district: string;
                                            status: string;
                                            date: string;
                                        }, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                                                data-testid={`application-${index}`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <p className="font-semibold text-sm">{app.id}</p>
                                                        <Badge
                                                            variant={app.status === "approved" ? "default" : "secondary"}
                                                            className={app.status === "approved" ? "bg-chart-3" : ""}
                                                        >
                                                            {app.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{app.applicant}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-muted-foreground">{app.component}</span>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">{app.district}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">{app.date}</p>
                                                    {/* <Button variant="ghost" size="sm" className="mt-2">
                                                        Review
                                                    </Button> */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle data-testid="text-top-components">Top Components</CardTitle>
                                        <CardDescription>Most requested schemes</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {topComponents.map((component, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{component.name}</span>
                                                    <span className="text-muted-foreground">{component.count}</span>
                                                </div>
                                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${component.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle data-testid="text-quick-actions">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Button variant="outline" className="w-full justify-start gap-3">
                                            <FileText className="w-4 h-4" />
                                            Review Applications
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-3">
                                            <Users className="w-4 h-4" />
                                            Manage Sub-Admins
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start gap-3">
                                            <Package className="w-4 h-4" />
                                            Configure Components
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
