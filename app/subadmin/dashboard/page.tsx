
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
} from "lucide-react";
import { DashboardClient } from "./client";
import { Header } from "./header";
export default function SubAdminDashboard() {
    // Mock zone data - in real app, this would come from auth context
    const assignedZone = {
        district: "Nagpur",
        taluka: "Nagpur Rural",
    };

    const stats = [
        {
            title: "Total Applications",
            value: "156",
            change: "+8.2%",
            icon: FileText,
            color: "text-chart-2",
            bgColor: "bg-chart-2/10",
        },
        {
            title: "Approved",
            value: "89",
            change: "+5.1%",
            icon: CheckCircle,
            color: "text-chart-3",
            bgColor: "bg-chart-3/10",
        },
        {
            title: "Pending Review",
            value: "52",
            change: "+12.5%",
            icon: Clock,
            color: "text-chart-4",
            bgColor: "bg-chart-4/10",
        },
        {
            title: "Rejected",
            value: "15",
            change: "-3.2%",
            icon: XCircle,
            color: "text-chart-5",
            bgColor: "bg-chart-5/10",
        },
    ];

    const recentApplications = [
        {
            id: "APP-2025-001247",
            applicant: "Ramesh Kumar Patil",
            component: "Animal Induction",
            village: "Khapa",
            status: "pending",
            date: "2025-01-06",
        },
        {
            id: "APP-2025-001240",
            applicant: "Sunita Devi",
            component: "HGM Purchase",
            village: "Mouda",
            status: "pending",
            date: "2025-01-05",
        },
        {
            id: "APP-2025-001235",
            applicant: "Prakash Deshmukh",
            component: "Fertility Feed",
            village: "Kamptee",
            status: "approved",
            date: "2025-01-04",
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: string; className: string }> = {
            pending: { variant: "outline", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
            approved: { variant: "outline", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
            rejected: { variant: "outline", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
        };

        return (
            <Badge variant={variants[status]?.variant as any} className={variants[status]?.className}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="subadmin" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

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

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Recent Applications</CardTitle>
                                        <CardDescription>Latest applications from your zone</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" data-testid="button-view-all">
                                        View All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentApplications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                            data-testid={`application-${app.id}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="font-mono text-sm font-semibold">{app.id}</p>
                                                    {getStatusBadge(app.status)}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Applicant: </span>
                                                        <span className="font-medium">{app.applicant}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Component: </span>
                                                        <span className="font-medium">{app.component}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Village: </span>
                                                        <span className="font-medium">{app.village}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{app.date}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    data-testid={`button-view-${app.id}`}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>Common tasks and shortcuts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start" data-testid="button-pending">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Review Pending Applications (52)
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" data-testid="button-reports">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Generate Zone Report
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Zone Information</CardTitle>
                                    <CardDescription>Your assigned coverage area</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <span className="text-sm text-muted-foreground">District</span>
                                        <span className="font-medium">{assignedZone.district}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <span className="text-sm text-muted-foreground">Taluka</span>
                                        <span className="font-medium">{assignedZone.taluka}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <span className="text-sm text-muted-foreground">Total Villages</span>
                                        <span className="font-medium">47</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
