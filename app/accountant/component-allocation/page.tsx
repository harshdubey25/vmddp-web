"use client"
import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFrappeGetDocList, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useAuth } from "@/context/AuthContext";
import {
    Package,
    ChevronRight,
    ChevronLeft,
    Tag,
    Leaf,
    Scissors,
    Search,
    ArrowRight,
    Download,
    FileText,
    RefreshCw,
    FileCheck,
    Clock,
    CheckCircle,
    Eye,
    Ban,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/use-export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { UserRole } from "@/enums/roles";
import CancelDDDialog, { DDDocDetails, PendingApplicationForDDCancel } from "@/app/accountant/component-allocation/CancelDDDialog";

const getComponentIcon = (component: string) => {
    if (component === "Animal Induction") return <Tag className="h-5 w-5" />;
    if (component === "HGM") return <Package className="h-5 w-5" />;
    if (component.includes("Feed") || component.includes("Silage")) return <Leaf className="h-5 w-5" />;
    if (component.includes("Chaff")) return <Scissors className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
};
interface PaginationInfo {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

interface DDCompletedApplication {
    message: {
        data: Array<ComponentAllocationItem>;
        pagination: PaginationInfo;
    }
}

const PAGE_SIZE = 20;

export default function ComponentAllocation() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "completed" ? "completed" : "pending");
    const [districtFilter, setDistrictFilter] = useState(searchParams.get("district") || "all")
    const [aadharFilter, setAadharFilter] = useState(searchParams.get("aadhaar") || "")
    const [applicationIdFilter, setApplicationIdFilter] = useState(searchParams.get("application_id") || "")
    const [componentFilter, setComponentFilter] = useState(searchParams.get("component") || "all")
    const [appliedAadharFilter, setAppliedAadharFilter] = useState(searchParams.get("aadhaar") || "")
    const [appliedApplicationIdFilter, setAppliedApplicationIdFilter] = useState(searchParams.get("application_id") || "")
    const [pendingPage, setPendingPage] = useState(1)
    const [completedPage, setCompletedPage] = useState(1)
    const [showCancelDDDialog, setShowCancelDDDialog] = useState(false)
    const [selectedPendingApplication, setSelectedPendingApplication] = useState<PendingApplicationForDDCancel | null>(null)

    const { toast } = useToast();

    const { isExporting, handleExport: exportData } = useExport({
        method: "vmddp_app.api.v1.component_allocation.export_completed_component_allocation_list",
        filename: "component-allocation-report",
    });

    const { data: districts } = useFrappeGetDocList('District Master')
    const { data: components } = useFrappeGetDocList('Component', {
        fields: ['name'],
        filters: [['name', 'in', ['HGM (Pregnant cow)', 'Animal Induction']]],
    })
    const { data: ddCompletedApplications, mutate: mutatePendingApplications } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_pending_component_allocation_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: appliedAadharFilter.length === 0 ? null : appliedAadharFilter,
        application_id: appliedApplicationIdFilter.length === 0 ? null : appliedApplicationIdFilter,
        component: componentFilter === 'all' ? null : componentFilter,
        limit_start: (pendingPage - 1) * PAGE_SIZE,
        limit_page_length: PAGE_SIZE,
    })

    const { data: completedAllocations } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_completed_component_allocation_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: appliedAadharFilter.length === 0 ? null : appliedAadharFilter,
        application_id: appliedApplicationIdFilter.length === 0 ? null : appliedApplicationIdFilter,
        component: componentFilter === 'all' ? null : componentFilter,
        limit_start: (completedPage - 1) * PAGE_SIZE,
        limit_page_length: PAGE_SIZE,
    })

    const { data: allocationStats } = useFrappeGetCall<{
        message: {
            pending_component_allocation: number;
            total_component_allocated: number;
            total_applications: number;
        }
    }>('vmddp_app.api.v1.accountant.get_component_allocation_stats')
    const { call: cancelDoc } = useFrappePostCall("frappe.client.cancel");
    const { call: setDocValue } = useFrappePostCall("frappe.client.set_value");
    const { user } = useAuth()
    const isAccountant = user?.roles?.includes(UserRole.VMDDP_ACCOUNTANT);
    const pendingApplications = ddCompletedApplications?.message?.data ?? []
    const completedList = completedAllocations?.message?.data ?? [];

    const { data: ddDetailsList, isLoading: loadingDDDetails } = useFrappeGetDocList<DDDocDetails>("DD", {
        fields: ["name", "application", "component", "item", "dd_number", "dd_date", "amount", "source_bank_name", "branch_name"],
        filters: selectedPendingApplication
            ? [
                ["application", "=", selectedPendingApplication.name],
                ["dd_number", "=", selectedPendingApplication.dd_number],
            ]
            : [["name", "=", "__none__"]],
        limit: 1,
        orderBy: { field: "creation", order: "desc" },
    });

    const selectedDD = ddDetailsList?.[0] || null;

    const updateSearchParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value && value !== "all" && value !== "") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        updateSearchParams({ tab: value });
    };

    const handleFilterChange = () => {
        setPendingPage(1);
        setCompletedPage(1);
    };

    const handleDistrictFilterChange = (value: string) => {
        setDistrictFilter(value);
        updateSearchParams({ district: value });
        handleFilterChange();
    };

    const handleComponentFilterChange = (value: string) => {
        setComponentFilter(value);
        updateSearchParams({ component: value });
        handleFilterChange();
    };

    const handleRefresh = () => {
        toast({
            title: "Refreshing",
            description: "Fetching latest data...",
        });
        setPendingPage(1);
        setCompletedPage(1);
    };

    const handleApplicationIdFilterChange = (value: string) => {
        setApplicationIdFilter(value.trim());
    };

    const handleSearch = () => {
        setAppliedAadharFilter(aadharFilter);
        setAppliedApplicationIdFilter(applicationIdFilter);
        updateSearchParams({ aadhaar: aadharFilter, application_id: applicationIdFilter });
        handleFilterChange();
    };

    const handleExport = (format: "excel" | "pdf") => {
        const params: Record<string, string> = {};

        if (appliedAadharFilter) params.search_text = appliedAadharFilter;
        if (appliedApplicationIdFilter) params.application_id = appliedApplicationIdFilter;
        if (componentFilter !== "all") params.component = componentFilter;
        if (districtFilter !== "all") params.district = districtFilter;

        exportData({ params, format });
    };

    const handleOpenCancelDialog = (application: ComponentAllocationItem) => {
        setSelectedPendingApplication(application);
        setShowCancelDDDialog(true);
    };

    const handleCancelDD = async (remarks: string) => {
        if (!selectedPendingApplication) {
            return;
        }

        if (!selectedDD?.name) {
            toast({
                title: "DD not found",
                description: "Unable to find the DD document for this application.",
                variant: "destructive",
            });
            return;
        }

        try {
            await setDocValue({
                doctype: "DD",
                name: selectedDD.name,
                fieldname: "remarks",
                value: remarks,
            });

            await cancelDoc({
                doctype: "DD",
                name: selectedDD.name,
            });

            toast({
                title: "DD Cancelled",
                description: `DD ${selectedDD.dd_number} has been cancelled successfully.`,
            });

            setShowCancelDDDialog(false);
            setSelectedPendingApplication(null);
            mutatePendingApplications();
        } catch (error: any) {
            toast({
                title: "Cancellation Failed",
                description: error?.message || "Failed to cancel DD.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="w-full bg-background overflow-y-scroll">
            <div className="">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                Component Allocation
                            </h1>
                            <p className="text-sm text-muted-foreground">Allocate components to approved beneficiaries</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {activeTab === "completed" && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2"
                                    disabled={isExporting}
                                    onClick={() => handleExport("excel")}
                                    data-testid="button-export-report"
                                >
                                    <Download className="h-4 w-4" />
                                    {isExporting ? "Exporting..." : "Export Excel"}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                title="Refresh data"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card data-testid="card-total-allocations" className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs sm:text-sm">Total Applications</CardDescription>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FileCheck className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-xl sm:text-2xl text-blue-600 drop-shadow-sm">{allocationStats?.message?.total_applications ?? 0}</CardTitle>
                                <div className="flex items-center gap-1 text-xs">
                                </div>
                            </CardHeader>
                        </Card>

                        <Card data-testid="card-pending-allocations" className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs sm:text-sm">Awaiting Allocation</CardDescription>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <Clock className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-xl sm:text-2xl text-yellow-600 drop-shadow-sm">{allocationStats?.message?.pending_component_allocation ?? 0}</CardTitle>
                                <div className="flex items-center gap-1 text-xs">
                                </div>
                            </CardHeader>
                        </Card>
                        <Card data-testid="card-completed-allocations" className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs sm:text-sm">Completed</CardDescription>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-xl sm:text-2xl text-green-600 drop-shadow-sm">{allocationStats?.message?.total_component_allocated ?? 0}</CardTitle>
                                <div className="flex items-center gap-1 text-xs">
                                </div>
                            </CardHeader>
                        </Card>

                        <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs sm:text-sm">Current Tab</CardDescription>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <Eye className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-xl sm:text-2xl text-purple-600 drop-shadow-sm">{activeTab === "pending" ? pendingApplications.length : completedList.length}</CardTitle>
                                <div className="flex items-center gap-1 text-xs">
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Allocations List */}
                    <Card data-testid="card-allocations-list">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Component Allocations Report
                            </CardTitle>
                            <CardDescription>View and manage component allocations by status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={handleTabChange}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                    <TabsList>
                                        <TabsTrigger value="pending" data-testid="tab-pending">
                                            Pending ({ddCompletedApplications?.message.pagination.total_items ?? 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" data-testid="tab-completed">
                                            Completed ({completedAllocations?.message.pagination.total_items ?? 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Filters */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search name, Aadhaar..."
                                                value={aadharFilter}
                                                onChange={(e) => setAadharFilter(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="pl-9 w-48"
                                                data-testid="input-list-search-aadhaar"
                                            />
                                        </div>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Application ID..."
                                                value={applicationIdFilter}
                                                onChange={(e) => handleApplicationIdFilterChange(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="pl-9 w-44"
                                                data-testid="input-list-search-application-id"
                                            />
                                        </div>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleSearch}
                                            data-testid="button-search"
                                        >
                                            <Search className="h-4 w-4 mr-1" />
                                            Search
                                        </Button>
                                        <Select value={districtFilter} onValueChange={handleDistrictFilterChange}>
                                            <SelectTrigger className="w-36" data-testid="select-filter-district">
                                                <SelectValue placeholder="District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Districts</SelectItem>
                                                {districts?.map((d) => (
                                                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={componentFilter} onValueChange={handleComponentFilterChange}>
                                            <SelectTrigger className="w-40" data-testid="select-filter-component">
                                                <SelectValue placeholder="Component" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Components</SelectItem>
                                                {components?.map((c) => (
                                                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <TabsContent value="pending">
                                    <div className="border rounded-lg overflow-hidden flex flex-col">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                            <table className="w-full min-w-[900px]">
                                                <thead className="bg-muted sticky top-0 z-30">
                                                    <tr>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Application ID</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Beneficiary</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Aadhaar</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">District</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Component</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Status</th>
                                                        {isAccountant && (
                                                            <th className="text-left p-3 text-xs sm:text-sm font-medium border">Action</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingApplications.map((app) => (
                                                        <tr key={app.name} data-testid={`row-pending-${app.name}`} className="border-b hover:bg-muted/30">
                                                            <td className="p-3 text-xs sm:text-sm font-medium border">{app.name}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">{app.first_name} {app.mid_name} {app.last_name}</td>
                                                            <td className="p-3 text-xs sm:text-sm font-mono border">{app.aadhar_number}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">{app.district}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                <Badge variant="outline" className="gap-1">
                                                                    {getComponentIcon(app.component_name)}
                                                                    {app.component_name}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                <Badge variant={app.component_status === 'DD Completed' ? 'secondary' : 'default'}>
                                                                    {app.component_status}
                                                                </Badge>
                                                            </td>
                                                            {isAccountant && (
                                                                <td className="p-3 text-xs sm:text-sm border">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <Link href={`/accountant/component-allocation/${encodeURIComponent(app.name)}`}>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                data-testid={`button-allocate-${app.name}`}
                                                                            >
                                                                                <ChevronRight className="h-4 w-4 mr-1" />
                                                                                Allocate
                                                                            </Button>
                                                                        </Link>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => handleOpenCancelDialog(app)}
                                                                            data-testid={`button-cancel-dd-${app.name}`}
                                                                        >
                                                                            <Ban className="h-4 w-4 mr-1" />
                                                                            Cancel DD
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    {pendingApplications.length === 0 && (
                                                        <tr>
                                                            <td colSpan={isAccountant ? 7 : 6} className="text-center py-8 text-sm text-muted-foreground border">
                                                                No applications awaiting allocation
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination for pending */}
                                    {(ddCompletedApplications?.message.pagination?.total_items ?? 0) > 0 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Page {pendingPage} • Showing {ddCompletedApplications?.message.pagination.total_pages} of {ddCompletedApplications?.message.pagination?.total_items ?? 0} results
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    // variant="outline"
                                                    size="sm"
                                                    onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                                    disabled={pendingPage === 1}
                                                    data-testid="button-pending-prev-page"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPendingPage(p => p + 1)}
                                                    disabled={pendingPage * PAGE_SIZE >= (ddCompletedApplications?.message.pagination?.total_items ?? 0)}
                                                    data-testid="button-pending-next-page"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="completed">
                                    <div className="border rounded-lg overflow-hidden flex flex-col">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                            <table className="w-full min-w-[900px]">
                                                <thead className="bg-muted sticky top-0 z-30">
                                                    <tr>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Application ID</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Beneficiary</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Aadhaar</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">District</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Component</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Status</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Animal/Item</th>
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {completedList.map((alloc) => (
                                                        <tr key={alloc.name} data-testid={`row-allocation-${alloc.name}`} className="border-b hover:bg-muted/30">
                                                            <td className="p-3 text-xs sm:text-sm font-medium border">{alloc.name}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">{alloc.first_name} {alloc.mid_name} {alloc.last_name}</td>
                                                            <td className="p-3 text-xs sm:text-sm font-mono border">{alloc.aadhar_number}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">{alloc.district}</td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                <Badge variant="outline">
                                                                    {alloc.component_name}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                <Badge variant="default" className="bg-green-600">
                                                                    {alloc.component_status}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                {alloc.type_of_animal || alloc.item || "-"}
                                                            </td>
                                                            <td className="p-3 text-xs sm:text-sm border">
                                                                <Link href={`/accountant/component-allocation/allocated/${alloc.component_allocation_id}`}>
                                                                    <Button variant="ghost" size="sm" data-testid={`button-view-details-${alloc.component_allocation_id}`}>
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {completedList.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground border">
                                                                No completed allocations
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination for completed */}
                                    {(completedAllocations?.message?.pagination?.total_items ?? 0) > 0 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Page {completedPage} • Showing {completedList.length} of {completedAllocations?.message?.pagination?.total_items ?? 0} results
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                                                    disabled={completedPage === 1}
                                                    data-testid="button-completed-prev-page"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCompletedPage(p => p + 1)}
                                                    disabled={completedPage * PAGE_SIZE >= (completedAllocations?.message?.pagination?.total_items ?? 0)}
                                                    data-testid="button-completed-next-page"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <CancelDDDialog
                open={showCancelDDDialog}
                onOpenChange={(open) => {
                    setShowCancelDDDialog(open);
                    if (!open) {
                        setSelectedPendingApplication(null);
                    }
                }}
                selectedPendingApplication={selectedPendingApplication}
                selectedDD={selectedDD}
                loadingDDDetails={loadingDDDetails}
                onCancelDD={handleCancelDD}
            />
        </div>
    );

}

interface ComponentAllocationItem {
    name: string;
    first_name: string;
    last_name: string;
    mid_name: string;
    component_status: "DD Completed" | "Pending" | "Approved" | "Rejected" | "Component Allocated";
    aadhar_number: string;
    component_name: string;
    amount: number;
    dd_number: string;
    dd_date: string; // Format: "YYYY-MM-DD"
    dd_amount: number;
    source_bank_name: string;
    branch_name: string;
    item: string | null;
    type_of_animal?: string;
    village: string;
    district: string;
    taluka: string;
    component_allocation_id: string;
}