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
import AdminSidebar from "@/components/AdminSidebar";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import {
    Search,
    Download,
    Eye,
    FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDoc, useFrappeUpdateDoc, useFrappeGetDocList, useFrappeAuth } from "frappe-react-sdk";
import { getStatusBadge } from "@/lib/status-utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
// Lightweight interface for list view
interface ApplicationListItem {
    id: string;
    applicantName: string;
    village: string;
    component: string;
    status: "Approved" | "Pending" | "Rejected" | "Selected";
    submittedDate: string;
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
}

export default function SubAdminApplicationsClient({ applications, currentPage, pageSize, initialFilters }: SubAdminApplicationsClientProps) {

    const { toast } = useToast();
    const { currentUser } = useFrappeAuth();
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "");

    const [componentFilter, setComponentFilter] = useState(initialFilters?.component || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters?.start_date || "");
    const [dateTo, setDateTo] = useState(initialFilters?.end_date || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

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
        const params = new URLSearchParams();

        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (componentFilter !== 'all') params.set('component', componentFilter);
        if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
        if (dateFrom) params.set('start_date', dateFrom);
        if (dateTo) params.set('end_date', dateTo);

        // Preserve pagination
        params.set('page', '1'); // Reset to first page on filter change

        router.push(pathname + '?' + params.toString());
    }, [statusFilter, componentFilter, debouncedSearchQuery, dateFrom, dateTo, pathname, router]);

    // Update URL when filters change
    useEffect(() => {
        updateFilters();
    }, [updateFilters]);


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
    useEffect(() => {
        router.push(pathname + '?' + createQueryString('status', statusFilter))
    }, [statusFilter]);
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

    const handleSubmitReview = async (action: "approve" | "reject", reviewRemarks: string) => {
        if (!selectedApp) return;

        const status = action === "approve" ? "Approved" : "Rejected";

        try {
            // Update the App Form doctype via Frappe hook
            await updateDoc('App Form', selectedApp.id, {
                status: status,
                remarks: reviewRemarks,
                approver: currentUser || undefined,
            });

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

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AdminSidebar userRole="subadmin" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-applications-title">
                            <FileText className="w-6 h-6" />
                            Applications
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and manage applications
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2" data-testid="button-export">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <CardTitle>All Applications</CardTitle>
                                        <CardDescription>
                                            {applications.length} applications found in your zone
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                                    <Select value={componentFilter} onValueChange={setComponentFilter}>
                                        <SelectTrigger data-testid="select-component-filter">
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

                                    <div className="flex gap-2">
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
                                                    <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Applicant</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Village</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Component</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Date</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {applications.map((app, index) => (
                                                    <tr
                                                        key={app.id}
                                                        className="border-b hover:bg-muted/30 transition-colors"
                                                        data-testid={`application-row-${index}`}
                                                    >
                                                        <td className="p-4">
                                                            <span className="font-mono text-sm font-semibold">{app.id}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div>
                                                                <p className="font-medium text-sm">{app.applicantName}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.village}</p>
                                                        </td>
                                                        <td className="p-4 max-w-[200px]">
                                                            <p className="text-sm break-words">{app.component}</p>
                                                        </td>
                                                        <td className="p-4">{getStatusBadge(app.status)}</td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.submittedDate}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleViewDetails(app)}
                                                                data-testid={`button-view-${index}`}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing page {currentPage} ({pageSize} items per page)
                                    </p>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={currentPage > 1 ? `?page=${currentPage - 1}&limit=${pageSize}` : '#'}
                                                    onClick={(e) => {
                                                        if (currentPage <= 1) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>

                                            {/* Page numbers */}
                                            {[...Array(Math.min(5, Math.max(1, currentPage + 2)))].map((_, i) => {
                                                const pageNum = Math.max(1, currentPage - 2) + i;
                                                return (
                                                    <PaginationItem key={pageNum}>
                                                        <PaginationLink
                                                            href={`?page=${pageNum}&limit=${pageSize}`}
                                                            isActive={pageNum === currentPage}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}

                                            {currentPage < 10 && (
                                                <>
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                </>
                                            )}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href={applications.length === pageSize ? `?page=${currentPage + 1}&limit=${pageSize}` : '#'}
                                                    onClick={(e) => {
                                                        if (applications.length < pageSize) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={applications.length < pageSize ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            <ApplicationDetailsDialog
                application={transformApplicationData(selectedApp)}
                isOpen={!!(selectedApp || isLoadingDetails)}
                onClose={() => {
                    if (!isLoadingDetails) {
                        setSelectedApp(null);
                        setSelectedAppId(null);
                    }
                }}
                onReview={(action, remarks) => {
                    handleSubmitReview(action, remarks);
                }}
                showReviewActions={true}
            />

        </div>
    );
}
