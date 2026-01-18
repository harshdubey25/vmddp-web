"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FileText, Target, ArrowRight } from "lucide-react";

const reports = [
    {
        title: "Animal Induction MPR Report",
        description: "Monthly Progress Report - Track monthly progress and submissions",
        href: "/accountant/mpr/animal-induction",
        icon: FileText,
    },
    {
        title: "HGM (Pregnant Cow) MPR Report",
        description: "Monthly Progress Report for High Genetic Merit Pregnant Heifers (IVF/ETT)",
        href: "/accountant/mpr/hgm",
        icon: FileText,
    },
    {
        title: "DBT Claims MPR Report",
        description: "Monthly Progress Report for DBT Claims components",
        href: "/accountant/mpr/dbt-claims-mpr",
        icon: FileText,
    },
    {
        title: "Target & Achievement",
        description: "View physical and financial targets vs achievements",
        href: "/accountant/target-achievement",
        icon: Target,
    },
];

export default function ReportsPage() {
    return (
        <main className="min-h-screen bg-background p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-muted-foreground">
                    Access various reports and analytics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                    <Link key={report.href} href={report.href}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <report.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {report.title}
                                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    {report.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}
