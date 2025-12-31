"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { Target, TrendingUp, IndianRupee, BarChart3 } from "lucide-react";

// Types
interface PhysicalData {
    total: number;
    [key: string]: number;
}

interface FinancialData {
    beneficiaryShare: number;
    subsidy: number;
    total: number;
}

interface ComponentTargetData {
    district: string;
    componentId: string;
    talukaCount: number;
    villageCount: number;
    physicalTarget: PhysicalData;
    physicalAchievement: PhysicalData;
    financialTarget: FinancialData;
    financialAchievement: FinancialData;
}

interface ComponentConfig {
    name: string;
    physicalLabel: string;
    columns: string[];
    isSingleCategory: boolean;
    data: ComponentTargetData[];
}

// Dummy Data
const dummyDistrictData: ComponentTargetData[] = [
    {
        district: "Indore",
        componentId: "animal-induction",
        talukaCount: 8,
        villageCount: 245,
        physicalTarget: { total: 500 },
        physicalAchievement: { total: 320 },
        financialTarget: { beneficiaryShare: 2500000, subsidy: 7500000, total: 10000000 },
        financialAchievement: { beneficiaryShare: 1600000, subsidy: 4800000, total: 6400000 },
    },
    {
        district: "Bhopal",
        componentId: "animal-induction",
        talukaCount: 6,
        villageCount: 180,
        physicalTarget: { total: 400 },
        physicalAchievement: { total: 280 },
        financialTarget: { beneficiaryShare: 2000000, subsidy: 6000000, total: 8000000 },
        financialAchievement: { beneficiaryShare: 1400000, subsidy: 4200000, total: 5600000 },
    },
    {
        district: "Jabalpur",
        componentId: "animal-induction",
        talukaCount: 7,
        villageCount: 210,
        physicalTarget: { total: 450 },
        physicalAchievement: { total: 300 },
        financialTarget: { beneficiaryShare: 2250000, subsidy: 6750000, total: 9000000 },
        financialAchievement: { beneficiaryShare: 1500000, subsidy: 4500000, total: 6000000 },
    },
    {
        district: "Gwalior",
        componentId: "animal-induction",
        talukaCount: 5,
        villageCount: 150,
        physicalTarget: { total: 350 },
        physicalAchievement: { total: 220 },
        financialTarget: { beneficiaryShare: 1750000, subsidy: 5250000, total: 7000000 },
        financialAchievement: { beneficiaryShare: 1100000, subsidy: 3300000, total: 4400000 },
    },
];

const dummyHGMData: ComponentTargetData[] = [
    {
        district: "Indore",
        componentId: "hgm",
        talukaCount: 8,
        villageCount: 245,
        physicalTarget: { total: 200 },
        physicalAchievement: { total: 150 },
        financialTarget: { beneficiaryShare: 1000000, subsidy: 3000000, total: 4000000 },
        financialAchievement: { beneficiaryShare: 750000, subsidy: 2250000, total: 3000000 },
    },
    {
        district: "Bhopal",
        componentId: "hgm",
        talukaCount: 6,
        villageCount: 180,
        physicalTarget: { total: 180 },
        physicalAchievement: { total: 130 },
        financialTarget: { beneficiaryShare: 900000, subsidy: 2700000, total: 3600000 },
        financialAchievement: { beneficiaryShare: 650000, subsidy: 1950000, total: 2600000 },
    },
];

