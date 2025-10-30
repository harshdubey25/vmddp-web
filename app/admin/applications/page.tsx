// Server component for admin applications page
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import AdminApplicationsClient from "./AdminApplicationsClient";
import { frappeServer } from "@/lib/frappe";

export interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "Pending" | "Approved" | "Rejected" | "Selected";
    submittedDate: string;
    animalCount?: number;
    approver?: string;
    gender: string;
    caste: string;
    aadharNumber: string;
    rationCardMembers: number;
    familyAadharNumbers: string[];
    animalTagNumber?: string;
    landHolding: number;
    khasraNumber: string;
    milkPouringPoint: string;
    farmerPourerCode: string;
    componentDetails: {
        benefits: string[];
        customQuestions: { label: string; answer: string }[];
    };
    documents: {
        name: string;
        uploaded: boolean;
        url?: string;
    }[];
}

async function getApplications(page: number = 1, limit: number = 20): Promise<Application[]> {
    const response = await frappeServer.call().get('vmddp_app.api.api.get_applications_summary', {
        page: page.toString(),
        limit: limit.toString()
    });
    console.log('API Response:', response);
    console.log('Applications raw data:', response.message?.applications);

    type FrappeApp = {
        name: string;
        fullname?: string;
        mobile_number?: string;
        mobile_no?: string;
        district?: string;
        village?: string;
        component_list?: string | string[];
        status?: string;
        date?: string;
        creation?: string;
        approver?: string;
    };

    const mappedApplications = (response.message?.applications || []).map((app: FrappeApp) => {
        console.log('Mapping application:', app);

        // Handle component_list - it might be a string or array
        let component = 'N/A';
        if (Array.isArray(app.component_list)) {
            component = app.component_list.join(', ');
        } else if (typeof app.component_list === 'string') {
            component = app.component_list;
        }

        const mapped = {
            id: app.name,
            applicantName: app.fullname ?? 'Unknown',
            fatherName: '',
            mobile: app.mobile_number ?? app.mobile_no ?? '',
            district: app.district ?? 'N/A',
            taluka: '',
            village: app.village ?? '',
            component: component,
            status: app.status,
            submittedDate: app.date ?? app.creation ?? '',
            animalCount: undefined,
            approver: app.approver,
            gender: '',
            caste: '',
            aadharNumber: '',
            rationCardMembers: 0,
            familyAadharNumbers: [],
            animalTagNumber: '',
            landHolding: 0,
            khasraNumber: '',
            milkPouringPoint: '',
            farmerPourerCode: '',
            componentDetails: {
                benefits: [],
                customQuestions: [],
            },
            documents: [],
        };
        console.log('Mapped application:', mapped);
        return mapped;
    });

    return mappedApplications;
}

export default async function Page({ searchParams }: { searchParams: { page?: string; limit?: string } }) {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '20');

    const applications = await getApplications(page, limit);
    console.log('Loaded applications:', applications);
    return <AdminApplicationsClient applications={applications} currentPage={page} pageSize={limit} />;
}
