"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Stethoscope,
    GraduationCap,
    Users,
    Target,
    Wallet,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFrappeAuth, useFrappeGetDoc, useFrappeGetCall } from "frappe-react-sdk";
import { Application, TreatmentDoc } from "@/types/subadmin";

export default function QuotaDetails() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>("infertile");

    const { currentUser } = useFrappeAuth();

    const { data: dpoData, isLoading } = useFrappeGetDoc("DPO", currentUser || undefined);

    const { data: quotaSummary, isLoading: summaryLoading } = useFrappeGetCall<{
        treatment: {
            count: number;
            budget_used: number;
            physical_target: number;
            financial_target: number;
        };
        training: {
            count: number;
            budget_used: number;
            physical_target: number;
            financial_target: number;
        };
    }>("vmddp_app.vmddp.api.quota_summary.get_quota_summary", {
        district: dpoData?.district || undefined
    });

    const assignedZone = dpoData;

    const infertileQuota = {
        districtName: assignedZone?.district || "",
        quota: quotaSummary?.treatment?.physical_target || 0,
        utilized: quotaSummary?.treatment?.count || 0,
        budget: quotaSummary?.treatment?.financial_target || 0,
        budgetUtilized: quotaSummary?.treatment?.budget_used || 0,
    };

    const trainingQuota = {
        districtName: assignedZone?.district || "",
        quota: quotaSummary?.training?.physical_target || 0,
        utilized: quotaSummary?.training?.count || 0,
        budget: quotaSummary?.training?.financial_target || 0,
        budgetUtilized: quotaSummary?.training?.budget_used || 0,
    };

    const currentQuota = activeTab === "infertile" ? infertileQuota : trainingQuota;
    const serviceName = activeTab === "infertile" ? "Treatment of Infertile Animal" : "Farmer Training";

    const calculateUtilization = (utilized: number, quota: number): number => {
        if (quota === 0) return 0;
        return Math.round((utilized / quota) * 100);
    };

    const formatBudgetInLakhs = (amount: number): string => {
        return `₹${(amount / 100000).toFixed(2)}L`;
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/subadmin/dashboard")}
                            data-testid="button-back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Quota & Target Details</h1>
                            <p className="text-sm text-muted-foreground">
                                {assignedZone?.district} District - Real-time breakdown
                            </p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md">
                                <TabsTrigger value="infertile" className="flex items-center gap-2" data-testid="tab-infertile">
                                    <Stethoscope className="w-4 h-4" />
                                    Infertile Animal
                                </TabsTrigger>
                                <TabsTrigger value="training" className="flex items-center gap-2" data-testid="tab-training">
                                    <GraduationCap className="w-4 h-4" />
                                    Farmer Training
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-6 space-y-6">
                                {currentQuota && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                                                            <Target className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Physical Target</p>
                                                            <p className="text-xl font-bold">{currentQuota.quota.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Achieved</p>
                                                            <p className="text-xl font-bold">{currentQuota.utilized.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                                            <Wallet className="w-5 h-5 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Financial Target</p>
                                                            <p className="text-xl font-bold">{formatBudgetInLakhs(currentQuota.budget)}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                                                            <Wallet className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Utilized</p>
                                                            <p className="text-xl font-bold">{formatBudgetInLakhs(currentQuota.budgetUtilized)}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">District Summary - {currentQuota.districtName}</CardTitle>
                                                <CardDescription>{serviceName}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Physical Target (PT)</span>
                                                        <span className="font-semibold">
                                                            {currentQuota.utilized.toLocaleString()} / {currentQuota.quota.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <Progress value={calculateUtilization(currentQuota.utilized, currentQuota.quota)} className="h-3" />
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">
                                                            {(currentQuota.quota - currentQuota.utilized).toLocaleString()} remaining
                                                        </span>
                                                        <span className="font-medium text-chart-3">
                                                            {calculateUtilization(currentQuota.utilized, currentQuota.quota)}% utilized
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Financial Target (FT)</span>
                                                        <span className="font-semibold">
                                                            {formatBudgetInLakhs(currentQuota.budgetUtilized)} / {formatBudgetInLakhs(currentQuota.budget)}
                                                        </span>
                                                    </div>
                                                    <Progress value={calculateUtilization(currentQuota.budgetUtilized, currentQuota.budget)} className="h-3" />
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">
                                                            {formatBudgetInLakhs(currentQuota.budget - currentQuota.budgetUtilized)} remaining
                                                        </span>
                                                        <span className="font-medium text-chart-3">
                                                            {calculateUtilization(currentQuota.budgetUtilized, currentQuota.budget)}% utilized
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="cursor-pointer hover:shadow-lg transition-all border-primary/30" 
                                              onClick={() => router.push(activeTab === "infertile" ? "/subadmin/treatment" : "/subadmin/farmer-training")}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            {activeTab === "infertile" ? (
                                                                <Stethoscope className="w-6 h-6 text-primary" />
                                                            ) : (
                                                                <GraduationCap className="w-6 h-6 text-primary" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-semibold">View All Applications</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                See detailed list of {serviceName.toLowerCase()} applications
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