const dummySingleCategoryData: ComponentTargetData[] = [
    {
        district: "Indore",
        componentId: "fertility",
        talukaCount: 8,
        villageCount: 245,
        physicalTarget: { total: 1000 },
        physicalAchievement: { total: 750 },
        financialTarget: { beneficiaryShare: 500000, subsidy: 1500000, total: 2000000 },
        financialAchievement: { beneficiaryShare: 375000, subsidy: 1125000, total: 1500000 },
    },
    {
        district: "Bhopal",
        componentId: "fertility",
        talukaCount: 6,
        villageCount: 180,
        physicalTarget: { total: 800 },
        physicalAchievement: { total: 600 },
        financialTarget: { beneficiaryShare: 400000, subsidy: 1200000, total: 1600000 },
        financialAchievement: { beneficiaryShare: 300000, subsidy: 900000, total: 1200000 },
    },
    {
        district: "Jabalpur",
        componentId: "fertility",
        talukaCount: 7,
        villageCount: 210,
        physicalTarget: { total: 900 },
        physicalAchievement: { total: 650 },
        financialTarget: { beneficiaryShare: 450000, subsidy: 1350000, total: 1800000 },
        financialAchievement: { beneficiaryShare: 325000, subsidy: 975000, total: 1300000 },
    },
];

const allComponentData: Record<string, ComponentConfig> = {
    "animal-induction": {
        name: "Animal Induction",
        physicalLabel: "Animals",
        columns: [],
        isSingleCategory: true,
        data: dummyDistrictData,
    },
    "hgm": {
        name: "HGM (High Genetic Merit)",
        physicalLabel: "Animals",
        columns: [],
        isSingleCategory: true,
        data: dummyHGMData,
    },
    "fertility": {
        name: "Fertility Feed",
        physicalLabel: "Beneficiaries",
        columns: [],
        isSingleCategory: true,
        data: dummySingleCategoryData,
    },
    "fatsnf": {
        name: "Fat & SNF Feed",
        physicalLabel: "Beneficiaries",
        columns: [],
        isSingleCategory: true,
        data: dummySingleCategoryData.map(d => ({ ...d, componentId: "fatsnf" })),
    },
    "silage": {
        name: "Silage Making Unit",
        physicalLabel: "Units",
        columns: [],
        isSingleCategory: true,
        data: dummySingleCategoryData.map(d => ({ ...d, componentId: "silage" })),
    },
    "chaffcutter": {
        name: "Chaff Cutter",
        physicalLabel: "Units",
        columns: [],
        isSingleCategory: true,
        data: dummySingleCategoryData.map(d => ({ ...d, componentId: "chaffcutter" })),
    },
};

