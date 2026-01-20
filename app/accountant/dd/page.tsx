"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Search,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { frappeBrowser } from "@/lib/frappe";
import { useFrappeGetCall } from "frappe-react-sdk";
import DDFilters from "@/components/DDFilters";

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
    const [ddCompletedApplications, setddCompletedApplications] = useState<
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
    });

    // Filter states for Collected DDs tab
    const [collectedFilters, setCollectedFilters] = useState({
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
    const [approvedPage, setApprovedPage] = useState(initialApprovedPage);
    const [selectedPage, setSelectedPage] = useState(initialSelectedPage);
    const [approvedTotal, setApprovedTotal] = useState(0);
    const [selectedTotal, setSelectedTotal] = useState(0);
    const pageSize = 20;

    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
    } = useFrappeGetCall("vmddp_app.api.v1.accountant.get_dd_stats");
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

    // Fetch selected applications
    const fetchddCompletedApplications = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: selectedPage,
                limit: pageSize,
            };

            // Add all filter parameters
            if (collectedFilters.aadhaar && collectedFilters.aadhaar.trim()) {
                params.search_text = collectedFilters.aadhaar.trim();
            }
            if (collectedFilters.district && collectedFilters.district.trim()) {
                params.district = collectedFilters.district.trim();
            }
            if (collectedFilters.taluka && collectedFilters.taluka.trim()) {
                params.taluka = collectedFilters.taluka.trim();
            }
            if (collectedFilters.village && collectedFilters.village.trim()) {
                params.village = collectedFilters.village.trim();
            }

            const response = await frappeBrowser
                .call()
                .get("vmddp_app.api.v1.accountant.get_completed_dd_list", params);
            const data = response?.message || [];
            setddCompletedApplications(data);
            setSelectedTotal(response?.total || data.length);
        } catch (error) {
            console.error("Error fetching completed DD applications:", error);
            setddCompletedApplications([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when tab, pagination, or filters change
    useEffect(() => {
        if (activeTab === "approved") {
            fetchselectedApplications();
        } else {
            fetchddCompletedApplications();
        }
    }, [
        activeTab,
        approvedPage,
        selectedPage,
        approvedFilters,
        collectedFilters,
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

            const query = params.toString();
            // Use replace to avoid adding history entries on every change
            router.replace(query ? `?${query}` : `/accountant/dd`);
        } catch (err) {
            console.error("Error syncing page params to URL", err);
        }
    }, [approvedPage, selectedPage, activeTab]);

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
    }) => {
        setApprovedPage(1); // Reset to first page on filter change
        setApprovedFilters(filters);
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
    console.log("Stats Data:", statsData);
    // Calculate summary stats
    const totalCollected = statsData?.message.total_dd_amount || 0;
    const pendingCount = statsData?.message.pending_dd || 0;

    const totalDDs = statsData?.message.total_applications || 0;
    const collectedDDs = statsData?.message.total_dd_completed || 0;
    return (
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card data-testid="card-total-collected">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <IndianRupee className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Collected
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        data-testid="text-total-amount"
                                    >
                                        ₹
                                        {totalCollected.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-total-dds">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/10">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total DDs
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        data-testid="text-total-count"
                                    >
                                        {totalDDs}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-pending">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-yellow-500/10">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Pending Collection
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        data-testid="text-pending-count"
                                    >
                                        {pendingCount}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-verified">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-500/10">
                                    <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Collected
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        data-testid="text-verified-count"
                                    >
                                        {collectedDDs}
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
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
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
                    </TabsList>

                    {/* Tab 1:  Applications */}
                    <TabsContent value="approved" className="space-y-4">
                        {/* Filters Section */}
                        <DDFilters
                            onFilterChange={handleApprovedFilterChange}
                            initialFilters={approvedFilters}
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
                                        <div className="overflow-x-auto overflow-y-auto h-full ">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Application ID
                                                        </TableHead>
                                                        <TableHead>
                                                            Beneficiary
                                                        </TableHead>
                                                        <TableHead>
                                                            Location
                                                        </TableHead>
                                                        <TableHead>
                                                            Component
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead>
                                                            DD Amount
                                                        </TableHead>
                                                        <TableHead>
                                                            Action
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedApplications.map(
                                                        (app) => (
                                                            <TableRow
                                                                key={app.name}
                                                                data-testid={`row-approved-${app.name}`}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {app.name}
                                                                </TableCell>
                                                                <TableCell>
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
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.district
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.taluka
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.village
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {
                                                                            app.component_name
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {getStatusBadge(
                                                                        app.component_status,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="font-semibold text-primary">
                                                                    ₹
                                                                    {(
                                                                        app.amount ||
                                                                        0
                                                                    ).toLocaleString(
                                                                        "en-IN",
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
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
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                    {selectedApplications.length ===
                                                        0 && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={7}
                                                                className="text-center py-8 text-muted-foreground"
                                                            >
                                                                {approvedFilters.aadhaar ||
                                                                approvedFilters.district ||
                                                                approvedFilters.taluka ||
                                                                approvedFilters.village
                                                                    ? "No applications found matching the selected filters"
                                                                    : "No approved applications pending DD collection"}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
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
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Loading...
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Application ID
                                                        </TableHead>
                                                        <TableHead>
                                                            Beneficiary
                                                        </TableHead>
                                                        <TableHead>
                                                            Location
                                                        </TableHead>
                                                        <TableHead>
                                                            Component
                                                        </TableHead>
                                                        <TableHead>
                                                            Amount
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {ddCompletedApplications.map(
                                                        (app) => (
                                                            <TableRow
                                                                key={app.name}
                                                                data-testid={`row-dd-${app.name}`}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {app.name}
                                                                </TableCell>
                                                                <TableCell>
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
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.district
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.taluka
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                app.village
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {
                                                                            app.component_name
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    ₹
                                                                    {(
                                                                        app.amount ||
                                                                        0
                                                                    ).toLocaleString(
                                                                        "en-IN",
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {getStatusBadge(
                                                                        app.component_status,
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                    {ddCompletedApplications.length ===
                                                        0 && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={6}
                                                                className="text-center py-8 text-muted-foreground"
                                                            >
                                                                {collectedFilters.aadhaar ||
                                                                collectedFilters.district ||
                                                                collectedFilters.taluka ||
                                                                collectedFilters.village
                                                                    ? "No collected DDs found matching the selected filters"
                                                                    : "No collected DD entries found"}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination for Selected */}
                                        {ddCompletedApplications.length > 0 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Page {selectedPage} •{" "}
                                                    {
                                                        ddCompletedApplications.length
                                                    }{" "}
                                                    items
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
                                                            selectedPage === 1
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
                                                            ddCompletedApplications.length <
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
                </Tabs>
            </div>
        </div>
    );
}
