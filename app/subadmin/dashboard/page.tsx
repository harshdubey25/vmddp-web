import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import { getStatusBadge } from "@/lib/status-utils";
import { Header } from "./header";
import SubAdminDashboardStats from "./stats";
import Link from "next/link";
export const runtime = 'edge';

interface Application {
    id: string;
    applicant: string;
    component: string;
    village: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Selected';
    date: string;
}


export default async function SubAdminDashboard() {

    const frappe = await getFrappeWithUserToken();
    const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', { limit: 5, order_by: 'creation desc' });
    console.log("Fetched applications:", response);

    // Process applications data
    const applications: Application[] = (response || []).message.applications.map((app: any): Application => {
        const applicant = [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
        const component = app.components?.[0]?.component || 'N/A';
        return {
            id: app.name,
            applicant: app.fullname,
            component: app.component_list,
            village: app.village || 'N/A',
            status: app.status,
            date: app.date,
        };
    });



    // Mock zone data - in real app, this would come from auth context
    const assignedZone = {
        district: "Nagpur",
        taluka: "Nagpur Rural",
    };



    // Get recent applications (last 3, sorted by date desc)
    const recentApplications = applications
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        ;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-5 lg:space-y-6 max-w-7xl">
                    <SubAdminDashboardStats />
                    <Card>
                        <CardHeader className="p-4 sm:p-5 lg:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <CardTitle className="text-base sm:text-lg lg:text-xl">Recent Applications</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Latest applications from your zone</CardDescription>
                                </div>
                                <Link href="/subadmin/applications" className="w-full sm:w-auto">
                                    <Button variant="outline" size="sm" data-testid="button-view-all" className="w-full sm:w-auto text-xs sm:text-sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="space-y-3 sm:space-y-4">
                                {recentApplications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                        data-testid={`application-${app.id}`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2 sm:mb-3">
                                                <p className="font-mono text-xs sm:text-sm font-semibold truncate">{app.id}</p>
                                                {getStatusBadge(app.status)}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
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
                                        {/* <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{app.date}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    data-testid={`button-view-${app.id}`}
                                                >
                                                    View
                                                </Button>
                                            </div> */}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>Common tasks and shortcuts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start" data-testid="button-pending">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Review Pending Applications ({pending})
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
                        </div> */}
                </div>
            </main>
        </div>
    );
}
