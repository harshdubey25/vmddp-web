"use client"
import { useEffect, useState } from "react";
import { frappePublic } from "@/lib/frappe";
import StatsCounter from "./StatsCounter";

export default function StatsCounterWrapper() {
    const [data, setData] = useState({
        approved: 0,
        rejected: 0,
        pending: 0,
        total: 0,
        fetchError: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await frappePublic.call().get('vmddp_app.vmddp.doctype.app_form.app_form.get_applications_by_district_component');

                setData({
                    approved: response?.message?.approved ?? 0,
                    rejected: response?.message?.rejected ?? 0,
                    pending: response?.message?.pending ?? 0,
                    total: response?.message?.total ?? 0,
                    fetchError: false,
                });
            } catch (error) {
                console.error("Failed to fetch application counts for AboutSection:", error);
                setData({
                    approved: 0,
                    rejected: 0,
                    pending: 0,
                    total: 0,
                    fetchError: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <StatsCounter data={{ approved: 0, rejected: 0, pending: 0, total: 0 }} />;
    }

    return <StatsCounter data={data} />;
}