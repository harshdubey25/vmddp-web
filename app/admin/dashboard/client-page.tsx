'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/AdminSidebar";
import {
    FileText,
    Users,
    Package,
    ArrowUpRight,
    AlertTriangle,
    RefreshCw,
    Copy,
} from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import Link from "next/link";

interface Application {
    name: string;
    fullname: string;
    component_list: string[] | string;
    village: string;
    status: string;
    date: string;
}

export default function AdminDashboardClient() {
    const [showError, setShowError] = useState(false);
    const [errorDetails, setErrorDetails] = useState<any>(null);

    const { data: applicationsResponse, error, isLoading, mutate } = useFrappeGetCall<{
        message: {
            applications: Application[];
        }
    }>('vmddp_app.api.api.get_applications_summary', {
        page: '1',
        limit: '4'
    });

    useEffect(() => {
        if (error) {
            console.error('Dashboard Error:', error);
            console.error('Full Error Object:', JSON.stringify(error, null, 2));
            setErrorDetails(error);
            setShowError(true);
        }
    }, [error]);

    // Error Display Component
    if (showError && errorDetails) {
        return (
            <div className="min-h-screen bg-muted/30 p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-destructive" />
                                <CardTitle className="text-destructive">Dashboard Error</CardTitle>
                            </div>
                            <CardDescription>An error occurred while loading the dashboard</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error Message */}
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <h3 className="font-semibold text-destructive mb-2">Error Message:</h3>
                                <p className="text-sm font-mono break-all">
                                    {errorDetails.message || 'Unknown error'}
                                </p>
                            </div>

                            {/* Full Error Object */}
                            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-96">
                                <h4 className="text-white mb-2">Full Error Object:</h4>
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(errorDetails, null, 2)}
                                </pre>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        setShowError(false);
                                        setErrorDetails(null);
                                        mutate();
                                    }}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const errorText = `Dashboard Error:\n\n${JSON.stringify(errorDetails, null, 2)}`;
                                        navigator.clipboard.writeText(errorText);
                                        alert('Error details copied to clipboard!');
                                    }}
                                    className="gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Error
                                </Button>
                                <Link href="/admin/dashboard">
                                    <Button variant="outline">
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const recentApplications = (applicationsResponse?.message?.applications || []).map((app: Application) => ({
        id: app.name,
        applicant: app.fullname,
        component: Array.isArray(app.component_list) ? app.component_list.join(', ') : 'N/A',
        district: app.village || 'N/A',
        status: app.status,
        date: app.date,
    }));

    return (
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar userRole="admin" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
                    <div>
                        <h1 className="font-display font-semibold text-xl">
                            Dashboard Overview
                        </h1>
                        <p className="text-sm text-muted-foreground">Welcome back, Administrator</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            System Active
                        </Badge>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        {/* Loading State */}
                        {isLoading && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                        Loading dashboard data...
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle>Recent Applications</CardTitle>
                                        <CardDescription>Latest submissions from farmers</CardDescription>
                                    </div>
                                    <Link href={'/admin/applications'}>
                                        <Button variant="outline" size="sm">
                                            View All
                                            <ArrowUpRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentApplications.length > 0 ? (
                                            recentApplications.map((app, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <p className="font-semibold text-sm">{app.id}</p>
                                                            <Badge
                                                                variant={app.status === "approved" ? "default" : "secondary"}
                                                                className={app.status === "approved" ? "bg-chart-3" : ""}
                                                            >
                                                                {app.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{app.applicant}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-muted-foreground">{app.component}</span>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground">{app.district}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">{app.date}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                {isLoading ? 'Loading applications...' : 'No recent applications found'}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Link href={"/admin/applications"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <FileText className="w-4 h-4" />
                                                Review Applications
                                            </Button>
                                        </Link>
                                        <Link href={"/admin/subadmins"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <Users className="w-4 h-4" />
                                                Manage Sub-Admins
                                            </Button>
                                        </Link>
                                        <Link href={"/admin/components"}>
                                            <Button variant="outline" className="w-full justify-start gap-3">
                                                <Package className="w-4 h-4" />
                                                Configure Components
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}