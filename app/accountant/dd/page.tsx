"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, CreditCard, Check, AlertCircle, IndianRupee, ClipboardList, FileText, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { frappeBrowser } from "@/lib/frappe";

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

    const [selectedApplications, setselectedApplications] = useState<DDApplication[]>([]);
    const [ddCompletedApplications, setddCompletedApplications] = useState<DDApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'approved');
    const [approvedSearchAadhaar, setApprovedSearchAadhaar] = useState('');
    const [selectedSearchAadhaar, setSelectedSearchAadhaar] = useState('');

    // Pagination states
    const [approvedPage, setApprovedPage] = useState(1);
    const [selectedPage, setSelectedPage] = useState(1);
    const [approvedTotal, setApprovedTotal] = useState(0);
    const [selectedTotal, setSelectedTotal] = useState(0);
    const pageSize = 20;

    // Fetch approved applications
    const fetchselectedApplications = async () => {
        setLoading(true);
        try {
            const params: any = {
                component_status: 'Selected',
                limit_start: (approvedPage - 1) * pageSize,
                limit_page_length: pageSize,
            };

            if (approvedSearchAadhaar && approvedSearchAadhaar.trim()) {
                params.aadhar_number = approvedSearchAadhaar.trim();
            }

            const response = await frappeBrowser.call().get('vmddp_app.api.v1.accountant.dd_applications', params);
            const data = response?.message || [];
            setselectedApplications(data);
            setApprovedTotal(data.length); // You might want to get total count from API
        } catch (error) {
            console.error('Error fetching approved applications:', error);
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
                component_status: 'DD Completed',
                limit_start: (selectedPage - 1) * pageSize,
                limit_page_length: pageSize,
            };

            if (selectedSearchAadhaar && selectedSearchAadhaar.trim()) {
                params.aadhar_number = selectedSearchAadhaar.trim();
            }

            const response = await frappeBrowser.call().get('vmddp_app.api.v1.accountant.dd_applications', params);
            const data = response?.message || [];
            setddCompletedApplications(data);
            setSelectedTotal(data.length);
        } catch (error) {
            console.error('Error fetching selected applications:', error);
            setddCompletedApplications([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when tab or pagination changes
    useEffect(() => {
        if (activeTab === 'approved') {
            fetchselectedApplications();
        } else {
            fetchddCompletedApplications();
        }
    }, [activeTab, approvedPage, selectedPage, approvedSearchAadhaar, selectedSearchAadhaar]);

    const handleSelectApplication = (app: DDApplication) => {
        router.push(`/accountant/dd/dd-collection/${encodeURIComponent(app.name)}`);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`?${params.toString()}`);
    };

    const handleApprovedSearch = () => {
        setApprovedPage(1); // Reset to first page on search
        fetchselectedApplications();
    };

    const handleSelectedSearch = () => {
        setSelectedPage(1); // Reset to first page on search
        fetchddCompletedApplications();
    };

    const getFullName = (app: DDApplication) => {
        return [app.first_name, app.mid_name, app.last_name].filter(Boolean).join(' ') || 'N/A';
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
            case "selected":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Selected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Calculate summary stats
    const totalCollected = ddCompletedApplications.reduce((sum: number, app: DDApplication) => sum + (app.amount || 0), 0);
    const pendingCount = selectedApplications.length;
    const verifiedCount = ddCompletedApplications.length;

    return (
        <div className="h-screen bg-background w-full">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/accountant/dashboard">
                            <Button variant="ghost" size="icon" data-testid="button-back">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="text-page-title">DD Collection</h1>
                            <p className="text-muted-foreground">Collect Demand Drafts from approved beneficiaries</p>
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
                                    <p className="text-sm text-muted-foreground">Total Collected</p>
                                    <p className="text-2xl font-bold" data-testid="text-total-amount">
                                        ₹{totalCollected.toLocaleString("en-IN")}
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
                                    <p className="text-sm text-muted-foreground">Total DDs</p>
                                    <p className="text-2xl font-bold" data-testid="text-total-count">
                                        {ddCompletedApplications.length}
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
                                    <p className="text-sm text-muted-foreground">Pending Collection</p>
                                    <p className="text-2xl font-bold" data-testid="text-pending-count">
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
                                    <p className="text-sm text-muted-foreground">Collected</p>
                                    <p className="text-2xl font-bold" data-testid="text-verified-count">
                                        {verifiedCount}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="approved" className="flex items-center gap-2" data-testid="tab-approved">
                            <ClipboardList className="h-4 w-4" />
                            Selected Applications
                        </TabsTrigger>
                        <TabsTrigger value="collected" className="flex items-center gap-2" data-testid="tab-collected">
                            <FileText className="h-4 w-4" />
                            Collected DDs
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1:  Applications */}
                    <TabsContent value="approved" className="space-y-4">
                        <Card data-testid="card-approved-search">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5" />
                                            Selected Applications Awaiting DD Collection
                                        </CardTitle>
                                        <CardDescription>
                                            {selectedApplications.length} selected applications pending DD collection
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by Aadhaar..."
                                                value={approvedSearchAadhaar}
                                                onChange={(e) => setApprovedSearchAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApprovedSearch()}
                                                className="pl-9 w-60"
                                                data-testid="input-approved-aadhaar-search"
                                            />
                                        </div>
                                        <Button onClick={handleApprovedSearch} size="sm">
                                            Search
                                        </Button>
                                        {approvedSearchAadhaar && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setApprovedSearchAadhaar("");
                                                    setApprovedPage(1);
                                                }}
                                                data-testid="button-clear-approved-search"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Application ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>DD Amount</TableHead>
                                                    <TableHead>Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedApplications.map((app) => (
                                                    <TableRow key={app.name} data-testid={`row-approved-${app.name}`}>
                                                        <TableCell className="font-medium">{app.name}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{getFullName(app)}</p>
                                                                <p className="text-xs text-muted-foreground">{app.aadhar_number}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                <Badge variant="outline" className="text-xs">{app.district}</Badge>
                                                                <Badge variant="outline" className="text-xs">{app.taluka}</Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{app.component_name}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(app.component_status)}
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-primary">
                                                            ₹{(app.amount || 0).toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSelectApplication(app)}
                                                                data-testid={`button-collect-${app.name}`}
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-1" />
                                                                Collect DD
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {selectedApplications.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            {approvedSearchAadhaar
                                                                ? `No applications found for Aadhaar "${approvedSearchAadhaar}"`
                                                                : "No approved applications pending DD collection"
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination for Approved */}
                                        {selectedApplications.length > 0 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Page {approvedPage} • {selectedApplications.length} items
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setApprovedPage(p => Math.max(1, p - 1))}
                                                        disabled={approvedPage === 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setApprovedPage(p => p + 1)}
                                                        disabled={selectedApplications.length < pageSize}
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
                        <Card data-testid="card-dd-list">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Collected DDs</CardTitle>
                                        <CardDescription>
                                            {ddCompletedApplications.length} collected demand drafts (Selected applications)
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by Aadhaar..."
                                                value={selectedSearchAadhaar}
                                                onChange={(e) => setSelectedSearchAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSelectedSearch()}
                                                className="pl-9 w-60"
                                                data-testid="input-selected-aadhaar-search"
                                            />
                                        </div>
                                        <Button onClick={handleSelectedSearch} size="sm">
                                            Search
                                        </Button>
                                        {selectedSearchAadhaar && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedSearchAadhaar("");
                                                    setSelectedPage(1);
                                                }}
                                                data-testid="button-clear-selected-search"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Application ID</TableHead>
                                                    <TableHead>Beneficiary</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ddCompletedApplications.map((app) => (
                                                    <TableRow key={app.name} data-testid={`row-dd-${app.name}`}>
                                                        <TableCell className="font-medium">{app.name}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{getFullName(app)}</p>
                                                                <p className="text-xs text-muted-foreground">{app.aadhar_number}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                <Badge variant="outline" className="text-xs">{app.district}</Badge>
                                                                <Badge variant="outline" className="text-xs">{app.taluka}</Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{app.component_name}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₹{(app.amount || 0).toLocaleString("en-IN")}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(app.component_status)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {ddCompletedApplications.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                            {selectedSearchAadhaar
                                                                ? `No collected DDs found for Aadhaar "${selectedSearchAadhaar}"`
                                                                : "No collected DD entries found"
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination for Selected */}
                                        {ddCompletedApplications.length > 0 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Page {selectedPage} • {ddCompletedApplications.length} items
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedPage(p => Math.max(1, p - 1))}
                                                        disabled={selectedPage === 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedPage(p => p + 1)}
                                                        disabled={ddCompletedApplications.length < pageSize}
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
