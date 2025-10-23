export const runtime = 'edge'; // Ensure the page uses the Edge runtime
export const dynamic = 'force-dynamic';
import RegisterClient from "./client";
import { frappeServer, frappePublic } from "@/lib/frappe";
export default async function RegisterPage() {
    // Server component: only renders the client component

    // Fetch criteria with child table data from custom API
    let criteriaFieldsData: any[] = [];
    try {
        const res = await frappeServer.call().get('vmddp_app.api.api.get_all_docs_with_children', { doctype: 'Criteria' });
        console.log("Fetched criteria fields with children:", res);
        criteriaFieldsData = res?.message ?? [];
    } catch (error) {
        console.error("Failed to fetch criteria fields:", error);
        // Let Next.js error boundary handle the error
        throw new Error('Failed to load registration form due to server error');
    }

    return <RegisterClient criteriaFields={criteriaFieldsData} />;
};
