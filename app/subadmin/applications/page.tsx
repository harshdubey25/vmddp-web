import SubAdminApplicationsClient from "./client";
import { getFrappeWithUserToken } from "@/lib/frappeHelper";

// Lightweight interface for list view
interface ApplicationListItem {
    id: string;
    applicantName: string;
    aadharNumber: string;
    mobile: string;
    taluka: string;
    village: string;
    milkPouringPoint: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
    submittedDate: string;
    dairyAnimalData?: {
        [key: string]: any;
    };
}



export default async function SubAdminApplications({
    searchParams
}: {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        status?: string;
        search?: string;
        component?: string;
        start_date?: string;
        end_date?: string;
    }>
}) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    const status = params.status || '';
    const search = params.search || '';
    const component = params.component || '';
    const startDate = params.start_date || '';
    const endDate = params.end_date || '';

    const frappe = await getFrappeWithUserToken();

    // Build API parameters for the updated API
    const apiParams: any = {
        page: page.toString(),
        limit: limit.toString(),
    };

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
        apiParams.status = status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Add search filter if provided
    if (search && search.trim()) {
        apiParams.search = search.trim();
    }

    // Add component filter if provided and not 'all'
    if (component && component !== 'all') {
        apiParams.component = component;
    }

    // Add date filters if provided
    if (startDate) {
        apiParams.start_date = startDate;
    }

    if (endDate) {
        apiParams.end_date = endDate;
    }

    const response = await frappe.call().get('vmddp_app.api.api.get_applications_summary', apiParams);
    console.log(response)

    // Map to lightweight list items only
    const applications: ApplicationListItem[] = (response || []).message.applications.map((app: any): ApplicationListItem => {
        const component_list = Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A';
        const submittedDate = app.created_at || app.date || new Date().toISOString().split('T')[0];

        return {
            id: app.name,
            applicantName: app.fullname,
            aadharNumber: app.aadhar_number ?? '',
            mobile: app.mobile_number ?? app.mobile_no ?? '',
            taluka: app.taluka ?? '',
            village: app.village || 'N/A',
            milkPouringPoint: app.milk_pouring_point ?? '',
            component: component_list,
            status: app.status,
            submittedDate,
            dairyAnimalData: app.dairy_animal_data,
        };
    });

    const pagination = response?.message?.pagination;

    return <SubAdminApplicationsClient
        applications={applications}
        currentPage={page}
        pageSize={limit}
        initialFilters={{
            status: status || 'all',
            search: search || '',
            component: component || 'all',
            start_date: startDate || '',
            end_date: endDate || ''
        }}
        paginationData={pagination}
    />;
}