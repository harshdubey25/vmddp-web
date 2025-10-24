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
    console.log(response)

    type FrappeApp = {
        name: string;
        fullname?: string;
        mobile_number?: string;
        district?: string;
        village?: string;
        component_list?: string[];
        status?: string;
        date?: string;
    };

    return (response.message?.applications || []).map((app: FrappeApp) => ({
        id: app.name,
        applicantName: app.fullname ?? '',
        fatherName: '',
        mobile: app.mobile_number ?? '',
        district: app.district ?? '',
        taluka: '',
        village: app.village ?? '',
        component: Array.isArray(app.component_list)
            ? app.component_list.join(', ')
            : '',
        status: app.status,
        submittedDate: app.date ?? '',
        animalCount: undefined,
        approver: '',
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
    }));
}

export default async function Page({ searchParams }: { searchParams: { page?: string; limit?: string } }) {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '20');

    const applications = await getApplications(page, limit);
    console.log('Loaded applications:', applications);
    return <AdminApplicationsClient applications={applications} currentPage={page} pageSize={limit} />;
}
