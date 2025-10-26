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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Search,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    MapPin,
    User,
    Package,
    Phone,
    Users,
    Leaf,
    Award,
    Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDoc, useFrappeUpdateDoc, useFrappeGetDocList } from "frappe-react-sdk";
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
    console.log(applications)

    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "");

    const [componentFilter, setComponentFilter] = useState(initialFilters?.component || "all");
    const [dateFrom, setDateFrom] = useState(initialFilters?.start_date || "");
    const [dateTo, setDateTo] = useState(initialFilters?.end_date || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewAction, setReviewAction] = useState<"Approved" | "Rejected" | null>(null);
    const [remarks, setRemarks] = useState("");
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
            console.log('Fetched application details:', doc);

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
            if (doc.family_member_aadhar_number) {
                if (Array.isArray(doc.family_member_aadhar_number)) {
                    familyAadharNumbers.push(...doc.family_member_aadhar_number.filter(Boolean).map(String));
                } else if (typeof doc.family_member_aadhar_number === 'string') {
                    const parts = doc.family_member_aadhar_number.split(',').map((s: string) => s.trim()).filter(Boolean);
                    familyAadharNumbers.push(...parts);
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

            const fullApplication: Application = {
                id: doc.name,
                applicantName: doc.fullname,
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
            console.error('Error fetching application details:', docError);
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

    const handleReview = (action: "Approved" | "Rejected") => {
        setReviewAction(action);
        setShowReviewDialog(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedApp || !reviewAction) return;

        try {
            // Update the App Form doctype via Frappe hook
            await updateDoc('App Form', selectedApp.id, {
                status: reviewAction,
                remarks: remarks,
            });

            // Update the application status in state
            // setApplications(prev =>
            //     prev.map(app =>
            //         app.id === selectedApp.id
            //             ? {
            //                 ...app,
            //                 status: reviewAction === "Approved" ? "Approved" : "Rejected",
            //             }
            //             : app
            //     )
            // );

            // Update the selected app status as well
            setSelectedApp({
                ...selectedApp,
                status: reviewAction === "Approved" ? "Approved" : "Rejected",
                approver: `DPO ${assignedZone.taluka}`
            });

            toast({
                title: reviewAction === "Approved" ? "Application Approved" : "Application Rejected",
                description: `Application ${selectedApp.id} has been ${reviewAction === "Approved" ? "approved" : "rejected"} successfully.`,
            });

            setShowReviewDialog(false);
            setRemarks("");
            setReviewAction(null);
        } catch (error) {
            console.error('Error updating application status:', error);
            toast({
                title: "Error",
                description: `Failed to ${reviewAction === "Approved" ? "approve" : "reject"} the application. Please try again.`,
                variant: "destructive",
            });
        }
    };

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

            {(selectedApp || isLoadingDetails) && (
                <Dialog open={!!(selectedApp || isLoadingDetails)} onOpenChange={() => {
                    if (!isLoadingDetails) {
                        setSelectedApp(null);
                        setSelectedAppId(null);
                    }
                }}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                Application Details
                            </DialogTitle>
                            <DialogDescription>
                                Review complete application information
                            </DialogDescription>
                        </DialogHeader>

                        {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-sm text-muted-foreground">Loading application details...</p>
                                </div>
                            </div>
                        ) : selectedApp ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="font-mono font-semibold text-lg">{selectedApp.id}</p>
                                        <p className="text-sm text-muted-foreground">Submitted on {selectedApp.submittedDate}</p>
                                    </div>
                                    {getStatusBadge(selectedApp.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Personal Information
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">Applicant Name</Label>
                                                <p className="font-medium">{selectedApp.applicantName}</p>
                                            </div>

                                            <div>
                                                <Label className="text-muted-foreground">Gender</Label>
                                                <p className="font-medium">{selectedApp.gender}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Caste/Category</Label>
                                                <p className="font-medium">{selectedApp.caste}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Mobile Number</Label>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Phone className="w-3 h-3" />
                                                    {selectedApp.mobile_no}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Aadhar Number</Label>
                                                <p className="font-medium">{selectedApp.aadharNumber}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Family Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">Ration Card Members</Label>
                                                <p className="font-medium">{selectedApp.rationCardMembers}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Family Aadhar Numbers</Label>
                                                <div className="space-y-1 mt-1">
                                                    {selectedApp.familyAadharNumbers.map((aadhar, idx) => (
                                                        <p key={idx} className="font-medium text-xs font-mono">{aadhar}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Location Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">District</Label>
                                                <p className="font-medium">{selectedApp.district}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Taluka</Label>
                                                <p className="font-medium">{selectedApp.taluka}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Village</Label>
                                                <p className="font-medium">{selectedApp.village}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Leaf className="w-4 h-4" />
                                            Eligibility & Livestock
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            {selectedApp.criteria.map((crit, idx) => (
                                                <div key={idx}>
                                                    <Label className="text-muted-foreground">{crit.label}</Label>
                                                    <p className="font-medium">
                                                        {crit.value != null ? String(crit.value) : 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Component Details
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedApp.components.map((comp, idx) => (
                                            <div key={comp.name} className="p-4 bg-primary/5 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-base">{comp.component}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        Component {idx + 1}
                                                    </Badge>
                                                </div>

                                                {comp.response && comp.response !== "[]" && (() => {
                                                    try {
                                                        const responseData = typeof comp.response === 'string'
                                                            ? JSON.parse(comp.response)
                                                            : comp.response;

                                                        if (Array.isArray(responseData) && responseData.length > 0) {
                                                            return (
                                                                <div className="space-y-2">
                                                                    <Label className="text-muted-foreground text-sm">Component Response</Label>
                                                                    <div className="space-y-2">
                                                                        {responseData.map((item, itemIdx) => (
                                                                            <div key={itemIdx} className="flex justify-between items-start p-2 bg-background/50 rounded border">
                                                                                <span className="text-sm text-muted-foreground flex-1 mr-2">
                                                                                    {item.question || item.label || item.name || `Question ${itemIdx + 1}`}:
                                                                                </span>
                                                                                <span className="text-sm font-medium flex-1 text-right">
                                                                                    {item.value != null ? String(item.value) : (item.answer != null ? String(item.answer) : 'N/A')}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else if (typeof responseData === 'object' && responseData !== null) {
                                                            // Format field names to be more readable
                                                            const formatFieldName = (key: string) => {
                                                                return key
                                                                    .replace(/_/g, ' ')
                                                                    .replace(/\b\w/g, l => l.toUpperCase())
                                                                    .replace(/Aadhar/g, 'Aadhaar')
                                                                    .replace(/Image/g, 'Image');
                                                            };

                                                            const isImageUrl = (value: any) => {
                                                                return typeof value === 'string' && (
                                                                    value.includes('/files/') ||
                                                                    value.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                                                );
                                                            };

                                                            return (
                                                                <div className="space-y-2">
                                                                    <Label className="text-muted-foreground text-sm">Component Response</Label>
                                                                    <div className="space-y-2">
                                                                        {Object.entries(responseData).map(([key, value], itemIdx) => (
                                                                            <div key={itemIdx} className="flex justify-between items-start p-2 bg-background/50 rounded border">
                                                                                <span className="text-sm text-muted-foreground flex-1 mr-2">
                                                                                    {formatFieldName(key)}:
                                                                                </span>
                                                                                <span className="text-sm font-medium flex-1 text-right">
                                                                                    {isImageUrl(value) ? (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="ghost"
                                                                                            className="p-0 h-auto font-medium text-sm text-blue-600 hover:text-blue-800 underline"
                                                                                            onClick={() => window.open(String(value), '_blank')}
                                                                                        >
                                                                                            View Image
                                                                                        </Button>
                                                                                    ) : (
                                                                                        value != null ? String(value) : 'N/A'
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    } catch (e) {
                                                        // If parsing fails, show raw response
                                                        return (
                                                            <div className="space-y-2">
                                                                <Label className="text-muted-foreground text-sm">Component Response</Label>
                                                                <div className="text-sm bg-background/50 p-2 rounded border">
                                                                    {typeof comp.response === 'string' ? comp.response : JSON.stringify(comp.response, null, 2)}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Documents Uploaded
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedApp.documents.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{doc.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {doc.uploaded ? (
                                                        <>
                                                            <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                                                                Uploaded
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    if (doc.url) {
                                                                        window.open(doc.url, '_blank');
                                                                    }
                                                                }}
                                                                data-testid={`button-view-document-${doc.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                                            Missing
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedApp.status === "Pending" && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            className="flex-1 bg-chart-3 hover:bg-chart-3/90"
                                            onClick={() => handleReview("Approved")}
                                            data-testid="button-approve"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve Application
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => handleReview("Rejected")}
                                            data-testid="button-reject"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Application
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            )}

            {showReviewDialog && (
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {reviewAction === "Approved" ? "Approve Application" : "Reject Application"}
                            </DialogTitle>
                            <DialogDescription>
                                Please provide remarks for this decision
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Enter your remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={4}
                                    data-testid="textarea-remarks"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowReviewDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmitReview}
                                    disabled={!remarks.trim()}
                                    data-testid="button-submit-review"
                                >
                                    Confirm {reviewAction === "Approved" ? "Approval" : "Rejection"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
