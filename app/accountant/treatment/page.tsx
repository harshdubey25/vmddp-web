"use client";

import { useState } from "react";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Stethoscope, Search, FileText, Loader2 } from "lucide-react";
import AccountantTreatmentReviewDialog from "@/components/AccountantTreatmentReviewDialog";
import { TreatmentDoc } from "@/types/subadmin";

interface Application {
    id: string;
    applicantName: string;
    aadharNumber?: string;
    district: string;
    taluka: string;
    village: string;
    component: string;
    submittedDate: string;
    docstatus: number;
}

export default function AccountantTreatmentPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("0");
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const { data: treatmentApplications, isLoading, error, mutate } = useFrappeGetDocList<TreatmentDoc>(
        "Treatment of Infertile Animal",
        {
            fields: [
                "name",
                "first_name",
                "middle_name",
                "surname",
                "aadhar_number",
                "district",
                "taluka",
                "village",
                "docstatus",
                "creation",
            ],
            filters: statusFilter === "all" ? [] : [["docstatus", "=", parseInt(statusFilter)]],
            orderBy: {
                field: "creation",
                order: "desc",
            },
        }
    );

    const applications: Application[] = (treatmentApplications || []).map((doc) => ({
        id: doc.name,
        applicantName: `${doc.first_name} ${doc.middle_name ? doc.middle_name + " " : ""}${doc.surname}`,
        aadharNumber: doc.aadhar_number,
        district: doc.district,
        taluka: doc.taluka,
        village: doc.village,
        component: "Treatment of Infertile Animal",
        submittedDate: doc.creation ? new Date(doc.creation).toLocaleDateString("en-GB") : "",
        docstatus: doc.docstatus || 0,
    }));

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.aadharNumber && app.aadharNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const handleViewDetails = (app: Application) => {
        setSelectedApplicationId(app.id);
        setIsReviewOpen(true);
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
                'Application ID': app.id,
                'Applicant Name': app.applicantName,
                'Aadhar Number': app.aadharNumber || '-',
                'District': app.district,
                'Taluka': app.taluka,
                'Village': app.village,
                'Submitted Date': app.submittedDate,
                'Status': app.docstatus === 0 ? 'Draft' : app.docstatus === 1 ? 'Submitted' : 'Cancelled',
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
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Treatment Applications');

            const date = new Date().toISOString().split('T')[0];
            const filename = `accountant-treatment-applications-${date}.xlsx`;

            XLSX.writeFile(workbook, filename);

            toast({
                title: "Export successful",
                description: `Exported ${filteredApplications.length} applications.`,
            });
        } catch {
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
                        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-treatment-title">
                            <Stethoscope className="w-6 h-6" />
                            Treatment Review
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Review and approve infertile animal treatment applications
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2" data-testid="button-export" onClick={handleExport}>
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
                                            placeholder="Search by ID, name, or village..."
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
                                ) : filteredApplications.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No applications found.
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden flex flex-col">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                                            <table className="w-full">
                                                <thead className="bg-muted sticky top-0 z-30 border-b">
                                                    <tr>
                                                        <th className="text-left p-3 text-sm font-medium">Application ID</th>
                                                        <th className="text-left p-3 text-sm font-medium">Applicant Name</th>
                                                        <th className="text-left p-3 text-sm font-medium">District</th>
                                                        <th className="text-left p-3 text-sm font-medium">Taluka</th>
                                                        <th className="text-left p-3 text-sm font-medium">Village</th>
                                                        <th className="text-left p-3 text-sm font-medium">Status</th>
                                                        <th className="text-left p-3 text-sm font-medium">Date</th>
                                                        <th className="text-left p-3 text-sm font-medium">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredApplications.map((app) => (
                                                        <tr key={app.id} className="border-b hover:bg-muted/30">
                                                            <td className="p-3 text-sm font-mono">{app.id}</td>
                                                            <td className="p-3 text-sm font-medium">{app.applicantName}</td>
                                                            <td className="p-3 text-sm">{app.district}</td>
                                                            <td className="p-3 text-sm">{app.taluka}</td>
                                                            <td className="p-3 text-sm">{app.village}</td>
                                                            <td className="p-3 text-sm">
                                                                {app.docstatus === 0 ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Draft</span>
                                                                ) : app.docstatus === 1 ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Submitted</span>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Cancelled</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-sm">{app.submittedDate}</td>
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

            <AccountantTreatmentReviewDialog
                applicationId={selectedApplicationId}
                open={isReviewOpen}
                onOpenChange={(open) => {
                    setIsReviewOpen(open);
                    if (!open) {
                        setSelectedApplicationId(null);
                    }
                }}
                onApproved={async () => {
                    await mutate();
                }}
            />
        </div>
    );
}
