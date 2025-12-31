import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "./header";
import SubAdminDashboardStats from "./stats";
import Link from "next/link";
import { Suspense } from "react";
import { RecentApplicationsList } from "./recent-application-list";
import { ListSkeleton, CardSkeleton } from "@/components/LoadingSkeletons";
export const runtime = 'edge';

export default async function SubAdminDashboard() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-5 lg:space-y-6 max-w-7xl">
                    <Suspense fallback={<CardSkeleton />}>
                        <SubAdminDashboardStats />
                    </Suspense>
                    <Card>
                        <CardHeader className="p-4 sm:p-5 lg:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <CardTitle className="text-base sm:text-lg lg:text-xl">Recent Applications</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Latest applications from your zone</CardDescription>
                                </div>
                                <Link href="/subadmin/applications" className="w-full sm:w-auto">
                                    <Button variant="outline" size="sm" data-testid="button-view-all" className="w-full sm:w-auto text-xs sm:text-sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <Suspense fallback={<ListSkeleton />}>
                                <RecentApplicationsList />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
