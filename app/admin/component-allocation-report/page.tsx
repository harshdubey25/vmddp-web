"use client"
import { useState } from "react"
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import {
    Package,
    Check,
    AlertCircle,
    Tag,
    Leaf,
    Scissors,
    Search,
    Link as LinkIcon,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

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
export default function ComponentAllocation() {
    const [activeTab, setActiveTab] = useState("pending");
    const [districtFilter, setDistrictFilter] = useState("all")
    const [aadharFilter, setAadharFilter] = useState("")
    const [componentFilter, setComponentFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;
    const { data: districts } = useFrappeGetDocList('District Master')
    const { data: components } = useFrappeGetDocList('Component', {
        fields: ['name'],
        filters: [['name', 'in', ['HGM (Pregnant cow)', 'Animal Induction']]],
    })
    const { data: ddCompletedApplications } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_completed_dd_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: aadharFilter.length === 0 ? null : aadharFilter,
        component: componentFilter === 'all' ? null : componentFilter,
    })

    const { data: completedAllocations } = useFrappeGetCall<DDCompletedApplication>('vmddp_app.api.v1.accountant.get_completed_component_allocation_list', {
        district: districtFilter === 'all' ? null : districtFilter,
        search_text: aadharFilter.length === 0 ? null : aadharFilter,
        component: componentFilter === 'all' ? null : componentFilter,
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

    const totalPendingRecords = pendingApplications.length;
    const totalPendingPages = Math.ceil(totalPendingRecords / pageSize);
    const pendingStartIndex = (currentPage - 1) * pageSize;
    const pendingEndIndex = pendingStartIndex + pageSize;
    const paginatedPending = pendingApplications.slice(pendingStartIndex, pendingEndIndex);

    const completedApplications = completedAllocations?.message || [];
    const totalCompletedRecords = completedApplications.length;
    const totalCompletedPages = Math.ceil(totalCompletedRecords / pageSize);
    const completedStartIndex = (currentPage - 1) * pageSize;
    const completedEndIndex = completedStartIndex + pageSize;
    const paginatedCompleted = completedApplications.slice(completedStartIndex, completedEndIndex);

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="">
                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/reports">
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                            </Link>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                    Component Allocation
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">View component allocations to approved beneficiaries</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Card data-testid="card-total-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Total Allocations</p>
                                        <p className="text-lg sm:text-2xl font-bold">{allocationStats?.message?.total_applications ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-pending-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10 flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Awaiting Allocation</p>
                                        <p className="text-lg sm:text-2xl font-bold">{allocationStats?.message?.pending_component_allocation ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card data-testid="card-completed-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 flex-shrink-0">
                                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                                        <p className="text-lg sm:text-2xl font-bold">{allocationStats?.message?.total_component_allocated ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Allocations List */}
                    <Card data-testid="card-allocations-list">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                Component Allocations
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">View and monitor component allocations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={(value) => {
                                setActiveTab(value);
                                setCurrentPage(1);
                            }}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                                    <TabsList className="w-full sm:w-auto">
                                        <TabsTrigger value="pending" data-testid="tab-pending" className="text-xs sm:text-sm">
                                            Pending ({allocationStats?.message?.pending_component_allocation ?? 0})
                                        </TabsTrigger>
                                        <TabsTrigger value="completed" data-testid="tab-completed" className="text-xs sm:text-sm">
                                            Completed ({allocationStats?.message?.total_component_allocated ?? 0})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                                        <div className="relative flex-1 sm:flex-initial w-full sm:w-40">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search Aadhaar..."
                                                value={aadharFilter}
                                                onChange={(e) => {
                                                    setAadharFilter(e.target.value.replace(/\D/g, ""));
                                                    setCurrentPage(1);
                                                }}
                                                className="pl-9 w-full text-xs sm:text-sm"
                                                data-testid="input-list-search-aadhaar"
                                            />
                                        </div>
                                        <Select value={districtFilter} onValueChange={(value) => {
                                            setDistrictFilter(value);
                                            setCurrentPage(1);
                                        }}>
                                            <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm" data-testid="select-filter-district">
                                                <SelectValue placeholder="District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Districts</SelectItem>
                                                {districts?.map((d) => (
                                                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={componentFilter} onValueChange={(value) => {
                                            setComponentFilter(value);
                                            setCurrentPage(1);
                                        }}>
                                            <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm" data-testid="select-filter-component">
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
                                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                                        <Table className="text-xs sm:text-sm">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-28">Application ID</TableHead>
                                                    <TableHead className="min-w-24 sm:min-w-32">Beneficiary</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Aadhaar</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">District</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-28">Component</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedPending.map((app, idx) => (
                                                    <TableRow key={app.name} data-testid={`row-pending-${app.name}`}>
                                                        <TableCell className="text-xs sm:text-sm text-muted-foreground">{pendingStartIndex + idx + 1}</TableCell>
                                                        <TableCell className="font-medium text-xs sm:text-sm">{app.name}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm">{app.first_name} {app.mid_name} {app.last_name}</TableCell>
                                                        <TableCell className="font-mono text-xs">{app.aadhar_number}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm">{app.district}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="gap-1 text-xs">
                                                                {getComponentIcon(app.component_name)}
                                                                <span className="hidden sm:inline">{app.component_name}</span>
                                                                <span className="sm:hidden">{app.component_name.substring(0, 10)}</span>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={app.component_status === 'DD Completed' ? 'secondary' : 'default'} className="text-xs">
                                                                {app.component_status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {paginatedPending.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                            No applications awaiting allocation
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {totalPendingPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Showing {paginatedPending.length} of {totalPendingRecords} records • Page {currentPage} of {totalPendingPages}
                                            </p>
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                        />
                                                    </PaginationItem>

                                                    {Array.from({ length: Math.min(5, totalPendingPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalPendingPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage >= totalPendingPages - 2) {
                                                            pageNum = totalPendingPages - 4 + i;
                                                        } else {
                                                            pageNum = currentPage - 2 + i;
                                                        }

                                                        return (
                                                            <PaginationItem key={pageNum}>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    isActive={currentPage === pageNum}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {pageNum}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    })}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage(p => Math.min(totalPendingPages, p + 1))}
                                                            className={currentPage === totalPendingPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="completed">
                                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                                        <Table className="text-xs sm:text-sm">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-28">Application ID</TableHead>
                                                    <TableHead className="min-w-24 sm:min-w-32">Beneficiary</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Aadhaar</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">District</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-28">Component</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Status</TableHead>
                                                    <TableHead className="min-w-24 sm:min-w-28">Animal/Item</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedCompleted.map((alloc, idx) => (
                                                    <TableRow key={alloc.name} data-testid={`row-allocation-${alloc.name}`}>
                                                        <TableCell className="text-xs sm:text-sm text-muted-foreground">{completedStartIndex + idx + 1}</TableCell>
                                                        <TableCell className="font-medium text-xs sm:text-sm">{alloc.name}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm">{alloc.first_name} {alloc.mid_name} {alloc.last_name}</TableCell>
                                                        <TableCell className="font-mono text-xs">{alloc.aadhar_number}</TableCell>
                                                        <TableCell className="text-xs sm:text-sm">{alloc.district}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-xs">
                                                                {alloc.component_name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="default" className="bg-green-600 text-xs">
                                                                {alloc.component_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs sm:text-sm">
                                                            {alloc.type_of_animal || alloc.item || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {paginatedCompleted.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                            No completed allocations
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {totalCompletedPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Showing {paginatedCompleted.length} of {totalCompletedRecords} records • Page {currentPage} of {totalCompletedPages}
                                            </p>
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                        />
                                                    </PaginationItem>

                                                    {Array.from({ length: Math.min(5, totalCompletedPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalCompletedPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage >= totalCompletedPages - 2) {
                                                            pageNum = totalCompletedPages - 4 + i;
                                                        } else {
                                                            pageNum = currentPage - 2 + i;
                                                        }

                                                        return (
                                                            <PaginationItem key={pageNum}>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    isActive={currentPage === pageNum}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {pageNum}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    })}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage(p => Math.min(totalCompletedPages, p + 1))}
                                                            className={currentPage === totalCompletedPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
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
}