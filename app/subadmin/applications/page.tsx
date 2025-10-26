import SubAdminApplicationsClient from "./client";
import { getFrappeWithUserToken } from "@/lib/frappeHelper";
export const runtime = 'edge';

// Lightweight interface for list view
interface ApplicationListItem {
    id: string;
    applicantName: string;
    village: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
    submittedDate: string;
}



export default async function SubAdminApplications({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string; status?: string }> }) {
    const page = parseInt((await searchParams).page || '1');
    const limit = parseInt((await searchParams).limit || '20');
    const status = (await searchParams).status || '';
    const statusFilter = status && status !== 'all' ? { "status": status } : {};
    const frappe = await getFrappeWithUserToken();
    const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', {
        page: page.toString(),
        limit: limit.toString(),
        filters: statusFilter
    });
    console.log(response)  

    // Map to lightweight list items only
    const applications: ApplicationListItem[] = (response || []).message.applications.map((app: any): ApplicationListItem => {
        const component_list = Array.isArray(app.component_list) ? app.component_list.map((comp: any) => comp).join(', ') : 'N/A';
        const submittedDate = app.creation ? new Date(app.creation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        return {
            id: app.name,
            applicantName: app.fullname,
            village: app.village || 'N/A',
            component: component_list,
            status: app.status,
            submittedDate,
        };
    });

    return <SubAdminApplicationsClient applications={applications} currentPage={page} pageSize={limit} />;
}