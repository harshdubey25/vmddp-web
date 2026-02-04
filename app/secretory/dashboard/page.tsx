"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FileText,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
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
                    
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Fodder Seeds Report
                            </CardTitle>
                            <CardDescription>
                                View detailed district-wise physical and financial achievement report for Supply of Fodder Seeds/Planting Materials
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/secretory/report">
                                <Button className="w-full sm:w-auto">
                                    View Report
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
