import { frappeServer } from "@/lib/frappe";
import StatsCounter from "./StatsCounter";
export default async function StatsCounterWrapper() {
    try {
        const [approvedApplicationsCount, rejectedApplicationsCount, pendingApplicationsCount, totalApplicationsCount] = await Promise.all([
            frappeServer.db().getCount("App Form", [["status", "=", "Approved"]]),
            frappeServer.db().getCount("App Form", [["status", "=", "Rejected"]]),
            frappeServer.db().getCount("App Form", [["status", "=", "Pending"]]),
            frappeServer.db().getCount("App Form", []),
        ]);

        const data = {
            approved: approvedApplicationsCount ?? 0,
            rejected: rejectedApplicationsCount ?? 0,
            pending: pendingApplicationsCount ?? 0,
            total: totalApplicationsCount ?? 0,
        };

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