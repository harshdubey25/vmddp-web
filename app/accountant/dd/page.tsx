"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CreditCard,
    Check,
    AlertCircle,
    IndianRupee,
    ClipboardList,
    FileText,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { frappeBrowser } from "@/lib/frappe";
import { useFrappeGetCall } from "frappe-react-sdk";
import DDFilters from "@/components/DDFilters";
import { useDebounce } from "@/hooks/use-debounce";
import DDDetailsModal from "@/components/DDDetailsModal";

interface DDApplication {
    name: string;
    first_name: string;
    last_name: string;
    mid_name: string;
    component_status: string;
    aadhar_number: string;
    component_name: string;
    amount: number;
    village: string;
    district: string;
    taluka: string;
}

export default function DDCollection() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedApplications, setselectedApplications] = useState<
        DDApplication[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(
        searchParams.get("tab") || "approved",
    );

    // Filter states for Selected Applications tab
    const [approvedFilters, setApprovedFilters] = useState({
        aadhaar: "",
        district: "",
        taluka: "",
        village: "",
        application_id: "",
        search: "",
    });

    // Filter states for Collected DDs tab
    const [collectedFilters, setCollectedFilters] = useState({
        aadhaar: "",
        district: "",
        taluka: "",
        village: "",
    });

    const [cancelledFilters, setCancelledFilters] = useState({
        aadhaar: "",
        district: "",
        taluka: "",
        village: "",
    });

    // Pagination states
    const initialApprovedPage = Number(
        searchParams.get("approvedPage") || searchParams.get("page") || 1,
    );
    const initialSelectedPage = Number(
        searchParams.get("collectedPage") || searchParams.get("page") || 1,
    );
    const initialCancelledPage = Number(
        searchParams.get("cancelledPage") || searchParams.get("page") || 1,
    );
    const [approvedPage, setApprovedPage] = useState(initialApprovedPage);
    const [selectedPage, setSelectedPage] = useState(initialSelectedPage);
    const [cancelledPage, setCancelledPage] = useState(initialCancelledPage);
    const [approvedTotal, setApprovedTotal] = useState(0);
    const pageSize = 20;

    // DD Details Modal state
    const [modalAppName, setModalAppName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openDDModal = (appName: string) => {
        setModalAppName(appName);
        setIsModalOpen(true);
    };

    // Debounce collected filters for the hook
    const debouncedCollectedAadhaar = useDebounce(collectedFilters.aadhaar, 500);
    const debouncedCollectedDistrict = useDebounce(collectedFilters.district, 500);
    const debouncedCollectedTaluka = useDebounce(collectedFilters.taluka, 500);
    const debouncedCollectedVillage = useDebounce(collectedFilters.village, 500);
    const debouncedCancelledAadhaar = useDebounce(cancelledFilters.aadhaar, 500);
    const debouncedCancelledDistrict = useDebounce(cancelledFilters.district, 500);
    const debouncedCancelledTaluka = useDebounce(cancelledFilters.taluka, 500);
    const debouncedCancelledVillage = useDebounce(cancelledFilters.village, 500);

    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
    } = useFrappeGetCall("vmddp_app.api.v1.accountant.get_dd_stats");

    // Fetch completed DD applications using the same hook pattern as dd-report
    const { data: completedDDResponse, isLoading: completedDDLoading } = useFrappeGetCall(
        "vmddp_app.api.v1.accountant.get_completed_dd_list",
        {
            limit_start: (selectedPage - 1) * pageSize,
            limit_page_length: pageSize,
            search_text: debouncedCollectedAadhaar || undefined,
            district: debouncedCollectedDistrict || undefined,
            taluka: debouncedCollectedTaluka || undefined,
            village: debouncedCollectedVillage || undefined,
            docstatus: 1
        },
    );

    const ddCompletedApplications = completedDDResponse?.message?.data || [];
    const selectedPagination = completedDDResponse?.message?.pagination || null;

    const { data: cancelledDDResponse, isLoading: cancelledDDLoading } = useFrappeGetCall(
        "vmddp_app.api.v1.accountant.get_completed_dd_list",
        {
            limit_start: (cancelledPage - 1) * pageSize,
            limit_page_length: pageSize,
            search_text: debouncedCancelledAadhaar || undefined,
            district: debouncedCancelledDistrict || undefined,
            taluka: debouncedCancelledTaluka || undefined,
            village: debouncedCancelledVillage || undefined,
            docstatus: 2
        },
    );

    const cancelledDDApplications = cancelledDDResponse?.message?.data || [];
    const cancelledPagination = cancelledDDResponse?.message?.pagination || null;
    // Fetch approved applications
    const fetchselectedApplications = async () => {
        setLoading(true);
        try {
            const params: any = {
                component_status: "Selected",
                limit_start: (approvedPage - 1) * pageSize,
                limit_page_length: pageSize,
            };

            // Add all filter parameters
            if (approvedFilters.aadhaar && approvedFilters.aadhaar.trim()) {
                params.aadhar_number = approvedFilters.aadhaar.trim();
            }
            if (approvedFilters.district && approvedFilters.district.trim()) {
                params.district = approvedFilters.district.trim();
            }
            if (approvedFilters.taluka && approvedFilters.taluka.trim()) {
                params.Taluka = approvedFilters.taluka.trim();
            }
            if (approvedFilters.village && approvedFilters.village.trim()) {
                params.Village = approvedFilters.village.trim();
            }
            if (approvedFilters.application_id && approvedFilters.application_id.trim()) {
                params.application_id = approvedFilters.application_id.trim();
            }
            if (approvedFilters.search && approvedFilters.search.trim()) {
                params.search_text = approvedFilters.search.trim();
            }

            const response = await frappeBrowser
                .call()
                .get("vmddp_app.api.v1.accountant.dd_applications", params);
            const data = response?.message || [];
            setselectedApplications(data);
            setApprovedTotal(data.length);
        } catch (error) {
            console.error("Error fetching approved applications:", error);
            setselectedApplications([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when tab, pagination, or filters change (only for approved tab)
    useEffect(() => {
        if (activeTab === "approved") {
            fetchselectedApplications();
        }
    }, [
        activeTab,
        approvedPage,
        approvedFilters,
    ]);

    // Keep page numbers in the URL so refresh preserves the current page
    useEffect(() => {
        try {
            const params = new URLSearchParams(searchParams.toString());
            // ensure tab is preserved
            params.set("tab", activeTab);

            if (approvedPage && approvedPage > 1) {
                params.set("approvedPage", String(approvedPage));
            } else {
                params.delete("approvedPage");
            }

            if (selectedPage && selectedPage > 1) {
                params.set("collectedPage", String(selectedPage));
            } else {
                params.delete("collectedPage");
            }

            if (cancelledPage && cancelledPage > 1) {
                params.set("cancelledPage", String(cancelledPage));
            } else {
                params.delete("cancelledPage");
            }

            const query = params.toString();
            // Use replace to avoid adding history entries on every change
            router.replace(query ? `?${query}` : `/accountant/dd`);
        } catch (err) {
            console.error("Error syncing page params to URL", err);
        }
    }, [approvedPage, selectedPage, cancelledPage, activeTab]);

    const handleSelectApplication = (app: DDApplication) => {
        router.push(
            `/accountant/dd/dd-collection/${encodeURIComponent(app.name)}`,
        );
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`?${params.toString()}`);
    };

    const handleApprovedFilterChange = (filters: {
        aadhaar: string;
        district: string;
        taluka: string;
        village: string;
        application_id?: string;
        search?: string;
    }) => {
        setApprovedPage(1); // Reset to first page on filter change
        setApprovedFilters({
            ...approvedFilters,
            ...filters,
            application_id: filters.application_id ?? approvedFilters.application_id,
            search: filters.search ?? approvedFilters.search,
        });
    };

    const handleCollectedFilterChange = (filters: {
        aadhaar: string;
        district: string;
        taluka: string;
        village: string;
    }) => {
        setSelectedPage(1); // Reset to first page on filter change
        setCollectedFilters(filters);
    };

    const handleCancelledFilterChange = (filters: {
        aadhaar: string;
        district: string;
        taluka: string;
        village: string;
    }) => {
        setCancelledPage(1);
        setCancelledFilters(filters);
    };

    const getFullName = (app: DDApplication) => {
        return (
            [app.first_name, app.mid_name, app.last_name]
                .filter(Boolean)
                .join(" ") || "N/A"
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
                return (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Approved
                    </Badge>
                );
            case "selected":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Selected
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };
    // Calculate summary stats
    const totalCollected = statsData?.message.total_dd_amount || 0;
    const pendingCount = statsData?.message.pending_dd || 0;

    const totalDDs = statsData?.message.total_applications || 0;
    const collectedDDs = statsData?.message.total_dd_completed || 0;
    const cancelledDDs = statsData?.message.cancelled_dd || 0;
    return (
        <>
            <div className=" bg-background w-full overflow-y-scroll">
                <div className="p-6 space-y-6 ">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                            <Button variant="ghost" size="icon" data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link> */}
                            <div>
                                <h1
                                    className="text-2xl font-display font-bold"
                                    data-testid="text-page-title"
                                >
                                    DD Collection
                                </h1>
                                <p className="text-muted-foreground">
                                    Collect Demand Drafts from approved
                                    beneficiaries
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 xl:gap-4">
                        <Card data-testid="card-total-collected" className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardContent className="pt-4 pb-4 px-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <IndianRupee className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-300 truncate">
                                            Total Collected
                                        </p>
                                        <p
                                            className="text-base sm:text-lg xl:text-xl font-bold text-indigo-900 dark:text-indigo-100 drop-shadow-sm truncate"
                                            data-testid="text-total-amount"
                                        >
                                            ₹{totalCollected.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-total-dds" className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardContent className="pt-4 pb-4 px-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300 truncate">
                                            Total DDs
                                        </p>
                                        <p
                                            className="text-base sm:text-lg xl:text-xl font-bold text-blue-900 dark:text-blue-100 drop-shadow-sm truncate"
                                            data-testid="text-total-count"
                                        >
                                            {totalDDs}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-pending" className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardContent className="pt-4 pb-4 px-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <AlertCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300 truncate">
                                            Pending Collection
                                        </p>
                                        <p
                                            className="text-base sm:text-lg xl:text-xl font-bold text-amber-900 dark:text-amber-100 drop-shadow-sm truncate"
                                            data-testid="text-pending-count"
                                        >
                                            {pendingCount}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-verified" className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardContent className="pt-4 pb-4 px-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 shrink-0 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-green-700/80 dark:text-green-300 truncate">
                                            Collected
                                        </p>
                                        <p
                                            className="text-base sm:text-lg xl:text-xl font-bold text-green-900 dark:text-green-100 drop-shadow-sm truncate"
                                            data-testid="text-verified-count"
                                        >
                                            {collectedDDs}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-cancelled-dds" className="relative overflow-hidden border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110" />
                            <CardContent className="pt-4 pb-4 px-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 shrink-0 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                        <X className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-red-700/80 dark:text-red-300 truncate">
                                            Returned DDs
                                        </p>
                                        <p
                                            className="text-base sm:text-lg xl:text-xl font-bold text-red-900 dark:text-red-100 drop-shadow-sm truncate"
                                            data-testid="text-returned-count"
                                        >
                                            {cancelledDDs}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs Section */}
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                            <TabsTrigger
                                value="approved"
                                className="flex items-center gap-2"
                                data-testid="tab-approved"
                            >
                                <ClipboardList className="h-4 w-4" />
                                Selected Applications
                            </TabsTrigger>
                            <TabsTrigger
                                value="collected"
                                className="flex items-center gap-2"
                                data-testid="tab-collected"
                            >
                                <FileText className="h-4 w-4" />
                                Collected DDs
                            </TabsTrigger>
                            <TabsTrigger
                                value="cancelled"
                                className="flex items-center gap-2"
                                data-testid="tab-cancelled"
                            >
                                <X className="h-4 w-4" />
                                Returned DDs
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1:  Applications */}
                        <TabsContent value="approved" className="space-y-4">
                            {/* Filters Section */}
                            <DDFilters
                                onFilterChange={handleApprovedFilterChange}
                                initialFilters={approvedFilters}
                                showApplicationIdFilter
                                showSearchFilter
                            />

                            <Card data-testid="card-approved-search">
                                <CardHeader className="pb-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5" />
                                            Selected Applications Awaiting DD
                                            Collection
                                        </CardTitle>
                                        <CardDescription>
                                            {selectedApplications.length} selected
                                            applications pending DD collection
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Loading...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full min-w-[900px]">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Application ID
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Beneficiary
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Location
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Component
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Status
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    DD Amount
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Action
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedApplications.map(
                                                                (app) => (
                                                                    <tr
                                                                        key={app.name}
                                                                        data-testid={`row-approved-${app.name}`}
                                                                        className="border-b hover:bg-muted/30"
                                                                    >
                                                                        <td className="p-3 text-xs sm:text-sm font-medium">
                                                                            {app.name}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div>
                                                                                <p className="font-medium">
                                                                                    {getFullName(
                                                                                        app,
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        app.aadhar_number
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {app.district && (<Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        app.district
                                                                                    }
                                                                                </Badge>)}

                                                                                {app.taluka && (<Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        app.taluka
                                                                                    }
                                                                                </Badge>)}
                                                                                {app.village &&
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {
                                                                                            app.village
                                                                                        }
                                                                                    </Badge>
                                                                                }

                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Badge variant="outline">
                                                                                {
                                                                                    app.component_name
                                                                                }
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            {getStatusBadge(
                                                                                app.component_status,
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm font-semibold text-primary">
                                                                            ₹
                                                                            {(
                                                                                app.amount ||
                                                                                0
                                                                            ).toLocaleString(
                                                                                "en-IN",
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    handleSelectApplication(
                                                                                        app,
                                                                                    )
                                                                                }
                                                                                data-testid={`button-collect-${app.name}`}
                                                                            >
                                                                                <CreditCard className="h-4 w-4 mr-1" />
                                                                                Collect
                                                                                DD
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                            {selectedApplications.length ===
                                                                0 && (
                                                                    <tr>
                                                                        <td
                                                                            colSpan={7}
                                                                            className="text-center py-8 text-xs sm:text-sm text-muted-foreground"
                                                                        >
                                                                            {approvedFilters.aadhaar ||
                                                                                approvedFilters.district ||
                                                                                approvedFilters.taluka ||
                                                                                approvedFilters.village
                                                                                ? "No applications found matching the selected filters"
                                                                                : "No approved applications pending DD collection"}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Pagination for Approved */}
                                            {selectedApplications.length > 0 && (
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm text-muted-foreground">
                                                        Page {approvedPage} •{" "}
                                                        {
                                                            selectedApplications.length
                                                        }{" "}
                                                        items
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setApprovedPage(
                                                                    (p) =>
                                                                        Math.max(
                                                                            1,
                                                                            p - 1,
                                                                        ),
                                                                )
                                                            }
                                                            disabled={
                                                                approvedPage === 1
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setApprovedPage(
                                                                    (p) => p + 1,
                                                                )
                                                            }
                                                            disabled={
                                                                selectedApplications.length <
                                                                pageSize
                                                            }
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab 2: Collected DDs */}
                        <TabsContent value="collected" className="space-y-4">
                            {/* Filters Section */}
                            <DDFilters
                                onFilterChange={handleCollectedFilterChange}
                                initialFilters={collectedFilters}
                            />

                            <Card data-testid="card-dd-list">
                                <CardHeader className="pb-4">
                                    <div>
                                        <CardTitle>Collected DDs</CardTitle>
                                        <CardDescription>
                                            {ddCompletedApplications.length}{" "}
                                            collected demand drafts (Selected
                                            applications)
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {completedDDLoading ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Loading...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full min-w-[900px]">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Application ID
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Beneficiary
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Location
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Component
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Amount
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Status
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Action
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {ddCompletedApplications.map(
                                                                (app: DDApplication) => (
                                                                    <tr
                                                                        key={app.name}
                                                                        data-testid={`row-dd-${app.name}`}
                                                                        className="border-b hover:bg-muted/30"
                                                                    >
                                                                        <td className="p-3 text-xs sm:text-sm font-medium">
                                                                            {app.name}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div>
                                                                                <p className="font-medium">
                                                                                    {getFullName(
                                                                                        app,
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        app.aadhar_number
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div className="flex flex-wrap gap-1">

                                                                                {app.district && (<Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        app.district
                                                                                    }
                                                                                </Badge>)}

                                                                                {app.taluka && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {
                                                                                            app.taluka
                                                                                        }
                                                                                    </Badge>)}

                                                                                {app.village && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {
                                                                                            app.village
                                                                                        }
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Badge variant="outline">
                                                                                {
                                                                                    app.component_name
                                                                                }
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm font-medium">
                                                                            ₹
                                                                            {(
                                                                                app.amount ||
                                                                                0
                                                                            ).toLocaleString(
                                                                                "en-IN",
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            {getStatusBadge(
                                                                                app.component_status,
                                                                            )}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => openDDModal(app.name)}
                                                                                data-testid={`button-view-dd-${app.name}`}
                                                                            >
                                                                                <FileText className="h-3 w-3 mr-1" />
                                                                                View
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                            {ddCompletedApplications.length ===
                                                                0 && (
                                                                    <tr>
                                                                        <td
                                                                            colSpan={7}
                                                                            className="text-center py-8 text-xs sm:text-sm text-muted-foreground"
                                                                        >
                                                                            {collectedFilters.aadhaar ||
                                                                                collectedFilters.district ||
                                                                                collectedFilters.taluka ||
                                                                                collectedFilters.village
                                                                                ? "No collected DDs found matching the selected filters"
                                                                                : "No collected DD entries found"}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Pagination for Selected */}
                                            {ddCompletedApplications.length > 0 && (
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm text-muted-foreground">
                                                        Page {selectedPagination?.current_page ?? selectedPage} of {selectedPagination?.total_pages ?? 1} •{" "}
                                                        {selectedPagination?.total_items ?? ddCompletedApplications.length}{" "}
                                                        total items
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedPage(
                                                                    (p) =>
                                                                        Math.max(
                                                                            1,
                                                                            p - 1,
                                                                        ),
                                                                )
                                                            }
                                                            disabled={
                                                                !selectedPagination?.has_previous_page
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSelectedPage(
                                                                    (p) => p + 1,
                                                                )
                                                            }
                                                            disabled={
                                                                !selectedPagination?.has_next_page
                                                            }
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="cancelled" className="space-y-4">
                            <DDFilters
                                onFilterChange={handleCancelledFilterChange}
                                initialFilters={cancelledFilters}
                            />

                            <Card data-testid="card-cancelled-dd-list">
                                <CardHeader className="pb-4">
                                    <div>
                                        <CardTitle>Returned DDs</CardTitle>
                                        <CardDescription>
                                            {cancelledDDApplications.length} returned demand drafts
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cancelledDDLoading ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Loading...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden flex flex-col">
                                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                                    <table className="w-full min-w-[900px]">
                                                        <thead className="bg-muted sticky top-0 z-30 border-b">
                                                            <tr>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Application ID
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Beneficiary
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Location
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Component
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Amount
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Status
                                                                </th>
                                                                <th className="text-left p-3 text-xs sm:text-sm font-medium">
                                                                    Action
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {cancelledDDApplications.map(
                                                                (app: DDApplication) => (
                                                                    <tr
                                                                        key={app.name}
                                                                        data-testid={`row-cancelled-dd-${app.name}`}
                                                                        className="border-b hover:bg-muted/30"
                                                                    >
                                                                        <td className="p-3 text-xs sm:text-sm font-medium">
                                                                            {app.name}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div>
                                                                                <p className="font-medium">
                                                                                    {getFullName(app)}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {app.aadhar_number}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {app.district && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {app.district}
                                                                                    </Badge>
                                                                                )}
                                                                                {app.taluka && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {app.taluka}
                                                                                    </Badge>
                                                                                )}
                                                                                {app.village && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {app.village}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Badge variant="outline">
                                                                                {app.component_name}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm font-medium">
                                                                            ₹{(app.amount || 0).toLocaleString("en-IN")}
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                                                                {app.component_status == "DD Rejected" ? "DD Returned" : app.component_status}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-3 text-xs sm:text-sm">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => openDDModal(app.name)}
                                                                                data-testid={`button-view-cancelled-dd-${app.name}`}
                                                                            >
                                                                                <FileText className="h-3 w-3 mr-1" />
                                                                                View
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                            {cancelledDDApplications.length === 0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={7}
                                                                        className="text-center py-8 text-xs sm:text-sm text-muted-foreground"
                                                                    >
                                                                        {cancelledFilters.aadhaar ||
                                                                            cancelledFilters.district ||
                                                                            cancelledFilters.taluka ||
                                                                            cancelledFilters.village
                                                                            ? "No Returned DDs found matching the selected filters"
                                                                            : "No Returned DD entries found"}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {cancelledDDApplications.length > 0 && (
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm text-muted-foreground">
                                                        Page {cancelledPagination?.current_page ?? cancelledPage} of {cancelledPagination?.total_pages ?? 1} • {cancelledPagination?.total_items ?? cancelledDDApplications.length} total items
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCancelledPage((p) => Math.max(1, p - 1))}
                                                            disabled={!cancelledPagination?.has_previous_page}
                                                        >
                                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCancelledPage((p) => p + 1)}
                                                            disabled={!cancelledPagination?.has_next_page}
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* DD Details Modal */}
            <DDDetailsModal
                appName={modalAppName}
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setModalAppName(null);
                }}
            />
        </>
    );

}
