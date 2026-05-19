"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, Stethoscope, Upload, Search, FileText, Loader2 } from "lucide-react";
import { TreatmentDoc } from "@/types/subadmin";
import AccountantTreatmentReviewDialog from "@/components/AccountantTreatmentReviewDialog";

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
  treatment_date: string;
  tag_number: string;
  animal_type: string;
  treatmentDetails?: TreatmentDetails;
  componentDetails: {
    benefits: string[];
    customQuestions: { label: string; answer: string }[];
  };
  docstatus: number;
  inreview: number;
}



export default function TreatmentPage() {
  const router = useRouter();

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"application" | "review">("application");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;




  const { data: frappeDistricts } = useFrappeGetDocList("District Master", {
    fields: ["name1"],
    limit: 100,
  });

  const {
    data: treatmentApplications,
    isLoading,
    error,
    mutate: mutateTreatmentApplications,
  } = useFrappeGetDocList<TreatmentDoc>(
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
        "inreview",
      ],
      orderBy: {
        field: "creation",
        order: "desc",
      },
    }
  );

  const { data: reviewCountData } = useFrappeGetDocCount(
    "Treatment of Infertile Animal",
    [
      ["inreview", "=", 1],
      ["docstatus", "!=", 2],
    ]
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
    treatment_date: doc.treatment_date || "-",
    tag_number: doc.tag_number || "-",
    animal_type: doc.animal_type,
    componentDetails: {
      benefits: [],
      customQuestions: [],
    },
    docstatus: doc.docstatus,
    inreview: doc.inreview,
  }));


  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.aadharNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const submittedDate = new Date(app.submittedDate.split('/').reverse().join('-'));
    const matchesFrom = !fromDate || submittedDate >= new Date(fromDate);
    const matchesTo = !toDate || submittedDate <= new Date(toDate);
    const matchesDistrict = districtFilter === "all" || app.district === districtFilter;
    const matchesStatus =
      statusFilter === "all"
        ? app.docstatus !== 2
        : app.docstatus.toString() === statusFilter;

    const matchesTab =
      activeTab === "application" ? app.inreview !== 1 : app.inreview === 1;
    return matchesSearch && matchesFrom && matchesTo && matchesDistrict && matchesStatus && matchesTab;
  });

  const totalRecords = filteredApplications.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);


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
        'Training ID': app.id,
        'Applicant Name': app.applicantName,
        'Animal Type': app.animal_type || '-',
        'Tag Number': app.tag_number || '-',
        'Aadhar Number': app.aadharNumber || '-',
        'District': app.district,
        'Taluka': app.taluka,
        'Village': app.village,
        'Treatment Date': app.treatment_date || '-',
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
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-treatment-title">
              <AccountantTreatmentReviewDialog
                applicationId={selectedApplicationId}
                open={isReviewOpen}
                onOpenChange={(open) => {
                  setIsReviewOpen(open);
                  if (!open) setSelectedApplicationId(null);
                }}
                canApprove={true}
                onApproved={async () => {
                  await mutateTreatmentApplications();
                  router.refresh();
                }}
              />
              <Stethoscope className="w-6 h-6" />
              Treatment of Infertile Animal
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage applications
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
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Treatment Applications</h2>
                    <p className="text-sm text-muted-foreground">
                      Total {filteredApplications.length} applications
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={activeTab === "application" ? "default" : "outline"}
                      onClick={() => {
                        setActiveTab("application");
                        setCurrentPage(1);
                      }}
                    >
                      Applications
                    </Button>

                    <Button
                      variant={activeTab === "review" ? "default" : "outline"}
                      onClick={() => {
                        setActiveTab("review");
                        setCurrentPage(1);
                      }}
                    >
                      In Review
                      {reviewCountData && reviewCountData > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {reviewCountData}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID or name..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">From Date</label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                      data-testid="input-from-date"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">To Date</label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                      data-testid="input-to-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">District</label>
                    <Select value={districtFilter} onValueChange={(value) => { setDistrictFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger data-testid="select-district-filter">
                        <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {(frappeDistricts || []).map((d) => (
                          <SelectItem key={d.name1} value={d.name1}>{d.name1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="0">Draft</SelectItem>
                        <SelectItem value="1">Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end">
                    {(searchQuery || fromDate || toDate || districtFilter !== "all" || statusFilter !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setSearchQuery("");
                          setFromDate("");
                          setToDate("");
                          setDistrictFilter("all");
                          setStatusFilter("all");
                          setCurrentPage(1);
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
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
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-muted sticky top-0 z-30 border-b">
                          <tr>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium w-12">#</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Training ID</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Applicant Name</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Animal Type</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Tag Number</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Aadhar Number</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">District</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Taluka</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Village</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Status</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Treatment Date</th>
                            <th className="text-left p-3 text-xs sm:text-sm font-medium">Actions</th>

                          </tr>
                        </thead>
                        <tbody>
                          {paginatedApplications.map((app, index) => (
                            <tr key={`${app.id}-${index}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-xs sm:text-sm text-muted-foreground">{startIndex + index + 1}</td>
                              <td className="p-3 text-xs sm:text-sm font-mono">{app.id}</td>
                              <td className="p-3 text-xs sm:text-sm font-medium">{app.applicantName}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.animal_type}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.tag_number}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.aadharNumber || "-"}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.district}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.taluka}</td>
                              <td className="p-3 text-xs sm:text-sm">{app.village}</td>
                              <td className="p-3 text-xs sm:text-sm">
                                <span className="inline-flex rounded-full bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {app.docstatus === 0 ? "Draft" : app.docstatus === 1 ? "Submitted" : "Cancelled"}
                                </span>
                              </td>
                              <td className="p-3 text-xs sm:text-sm text-muted-foreground">{app.treatment_date}</td>
                              <td className="p-3 text-xs sm:text-sm">
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

                {/* Pagination */}
                {totalPages > 1 && paginatedApplications.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {paginatedApplications.length} of {totalRecords} records • Page {currentPage} of {totalPages}
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
