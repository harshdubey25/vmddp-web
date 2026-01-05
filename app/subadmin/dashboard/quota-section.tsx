"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, GraduationCap, Stethoscope, ArrowRight } from "lucide-react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { Application, TreatmentDoc } from "@/types/subadmin";

interface QuotaData {
    componentName: string;
    icon: any;
    color: string;
    quota: number;
    utilized: number;
    budget: number;
    budgetUtilized: number;
    description: string;
    route: string;
    routeParam?: string;
}

export default function QuotaSection() {
    const router = useRouter();

    const { data: treatmentTarget } = useFrappeGetDocList(
        "Target Allocation",
        {
            fields: ["name", "district", "component", "physical_target", "financial_target"],
            filters: [["component", "=", "Treatment of Infertile Animal"]],
            limit: 1,
        }
    );

    const { data: trainingTarget } = useFrappeGetDocList(
        "Target Allocation",
        {
            fields: ["name", "district", "component", "physical_target", "financial_target"],
            filters: [["component", "=", "Farmer Training"]],
            limit: 1,
        }
    );

    const { data: treatmentApplications, isLoading: treatmentLoading } = useFrappeGetDocList<TreatmentDoc>(
        "Treatment of Infertile Animal",
        {
            fields: ["name", "district", "taluka", "village"],
            filters: [["docstatus", "=", 1]],
            limit: 1000,
        }
    );

    const { data: trainingApplications, isLoading: trainingLoading } = useFrappeGetDocList<Application>(
        "Farmer Training Application",
        {
            fields: [
                "name",
                "district",
                "taluka",
                "village",
                "total_budget",
            ],
            filters: [["docstatus", "=", 1]],
            limit: 1000,
        }
    );

    const isLoading = treatmentLoading || trainingLoading;

    const treatmentCount = treatmentApplications?.length || 0;
    const treatmentBudgetUsed = treatmentCount * 2000;

    const trainingCount = trainingApplications?.length || 0;
    const trainingBudgetUsed = trainingApplications?.reduce((sum, app) => {
        return sum + (app.total_budget || 0);
    }, 0) || 0;

    const treatmentPhysicalTarget = treatmentTarget?.[0]?.physical_target || 2500;
    const treatmentFinancialTarget = treatmentTarget?.[0]?.financial_target || 5000000;
    const trainingPhysicalTarget = trainingTarget?.[0]?.physical_target || 1800;
    const trainingFinancialTarget = trainingTarget?.[0]?.financial_target || 3600000;

    const quotaData: QuotaData[] = [
        {
            componentName: "Treatment of Infertile Animal",
            icon: Stethoscope,
            color: "text-blue-600",
            quota: treatmentPhysicalTarget,
            utilized: treatmentCount,
            budget: treatmentFinancialTarget,
            budgetUtilized: treatmentBudgetUsed,
            description: "Hormonal & Traditional Treatment",
            route: "/subadmin/quota-details",
            routeParam: "",
        },
        {
            componentName: "Farmer Training",
            icon: GraduationCap,
            color: "text-green-600",
            quota: trainingPhysicalTarget,
            utilized: trainingCount,
            budget: trainingFinancialTarget, 
            budgetUtilized: trainingBudgetUsed,
            description: "Modern Dairy Practices",
            route: "/subadmin/quota-details",
            routeParam: "?tab=training",
        },
    ];

    const calculateUtilization = (utilized: number, quota: number): number => {
        if (quota === 0) return 0;
        return Math.round((utilized / quota) * 100);
    };

    const formatBudgetInLakhs = (amount: number): string => {
        return `₹${(amount / 100000).toFixed(2)}L`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">Quota-Based Services</h2>
                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                    {isLoading ? "Loading..." : "Live Data"}
                </Badge>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-2 bg-muted rounded"></div>
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-2 bg-muted rounded"></div>
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {quotaData.map((quota) => {
                        const Icon = quota.icon;
                        const physicalUtilization = calculateUtilization(quota.utilized, quota.quota);
                        const financialUtilization = calculateUtilization(quota.budgetUtilized, quota.budget);

                        return (
                            <Card
                                key={quota.componentName}
                                className="cursor-pointer hover-elevate transition-all"
                                onClick={() => router.push(quota.route + (quota.routeParam || ""))}
                                data-testid={`card-quota-${quota.componentName.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${quota.componentName === "Treatment of Infertile Animal" ? "bg-blue-100 dark:bg-blue-950/30" : "bg-green-100 dark:bg-green-950/30"} flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${quota.color}`} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{quota.componentName}</CardTitle>
                                                <CardDescription>{quota.description}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Physical Target */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Physical Target (PT)</span>
                                            <span className="font-semibold">
                                                {quota.utilized.toLocaleString()} / {quota.quota.toLocaleString()}
                                            </span>
                                        </div>
                                        <Progress value={physicalUtilization} className="h-2" />
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{(quota.quota - quota.utilized).toLocaleString()} slots remaining</span>
                                            <span>•</span>
                                            <span className="text-chart-3">{physicalUtilization}% utilized</span>
                                        </div>
                                    </div>

                                    {/* Financial Target */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Financial Target (FT)</span>
                                            <span className="font-semibold">
                                                {formatBudgetInLakhs(quota.budgetUtilized)} / {formatBudgetInLakhs(quota.budget)}
                                            </span>
                                        </div>
                                        <Progress value={financialUtilization} className="h-2" />
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{formatBudgetInLakhs(quota.budget - quota.budgetUtilized)} remaining</span>
                                            <span>•</span>
                                            <span className="text-chart-3">{financialUtilization}% utilized</span>
                                        </div>
                                    </div>

                                    {/* Warning for high utilization */}
                                    {physicalUtilization > 80 && (
                                        <div className="flex items-center gap-2 p-3 bg-chart-4/10 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-chart-4" />
                                            <span className="text-xs text-chart-4 font-medium">
                                                Quota running low - only {100 - physicalUtilization}% remaining
                                            </span>
                                        </div>
                                    )}

                                    {/* View Details Link */}
                                    <div className="flex items-center justify-end gap-1 text-sm text-primary hover:underline">
                                        <span>View Quota Details</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
