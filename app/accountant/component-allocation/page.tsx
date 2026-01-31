"use client"
import { useState } from "react"
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
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

    // Reset pagination when filters change
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

    const handleAadharFilterChange = (value: string) => {
        setAadharFilter(value.replace(/\D/g, ""));
        handleFilterChange();
    };

    return (
        <div className="w-full bg-background overflow-y-scroll">
            <div className="">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* <Link href="/accountant/dashboard">
                                <Button variant="ghost" size="icon" data-testid="button-back">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link> */}
                            <div>
                                <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">
                                    Component Allocation
                                </h1>
                                <p className="text-muted-foreground">Allocate components to approved beneficiaries</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card data-testid="card-total-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Package className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Allocations</p>
                                        <p className="text-2xl font-bold">{allocationStats?.message?.total_applications ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-pending-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-yellow-500/10">
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Awaiting Allocation</p>
                                        <p className="text-2xl font-bold">{allocationStats?.message?.pending_component_allocation ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card data-testid="card-completed-allocations">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/10">
                                        <Check className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Completed</p>
                                        <p className="text-2xl font-bold">{allocationStats?.message?.total_component_allocated ?? 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Allocations List */}
                    <Card data-testid="card-allocations-list">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Component Allocations
                            </CardTitle>
                            <CardDescription>View and manage component allocations</CardDescription>
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
}