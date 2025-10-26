"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useFrappeGetCall } from "frappe-react-sdk";

const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

interface ChartDataItem {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

export default function ApplicationByComponent() {
    const { data: response, isLoading, error } = useFrappeGetCall('vmddp_app.api.v1.dashboard.app_forms_by_components', undefined, undefined, {
        revalidateOnFocus: false,
    });

    // Transform API data to chart format
    const componentData: ChartDataItem[] = response?.message?.components?.map((component: any, index: number) => ({
        name: component.component_name,
        value: component.total_applications,
        color: CHART_COLORS[index % CHART_COLORS.length],
    })) || [];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applications by Component</CardTitle>
                    <CardDescription>Distribution across different schemes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !componentData.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applications by Component</CardTitle>
                    <CardDescription>Distribution across different schemes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        {error ? 'Error loading data' : 'No data available'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Applications by Component</CardTitle>
                <CardDescription>Distribution across different schemes</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                        <Pie
                            data={componentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {componentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}