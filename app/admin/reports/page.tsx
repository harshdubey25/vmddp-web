"use client"
// ...existing code...
// Content from src/pages/admin/Reports.tsx
import { useState, useEffect } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    BarChart3,
    Building2,
    FileText,
    Clock,
    CheckCircle,
    Target,
    XCircle,
    TrendingUp,
    Package,
    Wallet,
    RefreshCw,
    CreditCard,
    Receipt,
    PieChart,
    Layers
} from "lucide-react";
import Link from "next/link";

import { frappeBrowser } from "@/lib/frappe";

export default function AdminReports() {
    const [dateFrom, setDateFrom] = useState("2025-01-01");
    const [dateTo, setDateTo] = useState("2025-01-31");
    const [selectedDistrict, setSelectedDistrict] = useState("all");
    const [selectedComponent, setSelectedComponent] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [statusCounts, setStatusCounts] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        selected: 0,
        rejected: 0,
    });
    const [statusCountsLoading, setStatusCountsLoading] = useState(false);
    const [statusCountsError, setStatusCountsError] = useState<string | null>(null);
    const [questionStats, setQuestionStats] = useState<Record<string, any>>({});
    const [questionStatsLoading, setQuestionStatsLoading] = useState(false);
    const [questionStatsError, setQuestionStatsError] = useState<string | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFrom, dateTo, selectedDistrict, selectedComponent, selectedStatus]);

    const { data: districtDocs, isLoading: districtsLoading } = useFrappeGetDocList("District Master", {
        fields: ["name1"],
        limit: 100,
    });

    const { data: componentDocs, isLoading: componentsLoading } = useFrappeGetDocList("Component", {
        fields: ["component_name"],
        limit: 100,
        filters: [["dont_show_in_website", "=", 0]],
    });

    const districtOptions = [
        "all",
        ...Array.from(
            new Set(
                (districtDocs ?? [])
                    .map((district: any) => district?.name1)
                    .filter((name: string | undefined): name is string => Boolean(name)),
            ),
        ),
    ];

    const componentOptions = [
        "all",
        ...Array.from(
            new Set(
                (componentDocs ?? [])
                    .map((component: any) => component?.component_name)
                    .filter((name: string | undefined): name is string => Boolean(name)),
            ),
        ),
    ];

    useEffect(() => {
        let isCancelled = false;

        const fetchStatusCounts = async () => {
            setStatusCountsLoading(true);
            setStatusCountsError(null);
            try {
                const params = new URLSearchParams({
                    district: selectedDistrict,
                    component: selectedComponent,
                });

                const response = await frappeBrowser
                    .call()
                    .get(
                        `vmddp_app.vmddp.doctype.app_form.app_form.get_applications_by_district_component?${params.toString()}`,
                    );

                if (isCancelled) {
                    return;
                }

                const payload = response?.message ?? {};
                setStatusCounts({
                    total: payload.total ?? 0,
                    pending: payload.pending ?? 0,
                    approved: payload.approved ?? 0,
                    selected: payload.selected ?? 0,
                    rejected: payload.rejected ?? 0,
                });
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                console.error("Failed to fetch application status counts:", error);
                setStatusCounts({ total: 0, pending: 0, approved: 0, selected: 0, rejected: 0 });
                setStatusCountsError("Unable to fetch live counts right now.");
            } finally {
                if (!isCancelled) {
                    setStatusCountsLoading(false);
                }
            }
        };

        fetchStatusCounts();

        return () => {
            isCancelled = true;
        };
    }, [selectedDistrict, selectedComponent]);

    useEffect(() => {
        if (!selectedComponent || selectedComponent === "all") {
            setQuestionStats({});
            setQuestionStatsError(null);
            setQuestionStatsLoading(false);
            return;
        }

        let isCancelled = false;
        const fetchQuestionStats = async () => {
            setQuestionStatsLoading(true);
            setQuestionStatsError(null);

            try {
                const params = new URLSearchParams({ component: selectedComponent });
                if (selectedDistrict && selectedDistrict !== "all") {
                    params.append("district", selectedDistrict);
                }
                if (selectedStatus && selectedStatus !== "all") {
                    params.append("status", selectedStatus);
                }

                const response = await frappeBrowser
                    .call()
                    .get(
                        `vmddp_app.vmddp.doctype.app_form.app_form.get_component_question_answers_count?${params.toString()}`,
                    );

                if (isCancelled) {
                    return;
                }

                const payload = response?.message?.message ?? response?.message ?? {};
                setQuestionStats(payload);
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                console.error("Failed to fetch component question stats:", error);
                setQuestionStats({});
                setQuestionStatsError("Unable to fetch question-wise counts. Please try again.");
            } finally {
                if (!isCancelled) {
                    setQuestionStatsLoading(false);
                }
            }
        };

        fetchQuestionStats();

        return () => {
            isCancelled = true;
        };
    }, [selectedComponent, selectedDistrict, selectedStatus]);




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


    const formatStatusCount = (value: number) => (statusCountsLoading ? "..." : value.toLocaleString());
    const statusSummaryCards = [
        {
            key: "total",
            label: "Total Applications",
            value: statusCounts.total,
            accent: "text-blue-600",
            icon: FileText,
            gradient: "from-blue-500/20 to-blue-600/10",
            borderColor: "border-blue-500/30",
            iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
            change: "+12.5%"
        },
        {
            key: "pending",
            label: "Pending",
            value: statusCounts.pending,
            accent: "text-yellow-600",
            icon: Clock,
            gradient: "from-yellow-500/20 to-orange-600/10",
            borderColor: "border-yellow-500/30",
            iconBg: "bg-gradient-to-br from-yellow-500 to-orange-600",
            change: "+8.3%"
        },
        {
            key: "approved",
            label: "Approved",
            value: statusCounts.approved,
            accent: "text-green-600",
            icon: CheckCircle,
            gradient: "from-green-500/20 to-green-600/10",
            borderColor: "border-green-500/30",
            iconBg: "bg-gradient-to-br from-green-500 to-green-600",
            change: "+15.7%"
        },
        {
            key: "selected",
            label: "Selected",
            value: statusCounts.selected,
            accent: "text-purple-600",
            icon: Target,
            gradient: "from-purple-500/20 to-purple-600/10",
            borderColor: "border-purple-500/30",
            iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
            change: "+9.2%"
        },
        {
            key: "rejected",
            label: "Rejected",
            value: statusCounts.rejected,
            accent: "text-red-600",
            icon: XCircle,
            gradient: "from-red-500/20 to-red-600/10",
            borderColor: "border-red-500/30",
            iconBg: "bg-gradient-to-br from-red-500 to-red-600",
            change: "-3.4%"
        },
    ];
    const getAnswerEntries = (answers: any): Array<[string, number]> => {
        if (!answers) {
            return [];
        }

        const source = Array.isArray(answers)
            ? answers.reduce((acc, entry) => ({ ...acc, ...entry }), {})
            : answers;

        const optionMap =
            source && typeof source === "object" && "options" in source && typeof source.options === "object"
                ? source.options
                : source;

        if (!optionMap || typeof optionMap !== "object") {
            return [] as Array<[string, number]>;
        }

        return Object.entries(optionMap)
            .filter(([key, value]) => key !== "total" && (typeof value === "number" || typeof value === "string"))
            .map(([key, value]) => [key, typeof value === "number" ? value : Number(value) || 0]);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between gap-3 sm:gap-0 border-b p-4 sm:px-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-lg sm:text-xl" data-testid="text-reports-title">
                        Reports & Analytics
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Generate and analyze application reports
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="default"
                        onClick={() => handleExportDistrictWiseReport("xlsx")}
                        data-testid="button-export-district-report"
                        disabled={isDownloadingReport}
                        className="w-full sm:w-auto text-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{isDownloadingReport ? "Downloading..." : "District Report"}</span>
                        <span className="sm:hidden">{isDownloadingReport ? "Downloading..." : "Export"}</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                            <div className="space-y-2">
                                <Label htmlFor="summary-district">District</Label>
                                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                                    <SelectTrigger id="summary-district" data-testid="summary-select-district">
                                        <SelectValue placeholder="All Districts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {districtsLoading ? (
                                            <SelectItem value="all">Loading districts...</SelectItem>
                                        ) : (
                                            districtOptions.map((district) => (
                                                <SelectItem key={district} value={district}>
                                                    {district === "all" ? "All Districts" : district}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="summary-component">Component</Label>
                                <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                                    <SelectTrigger id="summary-component" data-testid="summary-select-component">
                                        <SelectValue placeholder="All Components" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {componentsLoading ? (
                                            <SelectItem value="all">Loading components...</SelectItem>
                                        ) : (
                                            componentOptions.map((component) => (
                                                <SelectItem key={component} value={component}>
                                                    {component === "all" ? "All Components" : component}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {statusSummaryCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <Card
                                        key={card.key}
                                        className={`relative overflow-hidden border-2 ${card.borderColor} bg-gradient-to-br ${card.gradient} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group backdrop-blur-sm`}
                                    >
                                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${card.gradient} opacity-30 blur-2xl transition-all group-hover:opacity-50 group-hover:scale-110`} />
                                        <CardContent className="p-4 sm:p-6 relative">
                                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{card.label}</p>
                                            <p className={`font-display font-bold text-2xl sm:text-3xl ${card.accent} drop-shadow-sm`}>
                                                {formatStatusCount(card.value)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        {statusCountsError && (
                            <p className="text-sm text-destructive">{statusCountsError}</p>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Component Question Responses</CardTitle>
                            <CardDescription>
                                Option-wise counts for select questions in the chosen component
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedComponent === "all" ? (
                                <p className="text-sm text-muted-foreground">
                                    Choose a component to view question-level response counts.
                                </p>
                            ) : questionStatsLoading ? (
                                <p className="text-sm text-muted-foreground">Loading question stats...</p>
                            ) : questionStatsError ? (
                                <p className="text-sm text-destructive">{questionStatsError}</p>
                            ) : Object.keys(questionStats).length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No responses available for the selected filters.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(questionStats).map(([question, answers]) => {
                                        const answerEntries = getAnswerEntries(answers);
                                        return (
                                            <div key={question} className="border rounded-lg p-4">
                                                <p className="font-semibold text-sm mb-3">{question}</p>
                                                {answerEntries.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        No selectable responses recorded yet.
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {answerEntries.map(([option, count]) => (
                                                            <div
                                                                key={option}
                                                                className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2"
                                                            >
                                                                <span className="text-muted-foreground">{option}</span>
                                                                <span className="font-medium">{count.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    </div> */}

                    {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    </div> */}

                    {/* <Card>
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
                    </Card> */}

                    {/* <Card>
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
                    </Card> */}

                    {/* <Card>
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
                                                {districtsLoading ? (
                                                    <SelectItem value="all">Loading districts...</SelectItem>
                                                ) : (
                                                    districtOptions.map((district) => (
                                                        <SelectItem key={district} value={district}>
                                                            {district === "all" ? "All Districts" : district}
                                                        </SelectItem>
                                                    ))
                                                )}
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
                                                {componentsLoading ? (
                                                    <SelectItem value="all">Loading components...</SelectItem>
                                                ) : (
                                                    componentOptions.map((component) => (
                                                        <SelectItem key={component} value={component}>
                                                            {component === "all" ? "All Components" : component}
                                                        </SelectItem>
                                                    ))
                                                )}
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
                    </Card> */}
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold mb-3">Report Pages</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <Link href="/accountant/dd-report" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-blue-700 dark:text-blue-400 truncate">DD Reports</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View DD collection reports</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/accountant/component-allocation" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-green-700 dark:text-green-400 truncate">Component Allocation Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Track component allocations</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/dbt-claims-report" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-purple-700 dark:text-purple-400 truncate">DBT Claims Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View DBT claims data</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/vendor-payments-report" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-orange-700 dark:text-orange-400 truncate">Vendor Payments Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Monitor vendor payments</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/accountant/admin-expenses" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-red-500/30 bg-gradient-to-br from-red-500/20 to-red-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-red-700 dark:text-red-400 truncate">Admin Expenses Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Track administrative expenses</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/refunds-report" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 truncate">Refunds Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View refund transactions</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/fodder-seed-report" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-lime-500/30 bg-gradient-to-br from-lime-500/20 to-lime-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-lime-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-lime-700 dark:text-lime-400 truncate">Fodder Seed Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">District-wise fodder seed variety distribution</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-base sm:text-lg font-semibold mb-3">Monthly Progress Reports (MPR)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <Link href="/admin/mpr/animal-induction" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-cyan-700 dark:text-cyan-400 truncate">Animal Induction MPR</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View animal induction monthly progress report</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/mpr/dbt-claims-mpr" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/20 to-teal-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-teal-700 dark:text-teal-400 truncate">DBT Claims MPR</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View DBT claims monthly progress report</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/mpr/hgm" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-pink-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-pink-700 dark:text-pink-400 truncate">HGM MPR</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View HGM monthly progress report</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/mpr/all-targets" className="block h-full">
                                <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-600/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 h-full relative">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-xs sm:text-sm text-amber-700 dark:text-amber-400 truncate">All Targets Report</h3>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">View all targets report</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
