"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Search,
    Filter,
    Download,
    Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { frappeBrowser } from "@/lib/frappe";

import { Application } from "./page";

interface AdminApplicationsClientProps {
    applications: Application[];
    currentPage: number;
    pageSize: number;
    initialFilters?: {
        status: string;
        search: string;
        district: string;
        component: string;
        start_date: string;
        end_date: string;
    };
    paginationData?: {
        current_page: number;
        page_size: number;
        total_applications: number;
        total_pages: number;
        has_next_page: boolean;
        has_previous_page: boolean;
    };
}

export default function AdminApplicationsClient({ applications, currentPage, pageSize, initialFilters, paginationData }: AdminApplicationsClientProps) {
    console.log('AdminApplicationsClient received applications:', applications);

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "");
    const [statusFilter, setStatusFilter] = useState(initialFilters?.status || "all");
    const [districtFilter, setDistrictFilter] = useState(initialFilters?.district || "all");
    const [componentFilter, setComponentFilter] = useState(initialFilters?.component || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters?.start_date || "");
    const [dateTo, setDateTo] = useState(initialFilters?.end_date || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Fetch districts from Frappe
    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });

    const districts = frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [];

    // Fetch components from Frappe
    const { data: frappeComponents, isLoading: componentsLoading } = useFrappeGetDocList("Component", {
        filters: [['dont_show_in_website', '=', 0]],
        fields: ["component_name"],
        orderBy: {
            field: 'component_name',
            order: 'asc'
        },
        limit: 100,
    });

    const components = frappeComponents ? frappeComponents.map((c: any) => c.component_name) : [];

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { toast } = useToast();

    // Update URL with filters
    const updateFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Update filter parameters
        if (statusFilter !== 'all') {
            params.set('status', statusFilter);
        } else {
            params.delete('status');
        }

        if (districtFilter !== 'all') {
            params.set('district', districtFilter);
        } else {
            params.delete('district');
        }

        if (componentFilter !== 'all') {
            params.set('component', componentFilter);
        } else {
            params.delete('component');
        }

        if (debouncedSearchQuery) {
            params.set('search', debouncedSearchQuery);
        } else {
            params.delete('search');
        }

        if (dateFrom) {
            params.set('start_date', dateFrom);
        } else {
            params.delete('start_date');
        }

        if (dateTo) {
            params.set('end_date', dateTo);
        } else {
            params.delete('end_date');
        }

        // Only reset to page 1 if filters actually changed
        // Check if this is a filter change (not initial load or pagination)
        const currentStatus = searchParams.get('status') || 'all';
        const currentDistrict = searchParams.get('district') || 'all';
        const currentComponent = searchParams.get('component') || 'all';
        const currentSearch = searchParams.get('search') || '';
        const currentStartDate = searchParams.get('start_date') || '';
        const currentEndDate = searchParams.get('end_date') || '';

        const filtersChanged =
            currentStatus !== statusFilter ||
            currentDistrict !== districtFilter ||
            currentComponent !== componentFilter ||
            currentSearch !== debouncedSearchQuery ||
            currentStartDate !== dateFrom ||
            currentEndDate !== dateTo;

        if (filtersChanged) {
            params.set('page', '1');
        }

        params.set('limit', pageSize.toString());

        router.push(pathname + '?' + params.toString());
    }, [statusFilter, districtFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo, pathname, router, pageSize, searchParams]);

    // Update URL when filters change
    useEffect(() => {
        // Only update if filters have actually changed from URL params
        const currentStatus = searchParams.get('status') || 'all';
        const currentDistrict = searchParams.get('district') || 'all';
        const currentComponent = searchParams.get('component') || 'all';
        const currentSearch = searchParams.get('search') || '';
        const currentStartDate = searchParams.get('start_date') || '';
        const currentEndDate = searchParams.get('end_date') || '';

        if (
            currentStatus !== statusFilter ||
            currentDistrict !== districtFilter ||
            currentComponent !== componentFilter ||
            currentSearch !== debouncedSearchQuery ||
            currentStartDate !== dateFrom ||
            currentEndDate !== dateTo
        ) {
            updateFilters();
        }
    }, [statusFilter, districtFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo, updateFilters, searchParams]);

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
    };

    const handleReview = (action: "approve" | "reject", remarks: string) => {
        console.log(`${action} application with remarks:`, remarks);
        setSelectedApp(null);
    };

    // Export current applications list as CSV
    const handleExport = useCallback(() => {
        if (!applications || applications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ['Application ID', 'Applicant', 'Mobile', 'District', 'Village', 'Component', 'Tag Numbers', 'Status', 'Approver', 'Submitted Date'];

        const escapeCell = (value: any) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (/["\n,]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = applications.map((a) => {
            // Extract tag numbers from dairy_animal_data
            let tagNumbers = 'N/A';
            if (a.dairyAnimalData) {
                const tagNumberArray = a.dairyAnimalData['Tag Number'];
                if (Array.isArray(tagNumberArray)) {
                    const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                    tagNumbers = validTags.length > 0 ? validTags.join(', ') : 'N/A';
                }
            }

            return [
                a.id,
                a.applicantName,
                (a as any).mobile || (a as any).mobile_no || '',
                a.district || '',
                a.village || '',
                a.component || '',
                tagNumbers,
                a.status || '',
                a.approver || '',
                a.submittedDate || '',
            ];
        });

        const csvContent = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const date = new Date().toISOString().split('T')[0];
        const parts: string[] = [];
        if (statusFilter && statusFilter !== 'all') parts.push(statusFilter.replace(/\s+/g, '_'));
        if (districtFilter && districtFilter !== 'all') parts.push(districtFilter.replace(/\s+/g, '_'));
        if (componentFilter && componentFilter !== 'all') parts.push(componentFilter.replace(/\s+/g, '_'));
        if (debouncedSearchQuery) parts.push(`q-${debouncedSearchQuery.replace(/\s+/g, '_')}`);
        const suffix = parts.length ? `-${parts.join('-')}` : '';

        link.href = url;
        link.download = `applications${suffix}-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast({
            title: "Export started",
            description: `Exported ${applications.length} applications from current page.`,
        });
    }, [applications, statusFilter, districtFilter, componentFilter, debouncedSearchQuery, toast]);

    // Export current page as Excel (using CSV format)
    const handleExportExcel = useCallback(() => {
        if (!applications || applications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ['Application ID', 'Applicant', 'Mobile', 'District', 'Village', 'Component', 'Tag Numbers', 'Status', 'Approver', 'Submitted Date'];

        const escapeCell = (value: any) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (/["\n,]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = applications.map((a) => {
            // Extract tag numbers from dairy_animal_data
            let tagNumbers = 'N/A';
            if (a.dairyAnimalData) {
                const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                if (Array.isArray(tagNumberArray)) {
                    const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                    tagNumbers = validTags.length > 0 ? validTags.join(', ') : 'N/A';
                }
            }

            return [
                a.id,
                a.applicantName,
                (a as any).mobile || (a as any).mobile_no || '',
                a.district || '',
                a.village || '',
                a.component || '',
                tagNumbers,
                a.status || '',
                a.approver || '',
                a.submittedDate || '',
            ];
        });

        const csvContent = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const date = new Date().toISOString().split('T')[0];
        const parts: string[] = [];
        if (statusFilter && statusFilter !== 'all') parts.push(statusFilter.replace(/\s+/g, '_'));
        if (districtFilter && districtFilter !== 'all') parts.push(districtFilter.replace(/\s+/g, '_'));
        if (componentFilter && componentFilter !== 'all') parts.push(componentFilter.replace(/\s+/g, '_'));
        if (debouncedSearchQuery) parts.push(`q-${debouncedSearchQuery.replace(/\s+/g, '_')}`);
        const suffix = parts.length ? `-${parts.join('-')}` : '';

        link.href = url;
        link.download = `applications${suffix}-${date}.xls`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast({
            title: "Export completed",
            description: `Exported ${applications.length} applications from current page.`,
        });
    }, [applications, statusFilter, districtFilter, componentFilter, debouncedSearchQuery, toast]);    // Export ALL applications (with current filters) as CSV
    const handleExportAll = useCallback(async () => {
        toast({
            title: "Export started",
            description: "Fetching all applications with current filters...",
        });

        try {
            // Build API parameters matching current filters
            const apiParams: any = {
                export: true
            };

            // Add status filter if provided and not 'all'
            if (statusFilter && statusFilter !== 'all') {
                apiParams.status = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
            }

            // Add search filter if provided
            if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
                apiParams.search = debouncedSearchQuery.trim();
            }

            // Add district filter if provided and not 'all'
            if (districtFilter && districtFilter !== 'all') {
                apiParams.district = districtFilter;
            }

            // Add component filter if provided and not 'all'
            if (componentFilter && componentFilter !== 'all') {
                apiParams.component = componentFilter;
            }

            // Add date filters if provided
            if (dateFrom) {
                apiParams.start_date = dateFrom;
            }

            if (dateTo) {
                apiParams.end_date = dateTo;
            }

            // Fetch from Frappe with current filters
            const response = await frappeBrowser.call().get('vmddp_app.api.api.get_applications_summary', apiParams);

            const allApplications = (response.message?.applications || []).map((app: any) => {
                let component = 'N/A';
                if (Array.isArray(app.component_list)) {
                    component = app.component_list.join(', ');
                } else if (typeof app.component_list === 'string') {
                    component = app.component_list;
                }

                return {
                    id: app.name,
                    applicantName: app.fullname ?? 'Unknown',
                    aadharNumber: app.aadhar_number ?? '',
                    mobile: app.mobile_number ?? app.mobile_no ?? '',
                    district: app.district ?? 'N/A',
                    taluka: app.taluka ?? '',
                    village: app.village ?? '',
                    component: component,
                    status: app.status ?? '',
                    approver: app.approver ?? '',
                    submittedDate: app.created_at ?? app.date ?? '',
                    milk_pouring_point: app.milk_pouring_point ?? '',
                    dairyAnimalData: app.dairy_animal_data
                };
            });

            if (!allApplications || allApplications.length === 0) {
                toast({
                    title: "No data",
                    description: "There are no applications to export.",
                    variant: "destructive",
                });
                return;
            }

            const headers = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'District', 'Taluka', 'Village', 'Component', 'Tag Numbers', 'Status', 'Approver', 'Submitted Date', 'Name Of Milk Pouring Point'];

            const escapeCell = (value: any) => {
                if (value === null || value === undefined) return '';
                const str = String(value);
                if (/["\n,]/.test(str)) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const rows = allApplications.map((a: any) => {
                // Extract tag numbers from dairy_animal_data
                let tagNumbers = 'N/A';
                if (a.dairyAnimalData) {
                    const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                    if (Array.isArray(tagNumberArray)) {
                        const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                        tagNumbers = validTags.length > 0 ? validTags.join(', ') : 'N/A';
                    }
                }

                return [
                    a.id,
                    a.applicantName,
                    a.aadharNumber,
                    a.mobile || '',
                    a.district || '',
                    a.taluka || '',
                    a.village || '',
                    a.component || '',
                    tagNumbers,
                    a.status || '',
                    a.approver || '',
                    a.submittedDate || '',
                    a.milk_pouring_point || ''
                ];
            });

            const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r: any) => r.map(escapeCell).join(','))].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `all-applications-${date}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast({
                title: "Export completed",
                description: `Successfully exported ${allApplications.length} applications.`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export failed",
                description: "Failed to export applications. Please try again.",
                variant: "destructive",
            });
        }
    }, [toast, statusFilter, componentFilter, debouncedSearchQuery, districtFilter, dateFrom, dateTo]);

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
                    <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="button-export" onClick={handleExport}>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Export Page</span>
                        <span className="sm:hidden">Page</span>
                    </Button>
                    <Button variant="default" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="button-export-all" onClick={handleExportAll}>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Export All</span>
                        <span className="sm:hidden">All</span>
                    </Button>
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
                                        {paginationData?.total_applications} applications found
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
                                        onChange={(e) => setSearchQuery(e.target.value)}
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
                                            components.map((component: string) => (
                                                <SelectItem key={component} value={component}>
                                                    {component}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1"
                                        placeholder="From date"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
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
                                        <tbody>
                                            {applications.map((app, index) => (
                                                <tr
                                                    key={app.id}
                                                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                                    data-testid={`application-row-${index}`}
                                                    onClick={(e) => handleViewDetails(app)}
                                                >
                                                    <td className="p-2 sm:p-4">
                                                        <span className="font-mono text-xs sm:text-sm font-semibold">{app.id}</span>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.applicantName}</p>
                                                            <p className="text-[10px] sm:text-xs text-muted-foreground">{app.mobile}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.aadharNumber}</p>

                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.mobile}</p>

                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden md:table-cell">
                                                        <div>
                                                            <p className="text-xs sm:text-sm">{app.district || 'N/A'}</p>

                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.taluka}</p>

                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.village}</p>

                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                        <p className="text-xs sm:text-sm truncate max-w-[150px]">{app.milkPouringPoint || 'N/A'}</p>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                        <p className="text-xs sm:text-sm truncate max-w-[150px]">{app.component || 'N/A'}</p>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden xl:table-cell">
                                                        {(() => {
                                                            if (!app.dairyAnimalData) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

                                                            const tagNumberArray = app.dairyAnimalData['Registered Dairy Animal Tag Number'] || app.dairyAnimalData['Tag Number'];
                                                            if (!Array.isArray(tagNumberArray)) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

                                                            const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                                                            if (validTags.length === 0) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

                                                            return (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {validTags.map((tag: string, idx: number) => (
                                                                        <Badge key={idx} variant="outline" className="text-xs font-mono">
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-2 sm:p-4">{getStatusBadge(app.status)}</td>
                                                    <td className="p-2 sm:p-4 hidden xl:table-cell">
                                                        {app.approver ? (
                                                            <p className="text-xs sm:text-sm truncate max-w-[120px]">{app.approver}</p>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs" data-testid={`badge-approver-unassigned-${index}`}>Not Assigned</Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden sm:table-cell">
                                                        <p className="text-xs sm:text-sm">{app.submittedDate}</p>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(app)}
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
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 pt-3 sm:pt-4">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {paginationData ? (
                                        <>
                                            Showing {applications.length} of {paginationData.total_applications} applications
                                            (Page {paginationData.current_page} of {paginationData.total_pages})
                                        </>
                                    ) : (
                                        <>
                                            Showing {applications.length} items on page {currentPage}
                                            {applications.length < pageSize && currentPage > 1 ? ' (last page)' : ''}
                                        </>
                                    )}
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={(paginationData?.has_previous_page ?? currentPage > 1) ? `${pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: (currentPage - 1).toString() }).toString()}` : '#'}
                                                onClick={(e) => {
                                                    if (!(paginationData?.has_previous_page ?? currentPage > 1)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={!(paginationData?.has_previous_page ?? currentPage > 1) ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page numbers */}
                                        {(() => {
                                            const totalPages = paginationData?.total_pages ?? (applications.length === pageSize ? currentPage + 2 : currentPage);
                                            const startPage = Math.max(1, currentPage - 2);
                                            const endPage = Math.min(totalPages, startPage + 4);

                                            return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                                                const pageNum = startPage + i;
                                                return (
                                                    <PaginationItem key={pageNum}>
                                                        <PaginationLink
                                                            href={`${pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: pageNum.toString() }).toString()}`}
                                                            isActive={pageNum === currentPage}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            });
                                        })()}

                                        {paginationData && currentPage < paginationData.total_pages - 2 && (
                                            <>
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            </>
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                href={(paginationData?.has_next_page ?? applications.length === pageSize) ? `${pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: (currentPage + 1).toString() }).toString()}` : '#'}
                                                onClick={(e) => {
                                                    if (!(paginationData?.has_next_page ?? applications.length === pageSize)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={!(paginationData?.has_next_page ?? applications.length === pageSize) ? 'pointer-events-none opacity-50' : ''}
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
