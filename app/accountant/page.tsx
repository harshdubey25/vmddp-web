import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
    Receipt,
    Package,
    CreditCard,
    RefreshCcw,
    FileCheck,
    TrendingUp,
    Target,
    IndianRupee,
    ArrowRight,
    BarChart3,
    Users,
    Activity,
} from "lucide-react";


import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Dummy data for dashboard
const MASTER_STATUS_STAGES = [
    { id: "application_submitted", label: "Application Submitted", shortLabel: "Submitted", type: "pending" },
    { id: "dd_collection", label: "DD Collection", shortLabel: "DD Collect", type: "in_progress" },
    { id: "component_allocated", label: "Component Allocated", shortLabel: "Allocated", type: "in_progress" },
    { id: "vendor_assigned", label: "Vendor Assigned", shortLabel: "Vendor", type: "in_progress" },
    { id: "payment_processed", label: "Payment Processed", shortLabel: "Payment", type: "completed" },
    { id: "delivery_scheduled", label: "Delivery Scheduled", shortLabel: "Delivery", type: "in_progress" },
];

const beneficiaries = Array.from({ length: 150 }, (_, i) => ({ id: i + 1, name: `Beneficiary ${i + 1}` }));

const statusCounts: Record<string, number> = {
    application_submitted: 25,
    dd_collection: 30,
    component_allocated: 35,
    vendor_assigned: 20,
    payment_processed: 25,
    delivery_scheduled: 15,
};

const pendingCards = [
    { title: "DD Pending", count: 45, description: "Awaiting collection", href: "/accountant/dd-collection", icon: Receipt, color: "bg-orange-500/10 text-orange-600" },
    { title: "Allocations Due", count: 32, description: "Components to allocate", href: "/accountant/allocation", icon: Package, color: "bg-blue-500/10 text-blue-600" },
    { title: "Pending Payments", count: 28, description: "Awaiting approval", href: "/accountant/payments", icon: CreditCard, color: "bg-green-500/10 text-green-600" },
    { title: "Refund Requests", count: 8, description: "Need processing", href: "/accountant/refunds", icon: RefreshCcw, color: "bg-red-500/10 text-red-600" },
];

const districtChartData = [
    { name: "Dist A", target: 120, physical: 95 },
    { name: "Dist B", target: 100, physical: 85 },
    { name: "Dist C", target: 90, physical: 78 },
    { name: "Dist D", target: 80, physical: 70 },
];

const pieData = [
    { name: "Cow", value: 60 },
    { name: "Buffalo", value: 30 },
    { name: "Goat", value: 10 },
];

const mockDDEntries = [
    { id: 1, applicantName: "Rajesh Kumar", district: "District A", ddNumber: "DD12345", ddAmount: 25000, status: "pending" },
    { id: 2, applicantName: "Priya Sharma", district: "District B", ddNumber: "DD12346", ddAmount: 30000, status: "verified" },
    { id: 3, applicantName: "Amit Patel", district: "District C", ddNumber: "DD12347", ddAmount: 28000, status: "pending" },
];

const mockPayments = [
    { id: 1, applicantName: "Sunita Devi", vendorName: "ABC Suppliers", vendorType: "Equipment", payableAmount: 45000, adminApproval: false },
    { id: 2, applicantName: "Ramesh Singh", vendorName: "XYZ Traders", vendorType: "Feed", payableAmount: 35000, adminApproval: true },
    { id: 3, applicantName: "Kavita Reddy", vendorName: "PQR Livestock", vendorType: "Animal", payableAmount: 80000, adminApproval: false },
];

