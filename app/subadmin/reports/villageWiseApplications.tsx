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
                <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl">{t('villageWiseApplications')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('applicationStatusByVillage')}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-center h-[200px] sm:h-[250px] md:h-[300px]">
                        <div className="text-muted-foreground text-xs sm:text-sm">{t('loading')}</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl">{t('villageWiseApplications')}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('applicationStatusByVillage')}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-center h-[200px] sm:h-[250px] md:h-[300px]">
                        <div className="text-destructive text-xs sm:text-sm">{t('error_loading_data')}</div>
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
            <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">{t('villageWiseApplications')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('applicationStatusByVillage')}</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px] md:!h-[300px]">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="village"
                            tick={{ fontSize: 10 }}
                            className="sm:!text-xs"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis tick={{ fontSize: 10 }} className="sm:!text-xs" />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} className="sm:!text-xs" />
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