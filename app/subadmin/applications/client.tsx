"use client"
// ...existing code...
import { useState, useEffect, useCallback } from "react";
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
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import {
    Search,
    Download,
    Eye,
    FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDoc, useFrappeUpdateDoc, useFrappeGetDocList, useFrappeAuth, useFrappePostCall } from "frappe-react-sdk";
import { getStatusBadge } from "@/lib/status-utils";
import { frappeBrowser } from "@/lib/frappe";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import * as XLSX from 'xlsx';
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

interface Component {
    name: string;
    component_name: string;
    name_in_local_language?: string;
    dont_show_in_website?: number;
}

// Full interface for detail view
interface Application {
    id: string;
    applicantName: string;
    fatherName: string;
    mobile_no: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
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
    components: {
        name: string;
        component: string;
        response: any;
    }[];
    documents: {
        name: string;
        uploaded: boolean;
        url?: string;
    }[];
    criteria: {
        label: string;
        value: string | number | null;
        response?: any;
    }[];
}

interface SubAdminApplicationsClientProps {
    applications: ApplicationListItem[];
    currentPage: number;
    pageSize: number;
    initialFilters?: {
        status: string;
        search: string;
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

export default function SubAdminApplicationsClient({ applications, currentPage, pageSize, initialFilters, paginationData }: SubAdminApplicationsClientProps) {

    const { toast } = useToast();
    const { currentUser } = useFrappeAuth();
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "");

    const [componentFilter, setComponentFilter] = useState(initialFilters?.component || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters?.start_date || "");
    const [dateTo, setDateTo] = useState(initialFilters?.end_date || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [jumpToPage, setJumpToPage] = useState<string>("");

    // Fetch components for dropdown
    const { data: components } = useFrappeGetDocList<Component>(
        'Component',
        {
            fields: ['name', 'component_name', 'name_in_local_language', 'dont_show_in_website'],
            filters: [['dont_show_in_website', '=', 0]],
            orderBy: {
                field: 'component_name',
                order: 'asc'
            }
        }
    );
    const { call: approveApplication } = useFrappePostCall('vmddp_app.api.app_form.approve_or_reject_applicaiton');
    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const searchParams = useSearchParams();
    const router = useRouter()
    const pathname = usePathname()
    // Mock zone - in real app, this would come from auth context
    const assignedZone = {
        district: "Nagpur",
        taluka: "Nagpur Rural",
    };
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

    // Update URL with filters
    const updateFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Update filter parameters
        if (statusFilter !== 'all') {
            params.set('status', statusFilter);
        } else {
            params.delete('status');
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
        const currentComponent = searchParams.get('component') || 'all';
        const currentSearch = searchParams.get('search') || '';
        const currentStartDate = searchParams.get('start_date') || '';
        const currentEndDate = searchParams.get('end_date') || '';

        const filtersChanged =
            currentStatus !== statusFilter ||
            currentComponent !== componentFilter ||
            currentSearch !== debouncedSearchQuery ||
            currentStartDate !== dateFrom ||
            currentEndDate !== dateTo;

        if (filtersChanged) {
            params.set('page', '1');
        }

        params.set('limit', pageSize.toString());

        router.push(pathname + '?' + params.toString());
    }, [statusFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo, pathname, router, pageSize, searchParams]);

    // Update URL when filters change
    useEffect(() => {
        // Only update if filters have actually changed from URL params
        const currentStatus = searchParams.get('status') || 'all';
        const currentComponent = searchParams.get('component') || 'all';
        const currentSearch = searchParams.get('search') || '';
        const currentStartDate = searchParams.get('start_date') || '';
        const currentEndDate = searchParams.get('end_date') || '';

        if (
            currentStatus !== statusFilter ||
            currentComponent !== componentFilter ||
            currentSearch !== debouncedSearchQuery ||
            currentStartDate !== dateFrom ||
            currentEndDate !== dateTo
        ) {
            updateFilters();
        }
    }, [statusFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo, updateFilters, searchParams]);


    // Use Frappe hook to fetch document details
    const { data: doc, isLoading: isLoadingDetails, error: docError } = useFrappeGetDoc<any>(
        'App Form',
        selectedAppId || undefined,
        selectedAppId ? undefined : null // Don't fetch if no ID is selected
    );

    // Update doc for status changes
    const { updateDoc } = useFrappeUpdateDoc();
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    )
    // Transform Frappe document to Application interface when doc changes
    useEffect(() => {
        if (doc && selectedAppId) {

            // Map the Frappe document to Application interface
            const component_list = Array.isArray(doc.component_list)
                ? doc.component_list.map((comp: any) => comp).join(', ')
                : 'N/A';

            const submittedDate = doc.creation
                ? new Date(doc.creation).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            // Documents: collect known file fields
            const documents: { name: string; uploaded: boolean; url?: string }[] = [];
            if (doc.self_ration_card_image) {
                documents.push({ name: 'Self Ration Card', uploaded: true, url: doc.self_ration_card_image });
            }
            if (doc.family_ration_card_image) {
                documents.push({ name: 'Family Ration Card', uploaded: true, url: doc.family_ration_card_image });
            }
            if (doc.aadhar_image && typeof doc.aadhar_image === 'string' && doc.aadhar_image.startsWith('http')) {
                documents.push({ name: 'Aadhar Card', uploaded: true, url: doc.aadhar_image });
            }

            // Check component responses for additional documents
            if (Array.isArray(doc.components)) {
                doc.components.forEach((component: any) => {
                    if (component.response && typeof component.response === 'string') {
                        try {
                            const responseData = JSON.parse(component.response);
                            if (typeof responseData === 'object' && responseData !== null) {
                                if (responseData.aadhar_image && typeof responseData.aadhar_image === 'string') {
                                    documents.push({
                                        name: `${component.component} - Aadhaar Card`,
                                        uploaded: true,
                                        url: responseData.aadhar_image
                                    });
                                }
                            }
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                });
            }

            // Family aadhar numbers
            const familyAadharNumbers: string[] = [];

            // Check various possible locations for family member Aadhar numbers
            const possibleFields = [
                doc.family_member_aadhar_number,
                doc.family_aadhar_numbers,
                doc.family_members,
                doc.family_aadhar,
                doc.aadhar_numbers,
                doc.members_aadhar
            ];

            for (const field of possibleFields) {
                if (field) {
                    if (Array.isArray(field)) {
                        familyAadharNumbers.push(...field.filter(Boolean).map(String));
                        break;
                    } else if (typeof field === 'string') {
                        const parts = field.split(',').map((s: string) => s.trim()).filter(Boolean);
                        familyAadharNumbers.push(...parts);
                        break;
                    }
                }
            }

            // Check for individual family member fields (familyAadhaar1, familyAadhaar2, etc.)
            const rationCardMembers = parseInt(doc.number_of_members_in_ration_card) || 0;
            if (rationCardMembers > 1) {
                for (let i = 1; i < rationCardMembers; i++) {
                    const fieldNames = [
                        `familyAadhaar${i}`,
                        `family_aadhaar_${i}`,
                        `family_aadhar_${i}`,
                        `familyAadhar${i}`
                    ];

                    for (const fieldName of fieldNames) {
                        if (doc[fieldName]) {
                            familyAadharNumbers.push(String(doc[fieldName]));
                            break;
                        }
                    }
                }
            }

            // Map criteria
            const criteria: { label: string; value: string | number | null; response?: any }[] = [];
            if (Array.isArray(doc.criteria)) {
                doc.criteria.forEach((crit: any) => {
                    criteria.push({
                        label: crit.criteria || '',
                        value: crit.value,
                        response: crit.response
                    });
                });
            }

            const FullName = () => {
                if (doc.fullname) return doc.fullname;
                if (doc.applicant_name) return doc.applicant_name;

                const firstName = doc.first_name || '';
                const middleName = doc.mid_name || '';
                const lastName = doc.last_name || '';
                const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
                return fullName || 'N/A';
            };

            const fullApplication: Application = {
                id: doc.name,
                applicantName: FullName(),
                fatherName: doc.father_name || doc.father || 'N/A',
                mobile_no: doc.mobile_no || '',
                district: doc.district || 'N/A',
                taluka: doc.taluka || 'N/A',
                village: doc.village || 'N/A',
                component: component_list,
                status: doc.status,
                submittedDate,
                animalCount: doc.number_of_animals ? parseInt(doc.number_of_animals) : undefined,
                approver: doc.approver || undefined,
                gender: doc.gender || 'N/A',
                caste: doc.category || 'N/A',
                aadharNumber: (doc.aadhar_number && typeof doc.aadhar_number === 'string' && doc.aadhar_number.startsWith('http'))
                    ? doc.aadhar_number
                    : (doc.aadhar_number || ''),
                rationCardMembers: parseInt(doc.number_of_members_in_ration_card) || 0,
                familyAadharNumbers,
                animalTagNumber: undefined,
                landHolding: parseFloat(doc.land_holding) || 0,
                khasraNumber: doc.khasra_number || 'N/A',
                milkPouringPoint: doc.milk_pouring_point || 'N/A',
                farmerPourerCode: doc.farmer_pourer_code || 'N/A',
                components: Array.isArray(doc.components)
                    ? doc.components.map((c: any) => ({
                        name: c.name,
                        component: c.component,
                        response: c.response
                    }))
                    : [],
                documents,
                criteria
            };

            setSelectedApp(fullApplication);
        }
    }, [doc, selectedAppId]);

    // Handle errors from doc fetch
    useEffect(() => {
        if (docError) {
            toast({
                title: "Error",
                description: "Failed to load application details. Please try again.",
                variant: "destructive",
            });
            setSelectedAppId(null);
        }
    }, [docError, toast]);

    // Remove the hardcoded applications array



    const handleViewDetails = (app: ApplicationListItem) => {
        // Set the app ID to trigger the useFrappeGetDoc hook
        setSelectedAppId(app.id);
    };

    const handleJumpToPage = () => {
        const pageNum = parseInt(jumpToPage);
        const totalPages = paginationData?.total_pages ?? (applications.length === pageSize ? currentPage + 2 : currentPage);

        if (isNaN(pageNum) || pageNum < 1) {
            toast({
                title: "Invalid page number",
                description: "Please enter a valid page number.",
                variant: "destructive",
            });
            return;
        }

        if (pageNum > totalPages) {
            toast({
                title: "Page out of range",
                description: `Please enter a page number between 1 and ${totalPages}.`,
                variant: "destructive",
            });
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNum.toString());
        router.push(pathname + '?' + params.toString());
        setJumpToPage("");
    };

    const handleSubmitReview = async (action: "approve" | "reject", reviewRemarks: string, selectedComponents: Array<string>) => {
        if (!selectedApp) return;

        const status = action === "approve" ? "Approved" : "Rejected";

        try {
            // Update the App Form doctype via Frappe hook
            // await updateDoc('App Form', selectedApp.id, {
            //     status: status,
            //     remarks: reviewRemarks,
            //     approver: currentUser || undefined,
            // });
            const response = await approveApplication({
                application_id: selectedApp.id,
                status: status,
                components: selectedComponents,
                remarks: reviewRemarks,
            })
            console.log('Approve/Reject response:', response);

            // Update the selected app status as well
            setSelectedApp({
                ...selectedApp,
                status: status,
                approver: currentUser || `DPO ${assignedZone.taluka}`
            });

            toast({
                title: status === "Approved" ? "Application Approved" : "Application Rejected",
                description: `Application ${selectedApp.id} has been ${status === "Approved" ? "approved" : "rejected"} successfully.`,
            });

            // Close the application details dialog
            setSelectedApp(null);
            setSelectedAppId(null);
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${status === "Approved" ? "approve" : "reject"} the application. Please try again.`,
                variant: "destructive",
            });
        }
    };

    // Transform selectedApp data to match ApplicationDetailsDialog format
    const transformApplicationData = useCallback((app: any) => {
        if (!app) return null;

        return {
            id: app.id || app.name,
            submittedDate: app.submittedDate || app.creation?.split(' ')[0] || 'N/A',
            status: app.status,
            applicantName: app.applicantName || `${app.firstName || ''} ${app.middleName || ''} ${app.lastName || ''}`.trim(),
            fatherName: app.fatherName || 'N/A',
            gender: app.gender,
            caste: app.caste || app.category,
            mobile: app.mobile_no || app.mobile,
            aadharNumber: app.aadharNumber || app.aadhar_number,
            rationCardMembers: app.rationCardMembers,
            familyAadharNumbers: app.familyAadharNumbers || [],
            district: app.district,
            taluka: app.taluka,
            village: app.village,
            animalCount: app.animalCount,
            animalTagNumber: app.animalTagNumber,
            landHolding: app.landHolding,
            khasraNumber: app.khasraNumber,
            milkPouringPoint: app.milkPouringPoint,
            farmerPourerCode: app.farmerPourerCode,
            component: app.components?.[0]?.component || 'N/A',
            componentDetails: {
                benefits: app.components?.[0]?.benefits || [],
                customQuestions: app.components?.[0]?.customQuestions || []
            },
            documents: app.documents || []
        };
    }, []);

    const handleExport = useCallback(() => {
        if (!applications || applications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'Taluka', 'Village', 'Milk Pouring Point', 'Component', 'Tag Numbers', 'Status', 'Submitted Date'];

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

            const row: Record<string, string> = {
                'Application ID': a.id,
                'Applicant': a.applicantName,
                'Aadhar Number': a.aadharNumber || '',
                'Mobile': a.mobile || '',
                'Taluka': a.taluka || '',
                'Village': a.village,
                'Milk Pouring Point': a.milkPouringPoint || '',
                'Component': a.component,
                'Tag Numbers': tagNumbers,
                'Status': a.status,
                'Submitted Date': a.submittedDate,
            };

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

        const colWidths = headers.map((h) => {
            const maxDataLength = rows.reduce((max: number, row: any) => {
                const value = String(row[h as keyof typeof row] || '');
                return Math.max(max, value.length);
            }, 0);
            return { wch: Math.max(h.length, maxDataLength, 15) + 2 };
        });
        worksheet['!cols'] = colWidths;

        const date = new Date().toISOString().split('T')[0];
        const parts: string[] = [];
        if (statusFilter && statusFilter !== 'all') parts.push(statusFilter);
        if (componentFilter && componentFilter !== 'all') parts.push(componentFilter.replace(/\s+/g, '_'));
        if (debouncedSearchQuery) parts.push(`q-${debouncedSearchQuery.replace(/\s+/g, '_')}`);
        const suffix = parts.length ? `-${parts.join('-')}` : '';

        XLSX.writeFile(workbook, `applications${suffix}-${date}.xlsx`);

        toast({
            title: "Export started",
            description: `Exported ${applications.length} applications from current page.`,
        });
    }, [applications, statusFilter, componentFilter, debouncedSearchQuery, toast]);

    // Export ALL applications (with current filters) as Excel
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
            console.log('Component Filter:', componentFilter);
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
                    description: "There are no applications to export.",
                    variant: "destructive",
                });
                return;
            }

            const headers = ['Application ID', 'Applicant', 'Aadhar Number', 'Mobile', 'Taluka', 'Village', 'Milk Pouring Point', 'Component', 'Tag Numbers', 'Status', 'Submitted Date'];

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

                const row: Record<string, string> = {
                    'Application ID': a.id,
                    'Applicant': a.applicantName,
                    'Aadhar Number': a.aadharNumber || '',
                    'Mobile': a.mobile || '',
                    'Taluka': a.taluka || '',
                    'Village': a.village || '',
                    'Milk Pouring Point': a.milkPouringPoint || '',
                    'Component': a.component || '',
                    'Tag Numbers': tagNumbers,
                    'Status': a.status || '',
                    'Submitted Date': a.submittedDate || '',
                };

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

            const colWidths = headers.map((h) => {
                const maxDataLength = rows.reduce((max: number, row: any) => {
                    const value = String(row[h as keyof typeof row] || '');
                    return Math.max(max, value.length);
                }, 0);
                return { wch: Math.max(h.length, maxDataLength, 15) + 2 };
            });
            worksheet['!cols'] = colWidths;

            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `all-applications-${date}.xlsx`);

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
    }, [toast, statusFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo]);

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between pl-12 pr-3 py-4 md:p-6 border-b bg-card">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2" data-testid="text-applications-title">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        Applications
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Review and manage applications
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
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <Card>
                        <CardHeader className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-start md:items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">All Applications</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {paginationData?.total_applications} applications found in your zone
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
                                        className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                                        data-testid="input-search"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger data-testid="select-status-filter" className="text-xs sm:text-sm h-8 sm:h-10">
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

                                <Select value={componentFilter} onValueChange={setComponentFilter}>
                                    <SelectTrigger data-testid="select-component-filter" className="text-xs sm:text-sm h-8 sm:h-10">
                                        <SelectValue placeholder="Filter by component" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Components</SelectItem>
                                        {components?.map((component) => (
                                            <SelectItem key={component.name} value={component.component_name}>
                                                {component.component_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-1 sm:gap-2 min-w-0 sm:col-span-2 lg:col-span-1">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1 min-w-0 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="From date"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1 min-w-0 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px]">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">ID</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Applicant</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Aadhar Number</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Mobile Number</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Taluka</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Village</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">Milk Pouring Point</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">Component</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden xl:table-cell">Tag Numbers</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Status</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm hidden sm:table-cell">Date</th>
                                                <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app, index) => (
                                                <tr
                                                    key={`${app.id}-${index}`}
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
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.aadharNumber || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.mobile || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.taluka || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4">
                                                        <div>
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{app.village}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                        <p className="text-xs sm:text-sm truncate max-w-[150px]">{app.milkPouringPoint || '-'}</p>
                                                    </td>
                                                    <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                        <p className="text-xs sm:text-sm truncate max-w-[150px]">{app.component}</p>
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
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4 pt-3 sm:pt-4">
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

                                <div className="flex items-center gap-3">
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

                                            {/* {paginationData && currentPage < paginationData.total_pages - 2 && (
                                                <>
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                </>
                                            )} */}

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

                                    {/* Jump to Page Input */}
                                    <div className="flex items-center gap-1 sm:gap-2 border-l pl-3">
                                        <label htmlFor="jumpToPage" className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            Go to:
                                        </label>
                                        <Input
                                            id="jumpToPage"
                                            type="number"
                                            min="1"
                                            max={paginationData?.total_pages ?? (applications.length === pageSize ? currentPage + 2 : currentPage)}
                                            value={jumpToPage}
                                            onChange={(e) => setJumpToPage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleJumpToPage();
                                                }
                                            }}
                                            placeholder="Page"
                                            className="w-16 sm:w-20 text-xs sm:text-sm h-8 sm:h-9 text-center"
                                        />
                                        <Button
                                            onClick={handleJumpToPage}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs sm:text-sm h-8 sm:h-9 px-3"
                                        >
                                            Go
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <ApplicationDetailsDialog
                application={transformApplicationData(selectedApp)}
                isOpen={!!(selectedApp || isLoadingDetails)}
                onClose={() => {
                    if (!isLoadingDetails) {
                        setSelectedApp(null);
                        setSelectedAppId(null);
                    }
                }}
                onReview={(action, remarks, components) => {
                    handleSubmitReview(action, remarks, components);
                }}
                showReviewActions={true}
            />

        </div>
    );
}
