
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Users,
    Package,
    ArrowUpRight,
    Download,
} from "lucide-react";

import AdminDashboardStats from "./stats";
import TopComponents from "./topComponents";
import Link from "next/link";
import { Suspense } from "react";
import { CardSkeleton, ListSkeleton } from "@/components/LoadingSkeletons";
import RecentApplicationsDashboard from "./recent-applications";
import ExportReportsDashboard from "./export-reports";
export default function AdminDashboard() {

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-xl" data-testid="text-dashboard-title">
                        Dashboard Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Welcome back, Administrator</p>
                </div>
                <ExportReportsDashboard />
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <AdminDashboardStats />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
                                <div>
                                    <CardTitle className="text-base sm:text-lg" data-testid="text-recent-applications">Recent Applications</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Latest submissions from farmers</CardDescription>
                                </div>
                                <Link href={'/admin/applications'}>
                                    <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-view-all">
                                        <span className="hidden sm:inline">View All</span>
                                        <span className="sm:hidden">All</span>
                                        <ArrowUpRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <RecentApplicationsDashboard />
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <TopComponents />
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg" data-testid="text-quick-actions">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Link href="/admin/applications">
                                        <Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                                            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Review Applications
                                        </Button>
                                    </Link>
                                    <Link href="/admin/subadmins">
                                        <Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Manage Sub-Admins
                                        </Button>
                                    </Link>
                                    <Link href="/admin/components">
                                        <Button variant="outline" className="w-full justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                                            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
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
    );
}
