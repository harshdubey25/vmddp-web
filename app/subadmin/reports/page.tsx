"use client"
// ...existing code...
// Content from src/pages/subadmin/Reports.tsx
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
import AdminSidebar from "@/components/AdminSidebar";
import {
    Download,
    FileText,
    TrendingUp,
    BarChart3,
    Calendar,
    Search,
    MapPin,
} from "lucide-react";
import {
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

export default function SubAdminReports() {
    const [dateFrom, setDateFrom] = useState("2025-01-01");
    const [dateTo, setDateTo] = useState("2025-01-31");
    const [selectedComponent, setSelectedComponent] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Mock zone - in real app, this would come from auth context
    const assignedZone = {
        district: "Nagpur",
        taluka: "Nagpur Rural",
    };

    const componentData = [
        { name: "Animal Induction", value: 45, color: "hsl(var(--chart-1))" },
        { name: "HGM Purchase", value: 38, color: "hsl(var(--chart-2))" },
        { name: "Fertility Feed", value: 32, color: "hsl(var(--chart-3))" },
        { name: "Chaff Cutter", value: 25, color: "hsl(var(--chart-4))" },
        { name: "Others", value: 16, color: "hsl(var(--chart-5))" },
    ];

    const villageData = [
        { village: "Khapa", applications: 28, approved: 22 },
        { village: "Mouda", applications: 24, approved: 18 },
        { village: "Kamptee", applications: 32, approved: 25 },
        { village: "Parseoni", applications: 19, approved: 14 },
        { village: "Mauda", applications: 21, approved: 16 },
        { village: "Others", applications: 32, approved: 24 },
    ];

    const allApplications = [
        { applicationId: "VMDDP2501234", farmerName: "Ramesh Kumar Patil", village: "Khapa", component: "Animal Induction", appliedDate: "2025-01-15", status: "Approved", approver: "DPO Nagpur Rural" },
        { applicationId: "VMDDP2501240", farmerName: "Sunita Devi", village: "Mouda", component: "HGM Purchase", appliedDate: "2025-01-05", status: "Pending", approver: "-" },
        { applicationId: "VMDDP2501235", farmerName: "Prakash Deshmukh", village: "Kamptee", component: "Fertility Feed", appliedDate: "2025-01-04", status: "Approved", approver: "DPO Nagpur Rural" },
        { applicationId: "VMDDP2501248", farmerName: "Meena Sharma", village: "Parseoni", component: "Chaff Cutter", appliedDate: "2025-01-18", status: "Approved", approver: "DPO Nagpur Rural" },
        { applicationId: "VMDDP2501249", farmerName: "Ganesh Kale", village: "Khapa", component: "Animal Induction", appliedDate: "2025-01-12", status: "Pending", approver: "-" },
        { applicationId: "VMDDP2501250", farmerName: "Vandana Patil", village: "Mouda", component: "HGM Purchase", appliedDate: "2025-01-11", status: "Approved", approver: "DPO Nagpur Rural" },
    ];

    const filteredApplications = allApplications.filter((app) => {
        const matchesSearch =
            app.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.farmerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesComponent = selectedComponent === "all" || app.component === selectedComponent;
        const matchesStatus = selectedStatus === "all" || app.status.toLowerCase() === selectedStatus;

        return matchesSearch && matchesComponent && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: string; className: string }> = {
            Pending: { variant: "outline", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
            Approved: { variant: "outline", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
            Rejected: { variant: "outline", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
        };

        return (
            <Badge variant={variants[status]?.variant as any} className={variants[status]?.className}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <AdminSidebar userRole="subadmin" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            Reports & Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Zone-specific reports and insights
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div className="text-sm">
                            <span className="font-medium">{assignedZone.district}</span>
                            <span className="text-muted-foreground"> • {assignedZone.taluka}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">Total Applications</p>
                                        <FileText className="w-4 h-4 text-chart-2" />
                                    </div>
                                    <p className="text-2xl font-bold">156</p>
                                    <p className="text-xs text-chart-3 flex items-center gap-1 mt-2">
                                        <TrendingUp className="w-3 h-3" />
                                        +8.2% from last month
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">Approved</p>
                                        <FileText className="w-4 h-4 text-chart-3" />
                                    </div>
                                    <p className="text-2xl font-bold">89</p>
                                    <p className="text-xs text-muted-foreground mt-2">57% approval rate</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">Pending</p>
                                        <FileText className="w-4 h-4 text-chart-4" />
                                    </div>
                                    <p className="text-2xl font-bold">52</p>
                                    <p className="text-xs text-muted-foreground mt-2">Needs review</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground">Rejected</p>
                                        <FileText className="w-4 h-4 text-chart-5" />
                                    </div>
                                    <p className="text-2xl font-bold">15</p>
                                    <p className="text-xs text-muted-foreground mt-2">9.6% rejection rate</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Applications by Component</CardTitle>
                                    <CardDescription>Distribution across different schemes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={componentData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
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

                            <Card>
                                <CardHeader>
                                    <CardTitle>Village-wise Applications</CardTitle>
                                    <CardDescription>Application status by village</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={villageData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="village" tick={{ fontSize: 12 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="applications" fill="hsl(var(--chart-2))" name="Total" />
                                            <Bar dataKey="approved" fill="hsl(var(--chart-3))" name="Approved" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

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
                                                <SelectItem value="Animal Induction">Animal Induction</SelectItem>
                                                <SelectItem value="HGM Purchase">HGM Purchase</SelectItem>
                                                <SelectItem value="Fertility Feed">Fertility Feed</SelectItem>
                                                <SelectItem value="Chaff Cutter">Chaff Cutter</SelectItem>
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
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID or farmer name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                        data-testid="input-search"
                                    />
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="text-left p-4 font-semibold text-sm">Application ID</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Farmer Name</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Village</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Component</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Applied Date</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                                                    <th className="text-left p-4 font-semibold text-sm">Approver</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((app, index) => (
                                                    <tr
                                                        key={app.applicationId}
                                                        className="border-b hover:bg-muted/30 transition-colors"
                                                        data-testid={`application-row-${index}`}
                                                    >
                                                        <td className="p-4">
                                                            <span className="font-mono text-sm font-semibold">{app.applicationId}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm font-medium">{app.farmerName}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm">{app.village}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm">{app.component}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm">{app.appliedDate}</span>
                                                        </td>
                                                        <td className="p-4">{getStatusBadge(app.status)}</td>
                                                        <td className="p-4">
                                                            <span className="text-sm">{app.approver}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredApplications.length} of {allApplications.length} applications
                                    </p>
                                    <Button variant="outline" data-testid="button-export">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
