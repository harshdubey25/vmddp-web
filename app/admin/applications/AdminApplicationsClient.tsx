"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
    Search,
    Filter,
    Download,
    Eye,
} from "lucide-react";
import { getStatusBadge } from "@/lib/status-utils";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { useFrappeGetDocList } from "frappe-react-sdk";

import { Application } from "./page";

interface AdminApplicationsClientProps {
    applications: Application[];
    currentPage: number;
    pageSize: number;
}

export default function AdminApplicationsClient({ applications, currentPage, pageSize }: AdminApplicationsClientProps) {
    console.log('AdminApplicationsClient received applications:', applications);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");
    const [componentFilter, setComponentFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Fetch districts from Frappe
    const { data: frappeDistricts, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });

    const districts = frappeDistricts ? frappeDistricts.map((d: any) => d.name1) : [];

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        const matchesDistrict = districtFilter === "all" || app.district === districtFilter;
        const matchesComponent = componentFilter === "all" || app.component === componentFilter;
        return matchesSearch && matchesStatus && matchesDistrict && matchesComponent;
    });

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
    };

    const handleReview = (action: "approve" | "reject", remarks: string) => {
        console.log(`${action} application with remarks:`, remarks);
        setSelectedApp(null);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="admin" />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                    <div>
                        <h1 className="font-display font-semibold text-xl" data-testid="text-applications-title">
                            Applications Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and manage farmer applications
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
                                            {filteredApplications.length} applications found
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
                                        </SelectContent>
                                    </Select>
                                    <Select value={districtFilter} onValueChange={setDistrictFilter}>
                                        <SelectTrigger data-testid="select-district-filter">
                                            <SelectValue placeholder="Filter by district" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Districts</SelectItem>
                                            {districtsLoading ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : (
                                                districts.map((district: string) => (
                                                    <SelectItem key={district} value={district}>
                                                        {district}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Select value={componentFilter} onValueChange={setComponentFilter}>
                                        <SelectTrigger data-testid="select-component-filter">
                                            <SelectValue placeholder="Filter by component" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Components</SelectItem>
                                            <SelectItem value="Animal Induction (Calved Cow)">Animal Induction</SelectItem>
                                            <SelectItem value="HGM Purchase">HGM Purchase</SelectItem>
                                            <SelectItem value="Fertility Feed">Fertility Feed</SelectItem>
                                            <SelectItem value="Supply Chaff Cutter">Chaff Cutter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Applicant</th>
                                                    <th className="text-left p-4 font-semibold text-sm">District</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Component</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Approver</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Date</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((app, index) => (
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
                                                                <p className="text-xs text-muted-foreground">{app.mobile}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div>
                                                                <p className="text-sm">{app.district || 'N/A'}</p>
                                                                <p className="text-xs text-muted-foreground">{app.taluka || 'N/A'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.component || 'N/A'}</p>
                                                        </td>
                                                        <td className="p-4">{getStatusBadge(app.status)}</td>
                                                        <td className="p-4">
                                                            <p className="text-sm">{app.approver || "-"}</p>
                                                        </td>
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
                                                    href={filteredApplications.length === pageSize ? `?page=${currentPage + 1}&limit=${pageSize}` : '#'}
                                                    onClick={(e) => {
                                                        if (filteredApplications.length < pageSize) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={filteredApplications.length < pageSize ? 'pointer-events-none opacity-50' : ''}
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
                application={selectedApp}
                isOpen={!!selectedApp}
                onClose={() => setSelectedApp(null)}
                onReview={handleReview}
                showReviewActions={true}
            />
        </div>
    );
}
