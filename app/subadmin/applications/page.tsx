"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { frappeBrowser } from "@/lib/frappe";
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
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { Search, Download, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFrappeGetDoc, useFrappeGetDocList, useFrappeAuth, useFrappePostCall } from "frappe-react-sdk";
import { getStatusBadge } from "@/lib/status-utils";
import * as XLSX from "xlsx";

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

interface PaginationData {
    current_page: number;
    page_size: number;
    total_applications: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

interface Component {
    name: string;
    component_name: string;
    name_in_local_language?: string;
    dont_show_in_website?: number;
}

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
        benefits?: string[];
        customQuestions?: { label: string; answer: string }[];
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

async function getApplications(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
    component?: string,
    startDate?: string,
    endDate?: string
): Promise<{ applications: ApplicationListItem[]; pagination?: PaginationData }> {
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
    const pathname = usePathname();
    const { toast } = useToast();
    const { currentUser } = useFrappeAuth();

    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isListLoading, setIsListLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [componentFilter, setComponentFilter] = useState(searchParams.get("component") || "all");
    const [dateFrom, setDateFrom] = useState(searchParams.get("start_date") || "");
    const [dateTo, setDateTo] = useState(searchParams.get("end_date") || "");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [jumpToPage, setJumpToPage] = useState("");
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [pageSize] = useState(parseInt(searchParams.get("limit") || "20"));

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: components } = useFrappeGetDocList<Component>("Component", {
        fields: ["name", "component_name", "name_in_local_language", "dont_show_in_website"],
        filters: [["dont_show_in_website", "=", 0]],
        orderBy: {
            field: "component_name",
            order: "asc",
        },
    });

    const { call: approveApplication } = useFrappePostCall("vmddp_app.api.app_form.approve_or_reject_applicaiton");

    const { data: doc, isLoading: isLoadingDetails, error: docError } = useFrappeGetDoc<any>(
        "App Form",
        selectedAppId || undefined,
        selectedAppId ? undefined : null
    );

    const assignedZone = {
        district: "Nagpur",
        taluka: "Nagpur Rural",
    };

