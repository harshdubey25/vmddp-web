"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SubAdminApplicationsClient from "./client";
import { frappeBrowser } from "@/lib/frappe";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lightweight interface for list view
interface ApplicationListItem {
    id: string;
    applicantName: string;
    aadharNumber: string;
    mobile: string;
    taluka: string;
    village: string;
    milkPouringPoint: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
    submittedDate: string;
    dairyAnimalData?: {
        [key: string]: any;
    };
}

async function getApplications(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
    component?: string,
    startDate?: string,
    endDate?: string
): Promise<{ applications: ApplicationListItem[], pagination?: any }> {
    const apiParams: any = {
        page: page.toString(),
        limit: limit.toString(),
    };

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
        apiParams.status = status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Add search filter if provided
    if (search && search.trim()) {
        apiParams.search = search.trim();
    }

    // Add component filter if provided and not 'all'
    if (component && component !== 'all') {
        apiParams.component = component;
    }

    // Add date filters if provided
    if (startDate) {
        apiParams.start_date = startDate;
    }

    if (endDate) {
        apiParams.end_date = endDate;
    }

    const response = await frappeBrowser.call().get('vmddp_app.api.api.get_applications_summary', apiParams);

    const applications: ApplicationListItem[] = (response?.message?.applications || []).map((app: any): ApplicationListItem => {
        const component_list = Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A';
        const submittedDate = app.created_at || app.date || new Date().toISOString().split('T')[0];

        return {
            id: app.name,
            applicantName: app.fullname,
            aadharNumber: app.aadhar_number ?? '',
            mobile: app.mobile_number ?? app.mobile_no ?? '',
            taluka: app.taluka ?? '',
            village: app.village || 'N/A',
            milkPouringPoint: app.milk_pouring_point ?? '',
            component: component_list,
            status: app.status,
            submittedDate,
            dairyAnimalData: app.dairy_animal_data,
        };
    });

    return {
        applications,
        pagination: response?.message?.pagination
    };
}

export default function SubAdminApplications() {
    const searchParams = useSearchParams();

    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const component = searchParams.get('component') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        try {
            const { applications: fetchedApplications, pagination: fetchedPagination } =
                await getApplications(page, limit, status, search, component, startDate, endDate);
            setApplications(fetchedApplications);
            setPagination(fetchedPagination);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, status, search, component, startDate, endDate]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Skeleton */}
                <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                    <div>
                        <Skeleton className="h-5 sm:h-6 w-40 mb-1" />
                        <Skeleton className="h-3 sm:h-4 w-56 hidden sm:block" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </header>

                <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                    <Card>
                        <CardHeader className="pb-4">
                            {/* Filters Skeleton */}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Skeleton className="h-10 flex-1" />
                                    <div className="flex gap-2 flex-wrap">
                                        <Skeleton className="h-10 w-[140px]" />
                                        <Skeleton className="h-10 w-[140px]" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-10 w-[150px]" />
                                    <Skeleton className="h-10 w-[150px]" />
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Table Header Skeleton */}
                            <div className="hidden md:flex items-center gap-4 p-3 border-b bg-muted/50 rounded-t-lg">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32 flex-1" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            {/* Table Rows Skeleton */}
                            <div className="space-y-0">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border-b"
                                    >
                                        <Skeleton className="h-4 w-28" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-28 md:hidden" />
                                        </div>
                                        <Skeleton className="h-4 w-24 hidden md:block" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-4 w-24 hidden md:block" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Skeleton */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <Skeleton className="h-4 w-40" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-9" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <SubAdminApplicationsClient
            applications={applications}
            currentPage={page}
            pageSize={limit}
            initialFilters={{
                status: status || 'all',
                search: search || '',
                component: component || 'all',
                start_date: startDate || '',
                end_date: endDate || ''
            }}
            paginationData={pagination}
        />
    );
}