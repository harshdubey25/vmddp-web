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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    return (
        <div className="w-full bg-background min-h-screen overflow-y-auto">
            <div className="">
                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl sm:text-2xl font-display font-bold" data-testid="text-page-title">
                                Component Allocation
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">View component allocations to approved beneficiaries</p>
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
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                                                onChange={(e) => setAadharFilter(e.target.value.replace(/\D/g, ""))}
                                                className="pl-9 w-full text-xs sm:text-sm"
                                                data-testid="input-list-search-aadhaar"
                                            />
                                        </div>
                                        <Select value={districtFilter} onValueChange={setDistrictFilter}>
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
                                        <Select value={componentFilter} onValueChange={setComponentFilter}>
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
                                                    <TableHead className="min-w-20 sm:min-w-28">Application ID</TableHead>
                                                    <TableHead className="min-w-24 sm:min-w-32">Beneficiary</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Aadhaar</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">District</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-28">Component</TableHead>
                                                    <TableHead className="min-w-20 sm:min-w-24">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingApplications.map((app) => (
                                                    <TableRow key={app.name} data-testid={`row-pending-${app.name}`}>
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
                                                {pendingApplications.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                            No applications awaiting allocation
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="completed">
                                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                                        <Table className="text-xs sm:text-sm">
                                            <TableHeader>
                                                <TableRow>
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
                                                {completedAllocations?.message?.map((alloc) => (
                                                    <TableRow key={alloc.name} data-testid={`row-allocation-${alloc.name}`}>
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
                                                {completedAllocations?.message?.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                                                            No completed allocations
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
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