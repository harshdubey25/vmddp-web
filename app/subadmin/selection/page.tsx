"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { useExport } from "@/hooks/use-export";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadge } from "@/lib/status-utils";
import {
    Calendar,
    CheckCircle,
    Download,
    FileCheck,
    FileSpreadsheet,
    FileText,
    MapPin,
    Package,
    Search,
    Target,
    TrendingUp,
    User,
} from "lucide-react";
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

interface DashboardStatsResponse {
    message?: {
        approved_applications?: number;
        selected_applications?: number;
        total_applications?: number;
    };
}

interface ApplicationsResponse {
    message?: {
        applications?: any[];
        pagination?: {
            current_page: number;
            total_pages: number;
            total_records: number;
            has_next_page: boolean;
            has_previous_page: boolean;
        };
    };
}

interface VillageData {
    village_id: string;
    village_name: string;
    district: string;
    taluka: string;
    components: { component: string; application_count: number }[];
    total_selected_applications: number;
}

interface VillageStatusResponse {
    message?: {
        data?: VillageData[];
        pagination?: {
            has_next_page?: boolean;
            has_previous_page?: boolean;
            total_records?: number | null;
        };
    };
    data?: {
        data?: VillageData[];
        pagination?: {
            has_next_page?: boolean;
            has_previous_page?: boolean;
            total_records?: number | null;
        };
    };
}

function buildApplicationsParams(
    page: number,
    limit: number,
    status: string,
    search: string,
    village: string
) {
    const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        status: status && status !== "all" ? status.charAt(0).toUpperCase() + status.slice(1) : '["Approved","Selected"]',
    };

    if (search.trim()) {
        params.search = search.trim();
    }

    if (village && village !== "all") {
        params.village = village;
    }

    return params;
}

function buildExportParams(status: string, search: string, village: string) {
    const params: Record<string, string> = {
        status: status && status !== "all" ? status.charAt(0).toUpperCase() + status.slice(1) : '["Approved","Selected"]',
    };

    if (search.trim()) {
        params.search = search.trim();
    }

    if (village && village !== "all") {
        params.village = village;
    }

    return params;
}

function buildExportFilename(prefix: string, status: string, search: string, village: string) {
    const parts: string[] = [];

    if (status && status !== "all") {
        parts.push(status);
    }

    if (village && village !== "all") {
        parts.push(village.replace(/\s+/g, "_"));
    }

    if (search.trim()) {
        parts.push(`q-${search.trim().replace(/\s+/g, "_")}`);
    }

    return parts.length ? `${prefix}-${parts.join("-")}` : prefix;
}

function buildVillageStatusParams(
    page: number,
    status: "Selected" | "Approved",
    villageSearchQuery: string
) {
    const params: Record<string, string | number> = {
        page,
        limit: 5,
        status,
    };

    if (villageSearchQuery.trim()) {
        params.village = villageSearchQuery.trim();
    }

    return params;
}

function mapApplication(app: any): ApplicationSelectionItem {
    const component =
        Array.isArray(app.component_list)
            ? app.component_list.join(", ")
            : typeof app.component_list === "string"
                ? app.component_list
                : "N/A";

    return {
        id: app.name,
        realApplicationId: app.name,
        applicantName: app.fullname ?? "Unknown",
        mobile: app.mobile_number ?? app.mobile_no ?? "",
        village: app.village || "N/A",
        component,
        status: app.status as "Approved" | "Selected",
        submittedDate: app.created_at || app.date || new Date().toISOString().split("T")[0],
        aadharNumber: app.aadhar_number || "",
        taluka: app.taluka || "",
        milkPouringPoint: app.milk_pouring_point || "",
        dairyAnimalData: app.dairy_animal_data,
    };
}

