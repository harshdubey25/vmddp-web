"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AdminApplicationsClient from "./AdminApplicationsClient";
import { frappeBrowser } from "@/lib/frappe";

export interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "Pending" | "Approved" | "Rejected" | "Selected" | "Not Assigned";
    submittedDate: string;
    animalCount?: number;
    approver?: string;
    gender: string;
    caste: string;
    aadharNumber: string;
    rationCardMembers: number;
    familyAadharNumbers: string[];
    animalTagNumber?: string;
    landHolding: number;
    khasraNumber: string;
    milkPouringPoint: string;
    farmerPourerCode: string;
    componentDetails: {
        benefits: string[];
        customQuestions: { label: string; answer: string }[];
    };
    documents: {
        name: string;
        uploaded: boolean;
        url?: string;
    }[];
    criteria?: Array<{
        name: string;
        criteria: string;
        value: string;
        type?: string;
    }>;
    dairyAnimalData?: {
        [key: string]: any;
    };
}

type FrappeApp = {
    created_at: string;
    name: string;
    fullname?: string;
    mobile_number?: string;
    mobile_no?: string;
    district?: string;
    village?: string;
    component_list?: string | string[];
    status?: string;
    date?: string;
    creation?: string;
    approver?: string;
    aadhar_number?: string;
    taluka?: string;
    milk_pouring_point?: string;
    dairy_animal_data?: {
        [key: string]: any;
    };
};

async function getApplications(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
    district?: string,
    component?: string,
    startDate?: string,
    endDate?: string
): Promise<{ applications: Application[], pagination?: any }> {
    console.log("status:", status, "search:", search, "district:", district, "component:", component);
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

    // Add district filter if provided and not 'all'
    if (district && district !== 'all') {
        apiParams.district = district;
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

    const mappedApplications = (response.message?.applications || []).map((app: FrappeApp) => {
        // Handle component_list - it might be a string or array
        let componentValue = 'N/A';
        if (Array.isArray(app.component_list)) {
            componentValue = app.component_list.join(', ');
        } else if (typeof app.component_list === 'string') {
            componentValue = app.component_list;
        }

        const mapped = {
            id: app.name,
            applicantName: app.fullname ?? 'Unknown',
            fatherName: '',
            mobile: app.mobile_number ?? app.mobile_no ?? '',
            district: app.district ?? 'N/A',
            taluka: app.taluka ?? '',
            village: app.village ?? '',
            component: componentValue,
            status: app.status,
            // Use full creation datetime for submittedDate
            submittedDate: app.created_at ?? app.date ?? '',
            animalCount: undefined,
            approver: app.approver,
            gender: '',
            caste: '',
            aadharNumber: app.aadhar_number ?? '',
            rationCardMembers: 0,
            familyAadharNumbers: [],
            animalTagNumber: '',
            landHolding: 0,
            khasraNumber: '',
            milkPouringPoint: app.milk_pouring_point,
            farmerPourerCode: '',
            componentDetails: {
                benefits: [],
                customQuestions: [],
            },
            documents: [],
            dairyAnimalData: app.dairy_animal_data,
        };
        return mapped;
    });

    return {
        applications: mappedApplications,
        pagination: response.message?.pagination
    };
}

export default function Page() {
    const searchParams = useSearchParams();

    const [applications, setApplications] = useState<Application[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || 'all';
    const component = searchParams.get('component') || 'all';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        try {
            const { applications: fetchedApplications, pagination: fetchedPagination } =
                await getApplications(page, limit, status, search, district, component, startDate, endDate);
            setApplications(fetchedApplications);
            setPagination(fetchedPagination);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, status, search, district, component, startDate, endDate]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <AdminApplicationsClient
            applications={applications}
            currentPage={page}
            pageSize={limit}
            initialFilters={{
                status,
                search,
                district,
                component,
                start_date: startDate,
                end_date: endDate
            }}
            paginationData={pagination}
        />
    );
}
