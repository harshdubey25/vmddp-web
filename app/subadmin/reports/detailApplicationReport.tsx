'use client';

import { CardHeader, CardTitle, CardDescription, CardContent, Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface Application {
    name: string;
    fullname: string;
    mobile_number: string;
    village: string;
    component_list: string[];
    status: string;
    date: string;
}

interface Component {
    name: string;
    component_name: string;
    name_in_local_language?: string;
    dont_show_in_website?: number;
}

interface ApplicationsResponse {
    message: {
        applications: Application[];
    };
    error?: string;
}

const getStatusBadge = (status: string) => {
    const statusColors = {
        Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        Approved: "bg-green-100 text-green-800 border-green-200",
        Rejected: "bg-red-100 text-red-800 border-red-200",
        Selected: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
        <Badge
            variant="outline"
            className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"}
        >
            {status}
        </Badge>
    );
};

export default function DetailApplicationReport() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedComponent, setSelectedComponent] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);

    // Fetch components for dropdown
    const { data: components } = useFrappeGetDocList<Component>(
        'Component',
        {
            fields: ['name', 'component_name', 'name_in_local_language', 'dont_show_in_website'],
            filters: [['dont_show_in_website', '=', 0]], // Only show components that should be visible on website
            orderBy: {
                field: 'component_name',
                order: 'asc'
            }
        }
    );

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Build API parameters
    const apiParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: pageSize,
        };

        if (selectedStatus !== "all") {
            params.status = selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
        }

        if (selectedComponent !== "all") {
            params.component = selectedComponent;
        }

        if (dateFrom) {
            params.start_date = dateFrom;
        }

        if (dateTo) {
            params.end_date = dateTo;
        }

        if (debouncedSearchQuery) {
            params.search = debouncedSearchQuery;
        }

        return params;
    }, [currentPage, pageSize, selectedStatus, selectedComponent, dateFrom, dateTo, debouncedSearchQuery]);

    const { data: response, isLoading, error, mutate } = useFrappeGetCall<ApplicationsResponse>(
        'vmddp_app.api.api.get_applications_summary',
        apiParams,
        `applications-${currentPage}-${pageSize}-${JSON.stringify(apiParams)}`,
        {
            revalidateOnFocus: false,
        }
    );

    // Use API response directly without client-side filtering
    const applications = response?.message?.applications || [];
    console.log("Fetched applications:", response);
    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, selectedComponent, dateFrom, dateTo, debouncedSearchQuery]);

    // Refetch data when page changes or parameters change
    useEffect(() => {
        mutate();
    }, [currentPage, apiParams, mutate]);

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log("Export functionality to be implemented");
    };

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Detailed Application Report
                    </CardTitle>
                    <CardDescription>
                        Filter and search applications in your zone
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[200px]">
                        <div className="text-destructive">Error loading applications data</div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Detailed Application Report
                </CardTitle>
                <CardDescription>
                    Filter and search applications in your zone
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor="dateFrom">From Date</Label>
                        <Input
                            id="dateFrom"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            data-testid="input-date-from"
                        />
                    </div>

                    <div>
                        <Label htmlFor="dateTo">To Date</Label>
                        <Input
                            id="dateTo"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            data-testid="input-date-to"
                        />
                    </div>

                    <div>
                        <Label>Component</Label>
                        <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                            <SelectTrigger data-testid="select-component">
                                <SelectValue placeholder="All Components" />
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
                    </div>

                    <div>
                        <Label>Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="selected">Selected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID or applicant name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                            <th className="text-left p-4 font-semibold text-sm">Applicant Name</th>
                                            <th className="text-left p-4 font-semibold text-sm">Mobile Number</th>
                                            <th className="text-left p-4 font-semibold text-sm">Village</th>
                                            <th className="text-left p-4 font-semibold text-sm">Components</th>
                                            <th className="text-left p-4 font-semibold text-sm">Applied Date</th>
                                            <th className="text-left p-4 font-semibold text-sm">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.length > 0 ? (
                                            applications.map((app, index) => (
                                                <tr
                                                    key={app.name}
                                                    className="border-b hover:bg-muted/30 transition-colors"
                                                    data-testid={`application-row-${index}`}
                                                >
                                                    <td className="p-4">
                                                        <span className="font-mono text-sm font-semibold">{app.name}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm font-medium">{app.fullname}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.mobile_number}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.village}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.component_list.join(", ")}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm">{app.date}</span>
                                                    </td>
                                                    <td className="p-4">{getStatusBadge(app.status)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    No applications found matching your criteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {applications.length} applications on page {currentPage}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm px-3 py-1 bg-muted rounded">
                                        Page {currentPage}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={applications.length < pageSize}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleExport} data-testid="button-export">
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}