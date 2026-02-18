"use client"
import { useState } from "react"
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
    Package,
    Check,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Tag,
    Leaf,
    Scissors,
    Search,
    ExternalLink,
    ViewIcon,
    ArrowRight,
    Download,
    RefreshCw,
    FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

const getComponentIcon = (component: string) => {
    if (component === "Animal Induction") return <Tag className="h-5 w-5" />;
    if (component === "HGM") return <Package className="h-5 w-5" />;
    if (component.includes("Feed") || component.includes("Silage")) return <Leaf className="h-5 w-5" />;
    if (component.includes("Chaff")) return <Scissors className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
};
interface DDCompletedApplication {
    message: Array<ComponentAllocationItem>
}

const PAGE_SIZE = 20;

export default function ComponentAllocation() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("pending");
    const [districtFilter, setDistrictFilter] = useState("all")
    const [aadharFilter, setAadharFilter] = useState("")
    const [componentFilter, setComponentFilter] = useState("all")
    const [pendingPage, setPendingPage] = useState(1)
    const [completedPage, setCompletedPage] = useState(1)

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

    const pendingApplications = ddCompletedApplications?.message?.filter(
        app => app.component_status !== 'Component Allocated'
    ) || [];

    const completedList = completedAllocations?.message || [];

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


    const getCurrentTabInfo = () => {
        if (activeTab === "pending") {
            return {
                title: "Pending Component Allocations",
                description: "Applications awaiting component allocation",
                count: pendingApplications.length,
                icon: AlertCircle,
            };
        } else {
            return {
                title: "Completed Component Allocations",
                description: "Successfully allocated components",
                count: completedList.length,
                icon: Check,
            };
        }
    };

    const getFileName = () => {
        const date = new Date().toISOString().split('T')[0];
        const month = new Date().toLocaleString('default', { month: 'short' });
        return `Component-Allocations_${month}_${new Date().getFullYear()}_${date}.xlsx`;
    };

    // Helper function to calculate column widths for auto-fit
    const calculateColumnWidths = (data: any[][], minWidth = 10, maxWidth = 50) => {
        return data[0]?.map((_, colIndex) => {
            const maxLength = Math.max(
                ...data.map(row => {
                    const cell = row[colIndex];
                    return String(cell || '').length;
                })
            );
            return { wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth) };
        }) || [];
    };



    const handleExport = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // ===== PENDING ALLOCATIONS SHEET =====
            const pendingHeaders = [
                "Sr. No.",
                "Application ID",
                "Beneficiary Name",
                "Aadhaar Number",
                "District",
                "Taluka",
                "Village",
                "Component",
                "Status",
                "DD Number",
                "DD Date",
                "DD Amount (Rs.)",
                "Source Bank",
                "Branch",
                "Amount (Rs.)",
            ];

            const pendingRows = pendingApplications.map((app, idx) => [
                idx + 1,
                app.name,
                `${app.first_name} ${app.mid_name} ${app.last_name}`,
                app.aadhar_number,
                app.district,
                app.taluka,
                app.village,
                app.component_name,
                app.component_status,
                app.dd_number,
                app.dd_date,
                app.dd_amount,
                app.source_bank_name,
                app.branch_name,
                app.amount,
            ]);

            if (pendingRows.length > 0) {
                const pendingData = [pendingHeaders, ...pendingRows];
                const pendingSheet = XLSX.utils.aoa_to_sheet(pendingData);
                
                // Auto-fit columns based on content
                pendingSheet['!cols'] = calculateColumnWidths(pendingData);
                
                // Freeze header row
                pendingSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
                
                XLSX.utils.book_append_sheet(workbook, pendingSheet, "Pending");
            }

            const completedHeaders = [
                "Sr. No.",
                "Application ID",
                "Beneficiary Name",
                "Aadhaar Number",
                "District",
                "Taluka",
                "Village",
                "Component",
                "Status",
                "Animal/Item Type",
                "Amount (Rs.)",
                "Allocation ID",
            ];

            const completedRows = completedList.map((alloc, idx) => [
                idx + 1,
                alloc.name,
                `${alloc.first_name} ${alloc.mid_name} ${alloc.last_name}`,
                alloc.aadhar_number,
                alloc.district,
                alloc.taluka,
                alloc.village,
                alloc.component_name,
                alloc.component_status,
                alloc.type_of_animal || alloc.item || "-",
                alloc.amount,
                alloc.component_allocation_id,
            ]);

            if (completedRows.length > 0) {
                const completedData = [completedHeaders, ...completedRows];
                const completedSheet = XLSX.utils.aoa_to_sheet(completedData);
                
                // Auto-fit columns based on content
                completedSheet['!cols'] = calculateColumnWidths(completedData);
                
                // Freeze header row
                completedSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
                
                XLSX.utils.book_append_sheet(workbook, completedSheet, "Completed");
            }

            const summaryHeaders = ["Metric", "Value"];
            const summaryRows = [
                ["Total Applications", allocationStats?.message?.total_applications ?? 0],
                ["Pending Allocations", allocationStats?.message?.pending_component_allocation ?? 0],
                ["Completed Allocations", allocationStats?.message?.total_component_allocated ?? 0],
                ["", ""],
                ["Applied Filters", ""],
                ["District", districtFilter === "all" ? "All" : districtFilter],
                ["Component", componentFilter === "all" ? "All" : componentFilter],
                ["Aadhaar Search", aadharFilter || "None"],
                ["", ""],
                ["Export Date", new Date().toLocaleDateString()],
                ["Export Time", new Date().toLocaleTimeString()],
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
            
            // Auto-fit columns for summary
            summarySheet['!cols'] = calculateColumnWidths([summaryHeaders, ...summaryRows]);
            
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

            XLSX.writeFile(workbook, getFileName());

            toast({
                title: "Export completed",
                description: `Downloaded ${pendingRows.length + completedRows.length} records successfully.`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export failed",
                description: "Failed to generate report. Please try again.",
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
                                onClick={handleExport}
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
                                {/* Tab Header Info */}
                                <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-sm">
                                                {getCurrentTabInfo().title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {getCurrentTabInfo().description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">{getCurrentTabInfo().count}</p>
                                            <p className="text-xs text-muted-foreground">records</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-200 text-xs text-muted-foreground">
                                    📄 <strong>Export File:</strong> {getFileName()}
                                </div>
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
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Application ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>Aadhaar</TableHead>
                                                    <TableHead>District</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingApplications.map((app) => (
                                                    <TableRow key={app.name} data-testid={`row-pending-${app.name}`}>
                                                        <TableCell className="font-medium">{app.name}</TableCell>
                                                        <TableCell>{app.first_name} {app.mid_name} {app.last_name}</TableCell>
                                                        <TableCell className="font-mono text-xs">{app.aadhar_number}</TableCell>
                                                        <TableCell>{app.district}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="gap-1">
                                                                {getComponentIcon(app.component_name)}
                                                                {app.component_name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={app.component_status === 'DD Completed' ? 'secondary' : 'default'}>
                                                                {app.component_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
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
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {pendingApplications.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No applications awaiting allocation
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

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
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Application ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>Aadhaar</TableHead>
                                                    <TableHead>District</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Animal/Item</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {completedList.map((alloc) => (
                                                    <TableRow key={alloc.name} data-testid={`row-allocation-${alloc.name}`}>
                                                        <TableCell className="font-medium">{alloc.name}</TableCell>
                                                        <TableCell>{alloc.first_name} {alloc.mid_name} {alloc.last_name}</TableCell>
                                                        <TableCell className="font-mono text-xs">{alloc.aadhar_number}</TableCell>
                                                        <TableCell>{alloc.district}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {alloc.component_name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="default" className="bg-green-600">
                                                                {alloc.component_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {alloc.type_of_animal || alloc.item || "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link href={`/accountant/component-allocation/allocated/${alloc.component_allocation_id}`}>
                                                                <Button variant="ghost" size="sm" data-testid={`button-view-details-${alloc.component_allocation_id}`}>
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {completedList.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No completed allocations
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

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