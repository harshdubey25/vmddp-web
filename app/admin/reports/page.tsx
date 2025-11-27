"use client"
// ...existing code...
// Content from src/pages/admin/Reports.tsx
import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
    Download,
    FileText,
    TrendingUp,
    BarChart3,
    PieChart,
    Calendar,
    Filter,
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { frappeBrowser } from "@/lib/frappe";

export default function AdminReports() {
    const [dateFrom, setDateFrom] = useState("2025-01-01");
    const [dateTo, setDateTo] = useState("2025-01-31");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedComponent, setSelectedComponent] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<string>("applicationId");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFrom, dateTo, selectedDistrict, selectedComponent, selectedStatus]);

    const applicationTrend = [
        { date: "Jan 1", applications: 45 },
        { date: "Jan 5", applications: 78 },
        { date: "Jan 10", applications: 92 },
        { date: "Jan 15", applications: 125 },
        { date: "Jan 20", applications: 156 },
        { date: "Jan 25", applications: 189 },
        { date: "Jan 31", applications: 234 },
    ];

    const componentData = [
        { name: "Animal Induction", value: 342, color: "hsl(var(--chart-1))" },
        { name: "HGM Purchase", value: 298, color: "hsl(var(--chart-2))" },
        { name: "Fertility Feed", value: 215, color: "hsl(var(--chart-3))" },
        { name: "Chaff Cutter", value: 187, color: "hsl(var(--chart-4))" },
        { name: "Others", value: 205, color: "hsl(var(--chart-5))" },
    ];

    const districtData = [
        { district: "Nagpur", applications: 245, approved: 189 },
        { district: "Amravati", applications: 198, approved: 156 },
        { district: "Akola", applications: 187, approved: 134 },
        { district: "Yavatmal", applications: 156, approved: 98 },
        { district: "Wardha", applications: 134, approved: 89 },
    ];

    const subAdminPerformance = [
        { name: "Dr. Rajesh Shinde", total: 245, pending: 32, approved: 198, rejected: 15 },
        { name: "Mrs. Sunita Deshmukh", total: 189, pending: 28, approved: 145, rejected: 16 },
        { name: "Mr. Prashant Kale", total: 312, pending: 45, approved: 245, rejected: 22 },
        { name: "Dr. Vandana Patil", total: 156, pending: 12, approved: 132, rejected: 12 },
    ];

    const allApplications = [
        { applicationId: "VMDDP2501234", farmerName: "Ramesh Kumar Patil", district: "Nagpur", taluka: "Umred", component: "Animal Induction", appliedDate: "2025-01-15", status: "Approved", amount: "₹50,000", approver: "Dr. Suresh Deshmukh" },
        { applicationId: "VMDDP2501235", farmerName: "Suresh Bhaurao Deshmukh", district: "Amravati", taluka: "Achalpur", component: "HGM Purchase", appliedDate: "2025-01-18", status: "Pending", amount: "₹35,000" },
        { applicationId: "VMDDP2501236", farmerName: "Anil Vishwanath Shinde", district: "Akola", taluka: "Barshitakli", component: "Fertility Feed", appliedDate: "2025-01-20", status: "Approved", amount: "₹25,000", approver: "Mrs. Anjali Patil" },
        { applicationId: "VMDDP2501237", farmerName: "Prakash Tukaram Kale", district: "Yavatmal", taluka: "Arni", component: "Chaff Cutter", appliedDate: "2025-01-22", status: "Rejected", amount: "₹15,000", approver: "Dr. Rajesh Kulkarni" },
        { applicationId: "VMDDP2501238", farmerName: "Vinod Shankar Gawande", district: "Wardha", taluka: "Deoli", component: "Animal Induction", appliedDate: "2025-01-23", status: "Approved", amount: "₹50,000", approver: "Mr. Prakash Jadhav" },
        { applicationId: "VMDDP2501239", farmerName: "Rajendra Dattatray Pawar", district: "Nagpur", taluka: "Kuhi", component: "HGM Purchase", appliedDate: "2025-01-24", status: "Pending", amount: "₹35,000" },
        { applicationId: "VMDDP2501240", farmerName: "Mahesh Ganesh Bhosale", district: "Amravati", taluka: "Dharni", component: "Fertility Feed", appliedDate: "2025-01-25", status: "Approved", amount: "₹25,000", approver: "Dr. Suresh Deshmukh" },
        { applicationId: "VMDDP2501241", farmerName: "Santosh Maruti Jadhav", district: "Akola", taluka: "Akot", component: "Animal Induction", appliedDate: "2025-01-26", status: "Approved", amount: "₹50,000", approver: "Mrs. Anjali Patil" },
        { applicationId: "VMDDP2501242", farmerName: "Digambar Raghunath Wagh", district: "Yavatmal", taluka: "Darwa", component: "Chaff Cutter", appliedDate: "2025-01-27", status: "Pending", amount: "₹15,000" },
        { applicationId: "VMDDP2501243", farmerName: "Balasaheb Annasaheb Rathod", district: "Wardha", taluka: "Hinganghat", component: "HGM Purchase", appliedDate: "2025-01-28", status: "Approved", amount: "₹35,000", approver: "Dr. Rajesh Kulkarni" },
        { applicationId: "VMDDP2501244", farmerName: "Dnyaneshwar Sopan Kamble", district: "Nagpur", taluka: "Katol", component: "Fertility Feed", appliedDate: "2025-01-29", status: "Rejected", amount: "₹25,000", approver: "Mr. Prakash Jadhav" },
        { applicationId: "VMDDP2501245", farmerName: "Uttam Chandrakant Gavande", district: "Amravati", taluka: "Morshi", component: "Animal Induction", appliedDate: "2025-01-30", status: "Approved", amount: "₹50,000", approver: "Dr. Suresh Deshmukh" },
        { applicationId: "VMDDP2501246", farmerName: "Shrikant Bhagwan Meshram", district: "Akola", taluka: "Patur", component: "HGM Purchase", appliedDate: "2025-01-31", status: "Pending", amount: "₹35,000" },
        { applicationId: "VMDDP2501247", farmerName: "Mahadev Laxman Thakare", district: "Yavatmal", taluka: "Ghatanji", component: "Chaff Cutter", appliedDate: "2025-01-14", status: "Approved", amount: "₹15,000", approver: "Mrs. Anjali Patil" },
        { applicationId: "VMDDP2501248", farmerName: "Ramdas Pandurang Ingole", district: "Wardha", taluka: "Karanja", component: "Fertility Feed", appliedDate: "2025-01-13", status: "Approved", amount: "₹25,000", approver: "Dr. Rajesh Kulkarni" },
        { applicationId: "VMDDP2501249", farmerName: "Chandrakant Vasant Bansod", district: "Nagpur", taluka: "Narkhed", component: "Animal Induction", appliedDate: "2025-01-12", status: "Pending", amount: "₹50,000" },
        { applicationId: "VMDDP2501250", farmerName: "Ashok Tulshiram Dhotre", district: "Amravati", taluka: "Warud", component: "HGM Purchase", appliedDate: "2025-01-11", status: "Approved", amount: "₹35,000", approver: "Mr. Prakash Jadhav" },
        { applicationId: "VMDDP2501251", farmerName: "Vishnu Govind Mankar", district: "Akola", taluka: "Telhara", component: "Fertility Feed", appliedDate: "2025-01-10", status: "Rejected", amount: "₹25,000", approver: "Dr. Suresh Deshmukh" },
        { applicationId: "VMDDP2501252", farmerName: "Bharat Mohan Uike", district: "Yavatmal", taluka: "Kalamb", component: "Animal Induction", appliedDate: "2025-01-09", status: "Approved", amount: "₹50,000", approver: "Mrs. Anjali Patil" },
        { applicationId: "VMDDP2501253", farmerName: "Ganesh Narayan Sonkusare", district: "Wardha", taluka: "Samudrapur", component: "Chaff Cutter", appliedDate: "2025-01-08", status: "Approved", amount: "₹15,000", approver: "Dr. Rajesh Kulkarni" },
    ];

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const filteredApplications = allApplications.filter((app) => {
        const matchesSearch =
            searchQuery === "" ||
            app.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.farmerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDistrict =
            selectedDistrict === "all" || app.district.toLowerCase() === selectedDistrict.toLowerCase();

        const matchesComponent =
            selectedComponent === "all" ||
            app.component.toLowerCase().includes(selectedComponent.toLowerCase());

        const matchesStatus =
            selectedStatus === "all" || app.status.toLowerCase() === selectedStatus.toLowerCase();

        const appDate = new Date(app.appliedDate);
        const matchesDateRange =
            appDate >= new Date(dateFrom) && appDate <= new Date(dateTo);

        return matchesSearch && matchesDistrict && matchesComponent && matchesStatus && matchesDateRange;
    });

    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let aValue: any = a[sortField as keyof typeof a];
        let bValue: any = b[sortField as keyof typeof b];

        if (sortField === "appliedDate") {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        } else if (sortField === "amount") {
            aValue = parseFloat(aValue.replace(/[₹,]/g, ""));
            bValue = parseFloat(bValue.replace(/[₹,]/g, ""));
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
    const paginatedApplications = sortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExportPDF = () => {
        console.log("Exporting to PDF...");
    };

    const handleExportExcel = () => {
        console.log("Exporting to Excel...");
    };

    const handleExportDistrictWiseReport = async (format: "xlsx" | "csv") => {
        try {
            setIsDownloadingReport(true);

            const params = new URLSearchParams();
            params.append("file_format", format);

            if (selectedDistrict !== "all") {
                params.append("district", selectedDistrict);
            }
            if (selectedComponent !== "all") {
                params.append("component", selectedComponent);
            }
            if (selectedStatus !== "all") {
                params.append("status", selectedStatus);
            }

            // Get the authentication token
            const token = localStorage.getItem("frappe_access_token") ||
                document.cookie.match(/(?:^|; )frappe_access_token=([^;]*)/)?.[1];

            const baseUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL;
            const url = `${baseUrl}/api/method/vmddp_app.api.reports.download_district_wise_report?${params.toString()}`;

            // Fetch with authentication
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json, application/octet-stream'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `district_wise_report.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Get the blob and trigger download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error exporting district-wise report:", error);
            alert("Failed to export report. Please try again.");
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const totalApplications = districtData.reduce((sum, d) => sum + d.applications, 0);
    const totalApproved = districtData.reduce((sum, d) => sum + d.approved, 0);
    const approvalRate = ((totalApproved / totalApplications) * 100).toFixed(1);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-xl" data-testid="text-reports-title">
                        Reports & Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Generate and analyze application reports
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => handleExportDistrictWiseReport("xlsx")}
                        data-testid="button-export-district-report"
                        disabled={isDownloadingReport}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isDownloadingReport ? "Downloading..." : "District Report"}
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 bg-muted/30">
                <div className="space-y-6 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-chart-2" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                                <p className="font-display font-bold text-2xl">{totalApplications}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-chart-3" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                                <p className="font-display font-bold text-2xl">{totalApproved}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-chart-4" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                                <p className="font-display font-bold text-2xl">{approvalRate}%</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                                        <PieChart className="w-5 h-5 text-chart-1" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Components</p>
                                <p className="font-display font-bold text-2xl">{componentData.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Trend</CardTitle>
                                <CardDescription>Daily application submissions over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={applicationTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="applications"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            name="Applications"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Component Distribution</CardTitle>
                                <CardDescription>Applications by scheme component</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={componentData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => entry.name}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {componentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>District-wise Performance</CardTitle>
                            <CardDescription>Applications and approvals by district</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={districtData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="district" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="applications" fill="hsl(var(--chart-2))" name="Total Applications" />
                                    <Bar dataKey="approved" fill="hsl(var(--chart-3))" name="Approved" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sub-Admin Performance</CardTitle>
                            <CardDescription>Application processing by DPOs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {subAdminPerformance.map((sa, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                        data-testid={`subadmin-performance-${index}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold">{sa.name}</p>
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <span className="text-muted-foreground">
                                                    Total: <strong>{sa.total}</strong>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Pending: <strong>{sa.pending}</strong>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Approved: <strong className="text-chart-3">{sa.approved}</strong>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Rejected: <strong className="text-chart-5">{sa.rejected}</strong>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-chart-3">
                                                {((sa.approved / sa.total) * 100).toFixed(0)}% approval
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Detailed Application Report</CardTitle>
                                        <CardDescription>
                                            Showing {paginatedApplications.length} of {filteredApplications.length} applications
                                        </CardDescription>
                                    </div>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by ID or name..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="pl-9"
                                            data-testid="input-search-applications"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="date-from">From Date</Label>
                                        <Input
                                            id="date-from"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            data-testid="input-date-from"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date-to">To Date</Label>
                                        <Input
                                            id="date-to"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            data-testid="input-date-to"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>District</Label>
                                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                            <SelectTrigger data-testid="select-district">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Districts</SelectItem>
                                                <SelectItem value="nagpur">Nagpur</SelectItem>
                                                <SelectItem value="amravati">Amravati</SelectItem>
                                                <SelectItem value="akola">Akola</SelectItem>
                                                <SelectItem value="yavatmal">Yavatmal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Component</Label>
                                        <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                                            <SelectTrigger data-testid="select-component">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Components</SelectItem>
                                                <SelectItem value="animal">Animal Induction</SelectItem>
                                                <SelectItem value="hgm">HGM Purchase</SelectItem>
                                                <SelectItem value="feed">Fertility Feed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                            <SelectTrigger data-testid="select-status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("applicationId")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-applicationId"
                                                    >
                                                        Application ID
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("farmerName")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-farmerName"
                                                    >
                                                        Farmer Name
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("district")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-district"
                                                    >
                                                        District
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("taluka")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-taluka"
                                                    >
                                                        Taluka
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("component")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-component"
                                                    >
                                                        Component
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("appliedDate")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-appliedDate"
                                                    >
                                                        Applied Date
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("status")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-status"
                                                    >
                                                        Status
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                                <th className="text-left p-3 font-medium text-sm">
                                                    <button
                                                        onClick={() => handleSort("approver")}
                                                        className="flex items-center gap-1 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                                                        data-testid="sort-approver"
                                                    >
                                                        Approver
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedApplications.map((app, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t hover-elevate"
                                                    data-testid={`application-row-${index}`}
                                                >
                                                    <td className="p-3 text-sm font-mono">{app.applicationId}</td>
                                                    <td className="p-3 text-sm">{app.farmerName}</td>
                                                    <td className="p-3 text-sm">{app.district}</td>
                                                    <td className="p-3 text-sm">{app.taluka}</td>
                                                    <td className="p-3 text-sm">{app.component}</td>
                                                    <td className="p-3 text-sm">
                                                        {new Date(app.appliedDate).toLocaleDateString("en-IN")}
                                                    </td>
                                                    <td className="p-3 text-sm">
                                                        <Badge
                                                            className={
                                                                app.status === "Approved"
                                                                    ? "bg-chart-3"
                                                                    : app.status === "Pending"
                                                                        ? "bg-chart-4"
                                                                        : "bg-chart-5"
                                                            }
                                                        >
                                                            {app.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-sm">{app.approver || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {paginatedApplications.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No applications found matching the selected filters
                                    </div>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            data-testid="button-prev-page"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            data-testid="button-next-page"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
