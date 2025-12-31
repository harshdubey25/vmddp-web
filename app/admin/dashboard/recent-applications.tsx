"use client";

import { useEffect, useState } from "react";
import { frappeBrowser } from "@/lib/frappe";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Application {
    id: string;
    applicant: string;
    component: string;
    district: string;
    status: string;
    date: string;
}

function RecentApplicationsSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border gap-2 sm:gap-0"
                >
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function RecentApplicationsDashboard() {
    const [recentApplications, setRecentApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchApplications() {
            try {
                const applicationsResponse = await frappeBrowser.call().get('vmddp_app.api.api.get_applications_summary', {
                    page: '1',
                    limit: '5',
                    order_by: 'creation desc'
                });

                const applications = (applicationsResponse?.message?.applications || []).map((app: any) => ({
                    id: app.name,
                    applicant: app.fullname,
                    component: Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A',
                    district: app.district || 'N/A',
                    status: app.status,
                    date: app.date,
                }));
                setRecentApplications(applications);
            } catch (error) {
                console.error('Error fetching applications summary:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchApplications();
    }, []);

    if (isLoading) {
        return <RecentApplicationsSkeleton />;
    }

    return (
        <div className="space-y-3">
            {recentApplications.map((app, index) => (
                <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border hover-elevate gap-2 sm:gap-0"
                    data-testid={`application-${index}`}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                            <p className="font-semibold text-xs sm:text-sm">{app.id}</p>
                            <Badge
                                variant={app.status === "approved" ? "default" : "secondary"}
                                className={`text-xs ${app.status === "approved" ? "bg-chart-3" : ""}`}
                            >
                                {app.status}
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{app.applicant}</p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{app.component}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{app.district}</span>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs text-muted-foreground">{app.date}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}