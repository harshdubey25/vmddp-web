'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useTranslation } from "react-i18next";

interface VillageData {
    village_id: string;
    village_name: string;
    village_local_name: string;
    district: string;
    taluka: string;
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    selected_applications: number;
}

interface VillageApiResponse {
    villages: VillageData[];
    total_villages: number;
    user_district: string | null;
}

interface ChartDataItem {
    village: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    selected: number;
    [key: string]: string | number;
}

export default function VillageWiseApplications() {
    const { t, i18n } = useTranslation();

    const { data, error, isLoading } = useFrappeGetCall<VillageApiResponse>(
        'vmddp_app.api.v1.dashboard.app_forms_by_villages'
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('villageWiseApplications')}</CardTitle>
                    <CardDescription>{t('applicationStatusByVillage')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="text-muted-foreground">{t('loading')}</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('villageWiseApplications')}</CardTitle>
                    <CardDescription>{t('applicationStatusByVillage')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="text-destructive">{t('error_loading_data')}</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Transform data for chart
    const chartData: ChartDataItem[] = data?.villages?.map((village) => {
        const villageName = i18n.language === 'mr' && village.village_local_name
            ? village.village_local_name
            : village.village_name;

        return {
            village: villageName,
            total: village.total_applications,
            pending: village.pending_applications,
            approved: village.approved_applications,
            rejected: village.rejected_applications,
            selected: village.selected_applications,
        };
    }) || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('villageWiseApplications')}</CardTitle>
                <CardDescription>{t('applicationStatusByVillage')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="village"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="hsl(var(--chart-1))" name={t('total')} />
                        <Bar dataKey="pending" fill="hsl(var(--chart-2))" name={t('pending')} />
                        <Bar dataKey="approved" fill="hsl(var(--chart-3))" name={t('approved')} />
                        <Bar dataKey="rejected" fill="hsl(var(--chart-4))" name={t('rejected')} />
                        <Bar dataKey="selected" fill="hsl(var(--chart-5))" name={t('selected')} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}