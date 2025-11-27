import { frappeServer } from "@/lib/frappe";
import { Badge } from "@/components/ui/badge";

export default async function RecentApplicationsDashboard() {

    let applicationsResponse: any;
    try {

        applicationsResponse = await frappeServer.call().get('vmddp_app.api.api.get_applications_summary', {
            page: '1',
            limit: '5',
            order_by: 'creation desc'
        });
    } catch (error) {
        console.error('Error fetching applications summary:', error);
        throw error;
    }
    const recentApplications = (applicationsResponse?.message?.applications || []).map((app: any) => ({
        id: app.name,
        applicant: app.fullname,
        component: Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A',
        district: app.district || 'N/A',
        status: app.status,
        date: app.date,
    }));
    return <div className="space-y-3">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border hover-elevate gap-2 sm:gap-0"
                data-testid={`application-${index}`}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-xs sm:text-sm">{app.id}</p>
                        <Badge
                            variant={app.status === "approved" ? "default" : "secondary"}
                            className={`text-xs ${app.status === "approved" ? "bg-chart-3" : ""}`}
                        >
                            {app.status}
                        </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.applicant}</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{app.component}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{app.district}</span>
                    </div>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">{app.date}</p>
                    {/* <Button variant="ghost" size="sm" className="mt-2">
                                                        Review
                                                    </Button> */}
                </div>
            </div>
        ))}
    </div>;
}