    const updateUrl = useCallback((nextPage: number) => {
        const params = new URLSearchParams();

        if (statusFilter !== "all") {
            params.set("status", statusFilter);
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
    }, [componentFilter, dateFrom, dateTo, debouncedSearchQuery, pageSize, pathname, statusFilter]);

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
    }, [componentFilter, currentPage, dateFrom, dateTo, debouncedSearchQuery, isLoading, pageSize, statusFilter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    useEffect(() => {
        setCurrentPage(1);
    }, [componentFilter, dateFrom, dateTo, debouncedSearchQuery, statusFilter]);

    useEffect(() => {
        updateUrl(currentPage);
    }, [currentPage, updateUrl]);

    useEffect(() => {
        if (!doc || !selectedAppId) {
            return;
        }

        const componentList = Array.isArray(doc.component_list)
            ? doc.component_list.map((comp: any) => comp).join(", ")
            : "N/A";

        const submittedDate = doc.creation
            ? new Date(doc.creation).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

        const documents: { name: string; uploaded: boolean; url?: string }[] = [];
        if (doc.self_ration_card_image) {
            documents.push({ name: "Self Ration Card", uploaded: true, url: doc.self_ration_card_image });
        }
        if (doc.family_ration_card_image) {
            documents.push({ name: "Family Ration Card", uploaded: true, url: doc.family_ration_card_image });
        }
        if (doc.aadhar_image && typeof doc.aadhar_image === "string" && doc.aadhar_image.startsWith("http")) {
            documents.push({ name: "Aadhar Card", uploaded: true, url: doc.aadhar_image });
        }

        if (Array.isArray(doc.components)) {
            doc.components.forEach((componentEntry: any) => {
                if (componentEntry.response && typeof componentEntry.response === "string") {
                    try {
                        const responseData = JSON.parse(componentEntry.response);
                        if (typeof responseData === "object" && responseData !== null && responseData.aadhar_image && typeof responseData.aadhar_image === "string") {
                            documents.push({
                                name: `${componentEntry.component} - Aadhaar Card`,
                                uploaded: true,
                                url: responseData.aadhar_image,
                            });
                        }
                    } catch {
                        // Ignore invalid JSON in component response payloads.
                    }
                }
            });
        }

        const familyAadharNumbers: string[] = [];
        const possibleFields = [
            doc.family_member_aadhar_number,
            doc.family_aadhar_numbers,
            doc.family_members,
            doc.family_aadhar,
            doc.aadhar_numbers,
            doc.members_aadhar,
        ];

        for (const field of possibleFields) {
            if (!field) {
                continue;
            }

            if (Array.isArray(field)) {
                familyAadharNumbers.push(...field.filter(Boolean).map(String));
                break;
            }

            if (typeof field === "string") {
                familyAadharNumbers.push(...field.split(",").map((value: string) => value.trim()).filter(Boolean));
                break;
            }
        }

        const rationCardMembers = parseInt(doc.number_of_members_in_ration_card) || 0;
        if (rationCardMembers > 1) {
            for (let index = 1; index < rationCardMembers; index += 1) {
                const fieldNames = [
                    `familyAadhaar${index}`,
                    `family_aadhaar_${index}`,
                    `family_aadhar_${index}`,
                    `familyAadhar${index}`,
                ];

                for (const fieldName of fieldNames) {
                    if (doc[fieldName]) {
                        familyAadharNumbers.push(String(doc[fieldName]));
                        break;
                    }
                }
            }
        }

        const criteria: { label: string; value: string | number | null; response?: any }[] = [];
        if (Array.isArray(doc.criteria)) {
            doc.criteria.forEach((criterion: any) => {
                criteria.push({
                    label: criterion.criteria || "",
                    value: criterion.value,
                    response: criterion.response,
                });
            });
        }

        const applicantName = (() => {
            if (doc.fullname) return doc.fullname;
            if (doc.applicant_name) return doc.applicant_name;

            const firstName = doc.first_name || "";
            const middleName = doc.mid_name || "";
            const lastName = doc.last_name || "";
            const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
            return fullName || "N/A";
        })();

        setSelectedApp({
            id: doc.name,
            applicantName,
            fatherName: doc.father_name || doc.father || "N/A",
            mobile_no: doc.mobile_no || "",
            district: doc.district || "N/A",
            taluka: doc.taluka || "N/A",
            village: doc.village || "N/A",
            component: componentList,
            status: doc.status,
            submittedDate,
            animalCount: doc.number_of_animals ? parseInt(doc.number_of_animals) : undefined,
            approver: doc.approver || undefined,
            gender: doc.gender || "N/A",
            caste: doc.category || "N/A",
            aadharNumber: (doc.aadhar_number && typeof doc.aadhar_number === "string" && doc.aadhar_number.startsWith("http"))
                ? doc.aadhar_number
                : (doc.aadhar_number || ""),
            rationCardMembers,
            familyAadharNumbers,
            animalTagNumber: undefined,
            landHolding: parseFloat(doc.land_holding) || 0,
            khasraNumber: doc.khasra_number || "N/A",
            milkPouringPoint: doc.milk_pouring_point || "N/A",
            farmerPourerCode: doc.farmer_pourer_code || "N/A",
            components: Array.isArray(doc.components)
                ? doc.components.map((componentEntry: any) => {
                    let parsedResponse: any = componentEntry.response;

                    if (typeof componentEntry.response === "string") {
                        try {
                            parsedResponse = JSON.parse(componentEntry.response);
                        } catch {
                            parsedResponse = componentEntry.response;
                        }
                    }

                    return {
                        name: componentEntry.name,
                        component: componentEntry.component,
                        response: componentEntry.response,
                        benefits: Array.isArray(parsedResponse?.benefits) ? parsedResponse.benefits : [],
                        customQuestions: Array.isArray(parsedResponse?.customQuestions) ? parsedResponse.customQuestions : [],
                    };
                })
                : [],
            documents,
            criteria,
        });
    }, [doc, selectedAppId]);

    useEffect(() => {
        if (!docError) {
            return;
        }

        toast({
            title: "Error",
            description: "Failed to load application details. Please try again.",
            variant: "destructive",
        });
        setSelectedAppId(null);
    }, [docError, toast]);

    const handleViewDetails = (application: ApplicationListItem) => {
        setSelectedAppId(application.id);
    };

    const handleJumpToPage = () => {
        const pageNumber = parseInt(jumpToPage);
        const totalPages = pagination?.total_pages ?? (applications.length === pageSize ? currentPage + 1 : currentPage);

        if (Number.isNaN(pageNumber) || pageNumber < 1) {
            toast({
                title: "Invalid page number",
                description: "Please enter a valid page number.",
                variant: "destructive",
            });
            return;
        }

        if (pageNumber > totalPages) {
            toast({
                title: "Page out of range",
                description: `Please enter a page number between 1 and ${totalPages}.`,
                variant: "destructive",
            });
            return;
        }

        setCurrentPage(pageNumber);
        setJumpToPage("");
    };

    const handleSubmitReview = async (action: "approve" | "reject", reviewRemarks: string, selectedComponents: Array<string>) => {
        if (!selectedApp) {
            return;
        }

        const nextStatus = action === "approve" ? "Approved" : "Rejected";

        try {
            const response = await approveApplication({
                application_id: selectedApp.id,
                status: nextStatus,
                components: selectedComponents,
                remarks: reviewRemarks,
            });
            console.log("Approve/Reject response:", response);

            setSelectedApp({
                ...selectedApp,
                status: nextStatus,
                approver: currentUser || `DPO ${assignedZone.taluka}`,
            });
            setApplications((currentApplications) => currentApplications.map((application) => (
                application.id === selectedApp.id
                    ? { ...application, status: nextStatus }
                    : application
            )));

            toast({
                title: nextStatus === "Approved" ? "Application Approved" : "Application Rejected",
                description: `Application ${selectedApp.id} has been ${nextStatus === "Approved" ? "approved" : "rejected"} successfully.`,
            });

            setSelectedApp(null);
            setSelectedAppId(null);
        } catch {
            toast({
                title: "Error",
                description: `Failed to ${nextStatus === "Approved" ? "approve" : "reject"} the application. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const transformApplicationData = useCallback((application: Application | null) => {
        if (!application) {
            return null;
        }

        return {
            id: application.id,
            submittedDate: application.submittedDate || "N/A",
            status: application.status,
            applicantName: application.applicantName,
            fatherName: application.fatherName || "N/A",
            gender: application.gender,
            caste: application.caste,
            mobile: application.mobile_no,
            aadharNumber: application.aadharNumber,
            rationCardMembers: application.rationCardMembers,
            familyAadharNumbers: application.familyAadharNumbers || [],
            district: application.district,
            taluka: application.taluka,
            village: application.village,
            animalCount: application.animalCount,
            animalTagNumber: application.animalTagNumber,
            landHolding: application.landHolding,
            khasraNumber: application.khasraNumber,
            milkPouringPoint: application.milkPouringPoint,
            farmerPourerCode: application.farmerPourerCode,
            component: application.components?.[0]?.component || "N/A",
            componentDetails: {
                benefits: application.components?.[0]?.benefits || [],
                customQuestions: application.components?.[0]?.customQuestions || [],
            },
            documents: application.documents || [],
        };
    }, []);

    const handleExport = useCallback(() => {
        if (!applications.length) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ["Application ID", "Applicant", "Aadhar Number", "Mobile", "Taluka", "Village", "Milk Pouring Point", "Component", "Tag Numbers", "Status", "Submitted Date"];
        const rows = applications.map((application) => {
            let tagNumbers = "N/A";
            if (application.dairyAnimalData) {
                const tagNumberArray = application.dairyAnimalData["Registered Dairy Animal Tag Number"] || application.dairyAnimalData["Tag Number"];
                if (Array.isArray(tagNumberArray)) {
                    const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== "");
                    tagNumbers = validTags.length > 0 ? validTags.join(", ") : "N/A";
                }
            }

            return {
                "Application ID": application.id,
                Applicant: application.applicantName,
                "Aadhar Number": application.aadharNumber || "",
                Mobile: application.mobile || "",
                Taluka: application.taluka || "",
                Village: application.village,
                "Milk Pouring Point": application.milkPouringPoint || "",
                Component: application.component,
                "Tag Numbers": tagNumbers,
                Status: application.status,
                "Submitted Date": application.submittedDate,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

        worksheet["!cols"] = headers.map((header) => {
            const maxDataLength = rows.reduce((max: number, row: any) => {
                const value = String(row[header as keyof typeof row] || "");
                return Math.max(max, value.length);
            }, 0);
            return { wch: Math.max(header.length, maxDataLength, 15) + 2 };
        });

        const date = new Date().toISOString().split("T")[0];
        const parts: string[] = [];
        if (statusFilter !== "all") parts.push(statusFilter);
        if (componentFilter !== "all") parts.push(componentFilter.replace(/\s+/g, "_"));
        if (debouncedSearchQuery) parts.push(`q-${debouncedSearchQuery.replace(/\s+/g, "_")}`);
        const suffix = parts.length ? `-${parts.join("-")}` : "";

        XLSX.writeFile(workbook, `applications${suffix}-${date}.xlsx`);

        toast({
            title: "Export started",
            description: `Exported ${applications.length} applications from current page.`,
        });
    }, [applications, componentFilter, debouncedSearchQuery, statusFilter, toast]);

    const handleExportAll = useCallback(async () => {
        toast({
            title: "Export started",
            description: "Fetching all applications with current filters...",
        });

        try {
            const apiParams: any = {
                export: true,
            };

            if (statusFilter !== "all") {
                apiParams.status = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
            }

            if (debouncedSearchQuery.trim()) {
                apiParams.search = debouncedSearchQuery.trim();
            }

            if (componentFilter !== "all") {
                apiParams.component = componentFilter;
            }

            if (dateFrom) {
                apiParams.start_date = dateFrom;
            }

            if (dateTo) {
                apiParams.end_date = dateTo;
            }

            const response = await frappeBrowser.call().get("vmddp_app.api.api.get_applications_summary", apiParams);
            const allApplications = (response.message?.applications || []).map((application: any) => {
                let applicationComponent = "N/A";
                if (Array.isArray(application.component_list)) {
                    applicationComponent = application.component_list.join(", ");
                } else if (typeof application.component_list === "string") {
                    applicationComponent = application.component_list;
                }

                return {
                    id: application.name,
                    applicantName: application.fullname ?? "Unknown",
                    aadharNumber: application.aadhar_number ?? "",
                    mobile: application.mobile_number ?? application.mobile_no ?? "",
                    taluka: application.taluka ?? "",
                    village: application.village ?? "N/A",
                    milkPouringPoint: application.milk_pouring_point ?? "",
                    component: applicationComponent,
                    status: application.status ?? "",
                    submittedDate: application.created_at ?? application.date ?? "",
                    dairyAnimalData: application.dairy_animal_data,
                };
            });

            if (!allApplications.length) {
                toast({
                    title: "No data",
                    description: "There are no applications to export.",
                    variant: "destructive",
                });
                return;
            }

            const headers = ["Application ID", "Applicant", "Aadhar Number", "Mobile", "Taluka", "Village", "Milk Pouring Point", "Component", "Tag Numbers", "Status", "Submitted Date"];
            const rows = allApplications.map((application: any) => {
                let tagNumbers = "N/A";
                if (application.dairyAnimalData) {
                    const tagNumberArray = application.dairyAnimalData["Registered Dairy Animal Tag Number"] || application.dairyAnimalData["Tag Number"];
                    if (Array.isArray(tagNumberArray)) {
                        const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== "");
                        tagNumbers = validTags.length > 0 ? validTags.join(", ") : "N/A";
                    }
                }

                return {
                    "Application ID": application.id,
                    Applicant: application.applicantName,
                    "Aadhar Number": application.aadharNumber || "",
                    Mobile: application.mobile || "",
                    Taluka: application.taluka || "",
                    Village: application.village || "",
                    "Milk Pouring Point": application.milkPouringPoint || "",
                    Component: application.component || "",
                    "Tag Numbers": tagNumbers,
                    Status: application.status || "",
                    "Submitted Date": application.submittedDate || "",
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

            worksheet["!cols"] = headers.map((header) => {
                const maxDataLength = rows.reduce((max: number, row: any) => {
                    const value = String(row[header as keyof typeof row] || "");
                    return Math.max(max, value.length);
                }, 0);
                return { wch: Math.max(header.length, maxDataLength, 15) + 2 };
            });

            const date = new Date().toISOString().split("T")[0];
            XLSX.writeFile(workbook, `all-applications-${date}.xlsx`);

            toast({
                title: "Export completed",
                description: `Successfully exported ${allApplications.length} applications.`,
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export failed",
                description: "Failed to export applications. Please try again.",
                variant: "destructive",
            });
        }
    }, [componentFilter, dateFrom, dateTo, debouncedSearchQuery, statusFilter, toast]);

    const renderLoadingRows = () => (
        <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
                <tr key={index} className="border-b">
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-2 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-2 sm:p-4 hidden lg:table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-2 sm:p-4 hidden xl:table-cell"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-2 sm:p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
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
                                        {pagination?.total_applications} applications found in your zone
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
                                        onChange={(event) => setSearchQuery(event.target.value)}
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
                                        {components?.map((componentOption) => (
                                            <SelectItem key={componentOption.name} value={componentOption.component_name}>
                                                {componentOption.component_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-1 sm:gap-2 min-w-0 sm:col-span-2 lg:col-span-1">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(event) => setDateFrom(event.target.value)}
                                        className="flex-1 min-w-0 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="From date"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(event) => setDateTo(event.target.value)}
                                        className="flex-1 min-w-0 text-xs sm:text-sm h-8 sm:h-10"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                    <table className="w-full min-w-[640px]">
                                        <thead className="bg-muted sticky top-0 z-30 border-b">
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
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.applicantName}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.aadharNumber || "-"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.mobile || "-"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.taluka || "-"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4">
                                                            <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{application.village}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                            <p className="text-xs sm:text-sm truncate max-w-[150px]">{application.milkPouringPoint || "-"}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden lg:table-cell">
                                                            <p className="text-xs sm:text-sm truncate max-w-[150px]">{application.component}</p>
                                                        </td>
                                                        <td className="p-2 sm:p-4 hidden xl:table-cell">
                                                            {(() => {
                                                                if (!application.dairyAnimalData) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

                                                                const tagNumberArray = application.dairyAnimalData["Registered Dairy Animal Tag Number"] || application.dairyAnimalData["Tag Number"];
                                                                if (!Array.isArray(tagNumberArray)) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

                                                                const validTags = tagNumberArray.filter((tag: any) => tag !== null && tag !== undefined && tag !== "");
                                                                if (validTags.length === 0) return <p className="text-xs sm:text-sm text-muted-foreground">N/A</p>;

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

                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4 pt-3 sm:pt-4">
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

                                <div className="flex items-center gap-3">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        if (!(pagination?.has_previous_page ?? currentPage > 1)) {
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
                                                            return;
                                                        }
                                                        setCurrentPage((previousPage) => previousPage + 1);
                                                    }}
                                                    className={!(pagination?.has_next_page ?? applications.length === pageSize) ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>

                                    <div className="flex items-center gap-1 sm:gap-2 border-l pl-3">
                                        <label htmlFor="jumpToPage" className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            Go to:
                                        </label>
                                        <Input
                                            id="jumpToPage"
                                            type="number"
                                            min="1"
                                            max={pagination?.total_pages ?? (applications.length === pageSize ? currentPage + 1 : currentPage)}
                                            value={jumpToPage}
                                            onChange={(event) => setJumpToPage(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
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
                onReview={(action, remarks, selectedComponents) => {
                    handleSubmitReview(action, remarks, selectedComponents);
                }}
                showReviewActions={true}
            />
        </div>
    );
}