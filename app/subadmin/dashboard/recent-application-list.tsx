import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import { getStatusBadge } from "@/lib/status-utils";
interface Application {
    id: string;
    applicant: string;
    component: string;
    village: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Selected';
    date: string;
}

export const RecentApplicationsList = async () => {
    const frappe = await getFrappeWithUserToken();
    const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', { limit: 5, order_by: 'creation desc' });

    // Process applications data
    const applications: Application[] = (response || []).message.applications.map((app: any): Application => {
        return {
            id: app.name,
            applicant: app.fullname,
            component: app.component_list,
            village: app.village || 'N/A',
            status: app.status,
            date: app.date,
        };
    });
    return (
        <div className="space-y-3 sm:space-y-4">
            {applications.map((app) => (
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
                </div>
            ))}
        </div>
    )
}
