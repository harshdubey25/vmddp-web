"use client";
import SecretaryDashboardStats from "./stats";
import TopComponents from "../../admin/dashboard/topComponents";

export default function SecretaryDashboard() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-xl" data-testid="text-dashboard-title">
                        Dashboard Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Welcome back</p>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <SecretaryDashboardStats />

                    <TopComponents/>
                </div>
            </main>
        </div>
    );
}
