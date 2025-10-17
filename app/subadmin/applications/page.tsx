import { frappeServer } from "@/app/(website)/lib/frappe";
import SubAdminApplicationsClient from "./client";
import { cookies } from 'next/headers';

export const runtime = 'edge';

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
    components: {
        name: string;
        component: string;
        response: any;
    }[];
    documents: {
        name: string;
        uploaded: boolean;
        url?: string;
    }[];
    criteria: {
        label: string;
        value: string | number | null;
        response?: any;
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
    console.log(response)
    const applications: Application[] = (response || []).message.map((app: any): Application => {
        const applicantName = [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
        const componentName = app.components?.[0]?.component || 'N/A';

        // Normalize status: API may return TitleCase or lowercase; ensure allowed values
        const statusRaw = (app.status || '').toString();
        const status = (['Approved', 'Pending', 'Rejected', 'Selected'].includes(statusRaw) ? statusRaw :
            (statusRaw.toLowerCase() === 'approved' ? 'Approved' : statusRaw.toLowerCase() === 'rejected' ? 'Rejected' : statusRaw.toLowerCase() === 'selected' ? 'Selected' : 'Pending')) as
            'Approved' | 'Pending' | 'Rejected' | 'Selected';

        const submittedDate = app.creation ? new Date(app.creation).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Documents: collect known file fields (if URL treat as uploaded)
        const documents: { name: string; uploaded: boolean; url?: string }[] = [];
        if (app.self_ration_card_image) {
            documents.push({ name: 'Self Ration Card', uploaded: true, url: app.self_ration_card_image });
        }
        if (app.family_ration_card_image) {
            documents.push({ name: 'Family Ration Card', uploaded: true, url: app.family_ration_card_image });
        }
        if (app.aadhar_image && typeof app.aadhar_image === 'string' && app.aadhar_image.startsWith('http')) {
            documents.push({ name: 'Aadhar Card', uploaded: true, url: app.aadhar_image });
        }

        // Check component responses for additional documents like aadhar_image
        if (Array.isArray(app.components)) {
            app.components.forEach((component: any) => {
                if (component.response && typeof component.response === 'string') {
                    try {
                        const responseData = JSON.parse(component.response);
                        if (typeof responseData === 'object' && responseData !== null) {
                            // Check for aadhar_image in component response
                            if (responseData.aadhar_image && typeof responseData.aadhar_image === 'string') {
                                documents.push({
                                    name: `${component.component} - Aadhaar Card`,
                                    uploaded: true,
                                    url: responseData.aadhar_image
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });
        }

        // Parse components responses to extract custom question/answer pairs
        const customQuestions: { label: string; answer: string }[] = [];
        try {
            if (Array.isArray(app.components)) {
                app.components.forEach((c: any) => {
                    const resp = c.response;
                    if (typeof resp === 'string' && resp.trim()) {
                        try {
                            const parsed = JSON.parse(resp);
                            if (Array.isArray(parsed)) {
                                parsed.forEach((pq: any) => {
                                    // parsed question objects may have { question, value } or { name }
                                    const label = pq.question || pq.name || pq.label || '';
                                    const answer = pq.value != null ? String(pq.value) : (pq.answer != null ? String(pq.answer) : '');
                                    if (label) customQuestions.push({ label, answer });
                                });
                            } else if (typeof parsed === 'object') {
                                // object - flatten
                                Object.entries(parsed).forEach(([k, v]) => customQuestions.push({ label: k, answer: String(v) }));
                            }
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                });
            }
        } catch (e) {
            // swallow
        }

        // Criteria responses can also contain useful info (e.g., tag numbers) - attempt to extract
        try {
            if (Array.isArray(app.criteria)) {
                app.criteria.forEach((crit: any) => {
                    const resp = crit.response;
                    if (typeof resp === 'string' && resp.trim()) {
                        try {
                            const parsed = JSON.parse(resp);
                            if (Array.isArray(parsed)) {
                                parsed.forEach((pq: any) => {
                                    const label = pq.question || pq.name || pq.label || crit.criteria || '';
                                    const answer = pq.value != null ? String(pq.value) : '';
                                    if (label) customQuestions.push({ label, answer });
                                });
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                });
            }
        } catch (e) {
            // ignore
        }

        // Family aadhar numbers: API may return single value or null
        const familyAadharNumbers: string[] = [];
        if (app.family_member_aadhar_number) {
            if (Array.isArray(app.family_member_aadhar_number)) {
                familyAadharNumbers.push(...app.family_member_aadhar_number.filter(Boolean).map(String));
            } else if (typeof app.family_member_aadhar_number === 'string') {
                // handle comma separated or single value
                const parts = app.family_member_aadhar_number.split ? app.family_member_aadhar_number.split(',').map((s: string) => s.trim()).filter(Boolean) : [app.family_member_aadhar_number];
                familyAadharNumbers.push(...parts);
            }
        }

        // Map criteria
        const criteria: { label: string; value: string | number | null; response?: any }[] = [];
        if (Array.isArray(app.criteria)) {
            app.criteria.forEach((crit: any) => {
                criteria.push({
                    label: crit.criteria || '',
                    value: crit.value,
                    response: crit.response
                });
            });
        }

        return {
            id: app.name,
            applicantName,
            fatherName: app.father_name || app.father || 'N/A',
            mobile: app.mobile_no || '',
            district: app.district || 'N/A',
            taluka: app.taluka || 'N/A',
            village: app.village || 'N/A',
            component: componentName,
            status,
            submittedDate,
            animalCount: app.number_of_animals ? parseInt(app.number_of_animals) : undefined,
            approver: app.approver || undefined,
            gender: app.gender || 'N/A',
            caste: app.category || 'N/A',
            // show uploaded URL if present so UI can link; otherwise show the stored value
            aadharNumber: (app.aadhar_number && typeof app.aadhar_number === 'string' && app.aadhar_number.startsWith('http')) ? app.aadhar_number : (app.aadhar_number || ''),
            rationCardMembers: parseInt(app.number_of_members_in_ration_card) || 0,
            familyAadharNumbers,
            animalTagNumber: undefined,
            landHolding: parseFloat(app.land_holding) || 0,
            khasraNumber: app.khasra_number || 'N/A',
            milkPouringPoint: app.milk_pouring_point || 'N/A',
            farmerPourerCode: app.farmer_pourer_code || 'N/A',
            components: Array.isArray(app.components) ? app.components.map((c: any) => ({
                name: c.name,
                component: c.component,
                response: c.response
            })) : [],
            documents,
            criteria
        };
    });

    return <SubAdminApplicationsClient applications={applications} />;
}