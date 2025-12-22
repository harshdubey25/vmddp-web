"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Search,
    Download,
    CheckCircle,
    MapPin,
    User,
    Package,
    Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { frappeBrowser } from "@/lib/frappe";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

interface ApplicationSelectionItem {
    id: string;
    realApplicationId: string;
    applicantName: string;
    mobile: string;
    village: string;
    component: string;
    status: "Approved" | "Selected";
    submittedDate: string;
    aadharNumber?: string;
    taluka?: string;
    milkPouringPoint?: string;
    dairyAnimalData?: {
        [key: string]: any;
    };
}

const COMPONENT_ORDER = [
    "Animal Induction",
    "HGM (Pregnant cow)",
    "Fertility Feed",
    "SNF Enhancer",
    "Fodder Seed",
    "Supply Chaff Cutter",
    "Supply Of Silage",
];

interface SubAdminSelectionClientProps {
    applications: ApplicationSelectionItem[];
    stats: {
        approved: number;
        selected: number;
        total: number;
    };
    currentPage: number;
    pageSize: number;
    initialFilters: {
        status: string;
        search: string;
        village: string;
    };
    paginationData?: {
        current_page: number;
        total_pages: number;
        total_records: number;
        has_next_page: boolean;
        has_previous_page: boolean;
    };
}

