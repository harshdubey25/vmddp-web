"use client"
import { useState } from "react"
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
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
    FileSpreadsheet,
    FileText,
    RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportReport } from "@/lib/export-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

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
    const [activeTab, setActiveTab] = useState("pending");
    const [districtFilter, setDistrictFilter] = useState("all")
    const [aadharFilter, setAadharFilter] = useState("")
    const [componentFilter, setComponentFilter] = useState("all")
    const [pendingPage, setPendingPage] = useState(1)
    const [completedPage, setCompletedPage] = useState(1)

    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const { data: districts } = useFrappeGetDocList('District Master')
    const { data: components } = useFrappeGetDocList('Component', {
        fields: ['name'],
        filters: [['name', 'in', ['HGM (Pregnant cow)', 'Animal Induction']]],
    })
    const { data: ddCompletedApplications } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_completed_dd_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: aadharFilter.length === 0 ? null : aadharFilter,
        component: componentFilter === 'all' ? null : componentFilter,
        limit_start: (pendingPage - 1) * PAGE_SIZE,
        limit_page_length: PAGE_SIZE,
    })

    const { data: completedAllocations } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_completed_component_allocation_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: aadharFilter.length === 0 ? null : aadharFilter,
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

    const pendingApplications = (ddCompletedApplications?.message?.data ?? []).filter(
        (app) => app.component_status !== 'Component Allocated'
    );

    const completedList = completedAllocations?.message?.data ?? [];

    const handleFilterChange = () => {
        setPendingPage(1);
        setCompletedPage(1);
    };

    const handleDistrictFilterChange = (value: string) => {
        setDistrictFilter(value);
        handleFilterChange();
    };

    const handleComponentFilterChange = (value: string) => {
        setComponentFilter(value);
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

    const handleAadharFilterChange = (value: string) => {
        setAadharFilter(value.replace(/\D/g, ""));
        handleFilterChange();
    };

    const handleExport = async (format: "excel" | "pdf") => {
        setIsExporting(true);
        toast({
            title: "Export started",
            description: `Generating ${format.toUpperCase()} report...`,
        });

        try {
            const params: Record<string, string> = {};

            if (aadharFilter) params.search_text = aadharFilter;
            if (componentFilter !== "all") params.component = componentFilter;
            if (districtFilter !== "all") params.district = districtFilter;

            await exportReport({
                method: "vmddp_app.api.v1.component_allocation.export_completed_component_allocation_list",
                params,
                format,
                filename: "component-allocation-report",
            });

            toast({
                title: "Export completed",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export failed",
                description: "Failed to export report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
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
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                title="Refresh data"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="default"
                                className="gap-2"
                                onClick={() => handleExport("excel")}
                                data-testid="button-export"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export Excel</span>
                                <span className="sm:hidden">Export</span>
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card data-testid="card-total-allocations">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs sm:text-sm">Total Applications</CardDescription>
                                <CardTitle className="text-xl sm:text-2xl">{allocationStats?.message?.total_applications ?? 0}</CardTitle>
                            </CardHeader>
                        </Card>

                        <Card data-testid="card-pending-allocations">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs sm:text-sm">Awaiting Allocation</CardDescription>
                                <CardTitle className="text-xl sm:text-2xl text-yellow-600">{allocationStats?.message?.pending_component_allocation ?? 0}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card data-testid="card-completed-allocations">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs sm:text-sm">Completed</CardDescription>
                                <CardTitle className="text-xl sm:text-2xl text-green-600">{allocationStats?.message?.total_component_allocated ?? 0}</CardTitle>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs sm:text-sm">Current Tab</CardDescription>
                                <CardTitle className="text-xl sm:text-2xl text-blue-600">{activeTab === "pending" ? pendingApplications.length : completedList.length}</CardTitle>
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
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                    <TabsList>
                                        <TabsTrigger value="pending" data-testid="tab-pending">
                                            Pending ({allocationStats?.message?.pending_component_allocation ?? 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" data-testid="tab-completed">
                                            Completed ({allocationStats?.message?.total_component_allocated ?? 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Filters */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {activeTab === "completed" && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="gap-2"
                                                        disabled={isExporting}
                                                        data-testid="button-export-report"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        {isExporting ? "Exporting..." : "Export"}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleExport("excel")} data-testid="export-excel">
                                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                        Export as Excel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleExport("pdf")} data-testid="export-pdf">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Export as PDF
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search Aadhaar..."
                                                value={aadharFilter}
                                                onChange={(e) => handleAadharFilterChange(e.target.value)}
                                                className="pl-9 w-40"
                                                data-testid="input-list-search-aadhaar"
                                            />
                                        </div>
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
                                                        <th className="text-left p-3 text-xs sm:text-sm font-medium border">Action</th>
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
                                                            <td className="p-3 text-xs sm:text-sm border">
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
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {pendingApplications.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground border">
                                                                No applications awaiting allocation
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Pagination for pending */}
                                    {(allocationStats?.message?.pending_component_allocation ?? 0) > 0 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Page {pendingPage} • Showing {pendingApplications.length} of {allocationStats?.message?.pending_component_allocation ?? 0} results
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
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
                                                    disabled={pendingPage * PAGE_SIZE >= (allocationStats?.message?.pending_component_allocation ?? 0)}
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
                                    {(allocationStats?.message?.total_component_allocated ?? 0) > 0 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Page {completedPage} • Showing {completedList.length} of {allocationStats?.message?.total_component_allocated ?? 0} results
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
                                                    disabled={completedPage * PAGE_SIZE >= (allocationStats?.message?.total_component_allocated ?? 0)}
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