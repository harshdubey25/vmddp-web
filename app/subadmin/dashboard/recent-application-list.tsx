import { getFrappeWithUserToken } from "@/lib/frappeHelper";
import { getStatusBadge } from "@/lib/status-utils";
import RecentApplicationsClient from "./recent-applications-client";

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

    return <RecentApplicationsClient applications={applications} />;
}
