"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { frappeBrowser } from "@/lib/frappe";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Eye, FileSpreadsheet, FileText } from "lucide-react";
import { useExport } from "@/hooks/use-export";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { useFrappeGetDocList } from "frappe-react-sdk";

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

interface PaginationData {
    current_page: number;
    page_size: number;
    total_applications: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
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
): Promise<{ applications: Application[]; pagination?: PaginationData }> {
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

function buildExportParams(
    status: string,
    search: string,
    district: string,
    component: string,
    startDate: string,
    endDate: string
) {
    const params: Record<string, string> = {};

    if (status !== "all") {
        params.status = status.charAt(0).toUpperCase() + status.slice(1);
    }

    if (search.trim()) {
        params.search = search.trim();
    }

    if (district !== "all") {
        params.district = district;
    }

    if (component !== "all") {
        params.component = component;
    }

    if (startDate) {
        params.start_date = startDate;
    }

    if (endDate) {
        params.end_date = endDate;
    }

    return params;
}

function buildExportFilename(prefix: string, status: string, search: string, district: string, component: string) {
    const parts: string[] = [];

    if (status !== "all") parts.push(status.replace(/\s+/g, "_"));
    if (district !== "all") parts.push(district.replace(/\s+/g, "_"));
    if (component !== "all") parts.push(component.replace(/\s+/g, "_"));
    if (search.trim()) parts.push(`q-${search.trim().replace(/\s+/g, "_")}`);

    return parts.length ? `${prefix}-${parts.join("-")}` : prefix;
}

export default function Page() {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [applications, setApplications] = useState<Application[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isListLoading, setIsListLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [districtFilter, setDistrictFilter] = useState(searchParams.get("district") || "all");
    const [componentFilter, setComponentFilter] = useState(searchParams.get("component") || "all");
    const [dateFrom, setDateFrom] = useState(searchParams.get("start_date") || "");
    const [dateTo, setDateTo] = useState(searchParams.get("end_date") || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [pageSize] = useState(parseInt(searchParams.get("limit") || "20"));

    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const { toast } = useToast();
    const { isExporting, handleExport: exportApplications } = useExport({
        method: "vmddp_app.api.api.get_applications_summary_export",
        filename: "applications",
    });

    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });
    const districts = frappeDistricts ? frappeDistricts.map((district: any) => district.name1) : [];

    const { data: frappeComponents, isLoading: componentsLoading } = useFrappeGetDocList("Component", {
        filters: [["dont_show_in_website", "=", 0]],
        fields: ["component_name"],
        orderBy: {
            field: "component_name",
            order: "asc",
        },
        limit: 100,
    });
    const components = frappeComponents ? frappeComponents.map((component: any) => component.component_name) : [];

    const updateUrl = useCallback((nextPage: number) => {
        const params = new URLSearchParams();

        if (statusFilter !== "all") {
            params.set("status", statusFilter);
        }

        if (districtFilter !== "all") {
            params.set("district", districtFilter);
        }

        if (componentFilter !== "all") {
            params.set("component", componentFilter);
        }

        if (debouncedSearchQuery) {
            params.set("search", debouncedSearchQuery);
        }

        if (dateFrom) {
            params.set("start_date", dateFrom);
        }

        if (dateTo) {
            params.set("end_date", dateTo);
        }

        if (nextPage > 1) {
            params.set("page", nextPage.toString());
        }

        if (pageSize !== 20) {
            params.set("limit", pageSize.toString());
        }

        const queryString = params.toString();
        const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
        window.history.replaceState(null, "", nextUrl);
    }, [componentFilter, dateFrom, dateTo, debouncedSearchQuery, districtFilter, pageSize, pathname, statusFilter]);

    const fetchApplications = useCallback(async () => {
        if (isLoading) {
            setIsLoading(true);
        } else {
            setIsListLoading(true);
        }

        try {
            const { applications: fetchedApplications, pagination: fetchedPagination } =
                await getApplications(
                    currentPage,
                    pageSize,
                    statusFilter,
                    debouncedSearchQuery,
                    districtFilter,
                    componentFilter,
                    dateFrom,
                    dateTo
                );
            setApplications(fetchedApplications);
            setPagination(fetchedPagination ?? null);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
            setIsListLoading(false);
        }
    }, [componentFilter, currentPage, dateFrom, dateTo, debouncedSearchQuery, districtFilter, isLoading, pageSize, statusFilter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    useEffect(() => {
        setCurrentPage(1);
    }, [componentFilter, dateFrom, dateTo, debouncedSearchQuery, districtFilter, statusFilter]);

    useEffect(() => {
        updateUrl(currentPage);
    }, [currentPage, updateUrl]);

    const handleViewDetails = (application: Application) => {
        setSelectedApp(application);
    };

    const handleReview = (action: "approve" | "reject", remarks: string) => {
        console.log(`${action} application with remarks:`, remarks);
        setSelectedApp(null);
    };

    const handleExport = useCallback((format: "excel" | "pdf") => {
        if (!applications.length) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        void exportApplications({
            format,
            filename: buildExportFilename("applications-page", statusFilter, searchQuery, districtFilter, componentFilter),
            params: {
                ...buildExportParams(statusFilter, searchQuery, districtFilter, componentFilter, dateFrom, dateTo),
                page: currentPage.toString(),
                limit: pageSize.toString(),
            },
        });
    }, [applications.length, componentFilter, currentPage, dateFrom, dateTo, districtFilter, exportApplications, pageSize, searchQuery, statusFilter, toast]);

    const handleExportAll = useCallback((format: "excel" | "pdf") => {
        if (!pagination?.total_applications) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        void exportApplications({
            format,
            filename: buildExportFilename("applications", statusFilter, searchQuery, districtFilter, componentFilter),
            params: buildExportParams(statusFilter, searchQuery, districtFilter, componentFilter, dateFrom, dateTo),
        });
    }, [componentFilter, dateFrom, dateTo, districtFilter, exportApplications, pagination?.total_applications, searchQuery, statusFilter, toast]);

    const renderLoadingRows = () => (
        <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="border-b">
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-2 sm:p-4 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-2 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-2 sm:p-4 hidden xl:table-cell"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="p-2 sm:p-4 hidden xl:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
            ))}
        </tbody>
    );

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
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-xl" data-testid="text-applications-title">
                        Applications Management
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        Review and manage farmer applications
                    </p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="button-export" disabled={isExporting}>
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Export Page</span>
                                <span className="sm:hidden">Page</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("excel")}>
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                <FileText className="w-4 h-4" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="button-export-all" disabled={isExporting}>
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Export All</span>
                                <span className="sm:hidden">All</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExportAll("excel")}>
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportAll("pdf")}>
                                <FileText className="w-4 h-4" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30 ">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg">All Applications</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {pagination?.total_applications} applications found
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID or name..."
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        className="pl-10"
                                        data-testid="input-search"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger data-testid="select-status-filter">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                        <SelectItem value="Selected">Selected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                                    <SelectTrigger data-testid="select-district-filter">
                                        <SelectValue placeholder="Filter by district" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Districts</SelectItem>
                                        {districtsLoading ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (
                                            districts.map((district: string) => (
                                                <SelectItem key={district} value={district}>
                                                    {district}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Select value={componentFilter} onValueChange={setComponentFilter}>
                                    <SelectTrigger data-testid="select-component-filter">
                                        <SelectValue placeholder="Filter by component" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Components</SelectItem>
                                        {componentsLoading ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (
                                            components.map((componentName: string) => (
                                                <SelectItem key={componentName} value={componentName}>
                                                    {componentName}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(event) => setDateFrom(event.target.value)}
                                        className="flex-1"
                                        placeholder="From date"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(event) => setDateTo(event.target.value)}
                                        className="flex-1"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full">
                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                            <tr>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">ID</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Applicant</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Aadhar Number</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Mobile Number</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden md:table-cell">District</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Taluka</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Village</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">Milk Pouring Point</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">Component</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden xl:table-cell">Tag Numbers</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Status</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden xl:table-cell">Approver</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden sm:table-cell">Date</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        {isListLoading ? renderLoadingRows() : (
                                            <tbody>
                                                {applications.map((application, index) => (
                                                    <tr
                                                        key={`${application.id}-${index}`}
                                                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                                        data-testid={`application-row-${index}`}
                                                        onClick={() => handleViewDetails(application)}
                                                    >
                                                        <td className="p-2 sm:p-4">
                                                            <span className="font-mono text-xs sm:text-sm font-semibold">{application.id}</span>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <div>
                                                                <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.applicantName}</p>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground">{application.mobile}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.aadharNumber}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.mobile}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden md:table-cell">
                                                            <p className="text-xs sm:text-sm">{application.district || "N/A"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.taluka}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.village}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                            <p className="text-xs sm:text-sm truncate max-w-[150px]">{application.milkPouringPoint || "N/A"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                            <p className="text-xs sm:text-sm truncate max-w-[150px]">{application.component || "N/A"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden xl:table-cell">
                                                            {(() => {
                                                                if (!application.dairyAnimalData) {
                                                                    return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;
                                                                }

                                                                const tagNumberArray = application.dairyAnimalData["Registered Dairy Animal Tag Number"] || application.dairyAnimalData["Tag Number"];
                                                                if (!Array.isArray(tagNumberArray)) {
                                                                    return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;
                                                                }

                                                                const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== "");
                                                                if (validTags.length === 0) {
                                                                    return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;
                                                                }

                                                                return (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {validTags.map((tag: string, tagIndex: number) => (
                                                                            <Badge key={tagIndex} variant="outline" className="text-xs font-mono">
                                                                                {tag}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="p-2 sm:p-4">{getStatusBadge(application.status)}</td>
                                                        <td className="p-2 sm:p-4 hidden xl:table-cell">
                                                            {application.approver ? (
                                                                <p className="text-xs sm:text-sm truncate max-w-[120px]">{application.approver}</p>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs" data-testid={`badge-approver-unassigned-${index}`}>
                                                                    Not Assigned
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden sm:table-cell">
                                                            <p className="text-xs sm:text-sm">{application.submittedDate}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    handleViewDetails(application);
                                                                }}
                                                                data-testid={`button-view-${index}`}
                                                                className="text-xs sm:text-sm px-2 sm:px-3"
                                                            >
                                                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                                                <span className="hidden sm:inline">View</span>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        )}
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 pt-3 sm:pt-4">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {pagination ? (
                                        <>
                                            Showing {applications.length} of {pagination.total_applications} applications
                                            (Page {pagination.current_page} of {pagination.total_pages})
                                        </>
                                    ) : (
                                        <>
                                            Showing {applications.length} items on page {currentPage}
                                            {applications.length < pageSize && currentPage > 1 ? " (last page)" : ""}
                                        </>
                                    )}
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    if (!(pagination?.has_previous_page ?? currentPage > 1)) {
                                                        event.preventDefault();
                                                        return;
                                                    }

                                                    setCurrentPage((previousPage) => Math.max(1, previousPage - 1));
                                                }}
                                                className={!(pagination?.has_previous_page ?? currentPage > 1) ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>

                                        {(() => {
                                            const totalPages = pagination?.total_pages ?? (applications.length === pageSize ? currentPage + 1 : currentPage);
                                            const startPage = Math.max(1, currentPage - 2);
                                            const endPage = Math.min(totalPages, startPage + 4);

                                            return Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                                                const pageNumber = startPage + index;
                                                return (
                                                    <PaginationItem key={pageNumber}>
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                if (pageNumber !== currentPage) {
                                                                    setCurrentPage(pageNumber);
                                                                }
                                                            }}
                                                            isActive={pageNumber === currentPage}
                                                        >
                                                            {pageNumber}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            });
                                        })()}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    if (!(pagination?.has_next_page ?? applications.length === pageSize)) {
                                                        event.preventDefault();
                                                        return;
                                                    }

                                                    setCurrentPage((previousPage) => previousPage + 1);
                                                }}
                                                className={!(pagination?.has_next_page ?? applications.length === pageSize) ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <ApplicationDetailsDialog
                application={selectedApp}
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                onReview={handleReview}
                showReviewActions={true}
            />
        </div>
    );
}
