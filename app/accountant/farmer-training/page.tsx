"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList, useFrappeAuth } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, GraduationCap, Search, FileText, Loader2 } from "lucide-react";
import { Application } from "@/types/subadmin";

export default function AccountantFarmerTraining() {
    const router = useRouter();
    const { toast } = useToast();
    const { currentUser } = useFrappeAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("0");

    const { data: applications, isLoading, error } = useFrappeGetDocList<Application>("Farmer Training Application", {
        fields: [
            "name",
            "event_name",
            "event_date",
            "district",
            "taluka",
            "village",
            "venue_name",
            "venue_type",
            "number_of_participants",
            "no_of_male",
            "no_of_female",
            "training_material",
            "logistics",
            "refreshment",
            "docstatus",
            "creation"
        ],
        filters: statusFilter === "all" ? [] : [["docstatus", "=", parseInt(statusFilter)]],
        orderBy: {
            field: "creation",
            order: "desc"
        },
        limit: 1000,
    });

    const filteredApplications = (applications || []).filter((app) => {
        const matchesSearch =
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.district.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleViewDetails = (app: Application) => {
        router.push(`/accountant/farmer-training/${encodeURIComponent(app.name)}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTotalBudget = (app: Application) => {
        return (app.training_material || 0) + (app.logistics || 0) + (app.refreshment || 0);
    };

    const handleExport = async () => {
        if (!filteredApplications || filteredApplications.length === 0) {
            toast({
                title: "No data",
                description: "There are no applications to export.",
                variant: "destructive",
            });
            return;
        }

        try {
            const XLSX = await import('xlsx');

            const exportData = filteredApplications.map(app => ({
                'Application ID': app.name,
                'Event Name': app.event_name,
                'Event Date': new Date(app.event_date).toLocaleDateString('en-GB'),
                'District': app.district,
                'Taluka': app.taluka,
                'Village': app.village,
                'Venue Type': app.venue_type,
                'Venue Name': app.venue_name,
                'Participants': app.number_of_participants,
                'Training Material': formatCurrency(app.training_material || 0),
                'Logistics': formatCurrency(app.logistics || 0),
                'Refreshment': formatCurrency(app.refreshment || 0),
                'Total Budget': formatCurrency(getTotalBudget(app)),
                'Status': app.docstatus === 0 ? 'Draft' : app.docstatus === 1 ? 'Submitted' : 'Cancelled',
                'Created On': new Date(app.creation).toLocaleDateString('en-GB'),
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);

            const headers = Object.keys(exportData[0]);
            const colWidths = headers.map(header => {
                const maxLength = Math.max(
                    header.length,
                    ...exportData.map(row => String(row[header as keyof typeof row] || '').length)
                );
                return { wch: maxLength + 2 };
            });
            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmer Training');

            const date = new Date().toISOString().split('T')[0];
            const filename = `accountant-farmer-training-${date}.xlsx`;

            XLSX.writeFile(workbook, filename);

            toast({
                title: "Export successful",
                description: `Exported ${filteredApplications.length} applications.`,
            });
        } catch (error) {
            toast({
                title: "Export failed",
                description: "Failed to export applications. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b bg-card">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-accountant-farmer-training-title">
                            <GraduationCap className="w-6 h-6" />
                            Farmer Training Review
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and approve training applications
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-muted/30">
                    <div className="space-y-6 max-w-7xl">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">Applications for Review</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Total {filteredApplications.length} applications found
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Status:</span>
                                        <select
                                            className="bg-background border rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="0">Draft (Pending Review)</option>
                                            <option value="1">Submitted (Approved)</option>
                                            <option value="2">Cancelled</option>
                                            <option value="all">All</option>
                                        </select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by ID, event name, or district..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                            data-testid="input-search"
                                        />
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-12 text-destructive">
                                        Error loading applications. Please try again.
                                    </div>
                                ) : filteredApplications && filteredApplications.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No applications found matching the criteria.
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden flex flex-col">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                            <table className="w-full">
                                                <thead className="bg-muted sticky top-0 z-30 border-b">
                                                    <tr>
                                                        <th className="text-left p-3 text-sm font-medium">Application ID</th>
                                                        <th className="text-left p-3 text-sm font-medium">Event Name</th>
                                                        <th className="text-left p-3 text-sm font-medium">District</th>
                                                        <th className="text-left p-3 text-sm font-medium">Date</th>
                                                        <th className="text-left p-3 text-sm font-medium">Participants</th>
                                                        <th className="text-left p-3 text-sm font-medium">Total Budget</th>
                                                        <th className="text-left p-3 text-sm font-medium">Status</th>
                                                        <th className="text-left p-3 text-sm font-medium">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredApplications.map((app) => (
                                                        <tr key={app.name} className="border-b hover:bg-muted/30">
                                                            <td className="p-3 text-sm font-mono">{app.name}</td>
                                                            <td className="p-3 text-sm">{app.event_name}</td>
                                                            <td className="p-3 text-sm">{app.district}</td>
                                                            <td className="p-3 text-sm">{new Date(app.event_date).toLocaleDateString()}</td>
                                                            <td className="p-3 text-sm">{app.number_of_participants}</td>
                                                            <td className="p-3 text-sm font-semibold">{formatCurrency(getTotalBudget(app))}</td>
                                                            <td className="p-3 text-sm">
                                                                {app.docstatus === 0 ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Draft</span>
                                                                ) : app.docstatus === 1 ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Submitted</span>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Cancelled</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-sm">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewDetails(app)}
                                                                    data-testid="button-view-details"
                                                                >
                                                                    <FileText className="w-4 h-4 mr-1" />
                                                                    Review
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
