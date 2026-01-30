"use client";
import { Button } from "@/components/ui/button";
import {
    Download,
} from "lucide-react";
import Link from "next/link";
import SecretaryDashboardStats from "./stats";

export default function SecretaryDashboard() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 sm:pl-6 sm:pr-6 bg-background">
                <div>
                    <h1 className="font-display font-semibold text-base sm:text-xl" data-testid="text-dashboard-title">
                        Dashboard Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Welcome back, Secretary</p>
                </div>
                <Link href="/secretory/report">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Reports</span>
                        <span className="sm:hidden">Reports</span>
                    </Button>
                </Link>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-muted/30">
                <div className="space-y-4 sm:space-y-6 max-w-7xl">
                    <SecretaryDashboardStats />
                </div>
            </main>
        </div>
    );
}
