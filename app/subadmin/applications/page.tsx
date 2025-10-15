import { frappeServer } from "@/app/lib/frappe";
import SubAdminApplicationsClient from "./client";
import { cookies } from 'next/headers';

interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
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

// Server-side function to get current user district
async function getCurrentUserDistrict(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('frappe_access_token')?.value;

        if (!token) {
            return null;
        }

        // Get logged in user
        const userResp = await fetch(
            `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/frappe.auth.get_logged_user`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!userResp.ok) {
            return null;
        }

        const userData = await userResp.json();
        const userId = userData.message;

        // Get user details including district
        const userDetailsResp = await fetch(
            `${process.env.NEXT_PUBLIC_FRAPPE_BASE_URL}/api/method/vmddp_app.api.user.get_user_details?user_id=${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (userDetailsResp.ok) {
            const userDetails = await userDetailsResp.json();
            return userDetails.message?.dpo?.district || null;
        }

        return null;
    } catch (error) {
        console.error('Error getting current user district:', error);
        return null;
    }
}

export default async function SubAdminApplications() {
    // Get current user's district
    const userDistrict = await getCurrentUserDistrict();

    // Fetch applications with district filter if user district is available
    const filters: any = { doctype: 'App Form' };
    if (userDistrict) {
        filters.filters = { district: userDistrict };
    }

    const response = await frappeServer.call().get('vmddp_app.api.api.get_all_docs_with_children', filters);

    const applications: Application[] = (response || []).message.map((app: any): Application => {
        const applicantName = [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
        const component = app.components?.[0]?.component || 'N/A';
        // Use the status field directly from the API response
        const status: 'Approved' | 'Pending' | 'Rejected' | 'Selected' = app.status === 'pending' ? 'Pending' :
            app.status === 'approved' ? 'Approved' :
                app.status === 'rejected' ? 'Rejected' :
                    app.status === 'selected' ? 'Selected' : 'Pending';
        const submittedDate = new Date(app.creation).toISOString().split('T')[0];

        // Map documents
        const documents = [];
        if (app.self_ration_card_image) {
            documents.push({ name: 'Self Ration Card', uploaded: true, url: app.self_ration_card_image });
        }
        if (app.family_ration_card_image) {
            documents.push({ name: 'Family Ration Card', uploaded: true, url: app.family_ration_card_image });
        }
        if (app.aadhar_number && app.aadhar_number.startsWith('http')) {
            documents.push({ name: 'Aadhar Card', uploaded: true, url: app.aadhar_number });
        }

        return {
            id: app.name,
            applicantName,
            fatherName: 'N/A', // Not in API
            mobile: app.mobile_no || '',
            district: app.district || 'N/A',
            taluka: app.taluka || 'N/A',
            village: app.village || 'N/A',
            component,
            status: app.status,
            submittedDate,
            animalCount: undefined, // Not in API
            gender: app.gender || 'N/A',
            caste: app.category || 'N/A',
            aadharNumber: app.aadhar_number?.startsWith('http') ? 'Uploaded' : app.aadhar_number || '',
            rationCardMembers: parseInt(app.number_of_members_in_ration_card) || 0,
            familyAadharNumbers: app.family_member_aadhar_number ? [app.family_member_aadhar_number] : [],
            animalTagNumber: undefined, // Not in API
            landHolding: 0, // Not in API
            khasraNumber: 'N/A', // Not in API
            milkPouringPoint: 'N/A', // Not in API
            farmerPourerCode: 'N/A', // Not in API
            componentDetails: {
                benefits: [], // Could map from components if available
                customQuestions: [] // Could map from criteria if available
            },
            documents
        };
    });

    return <SubAdminApplicationsClient applications={applications} />;
}