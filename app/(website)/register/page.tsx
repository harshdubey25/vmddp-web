export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import RegisterClient from "./client";
import { frappeServer } from "@/lib/frappe";
export default async function RegisterPage() {
    // Server component: only renders the client component

    // Fetch criteria with child table data from custom API
    let criteriaFieldsData: any[] = [];
    try {
        const res = await frappeServer.call().get('vmddp_app.api.api.get_criteria_details');
        console.log("Fetched criteria fields with children:", res);
        criteriaFieldsData = res?.message ?? [];
        criteriaFieldsData = Array.isArray(criteriaFieldsData)
            ? [...criteriaFieldsData].sort((a, b) => {
                const orderA = typeof a.order === 'number' ? a.order : Infinity;
                const orderB = typeof b.order === 'number' ? b.order : Infinity;
                return orderA - orderB;
            })
            .reverse()
            : [];
    } catch (error) {
        console.error("Failed to fetch criteria fields:", error);
        // Let Next.js error boundary handle the error
        throw new Error('Failed to load registration form due to server error');
    }

    return <RegisterClient criteriaFields={criteriaFieldsData} />;
};
