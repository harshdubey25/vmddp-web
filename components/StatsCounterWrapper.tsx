import { frappeServer } from "@/lib/frappe";
import StatsCounter from "./StatsCounter";

// Disable caching - fetch fresh data on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatsCounterWrapper() {
    try {
        const response = await frappeServer.call().get('vmddp_app.vmddp.doctype.app_form.app_form.get_applications_by_district_component');

        const data = {
            approved: response.message?.approved ?? 0,
            rejected: response.message?.rejected ?? 0,
            pending: response.message?.pending ?? 0,
            total: response.message?.total ?? 0,
        };
        console.log(response, data)
        return <StatsCounter data={data} />;
    } catch (error) {
        console.error("Failed to fetch application counts for AboutSection:", error);

        const data = {
            approved: 0,
            rejected: 0,
            pending: 0,
            total: 0,
            fetchError: true,
        };

        return <StatsCounter data={data} />;
    }
}