export default function SubAdminSelectionPage() {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const village = searchParams.get("village") || "all";

    const [searchQuery, setSearchQuery] = useState(search);
    const [villageFilter, setVillageFilter] = useState(village);
    const [applicationStatusFilter, setApplicationStatusFilter] = useState(status);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationSelectionItem | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [applications, setApplications] = useState<ApplicationSelectionItem[]>([]);
    const [villageSearchQuery, setVillageSearchQuery] = useState("");
    const [currentCountsPage, setCurrentCountsPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"Selected" | "Approved">("Selected");

    const applicationsParams = buildApplicationsParams(
        currentPage,
        pageSize,
        status,
        search,
        village
    );

    const villageStatusParams = buildVillageStatusParams(
        currentCountsPage,
        statusFilter,
        villageSearchQuery
    );

    const {
        data: statsResponse,
        isLoading: statsLoading,
        mutate: mutateStats,
    } = useFrappeGetCall<DashboardStatsResponse>("vmddp_app.api.v1.dashboard.subadmin_dashboard_data");

    const {
        data: applicationsResponse,
        isLoading: applicationsLoading,
        mutate: mutateApplications,
    } = useFrappeGetCall<ApplicationsResponse>(
        "vmddp_app.api.api.get_applications_summary",
        applicationsParams
    );

    const {
        data: villageStatusResponse,
        isLoading: villageCountsLoading,
        mutate: mutateVillageCounts,
    } = useFrappeGetCall<VillageStatusResponse>(
        "vmddp_app.api.reports.village_selection_status_per_component",
        villageStatusParams
    );

    const { call: selectionApplication } = useFrappePostCall("vmddp_app.api.app_form.select_application");
    const { isExporting, handleExport: exportApplications } = useExport({
        method: "vmddp_app.api.api.get_applications_summary_export",
        filename: "applications",
    });

    useEffect(() => {
        setSearchQuery(search);
        setVillageFilter(village);
        setApplicationStatusFilter(status);
    }, [search, status, village]);

    useEffect(() => {
        const fetchedApplications = (applicationsResponse?.message?.applications || []).map(mapApplication);
        setApplications(fetchedApplications);
    }, [applicationsResponse]);

    const stats = {
        approved: statsResponse?.message?.approved_applications ?? 0,
        selected: statsResponse?.message?.selected_applications ?? 0,
        total: statsResponse?.message?.total_applications ?? 0,
    };

    const paginationData = applicationsResponse?.message?.pagination;
    const filteredApplications = applications;
    const totalPages = paginationData?.total_pages || 1;
    const totalItems = paginationData?.total_records || applications.length;
    const applicationVillages = Array.from(new Set(applications.map((app) => app.village))).sort();

    const villageStatusData = villageStatusResponse?.message || villageStatusResponse?.data;
    const villages = villageStatusData?.data || [];
    const countsPagination = {
        has_next_page: villageStatusData?.pagination?.has_next_page || false,
        has_previous_page: villageStatusData?.pagination?.has_previous_page || false,
        total_records: villageStatusData?.pagination?.total_records || null,
    };

    const isLoading = statsLoading || applicationsLoading;

    const updateFilters = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== "all" && value !== "") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        if (!("page" in updates)) {
            params.delete("page");
        }

        const queryString = params.toString();
        router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const getPageHref = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handleExportPage = (format: "excel" | "pdf") => {
        if (applications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        void exportApplications({
            format,
            filename: buildExportFilename("applications-page", applicationStatusFilter, searchQuery, villageFilter),
            params: {
                ...buildExportParams(applicationStatusFilter, searchQuery, villageFilter),
                page: currentPage.toString(),
                limit: pageSize.toString(),
            },
        });
    };

    const handleExportAll = (format: "excel" | "pdf") => {
        if (totalItems === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export with the current filters.",
                variant: "destructive",
            });
            return;
        }

        void exportApplications({
            format,
            filename: buildExportFilename("applications", applicationStatusFilter, searchQuery, villageFilter),
            params: buildExportParams(applicationStatusFilter, searchQuery, villageFilter),
        });
    };

    const handleSelect = async (applicationId: string) => {
        const application = applications.find((item) => item.id === applicationId);
        if (!application) {
            return;
        }

        try {
            await selectionApplication({ application_id: application.realApplicationId });

            setApplications((previous) =>
                previous.map((item) =>
                    item.realApplicationId === application.realApplicationId
                        ? { ...item, status: "Selected" as const }
                        : item
                )
            );

            toast({
                title: "Application Selected",
                description: `${application.applicantName} has been selected (all their components)`,
            });

            void mutateApplications();
            void mutateStats();
            void mutateVillageCounts();
        } catch (error) {
            console.error("Error updating application status:", error);
            toast({
                title: "Error",
                description: `Failed to select ${application.applicantName}. Please try again.`,
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                    <div>
                        <Skeleton className="h-5 sm:h-6 w-48 mb-1" />
                        <Skeleton className="h-3 sm:h-4 w-64 hidden sm:block" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Card key={index}>
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <Skeleton className="h-4 w-20 mb-3" />
                                        <Skeleton className="h-8 w-16" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col gap-3">
                                    <Skeleton className="h-6 w-56" />
                                    <Skeleton className="h-10 w-full max-w-sm" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <Skeleton key={index} className="h-16 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
                                data-testid="button-export"
                                disabled={isExporting}
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Export Page</span>
                                <span className="xs:hidden">Page</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExportPage("excel")}>
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportPage("pdf")}>
                                <FileText className="w-4 h-4" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="default"
                                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10"
                                data-testid="button-export-all"
                                disabled={isExporting}
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Export All</span>
                                <span className="xs:hidden">All</span>
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

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                        <FileCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1 shadow-sm">
                                        <TrendingUp className="w-3 h-3" />
                                        +5.2%
                                    </span>
                                </div>
                                <CardDescription className="text-xs sm:text-sm font-medium">Approved</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl font-bold text-green-600 drop-shadow-sm">
                                    {stats.approved}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1 shadow-sm">
                                        <TrendingUp className="w-3 h-3" />
                                        +8.1%
                                    </span>
                                </div>
                                <CardDescription className="text-xs sm:text-sm font-medium">Selected</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl font-bold text-blue-600 drop-shadow-sm">
                                    {stats.selected}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="sm:col-span-2 md:col-span-1 relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1 shadow-sm">
                                        <TrendingUp className="w-3 h-3" />
                                        +12.3%
                                    </span>
                                </div>
                                <CardDescription className="text-xs sm:text-sm font-medium">Total Applications</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl font-bold text-purple-600 drop-shadow-sm">
                                    {stats.total}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">
                                            {statusFilter === "Selected" ? "Selected" : "Approved"} Applications by Village
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {villageCountsLoading
                                                ? "Loading..."
                                                : countsPagination.total_records !== null
                                                    ? `${countsPagination.total_records} total villages`
                                                    : `${villages.length} villages found`}
                                        </CardDescription>
                                    </div>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value: "Selected" | "Approved") => {
                                            setStatusFilter(value);
                                            setCurrentCountsPage(1);
                                        }}
                                    >
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
                                        onChange={(event) => {
                                            setVillageSearchQuery(event.target.value);
                                            setCurrentCountsPage(1);
                                        }}
                                        className="pl-10 text-xs sm:text-sm h-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {villageCountsLoading ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">Loading villages...</div>
                            ) : villages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">No villages found</div>
                            ) : (
                                <>
                                    <Accordion type="multiple" className="w-full">
                                        {villages.map((villageItem) => (
                                            <AccordionItem key={villageItem.village_id} value={villageItem.village_id}>
                                                <AccordionTrigger className="hover:no-underline py-3">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                                            <div className="text-left">
                                                                <h3 className="font-semibold text-sm sm:text-base">{villageItem.village_name}</h3>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {villageItem.district} • {villageItem.taluka}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg sm:text-xl font-semibold text-primary">
                                                                {villageItem.total_selected_applications}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {statusFilter === "Selected" ? "selected" : "approved"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                        {villageItem.components.map((component, idx) => {
                                                            const colorClasses = [
                                                                'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/50 hover:border-blue-300 dark:border-blue-800/50',
                                                                'bg-purple-50/80 dark:bg-purple-950/20 border-purple-200/50 hover:border-purple-300 dark:border-purple-800/50',
                                                                'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 hover:border-amber-300 dark:border-amber-800/50',
                                                                'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 hover:border-emerald-300 dark:border-emerald-800/50',
                                                                'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/50 hover:border-rose-300 dark:border-rose-800/50',
                                                                'bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200/50 hover:border-indigo-300 dark:border-indigo-800/50',
                                                                'bg-teal-50/80 dark:bg-teal-950/20 border-teal-200/50 hover:border-teal-300 dark:border-teal-800/50'
                                                            ];
                                                            const cardColor = colorClasses[idx % colorClasses.length];
                                                            return (
                                                                <div key={component.component} className={`p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${cardColor}`}>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="p-1.5 rounded-md bg-background/50 backdrop-blur-sm shadow-sm">
                                                                            <Package className="w-4 h-4 text-foreground/80 flex-shrink-0" />
                                                                        </div>
                                                                        <p className="text-sm font-semibold truncate text-foreground/90">{component.component}</p>
                                                                    </div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Count</span>
                                                                        <span className="text-lg font-bold bg-background/60 px-2 py-0.5 rounded-md shadow-sm text-primary">
                                                                            {component.application_count}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>

                                    {(countsPagination.has_next_page || countsPagination.has_previous_page) && (
                                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage((page) => Math.max(1, page - 1))}
                                                disabled={!countsPagination.has_previous_page}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-3">
                                                Page {currentCountsPage}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentCountsPage((page) => page + 1)}
                                                disabled={!countsPagination.has_next_page}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">
                                        Approved Applications (FIFO Order)
                                    </CardTitle>
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
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                updateFilters({ search: searchQuery });
                                            }
                                        }}
                                        onBlur={() => {
                                            if (searchQuery !== search) {
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
                                        {applicationVillages.map((villageName) => (
                                            <SelectItem key={villageName} value={villageName}>
                                                {villageName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full min-w-[720px]">
                                        <thead className="bg-muted sticky top-0 z-30 border-b">
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
                                            {filteredApplications.map((application, index) => (
                                                <tr
                                                    key={`${application.id}-${index}`}
                                                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                                    data-testid={`application-row-${index}`}
                                                    onClick={() => {
                                                        setSelectedApplication(application);
                                                        setIsDetailsDialogOpen(true);
                                                    }}
                                                >
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                                            <span className="hidden xs:inline">
                                                                {application.submittedDate === "Unknown"
                                                                    ? "Unknown"
                                                                    : new Date(application.submittedDate).toLocaleDateString()}
                                                            </span>
                                                            <span className="xs:hidden">
                                                                {application.submittedDate === "Unknown"
                                                                    ? "N/A"
                                                                    : new Date(application.submittedDate).toLocaleDateString("en", {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                    })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <div className="font-mono text-xs sm:text-sm">
                                                            <span className="font-semibold">{application.realApplicationId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-xs sm:text-sm truncate">
                                                                    {application.applicantName}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{application.mobile}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                            <p className="text-xs sm:text-sm truncate">{application.village}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <div className="flex items-center gap-1 sm:gap-2">
                                                            <Package className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                                            <p className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                                                                {application.component}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">{getStatusBadge(application.status)}</td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        {application.status === "Approved" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    void handleSelect(application.id);
                                                                }}
                                                                className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                                                data-testid={`button-select-${index}`}
                                                            >
                                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden xs:inline">Select</span>
                                                            </Button>
                                                        )}
                                                        {application.status === "Selected" && (
                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-chart-3">
                                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden xs:inline">Selected</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 pt-3 sm:pt-4">
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Showing {filteredApplications.length} of {totalItems} items • Page {currentPage} of {totalPages}
                                    </p>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={currentPage > 1 ? getPageHref(currentPage - 1) : "#"}
                                                    onClick={(event) => {
                                                        if (currentPage <= 1) {
                                                            event.preventDefault();
                                                        }
                                                    }}
                                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {(() => {
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, startPage + 4);

                                                return Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                                                    const pageNumber = startPage + index;

                                                    return (
                                                        <PaginationItem key={pageNumber}>
                                                            <PaginationLink
                                                                href={getPageHref(pageNumber)}
                                                                isActive={pageNumber === currentPage}
                                                            >
                                                                {pageNumber}
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
                                                    href={currentPage < totalPages ? getPageHref(currentPage + 1) : "#"}
                                                    onClick={(event) => {
                                                        if (currentPage >= totalPages) {
                                                            event.preventDefault();
                                                        }
                                                    }}
                                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
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
                page="selection"
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
