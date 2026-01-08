"use client"
import { useFrappeGetCall } from "frappe-react-sdk";
import { ListSkeleton } from "@/components/LoadingSkeletons";
import RecentApplicationsClient from "./recent-applications-client";

interface Application {
    id: string;
    applicant: string;
    component: string;
    village: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Selected';
    date: string;
}

interface ApiResponse {
    message: {
        applications: Array<{
            name: string;
            fullname: string;
            component_list: string;
            village: string;
            status: 'Approved' | 'Pending' | 'Rejected' | 'Selected';
            date: string;
        }>;
    };
}

export function RecentApplicationsList() {
    const { data: response, isLoading } = useFrappeGetCall<ApiResponse>(
        'vmddp_app.api.api.get_applications_summary',
        { limit: 5, order_by: 'creation desc' },
        undefined,
        { revalidateOnFocus: false }
    );

    if (isLoading) {
        return <ListSkeleton />;
    }

    // Process applications data
    const applications: Application[] = (response?.message?.applications || []).map((app): Application => {
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

export default RecentApplicationsList;