export default function TargetAchievement() {
    const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
    const [selectedComponent, setSelectedComponent] = useState<string>("animal-induction");

    const currentComponent = allComponentData[selectedComponent];





    const filteredData =
        selectedDistrict === "all"
            ? currentComponent.data
            : currentComponent.data.filter((d) => d.district === selectedDistrict);

    const districts = Array.from(
        new Set(currentComponent.data.map((d) => d.district))
    );

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    const getPercentage = (achieved: number, target: number) => {
        if (target === 0) return 0;
        return Math.round((achieved / target) * 100);
    };

    const calculateTotals = (data: ComponentTargetData[]) => {
        return data.reduce(
            (acc, d) => ({
                physicalTarget: acc.physicalTarget + d.physicalTarget.total,
                physicalAchievement: acc.physicalAchievement + d.physicalAchievement.total,
                financialTarget: acc.financialTarget + d.financialTarget.total,
                financialAchievement: acc.financialAchievement + d.financialAchievement.total,
            }),
            {
                physicalTarget: 0,
                physicalAchievement: 0,
                financialTarget: 0,
                financialAchievement: 0,
            }
        );
    };

    const totals = calculateTotals(filteredData);

    const getPhysicalValue = (data: ComponentTargetData, key: string, isAchievement: boolean) => {
        if (isAchievement) {
            return data.physicalAchievement[key] || 0;
        }
        return data.physicalTarget[key] || 0;
    };

    return (
        <div className="min-h-screen bg-background overflow-y-scroll">


            <main className="overflow-auto min-h-screen">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold" data-testid="heading-target-achievement">
                                Target & Achievement
                            </h1>
                            <p className="text-muted-foreground">
                                Track physical and financial targets across all components
                            </p>
                        </div>
                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                            <SelectTrigger className="w-48" data-testid="select-district-filter">
                                <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Districts</SelectItem>
                                {districts.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card data-testid="card-physical-target">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">{currentComponent.physicalLabel} Target</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totals.physicalTarget.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Total target</p>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-physical-achievement-summary">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">{currentComponent.physicalLabel} Achievement</CardTitle>
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                    {totals.physicalAchievement.toLocaleString()}
                                </div>
                                <Progress
                                    value={getPercentage(totals.physicalAchievement, totals.physicalTarget)}
                                    className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {getPercentage(totals.physicalAchievement, totals.physicalTarget)}% achieved
                                </p>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-target">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Financial Target</CardTitle>
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totals.financialTarget)}</div>
                                <p className="text-xs text-muted-foreground">Total budget allocation</p>
                            </CardContent>
                        </Card>

                        <Card data-testid="card-financial-achievement-summary">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <CardTitle className="text-sm font-medium">Financial Achievement</CardTitle>
                                <BarChart3 className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                    {formatCurrency(totals.financialAchievement)}
                                </div>
                                <Progress
                                    value={getPercentage(totals.financialAchievement, totals.financialTarget)}
                                    className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {getPercentage(totals.financialAchievement, totals.financialTarget)}% achieved
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Component Tabs */}
                    <Tabs value={selectedComponent} onValueChange={setSelectedComponent} className="w-full">
                        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-component-selector">
                            <TabsTrigger value="animal-induction" data-testid="tab-animal-induction">Animal Induction</TabsTrigger>
                            <TabsTrigger value="hgm" data-testid="tab-hgm">HGM</TabsTrigger>
                            <TabsTrigger value="fertility" data-testid="tab-fertility">Fertility Feed</TabsTrigger>
                            <TabsTrigger value="fatsnf" data-testid="tab-fatsnf">Fat & SNF</TabsTrigger>
                            <TabsTrigger value="silage" data-testid="tab-silage">Silage</TabsTrigger>
                            <TabsTrigger value="chaffcutter" data-testid="tab-chaffcutter">Chaff Cutter</TabsTrigger>
                        </TabsList>

                        {Object.entries(allComponentData).map(([key, component]) => (
                            <TabsContent key={key} value={key} className="space-y-4">
                                {/* Component-Specific Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{component.name} - Target & Achievement</CardTitle>
                                        <CardDescription>
                                            District-wise targets and achievements for {component.name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    {component.isSingleCategory ? (
                                                        <TableRow>
                                                            <TableHead className="align-bottom">District</TableHead>
                                                            <TableHead className="text-center align-bottom border-l">Talukas</TableHead>
                                                            <TableHead className="text-center align-bottom border-l">Villages</TableHead>
                                                            <TableHead className="text-center align-bottom border-l bg-blue-50 dark:bg-blue-950/30">
                                                                Target ({component.physicalLabel})
                                                            </TableHead>
                                                            <TableHead className="text-center align-bottom border-l bg-green-50 dark:bg-green-950/30">
                                                                Achievement ({component.physicalLabel})
                                                            </TableHead>
                                                            <TableHead className="text-center border-l bg-orange-50 dark:bg-orange-950/30 text-xs">Ben. Share</TableHead>
                                                            <TableHead className="text-center bg-orange-50 dark:bg-orange-950/30 text-xs">Subsidy</TableHead>
                                                            <TableHead className="text-center bg-orange-50 dark:bg-orange-950/30 text-xs">Total (Target)</TableHead>
                                                            <TableHead className="text-center border-l bg-purple-50 dark:bg-purple-950/30 text-xs">Ben. Share</TableHead>
                                                            <TableHead className="text-center bg-purple-50 dark:bg-purple-950/30 text-xs">Subsidy</TableHead>
                                                            <TableHead className="text-center bg-purple-50 dark:bg-purple-950/30 text-xs">Total (Ach.)</TableHead>
                                                            <TableHead className="text-center bg-purple-50 dark:bg-purple-950/30 text-xs">Balance</TableHead>
                                                        </TableRow>
                                                    ) : (
                                                        <>
                                                            <TableRow>
                                                                <TableHead rowSpan={2} className="align-bottom">District</TableHead>
                                                                <TableHead rowSpan={2} className="text-center align-bottom border-l">Talukas</TableHead>
                                                                <TableHead rowSpan={2} className="text-center align-bottom border-l">Villages</TableHead>
                                                                <TableHead colSpan={component.columns.length + 1} className="text-center border-l bg-blue-50 dark:bg-blue-950/30">
                                                                    Target – Physical ({component.physicalLabel})
                                                                </TableHead>
                                                                <TableHead colSpan={component.columns.length + 1} className="text-center border-l bg-green-50 dark:bg-green-950/30">
                                                                    Achievement – Physical ({component.physicalLabel})
                                                                </TableHead>
                                                                <TableHead colSpan={3} className="text-center border-l bg-orange-50 dark:bg-orange-950/30">
                                                                    Target – Financial
                                                                </TableHead>
                                                                <TableHead colSpan={4} className="text-center border-l bg-purple-50 dark:bg-purple-950/30">
                                                                    Achievement – Financial
                                                                </TableHead>
                                                            </TableRow>
                                                            <TableRow>
                                                                {component.columns.map((col) => (
                                                                    <TableHead key={`target-${col}`} className="text-center border-l text-xs">
                                                                        {col}
                                                                    </TableHead>
                                                                ))}
                                                                <TableHead className="text-center border-l text-xs font-bold">Total</TableHead>
                                                                {component.columns.map((col) => (
                                                                    <TableHead key={`achieve-${col}`} className="text-center border-l text-xs">
                                                                        {col}
                                                                    </TableHead>
                                                                ))}
                                                                <TableHead className="text-center border-l text-xs font-bold">Total</TableHead>
                                                                <TableHead className="text-center border-l text-xs">Ben. Share</TableHead>
                                                                <TableHead className="text-center text-xs">Subsidy</TableHead>
                                                                <TableHead className="text-center text-xs">Total</TableHead>
                                                                <TableHead className="text-center border-l text-xs">Ben. Share</TableHead>
                                                                <TableHead className="text-center text-xs">Subsidy</TableHead>
                                                                <TableHead className="text-center text-xs">Total</TableHead>
                                                                <TableHead className="text-center text-xs">Balance</TableHead>
                                                            </TableRow>
                                                        </>
                                                    )}
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredData.map((row) => {
                                                        const balance = row.financialTarget.total - row.financialAchievement.total;
                                                        return (
                                                            <TableRow key={`${row.district}-${row.componentId}`} data-testid={`row-${key}-${row.district}`}>
                                                                <TableCell className="font-medium">{row.district}</TableCell>
                                                                <TableCell className="text-center border-l text-sm">
                                                                    {row.talukaCount}
                                                                </TableCell>
                                                                <TableCell className="text-center border-l text-sm">
                                                                    {row.villageCount.toLocaleString()}
                                                                </TableCell>
                                                                {component.isSingleCategory ? (
                                                                    <>
                                                                        <TableCell className="text-center border-l font-semibold text-sm">
                                                                            {row.physicalTarget.total}
                                                                        </TableCell>
                                                                        <TableCell className="text-center border-l text-green-600 font-bold text-sm">
                                                                            {row.physicalAchievement.total}
                                                                        </TableCell>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {component.columns.map((col) => {
                                                                            const colKey = col.toLowerCase();
                                                                            return (
                                                                                <TableCell key={`target-${col}`} className="text-center border-l text-sm">
                                                                                    {getPhysicalValue(row, colKey, false)}
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                        <TableCell className="text-center border-l font-semibold text-sm">
                                                                            {row.physicalTarget.total}
                                                                        </TableCell>
                                                                        {component.columns.map((col) => {
                                                                            const colKey = col.toLowerCase();
                                                                            return (
                                                                                <TableCell key={`achieve-${col}`} className="text-center border-l text-green-600 font-medium text-sm">
                                                                                    {getPhysicalValue(row, colKey, true)}
                                                                                </TableCell>
                                                                            );
                                                                        })}
                                                                        <TableCell className="text-center border-l text-green-600 font-bold text-sm">
                                                                            {row.physicalAchievement.total}
                                                                        </TableCell>
                                                                    </>
                                                                )}
                                                                <TableCell className="text-center border-l text-xs">
                                                                    {formatCurrency(row.financialTarget.beneficiaryShare)}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs">
                                                                    {formatCurrency(row.financialTarget.subsidy)}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs font-semibold">
                                                                    {formatCurrency(row.financialTarget.total)}
                                                                </TableCell>
                                                                <TableCell className="text-center border-l text-xs text-purple-600 font-medium">
                                                                    {formatCurrency(row.financialAchievement.beneficiaryShare)}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs text-purple-600 font-medium">
                                                                    {formatCurrency(row.financialAchievement.subsidy)}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs text-purple-600 font-bold">
                                                                    {formatCurrency(row.financialAchievement.total)}
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs text-muted-foreground">
                                                                    {formatCurrency(balance)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    <TableRow className="bg-muted/50 font-bold">
                                                        <TableCell>Total</TableCell>
                                                        <TableCell className="text-center border-l">
                                                            {filteredData.reduce((sum, d) => sum + d.talukaCount, 0)}
                                                        </TableCell>
                                                        <TableCell className="text-center border-l">
                                                            {filteredData.reduce((sum, d) => sum + d.villageCount, 0).toLocaleString()}
                                                        </TableCell>
                                                        {component.isSingleCategory ? (
                                                            <>
                                                                <TableCell className="text-center border-l">
                                                                    {totals.physicalTarget}
                                                                </TableCell>
                                                                <TableCell className="text-center border-l text-green-600">
                                                                    {totals.physicalAchievement}
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {component.columns.map((col) => {
                                                                    const colKey = col.toLowerCase();
                                                                    let colTotal = 0;
                                                                    filteredData.forEach((d) => {
                                                                        colTotal += getPhysicalValue(d, colKey, false);
                                                                    });
                                                                    return (
                                                                        <TableCell key={`total-target-${col}`} className="text-center border-l">
                                                                            {colTotal}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                                <TableCell className="text-center border-l">
                                                                    {totals.physicalTarget}
                                                                </TableCell>
                                                                {component.columns.map((col) => {
                                                                    const colKey = col.toLowerCase();
                                                                    let colTotal = 0;
                                                                    filteredData.forEach((d) => {
                                                                        colTotal += getPhysicalValue(d, colKey, true);
                                                                    });
                                                                    return (
                                                                        <TableCell key={`total-achieve-${col}`} className="text-center border-l text-green-600">
                                                                            {colTotal}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                                <TableCell className="text-center border-l text-green-600">
                                                                    {totals.physicalAchievement}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                        <TableCell className="text-center border-l text-xs">
                                                            {formatCurrency(
                                                                filteredData.reduce((sum, d) => sum + d.financialTarget.beneficiaryShare, 0)
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            {formatCurrency(
                                                                filteredData.reduce((sum, d) => sum + d.financialTarget.subsidy, 0)
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs">
                                                            {formatCurrency(totals.financialTarget)}
                                                        </TableCell>
                                                        <TableCell className="text-center border-l text-xs text-purple-600">
                                                            {formatCurrency(
                                                                filteredData.reduce((sum, d) => sum + d.financialAchievement.beneficiaryShare, 0)
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-purple-600">
                                                            {formatCurrency(
                                                                filteredData.reduce((sum, d) => sum + d.financialAchievement.subsidy, 0)
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-purple-600">
                                                            {formatCurrency(totals.financialAchievement)}
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs text-muted-foreground">
                                                            {formatCurrency(totals.financialTarget - totals.financialAchievement)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Info Note */}
                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-100">
                                        Auto-updating Values
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Achievement values are automatically updated when DD Collection, Component
                                        Allocation, Payments & DBT, or Refunds are processed. Admin can edit
                                        district-wise targets from the Admin Dashboard.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
