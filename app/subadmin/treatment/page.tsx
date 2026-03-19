"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList, useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Stethoscope, Upload, Search, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AccountantTreatmentReviewDialog from "@/components/AccountantTreatmentReviewDialog";
import { TreatmentDoc } from "@/types/subadmin";
import { cn } from "@/lib/utils";


interface TreatmentDetails {
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSurname: string;
  district: string;
  taluka: string;
  village: string;
  animalType: string;
  tagNumber: string;
  examinationDate: string;
  veterinarianName: string;
  diagnosisSymptoms: string[];
  primaryTreatment: string;
  actualTreatment: string;
  suggestedTreatment: string;
  treatmentGiven: string;
  treatmentDate: string;
  treatmentDays: string;
  treatmentGap: string;
  followUpObservations: string;
  medicines: {
    date: string;
    name: string;
    batchNumber: string;
    expiryDate: string;
    price: string;
  }[];
}

interface Application {
  id: string;
  applicantName: string;
  aadharNumber?: string;
  district: string;
  taluka: string;
  village: string;
  component: string;
  submittedDate: string;
  treatmentDetails?: TreatmentDetails;
  componentDetails: {
    benefits: string[];
    customQuestions: { label: string; answer: string }[];
  };
  docstatus: number;
}



export default function TreatmentPage() {
  const router = useRouter();
  const { currentUser } = useFrappeAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { toast } = useToast();

  const { data: dpoData } = useFrappeGetDoc("DPO", currentUser || undefined);
  const assignedDistrict = dpoData?.district;

  const { data: treatmentApplications, isLoading, error } = useFrappeGetDocList<TreatmentDoc>(
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
        "animal_type",
        "tag_number",
        "examination_date",
        "veterinarian_name",
        "treatment_date",
        "suggested_treatment",
        "treatment_given",
        "primary_treatment",
        "actual_treatment_outcome",
        "docstatus",
        "creation",
        "modified",

      ],
      filters: assignedDistrict ? [["district", "=", assignedDistrict]] : [],
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
    componentDetails: {
      benefits: [],
      customQuestions: [],
    },
    docstatus: doc.docstatus,
  }));


  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.aadharNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.docstatus.toString() === statusFilter;
    return matchesSearch && matchesStatus;
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
        'Component': app.component,
        'Submitted Date': app.submittedDate,
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
      const filename = `treatment-applications-${date}.xlsx`;

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
              Treatment of Infertile Animal
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage applications for- {assignedDistrict} District
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
                    <h2 className="text-lg font-semibold">Treatment Applications</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total {filteredApplications.length} applications found
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => router.push("/subadmin/treatment-form")}
                    data-testid="button-create-application"
                  >
                    <Upload className="w-3 h-3" />
                    Create New Application
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="0">Draft</SelectItem>
                      <SelectItem value="1">Submitted</SelectItem>
                      <SelectItem value="2">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading applications...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-12 text-destructive">
                    <p>Error loading applications. Please try again.</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p>No applications found.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-30 border-b">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Application ID</th>
                            <th className="text-left p-3 text-sm font-medium">Applicant Name</th>
                            <th className="text-left p-3 text-sm font-medium">Aadhar Number</th>
                            <th className="text-left p-3 text-sm font-medium">District</th>
                            <th className="text-left p-3 text-sm font-medium">Taluka</th>
                            <th className="text-left p-3 text-sm font-medium">Village</th>
                            <th className="text-left p-3 text-sm font-medium">Submitted Date</th>
                            <th className="text-left p-3 text-sm font-medium">Status</th>
                            <th className="text-left p-3 text-sm font-medium">Actions</th>

                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map((app, index) => (
                            <tr key={`${app.id}-${index}`} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-sm font-mono">{app.id}</td>
                              <td className="p-3 text-sm font-medium">{app.applicantName}</td>
                              <td className="p-3 text-sm">{app.aadharNumber || "-"}</td>
                              <td className="p-3 text-sm">{app.district}</td>
                              <td className="p-3 text-sm">{app.taluka}</td>
                              <td className="p-3 text-sm">{app.village}</td>
                              <td className="p-3 text-sm text-muted-foreground">{app.submittedDate}</td>
                              <td className="p-3 text-sm">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    app.docstatus === 0 && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                    app.docstatus === 1 && "bg-green-50 text-green-700 border-green-200",
                                    app.docstatus === 2 && "bg-red-50 text-red-700 border-red-200"
                                  )}
                                >
                                  {app.docstatus === 0 ? "Draft" : app.docstatus === 1 ? "Submitted" : "Cancelled"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(app)}
                                  data-testid="button-view-details"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  View
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
        canApprove={false}
      />
    </div>
  );
}