export default function SubAdminSelectionClient({
    applications: initialApplications,
    stats,
    currentPage,
    pageSize,
    initialFilters,
    paginationData
}: SubAdminSelectionClientProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState(initialFilters.search);
    const [villageFilter, setVillageFilter] = useState(initialFilters.village);
    const [applicationStatusFilter, setApplicationStatusFilter] = useState(initialFilters.status || "all");
    const [applications, setApplications] = useState<ApplicationSelectionItem[]>(initialApplications);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationSelectionItem | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    // Village data from API (grouped by village)
    interface VillageData {
        village_id: string;
        village_name: string;
        district: string;
        taluka: string;
        components: { component: string; application_count: number }[];
        total_selected_applications: number;
    }

    const [villages, setVillages] = useState<VillageData[]>([]);
    const [countsLoading, setCountsLoading] = useState(false);
    const [villageSearchQuery, setVillageSearchQuery] = useState("");
    const [currentCountsPage, setCurrentCountsPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"Selected" | "Approved">("Selected");
    const [pagination, setPagination] = useState({
        has_next_page: false,
        has_previous_page: false,
        total_records: null as number | null
    });

    // Get unique villages for application filter dropdown
    const applicationVillages = Array.from(new Set(applications.map(app => app.village))).sort();

    // Export current page as Excel
    const handleExport = () => {
        if (!applications || applications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        const appsToExport = applications;

        let maxTagNumbers = 1;
        appsToExport.forEach((a) => {
            if (a.dairyAnimalData) {
                const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                if (Array.isArray(tagNumberArray)) {
                    const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                    maxTagNumbers = Math.max(maxTagNumbers, validTags.length);
                }
            }
        });

        const baseHeaders = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'Taluka', 'Village', 'Milk Pouring Point'];
        const componentHeaders = COMPONENT_ORDER.map((name, i) => `Component ${i + 1}`);
        const tagHeaders = Array.from({ length: maxTagNumbers }, (_, i) => `Tag Number ${i + 1}`);
        const endHeaders = ['Status', 'Submitted Date'];
        const headers = [...baseHeaders, ...componentHeaders, 'Status', ...tagHeaders, ...endHeaders];

        const rows = appsToExport.map((a) => {
            const componentsArr = (a.component || '').split(',').map(c => c.trim()).filter(c => c);
            const componentsInOrder = COMPONENT_ORDER.map(orderName => componentsArr.find((c: string) => c === orderName) || '');
            let tagNumbers: string[] = [];
            if (a.dairyAnimalData) {
                const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                if (Array.isArray(tagNumberArray)) {
                    tagNumbers = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                }
            }

            const row: Record<string, string> = {
                'Application ID': a.realApplicationId,
                'Applicant': a.applicantName,
                'Aadhar Number': a.aadharNumber || '',
                'Mobile': a.mobile || '',
                'Taluka': a.taluka || '',
                'Village': a.village || '',
                'Milk Pouring Point': a.milkPouringPoint || '',
                'Submitted Date': a.submittedDate || '',
            };

            for (let i = 0; i < COMPONENT_ORDER.length; i++) {
                row[`Component ${i + 1}`] = componentsInOrder[i] || '';
            }
            row['Status'] = a.status;
            for (let i = 0; i < maxTagNumbers; i++) {
                row[`Tag Number ${i + 1}`] = tagNumbers[i] || '';
            }

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

        const colWidths = headers.map((h, i) => {
            const maxDataLength = rows.reduce((max, row) => {
                const value = String(row[h as keyof typeof row] || '');
                return Math.max(max, value.length);
            }, 0);
            return { wch: Math.max(h.length, maxDataLength, 15) + 2 };
        });
        worksheet['!cols'] = colWidths;

        const date = new Date().toISOString().split('T')[0];
        const parts: string[] = [];
        if (applicationStatusFilter && applicationStatusFilter !== 'all') parts.push(applicationStatusFilter);
        if (villageFilter && villageFilter !== 'all') parts.push(villageFilter.replace(/\s+/g, '_'));
        if (searchQuery) parts.push(`q-${searchQuery.replace(/\s+/g, '_')}`);
        const suffix = parts.length ? `-${parts.join('-')}` : '';

        XLSX.writeFile(workbook, `applications${suffix}-${date}.xlsx`);

        toast({
            title: "Export started",
            description: `Exported ${appsToExport.length} applications from current page.`,
        });
    };

    // Export ALL applications with current filters
    const handleExportAll = async () => {
        toast({
            title: "Export started",
            description: "Fetching all applications with current filters...",
        });

        try {
            // Build API parameters based on current filters
            const apiParams: any = {
                export: true
            };

            // Add status filter based on current selection
            if (applicationStatusFilter && applicationStatusFilter !== 'all') {
                apiParams.status = applicationStatusFilter;
            } else {
                // When status is 'all', fetch both Approved and Selected
                apiParams.status = '["Approved","Selected"]';
            }

            // Add search filter if provided
            if (searchQuery && searchQuery.trim()) {
                apiParams.search = searchQuery.trim();
            }

            // Add village filter if provided and not 'all'
            if (villageFilter && villageFilter !== 'all') {
                apiParams.village = villageFilter;
            }

            // Fetch from Frappe with filters
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
                    realApplicationId: app.name,
                    applicantName: app.fullname ?? 'Unknown',
                    aadharNumber: app.aadhar_number ?? '',
                    mobile: app.mobile_number ?? app.mobile_no ?? '',
                    taluka: app.taluka ?? '',
                    village: app.village ?? 'N/A',
                    milkPouringPoint: app.milk_pouring_point ?? '',
                    component: component,
                    status: app.status ?? '',
                    submittedDate: app.created_at ?? app.date ?? '',
                    dairyAnimalData: app.dairy_animal_data,
                };
            });

            if (!allApplications || allApplications.length === 0) {
                toast({
                    title: "No data",
                    description: "There are no applications to export with the current filters.",
                    variant: "destructive",
                });
                return;
            }

            let maxTagNumbers = 1;
            allApplications.forEach((a: any) => {
                if (a.dairyAnimalData) {
                    const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                    if (Array.isArray(tagNumberArray)) {
                        const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                        maxTagNumbers = Math.max(maxTagNumbers, validTags.length);
                    }
                }
            });

            const baseHeaders = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'Taluka', 'Village', 'Milk Pouring Point'];
            const componentHeaders = COMPONENT_ORDER.map((name, i) => `Component ${i + 1}`);
            const tagHeaders = Array.from({ length: maxTagNumbers }, (_, i) => `Tag Number ${i + 1}`);
            const endHeaders = ['Submitted Date'];
            const headers = [...baseHeaders, ...componentHeaders, 'Status', ...tagHeaders, ...endHeaders];

            const rows = allApplications.map((a: any) => {
                const componentsArr = (a.component || '').split(',').map((c: string) => c.trim()).filter((c: string) => c);
                const componentsInOrder = COMPONENT_ORDER.map(orderName => componentsArr.find((c: string) => c === orderName) || '');
                let tagNumbers: string[] = [];
                if (a.dairyAnimalData) {
                    const tagNumberArray = a.dairyAnimalData['Registered Dairy Animal Tag Number'] || a.dairyAnimalData['Tag Number'];
                    if (Array.isArray(tagNumberArray)) {
                        tagNumbers = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== '');
                    }
                }

                const row: Record<string, string> = {
                    'Application ID': a.realApplicationId,
                    'Applicant': a.applicantName,
                    'Aadhar Number': a.aadharNumber || '',
                    'Mobile': a.mobile || '',
                    'Taluka': a.taluka || '',
                    'Village': a.village || '',
                    'Milk Pouring Point': a.milkPouringPoint || '',
                    'Status': a.status || '',
                    'Submitted Date': a.submittedDate || '',
                };

                for (let i = 0; i < COMPONENT_ORDER.length; i++) {
                    row[`Component ${i + 1}`] = componentsInOrder[i] || '';
                }

                for (let i = 0; i < maxTagNumbers; i++) {
                    row[`Tag Number ${i + 1}`] = tagNumbers[i] || '';
                }

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

            const colWidths = headers.map((h, i) => {
                const maxDataLength = rows.reduce((max: number, row: any) => {
                    const value = String(row[h as keyof typeof row] || '');
                    return Math.max(max, value.length);
                }, 0);
                return { wch: Math.max(h.length, maxDataLength, 15) + 2 };
            });
            worksheet['!cols'] = colWidths;

            const date = new Date().toISOString().split('T')[0];
            const statusPart = applicationStatusFilter && applicationStatusFilter !== 'all' ? `-${applicationStatusFilter}` : '';
            XLSX.writeFile(workbook, `all-applications${statusPart}-${date}.xlsx`);

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
    };

    // Update URL with filters
    const updateFilters = (updates: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search);

        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // Reset to page 1 when filters change
        if ('page' in updates === false) {
            params.delete('page');
        }

        window.location.href = `?${params.toString()}`;
    };
    console.log('applications', applications);
    // Fetch village data from backend API
    useEffect(() => {
        const fetchVillages = async () => {
            setCountsLoading(true);
            try {
                const response = await frappeBrowser.call().get('vmddp_app.api.reports.village_selection_status_per_component', {
                    page: currentCountsPage,
                    limit: 5,
                    status: statusFilter,
                    village: villageSearchQuery || undefined
                });

                const data = response?.message || response?.data || response;
                const villagesData = data?.data || [];
                const paginationData = data?.pagination || {};

                setVillages(villagesData);
                setPagination({
                    has_next_page: paginationData.has_next_page || false,
                    has_previous_page: paginationData.has_previous_page || false,
                    total_records: paginationData.total_records || null
                });
            } catch (error) {
                console.error('Error fetching villages:', error);
                setVillages([]);
            } finally {
                setCountsLoading(false);
            }
        };

        fetchVillages();
    }, [currentCountsPage, villageSearchQuery, statusFilter]);

    // Use server-side filtered and paginated data
    const filteredApplications = applications;
    const totalPages = paginationData?.total_pages || 1;
    const totalItems = paginationData?.total_records || applications.length;
    const { call: selectionApplication } = useFrappePostCall("vmddp_app.api.app_form.select_application");
    const handleSelect = async (appId: string) => {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const originalAppId = app.realApplicationId;


        try {
            // Update the App Form doctype via API using original application ID
            // await frappeBrowser.db().updateDoc('App Form', originalAppId, {
            //     status: 'Selected',
            // });
            await selectionApplication({ application_id: originalAppId });
            setApplications(prev =>
                prev.map(application => {
                    const applicantOriginalId = application.realApplicationId;
                    return applicantOriginalId === originalAppId
                        ? { ...application, status: "Selected" as const }
                        : application;
                })
            );

            toast({
                title: "Application Selected",
                description: `${app.applicantName} has been selected (all their components)`,
            });
        } catch (error) {
            console.error('Error updating application status:', error);
            toast({
                title: "Error",
                description: `Failed to select ${app.applicantName}. Please try again.`,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 py-3 md:px-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-lg md:text-xl" data-testid="text-selection-title">
                        Beneficiary Selection
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Manage approved and selected applications
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10" data-testid="button-export" onClick={handleExport}>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Export Page</span>
                        <span className="xs:hidden">Page</span>
                    </Button>
                    <Button variant="default" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10" data-testid="button-export-all" onClick={handleExportAll}>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Export All</span>
                        <span className="xs:hidden">All</span>
                    </Button>
                </div>
            </header>            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Approved</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.approved}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Selected</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.selected}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="sm:col-span-2 md:col-span-1">
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                                <CardDescription className="text-xs sm:text-sm">Total Applications</CardDescription>
                                <CardTitle className="text-2xl sm:text-3xl">
                                    {stats.total}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Selection Status by Village and Component */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">
                                            {statusFilter === "Selected" ? "Selected" : "Approved"} Applications by Village
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {countsLoading ? 'Loading...' : pagination.total_records !== null ? `${pagination.total_records} total villages` : `${villages.length} villages found`}
                                        </CardDescription>
                                    </div>
                                    <Select value={statusFilter} onValueChange={(value: any) => {
                                        setStatusFilter(value);
                                        setCurrentCountsPage(1);
                                    }}>
                                        <SelectTrigger className="w-32 h-9 text-xs sm:text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Selected">Selected</SelectItem>
                                            <SelectItem value="Approved">Approved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search village..."
                                        value={villageSearchQuery}
                                        onChange={(e) => {
                                            setVillageSearchQuery(e.target.value);
                                            setCurrentCountsPage(1);
                                        }}
                                        className="pl-10 text-xs sm:text-sm h-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {countsLoading ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">Loading villages...</div>
                            ) : villages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">No villages found</div>
                            ) : (
                                <>
                                    <Accordion type="multiple" className="w-full">
                                        {villages.map((village) => {
                                            return (
                                                <AccordionItem key={village.village_id} value={village.village_id}>
                                                    <AccordionTrigger className="hover:no-underline py-3">
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                                                <div className="text-left">
                                                                    <h3 className="font-semibold text-sm sm:text-base">{village.village_name}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {village.district} • {village.taluka}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg sm:text-xl font-semibold text-primary">
                                                                    {village.total_selected_applications}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {statusFilter === "Selected" ? "selected" : "approved"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                            {village.components.map((comp) => (
                                                                <div key={comp.component} className="p-3 border rounded-lg bg-muted/30">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                        <p className="text-xs sm:text-sm font-medium truncate">{comp.component}</p>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-muted-foreground">Count</span>
                                                                        <span className="text-base font-semibold text-primary">
                                                                            {comp.application_count}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>

                                    {/* Pagination for counts */}
                                    {(pagination.has_next_page || pagination.has_previous_page) && (
                                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage(p => Math.max(1, p - 1))}
                                                disabled={!pagination.has_previous_page}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-3">
                                                Page {currentCountsPage}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage(p => p + 1)}
                                                disabled={!pagination.has_next_page}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Applications List */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">Approved Applications (FIFO Order)</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {totalItems} applications • Page {currentPage} of {totalPages}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                <div className="relative">
                                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateFilters({ search: searchQuery });
                                            }
                                        }}
                                        onBlur={() => {
                                            if (searchQuery !== initialFilters.search) {
                                                updateFilters({ search: searchQuery });
                                            }
                                        }}
                                        className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                                        data-testid="input-search"
                                    />
                                </div>

                                <Select
                                    value={applicationStatusFilter}
                                    onValueChange={(value) => {
                                        setApplicationStatusFilter(value);
                                        updateFilters({ status: value });
                                    }}
                                >
                                    <SelectTrigger data-testid="select-status-filter" className="text-xs sm:text-sm h-8 sm:h-10">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Selected">Selected</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={villageFilter}
                                    onValueChange={(value) => {
                                        setVillageFilter(value);
                                        updateFilters({ village: value });
                                    }}
                                >
                                    <SelectTrigger data-testid="select-village-filter" className="text-xs sm:text-sm h-8 sm:h-10">
                                        <SelectValue placeholder="Filter by village" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Villages</SelectItem>
                                        {applicationVillages.map(village => (
                                            <SelectItem key={village} value={village}>{village}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px]">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Date</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Application ID</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Applicant</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Village</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Component</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Status</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.map((app, index) => {
                                                return (
                                                    <tr
                                                        key={app.id}
                                                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                                        data-testid={`application-row-${index}`}
                                                        onClick={() => {
                                                            setSelectedApplication(app);
                                                            setIsDetailsDialogOpen(true);
                                                        }}
                                                    >
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                                                <span className="hidden xs:inline">
                                                                    {app.submittedDate === 'Unknown'
                                                                        ? 'Unknown'
                                                                        : new Date(app.submittedDate).toLocaleDateString()
                                                                    }
                                                                </span>
                                                                <span className="xs:hidden">
                                                                    {app.submittedDate === 'Unknown'
                                                                        ? 'N/A'
                                                                        : new Date(app.submittedDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="font-mono text-xs sm:text-sm">
                                                                <span className="font-semibold">
                                                                    {app.realApplicationId}
                                                                </span>
                                                                {/* {app.id.includes('-') && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            Component: {app.component}
                                                                        </p>
                                                                    )} */}
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-xs sm:text-sm truncate">{app.applicantName}</p>
                                                                    <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <p className="text-xs sm:text-sm truncate">{app.village}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                                <p className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.component}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            {getStatusBadge(app.status)}
                                                        </td>
                                                        <td className="p-2 sm:p-3 md:p-4">
                                                            {app.status === "Approved" && (
                                                                <Button
                                                                    size="sm"
                                                                    // disabled={!canSelect(app)}
                                                                    onClick={() => handleSelect(app.id)}
                                                                    className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                                                    data-testid={`button-select-${index}`}
                                                                // title={!canSelect(app) ? "Already selected or quota reached" : "Select this applicant for all their components"}
                                                                >
                                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <span className="hidden xs:inline">Select</span>
                                                                </Button>
                                                            )}
                                                            {app.status === "Selected" && (
                                                                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-chart-3">
                                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    <span className="hidden xs:inline">Selected</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 pt-3 sm:pt-4">
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Showing {filteredApplications.length} of {totalItems} items • Page {currentPage} of {totalPages}
                                    </p>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: (currentPage - 1).toString() })}` : '#'}
                                                    onClick={(e) => {
                                                        if (currentPage <= 1) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>

                                            {/* Page numbers */}
                                            {(() => {
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, startPage + 4);

                                                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                                                    const pageNum = startPage + i;
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.set('page', pageNum.toString());

                                                    return (
                                                        <PaginationItem key={pageNum}>
                                                            <PaginationLink
                                                                href={`?${params.toString()}`}
                                                                isActive={pageNum === currentPage}
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                });
                                            })()}

                                            {currentPage < totalPages - 2 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href={currentPage < totalPages ? `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: (currentPage + 1).toString() })}` : '#'}
                                                    onClick={(e) => {
                                                        if (currentPage >= totalPages) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <ApplicationDetailsDialog
                application={selectedApplication}
                isOpen={isDetailsDialogOpen}
                onClose={() => {
                    setIsDetailsDialogOpen(false);
                    setSelectedApplication(null);
                }}
                showReviewActions={false}
            />
        </div>
    );
}
