
import RegisterClient from "./client";
import { frappeServer } from "@/app/lib/frappe";
export default async function RegisterPage() {
    // Server component: only renders the client component

    // Fetch criteria with child table data from custom API

    const criteriaFields = await frappeServer.call().get('vmddp_app.api.api.get_all_docs_with_children', { doctype: 'Criteria' });
    console.log("Fetched criteria fields with children:", criteriaFields);
    return <RegisterClient criteriaFields={criteriaFields.message} />;
};
