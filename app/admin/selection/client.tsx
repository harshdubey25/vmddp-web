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
    ChevronsLeft,
    ChevronsRight,
    MapPin,
    User,
    Package,
    Calendar,
    FileCheck,
    Target,
    TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { frappeBrowser } from "@/lib/frappe";
import { useFrappePostCall } from "frappe-react-sdk";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";


interface ApplicationSelectionItem {
    id: string;
    realApplicationId: string;
    applicantName: string;
    mobile: string;
    village: string;
    district?: string;
    component: string;
    status: "Approved" | "Selected";
    submittedDate: string;
    aadharNumber?: string;
    mobile_no?: number;
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
interface AdminSelectionClientProps {
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
        district: string;
        start_date: string;
        end_date: string;
    };
    paginationData?: {
        current_page: number;
        total_pages: number;
        total_records: number;
        has_next_page: boolean;
        has_previous_page: boolean;
    };
}

export default function AdminSelectionClient({
    applications: initialApplications,
    stats,
    currentPage,
    pageSize,
    initialFilters,
    paginationData
}: AdminSelectionClientProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState(initialFilters.search);
    const [districtFilter, setDistrictFilter] = useState(initialFilters.district);
    const [applicationStatusFilter, setApplicationStatusFilter] = useState(initialFilters.status || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters.start_date || "");
    const [dateTo, setDateTo] = useState(initialFilters.end_date || "");
    const [applications, setApplications] = useState<ApplicationSelectionItem[]>(initialApplications);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationSelectionItem | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    const { call: selectionApplication } = useFrappePostCall("vmddp_app.api.app_form.select_application");

    interface DistrictData {
        district_id: string;
        district_name: string;
        components: {
            component: string;
            application_count: number;
            responses?: Array<{
                response: any;
                component_status: string;
            }>;
        }[];
        total_selected_applications: number;
        villages?: { village_name: string; count: number }[];
    }

    const [districts, setDistricts] = useState<DistrictData[]>([]);
    const [countsLoading, setCountsLoading] = useState(false);
    const [districtSearchQuery, setDistrictSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"Selected" | "Approved">("Selected");
    const [showAllDistricts, setShowAllDistricts] = useState(false);

    interface ComponentQuestionAnswers {
        [componentName: string]: {
            [question: string]: {
                [answer: string]: number;
            };
        };
    }
    const [componentQuestionAnswers, setComponentQuestionAnswers] = useState<ComponentQuestionAnswers>({});
    const [questionAnswersLoading, setQuestionAnswersLoading] = useState(false);
    const [loadedDistricts, setLoadedDistricts] = useState<Set<string>>(new Set());

    const applicationDistricts = Array.from(new Set(districts.map(d => d.district_name).filter(Boolean))).sort();

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

        const baseHeaders = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'District', 'Taluka', 'Village', 'Milk Pouring Point'];
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
                'District': a.district || '',
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
        if (districtFilter && districtFilter !== 'all') parts.push(districtFilter.replace(/\s+/g, '_'));
        if (searchQuery) parts.push(`q-${searchQuery.replace(/\s+/g, '_')}`);
        const suffix = parts.length ? `-${parts.join('-')}` : '';

        XLSX.writeFile(workbook, `admin-applications${suffix}-${date}.xlsx`);

        toast({
            title: "Export started",
            description: `Exported ${appsToExport.length} applications from current page.`,
        });
    };

    const handleExportAll = async () => {
        toast({
            title: "Export started",
            description: "Fetching all applications with current filters...",
        });

        try {
            const apiParams: any = {
                export: true
            };

            if (applicationStatusFilter && applicationStatusFilter !== 'all') {
                apiParams.status = applicationStatusFilter;
            } else {
                apiParams.status = '["Approved","Selected"]';
            }

            if (searchQuery && searchQuery.trim()) {
                apiParams.search = searchQuery.trim();
            }

            if (districtFilter && districtFilter !== 'all') {
                apiParams.district = districtFilter;
            }

            if (dateFrom) {
                apiParams.start_date = dateFrom;
            }

            if (dateTo) {
                apiParams.end_date = dateTo;
            }

            const response = await frappeBrowser.call().get('vmddp_app.api.api.get_applications_summary', apiParams);

            const allApplications = (response.message?.applications || []).map((app: any) => {
                let component = 'N/A';
                if (Array.isArray(app.component_list)) {
                    const ordered = COMPONENT_ORDER.map(orderName => app.component_list.find((c: string) => c === orderName)).filter(Boolean);
                    component = ordered.join(', ');
                } else if (typeof app.component_list === 'string') {
                    component = app.component_list;
                }

                return {
                    id: app.name,
                    realApplicationId: app.name,
                    applicantName: app.fullname ?? 'Unknown',
                    aadharNumber: app.aadhar_number ?? '',
                    mobile: app.mobile_number ?? app.mobile_no ?? '',
                    district: app.district ?? app.address_district ?? '',
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

            const baseHeaders = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'District', 'Taluka', 'Village', 'Milk Pouring Point'];
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
                    'District': a.district || '',
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
            XLSX.writeFile(workbook, `admin-all-applications${statusPart}-${date}.xlsx`);

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


    const handleExportPDF = async () => {
        const params = new URLSearchParams();

        if (applicationStatusFilter && applicationStatusFilter !== 'all') {
            params.set("status", applicationStatusFilter);
        } else {
            params.set("status", '["Approved","Selected"]');
        }

        if (districtFilter && districtFilter !== "all") {
            params.set("district", districtFilter);
        }

        if (searchQuery && searchQuery.trim()) {
            params.set("search", searchQuery.trim());
        }

        if (dateFrom) {
            params.set("start_date", dateFrom);
        }

        if (dateTo) {
            params.set("end_date", dateTo);
        }

        const url = `/api/reports/selected-applications-pdf?${params.toString()}`;

        try {
            toast({
                title: "Generating PDF",
                description: "Please wait while the PDF is being generated...",
            });

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to generate PDF" }));
                toast({
                    title: "Error",
                    description: errorData.error || "Failed to generate PDF",
                    variant: "destructive",
                });
                return;
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'selected-applications.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: "Success",
                description: "PDF has been downloaded successfully",
            });
        } catch (error) {
            console.error("PDF export error:", error);
            toast({
                title: "Error",
                description: "Failed to export PDF. Please try again.",
                variant: "destructive",
            });
        }
    };


    const updateFilters = (updates: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search);

        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

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

        if ('page' in updates === false) {
            params.delete('page');
        }

        window.location.href = `?${params.toString()}`;
    };

    useEffect(() => {
        const fetchDistricts = async () => {
            setCountsLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('limit', '25');
                params.append('status', statusFilter);
                if (districtSearchQuery && districtSearchQuery !== 'all') {
                    params.append('district', districtSearchQuery);
                }

                const response = await frappeBrowser
                    .call()
                    .get(
                        `vmddp_app.api.reports.district_selection_status_per_component?${params.toString()}`,
                    );

                const data = response?.message || response?.data || response;
                const districtsData = data?.data || [];

                setDistricts(districtsData);
            } catch (error) {
                console.error('Error fetching districts:', error);
                setDistricts([]);
            } finally {
                setCountsLoading(false);
            }
        };

        fetchDistricts();
    }, [districtSearchQuery, statusFilter]);

    // Function to fetch component question answers for a specific district
    const fetchDistrictQuestionAnswers = async (districtName: string) => {
        // Skip if already loaded
        if (loadedDistricts.has(districtName)) {
            return;
        }

        setQuestionAnswersLoading(true);
        try {
            const params = new URLSearchParams({
                component: 'all',
                district: districtName,
                status: statusFilter
            });

            const response = await frappeBrowser
                .call()
                .get(
                    `vmddp_app.api.reports.get_component_question_answers_count?${params.toString()}`,
                );

            console.log('Question Answers API Response:', response);
            const data = response?.message?.message || response?.message || {};
            console.log('Extracted data:', data);

            setComponentQuestionAnswers(prev => ({
                ...prev,
                ...data
            }));

            setLoadedDistricts(prev => new Set([...prev, districtName]));
        } catch (error) {
            console.error('Error fetching component question answers:', error);
        } finally {
            setQuestionAnswersLoading(false);
        }
    };

    const filteredApplications = applications;
    const totalPages = paginationData?.total_pages || 1;
    const totalItems = paginationData?.total_records || applications.length;

    const handleSelect = async (appId: string) => {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const originalAppId = app.realApplicationId;

        try {
            // Use the proper API endpoint that handles both application and component statuses
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
                    <Button variant="secondary" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10" data-testid="button-export-all-pdf" onClick={handleExportPDF}>
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Export All PDF</span>
                        <span className="xs:hidden">All PDF</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                                        <FileCheck className="w-6 h-6 text-white" />
                                    </div>

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

                                </div>
                                <CardDescription className="text-xs sm:text-sm font-medium">Total Applications</CardDescription>
                                <CardTitle className="text-3xl sm:text-4xl font-bold text-purple-600 drop-shadow-sm">
                                    {stats.total}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Selection Status by District and Component */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg md:text-xl">
                                            {statusFilter === "Selected" ? "Selected" : "Approved"} Applications by District
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {countsLoading ? 'Loading...' : `${districts.length} districts found`}
                                        </CardDescription>
                                    </div>
                                    <Select value={statusFilter} onValueChange={(value: any) => {
                                        setStatusFilter(value);
                                        setShowAllDistricts(false);
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
                                    <Select
                                        value={districtSearchQuery}
                                        onValueChange={(value) => {
                                            setDistrictSearchQuery(value === "all" ? "" : value);
                                            setShowAllDistricts(false);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs sm:text-sm">
                                            <div className="flex items-center gap-2">
                                                <SelectValue placeholder="Select district..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Districts</SelectItem>
                                            {districts.map((district) => (
                                                <SelectItem key={district.district_id} value={district.district_name}>
                                                    {district.district_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            {countsLoading ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">Loading districts...</div>
                            ) : districts.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">No districts found</div>
                            ) : (
                                <>
                                    {(() => {
                                        const filteredDistricts = districtSearchQuery
                                            ? districts.filter(d => d.district_name === districtSearchQuery)
                                            : districts;
                                        const displayDistricts = showAllDistricts ? filteredDistricts : filteredDistricts.slice(0, 6);

                                        return (
                                            <Accordion
                                                type="multiple"
                                                className="w-full"
                                                onValueChange={(openValues) => {
                                                    openValues.forEach(districtId => {
                                                        const district = districts.find(d => d.district_id === districtId);
                                                        if (district) {
                                                            fetchDistrictQuestionAnswers(district.district_name);
                                                        }
                                                    });
                                                }}
                                            >
                                                {displayDistricts.map((district) => (
                                                    <AccordionItem key={district.district_id} value={district.district_id}>
                                                        <AccordionTrigger className="hover:no-underline py-3">
                                                            <div className="flex items-center justify-between w-full pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                                                                    <div className="text-left">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold text-sm sm:text-base">{district.district_name}</h3>
                                                                            {questionAnswersLoading && !loadedDistricts.has(district.district_name) && (
                                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            District
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-lg sm:text-xl font-semibold text-primary">
                                                                        {district.total_selected_applications}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {statusFilter === "Selected" ? "selected" : "approved"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                                {COMPONENT_ORDER.map((orderName, idx) => {
                                                                    const comp = district.components.find(c => c.component === orderName);
                                                                    if (!comp) return null;

                                                                    const componentQuestions = componentQuestionAnswers[comp.component] || {};

                                                                    const colorClasses = [
                                                                        'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/50 hover:border-blue-300 dark:border-blue-800/50',
                                                                        'bg-purple-50/80 dark:bg-purple-950/20 border-purple-200/50 hover:border-purple-300 dark:border-purple-800/50',
                                                                        'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50 hover:border-amber-300 dark:border-amber-800/50',
                                                                        'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 hover:border-emerald-300 dark:border-emerald-800/50',
                                                                        'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/50 hover:border-rose-300 dark:border-rose-800/50',
                                                                        'bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200/50 hover:border-indigo-300 dark:border-indigo-800/50'
                                                                    ];
                                                                    const cardColor = colorClasses[idx % colorClasses.length];

                                                                    return (
                                                                        <div key={comp.component} className={`p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${cardColor}`}>
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <div className="p-1.5 rounded-md bg-background/50 backdrop-blur-sm shadow-sm">
                                                                                    <Package className="w-4 h-4 text-foreground/80 flex-shrink-0" />
                                                                                </div>
                                                                                <p className="text-sm font-semibold truncate text-foreground/90">{comp.component}</p>
                                                                            </div>
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Applications</span>
                                                                                <span className="text-lg font-bold bg-background/60 px-2 py-0.5 rounded-md shadow-sm">
                                                                                    {comp.application_count}
                                                                                </span>
                                                                            </div>

                                                                            {Object.keys(componentQuestions).length > 0 ? (
                                                                                <div className="mt-3 pt-3 border-t border-foreground/10 space-y-3">
                                                                                    {questionAnswersLoading ? (
                                                                                        <div className="flex justify-center py-2">
                                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground/30"></div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        Object.entries(componentQuestions)
                                                                                            .filter(([question]) => question !== "Quantity")
                                                                                            .map(([question, answers]) => (
                                                                                                <div key={question} className="space-y-1.5 bg-background/40 p-2 rounded-lg">
                                                                                                    <p className="text-xs font-semibold text-foreground/90 leading-tight">{question}</p>
                                                                                                    <div className="space-y-1 pl-1">
                                                                                                        {Object.entries(answers).map(([answer, count]) => (
                                                                                                            count > 0 && (
                                                                                                                <div key={answer} className="flex items-center justify-between text-xs group">
                                                                                                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors mr-2 truncate">{answer}</span>
                                                                                                                    <span className="font-semibold px-1.5 py-0.5 rounded-full bg-background shadow-sm text-foreground/80 flex-shrink-0">{count}</span>
                                                                                                                </div>
                                                                                                            )
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                    )}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        );
                                    })()}

                                    {(() => {
                                        const filteredDistricts = districtSearchQuery
                                            ? districts.filter(d => d.district_name === districtSearchQuery)
                                            : districts;
                                        return filteredDistricts.length > 6 && (
                                            <div className="flex items-center justify-center mt-4 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowAllDistricts(!showAllDistricts)}
                                                    className="text-xs sm:text-sm"
                                                >
                                                    {showAllDistricts ? (
                                                        <>
                                                            Show Less Districts
                                                            <span className="ml-2">↑</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            Show All {filteredDistricts.length} Districts
                                                            <span className="ml-2">↓</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Applications List */}
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">Applications (FIFO Order)</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {totalItems} applications • Page {currentPage} of {totalPages}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                <div className="relative">
                                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateFilters({ search: searchQuery, status: applicationStatusFilter, district: districtFilter });
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
                                    value={districtFilter}
                                    onValueChange={(value) => {
                                        setDistrictFilter(value);
                                    }}
                                >
                                    <SelectTrigger data-testid="select-district-filter" className="text-xs sm:text-sm h-8 sm:h-10">
                                        <SelectValue placeholder="Filter by district" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Districts</SelectItem>
                                        {applicationDistricts.map(district => (
                                            <SelectItem key={district!} value={district!}>{district}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="From date"
                                        data-testid="input-date-from"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="To date"
                                        data-testid="input-date-to"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => updateFilters({ search: searchQuery, status: applicationStatusFilter, district: districtFilter })}
                                    className="gap-2 text-xs sm:text-sm h-8 sm:h-10"
                                    data-testid="button-apply-filters"
                                >
                                    <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Search
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full min-w-[720px]">
                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                            <tr>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Date</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Application ID</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Applicant</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">District</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Taluka</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Village</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Component</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Status</th>
                                                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.map((app, index) => (
                                                <tr
                                                    key={`${app.id}-${index}`}
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
                                                        <p className="text-xs sm:text-sm truncate">{app.district || 'N/A'}</p>
                                                    </td>
                                                    <td className="p-2 sm:p-3 md:p-4">
                                                        <p className="text-xs sm:text-sm truncate">{app.taluka || 'N/A'}</p>
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelect(app.id);
                                                                }}
                                                                className="gap-1 sm:gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                                                data-testid={`button-select-${index}`}
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
                                            ))}
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
                                    <div className="flex items-center gap-3">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')), page: '1' })}`}
                                                        onClick={(e) => {
                                                            if (currentPage <= 1) e.preventDefault();
                                                        }}
                                                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                        aria-label="First page"
                                                    >
                                                        <ChevronsLeft className="h-4 w-4" />
                                                    </PaginationLink>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        href={currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: (currentPage - 1).toString() })}` : '#'}
                                                        onClick={(e) => {
                                                            if (currentPage <= 1) e.preventDefault();
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

                                                <PaginationItem>
                                                    <PaginationNext
                                                        href={currentPage < totalPages ? `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: (currentPage + 1).toString() })}` : '#'}
                                                        onClick={(e) => {
                                                            if (currentPage >= totalPages) e.preventDefault();
                                                        }}
                                                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                                    />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        href={`?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), page: totalPages.toString() })}`}
                                                        onClick={(e) => {
                                                            if (currentPage >= totalPages) e.preventDefault();
                                                        }}
                                                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                                        aria-label="Last page"
                                                    >
                                                        <ChevronsRight className="h-4 w-4" />
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Go to</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={totalPages}
                                                placeholder="#"
                                                className="w-14 h-8 text-xs sm:text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        const value = parseInt((e.target as HTMLInputElement).value);
                                                        if (!isNaN(value)) {
                                                            const page = Math.max(1, Math.min(totalPages, value));
                                                            const params = new URLSearchParams(window.location.search);
                                                            params.set('page', page.toString());
                                                            window.location.href = `?${params.toString()}`;
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
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