export default function AccountantDashboard() {


    const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(142, 70%, 45%)"];

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
        return `${amount.toLocaleString("en-IN")}`;
    };



    const quickActions = [
        { label: "Start DD Collection", href: "/accountant/dd-collection", icon: Receipt },
        { label: "Allocate Component", href: "/accountant/allocation", icon: Package },
        { label: "Record Payment", href: "/accountant/payments", icon: CreditCard },
        { label: "View Refunds", href: "/accountant/refunds", icon: RefreshCcw },
    ];

    return (
        <div className="min-h-screen bg-background">


            <main className="ml-72 overflow-auto min-h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="heading-dashboard">
                                Accountant Dashboard
                            </h1>
                            <p className="text-muted-foreground">
                                Financial and operational management overview
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            Last updated: {new Date().toLocaleDateString("en-IN")}
                        </Badge>
                    </div>

                    {/* Achievement Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card data-testid="card-physical-achievement">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Physical Achievement</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{"stats.totalPhysicalAchievement.toLocaleString()"}</div>
                                <Progress value={10} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {"stats.physicalTargetPercent"}% of target achieved
                                </p>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-achievement">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(500)}
                                </div>
                                <Progress value={10} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {"stats.financialTargetPercent"}% of target achieved
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Master Status Overview */}
                    <Card data-testid="card-master-status-overview">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Beneficiary Progress Tracker</CardTitle>
                                    <CardDescription>10-stage workflow status overview</CardDescription>
                                </div>
                            </div>
                            <Link href="/accountant/ledger">
                                <Button variant="outline" size="sm" data-testid="button-view-tracker">
                                    <Users className="h-4 w-4 mr-2" />
                                    View Tracker
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {MASTER_STATUS_STAGES.map((stage: typeof MASTER_STATUS_STAGES[number]) => {
                                    const count = statusCounts[stage.id] || 0;
                                    const totalBeneficiaries = beneficiaries.length || 1;
                                    const percentage = Math.round((count / totalBeneficiaries) * 100);
                                    return (
                                        <div
                                            key={stage.id}
                                            className="p-3 rounded-lg border bg-card"
                                            data-testid={`status-stage-${stage.id}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium truncate" title={stage.label}>
                                                    {stage.shortLabel}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${stage.type === "completed"
                                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                        : stage.type === "in_progress"
                                                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                        }`}
                                                >
                                                    {count}
                                                </Badge>
                                            </div>
                                            <Progress value={percentage} className="h-1" />
                                            <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Total Beneficiaries: <span className="font-medium text-foreground">{beneficiaries.length}</span>
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-xs text-muted-foreground">Pending</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <span className="text-xs text-muted-foreground">In Progress</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-xs text-muted-foreground">Completed</span>
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Tasks Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {pendingCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link key={card.title} href={card.href}>
                                    <Card
                                        className="hover-elevate cursor-pointer transition-all"
                                        data-testid={`card-pending-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                            <div className={`p-2 rounded-lg ${card.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{card.count}</div>
                                            <p className="text-xs text-muted-foreground">{card.description}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card data-testid="card-district-progress">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    District-wise Physical Progress
                                </CardTitle>
                                <CardDescription>Achievement vs Target by district</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64" data-testid="chart-district-progress">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={districtChartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="name" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                                            <Bar dataKey="physical" fill="hsl(var(--primary))" name="Achievement" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-breed-distribution">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Breed-wise Distribution
                                </CardTitle>
                                <CardDescription>Physical achievement by animal type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center" data-testid="chart-breed-distribution">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${50}%`}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card data-testid="card-quick-actions">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Start common tasks quickly</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {quickActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <Link key={action.label} href={action.href}>
                                            <Button
                                                variant="outline"
                                                className="w-full h-auto py-4 flex flex-col items-center gap-2"
                                                data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span className="text-xs text-center">{action.label}</span>
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card data-testid="card-recent-dd">
                            <CardHeader className="flex flex-row items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base">Recent DD Collections</CardTitle>
                                    <CardDescription>Latest demand draft entries</CardDescription>
                                </div>
                                <Link href="/accountant/dd-collection">
                                    <Button variant="ghost" size="sm" data-testid="button-view-all-dd">
                                        View All <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mockDDEntries.slice(0, 3).map((dd) => (
                                        <div
                                            key={dd.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            data-testid={`item-dd-${dd.id}`}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{dd.applicantName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {dd.district} | DD: {dd.ddNumber}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">
                                                    {formatCurrency(dd.ddAmount)}
                                                </p>
                                                <Badge
                                                    variant={dd.status === "pending" ? "secondary" : "default"}
                                                    className="text-xs"
                                                >
                                                    {dd.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-recent-payments">
                            <CardHeader className="flex flex-row items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base">Pending Payments</CardTitle>
                                    <CardDescription>Awaiting processing</CardDescription>
                                </div>
                                <Link href="/accountant/payments">
                                    <Button variant="ghost" size="sm" data-testid="button-view-all-payments">
                                        View All <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mockPayments.slice(0, 3).map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            data-testid={`item-payment-${payment.id}`}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{payment.applicantName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {payment.vendorName} ({payment.vendorType})
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">
                                                    {formatCurrency(payment.payableAmount)}
                                                </p>
                                                <Badge
                                                    variant={payment.adminApproval ? "default" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {payment.adminApproval ? "Approved" : "Pending"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
