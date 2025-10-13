// Server component for admin applications page
import AdminApplicationsClient from "./AdminApplicationsClient";

export interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "pending" | "approved" | "rejected";
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


import { frappeServer } from "@/app/lib/frappe";

async function getApplications(): Promise<Application[]> {
    const response = await frappeServer.call().get('vmddp_app.api.api.get_all_docs_with_children', { doctype: 'App Form' });
    type FrappeApp = {
        name: string;
        first_name?: string;
        mid_name?: string;
        last_name?: string;
        father_name?: string;
        mobile?: string;
        district?: string;
        taluka?: string;
        village?: string;
        component_name?: string;
        components?: { component_name?: string; name: string }[];
        status?: string;
        creation?: string;
        approver?: string;
        gender?: string;
        category?: string;
        aadhar_number?: string;
        ration_card_members?: number;
        family_aadhar_numbers?: string[];
        animal_tag_number?: string;
        land_holding?: number;
        khasra_number?: string;
        milk_pouring_point?: string;
        farmer_pourer_code?: string;
        component_details?: {
            benefits?: string[];
            custom_questions?: { label: string; answer: string }[];
        };
        documents?: {
            name: string;
            uploaded: boolean;
            url?: string;
        }[];
    };

    return (response.message || []).map((app: FrappeApp) => ({
        id: app.name,
        applicantName: `${app.first_name ?? ''} ${app.mid_name ?? ''} ${app.last_name ?? ''}`.trim(),
        fatherName: app.father_name ?? '',
        mobile: app.mobile ?? '',
        district: app.district ?? '',
        taluka: app.taluka ?? '',
        village: app.village ?? '',
        component: Array.isArray(app.components)
            ? app.components.map(c => c.component_name || c.name).join(', ')
            : app.component_name ?? '',
        status: (app.status as "pending" | "approved" | "rejected") ?? "pending",
        submittedDate: app.creation ? app.creation.split(' ')[0] : '',
        animalCount: undefined,
        approver: app.approver ?? '',
        gender: app.gender ?? '',
        category: app.category ?? '',
        aadharNumber: app.aadhar_number ?? '',
        rationCardMembers: app.ration_card_members ?? 0,
        familyAadharNumbers: app.family_aadhar_numbers ?? [],
        animalTagNumber: app.animal_tag_number ?? '',
        landHolding: app.land_holding ?? 0,
        khasraNumber: app.khasra_number ?? '',
        milkPouringPoint: app.milk_pouring_point ?? '',
        farmerPourerCode: app.farmer_pourer_code ?? '',
        componentDetails: {
            benefits: app.component_details?.benefits ?? [],
            customQuestions: app.component_details?.custom_questions ?? [],
        },
        documents: app.documents ?? [],
    }));
}

export default async function AdminApplicationsServer() {
    const applications = await getApplications();
    console.log('Loaded applications:', applications);
    return <AdminApplicationsClient applications={applications} />;
}
