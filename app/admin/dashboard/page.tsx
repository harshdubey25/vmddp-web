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
import { frappeServer } from "@/lib/frappe";
import AdminDashboardStats from "./stats";
import TopComponents from "./topComponents";
import Link from "next/link";
export default async function AdminDashboard() {
    // Get recent applications
    const applicationsResponse = await frappeServer.call().get('vmddp_app.api.api.get_applications_summary', {
        page: '1',
        limit: '4'
    });

    const recentApplications = (applicationsResponse?.message?.applications || []).map((app: any) => ({
        id: app.name,
        applicant: app.fullname,
        component: Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A',
        district: app.village || 'N/A',
        status: app.status,
        date: app.date,
    }));

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
                        <AdminDashboardStats />

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
                                <TopComponents />

                                <Card>
                                    <CardHeader>
                                        <CardTitle data-testid="text-quick-actions">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Link href={"/admin/applications"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <FileText className="w-4 h-4" />
                                                Review Applications
                                            </Button>
                                        </Link>
                                        <Link href={"/admin/subadmins"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <Users className="w-4 h-4" />
                                                Manage Sub-Admins
                                            </Button>
                                        </Link>
                                        <Link href={"/admin/components"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <Package className="w-4 h-4" />
                                                Configure Components
                                            </Button>
                                        </Link>
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
