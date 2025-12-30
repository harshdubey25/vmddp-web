"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Stethoscope, Upload, Search, FileText } from "lucide-react";

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
  mobile: string;
  village: string;
  component: string;
  status: "pending" | "approved" | "selected" | "rejected";
  submittedDate: string;
  treatmentDetails?: TreatmentDetails;
  componentDetails: {
    benefits: string[];
    customQuestions: { label: string; answer: string }[];
  };
}

const mockApplications: Application[] = [
  {
    id: "VMDDP-TIA-2024-001",
    applicantName: "Ramesh Patil",
    mobile: "9876543210",
    village: "Hingna",
    component: "Treatment of Infertile Animal",
    status: "pending",
    submittedDate: "2024-12-15",
    treatmentDetails: {
      ownerFirstName: "Ramesh",
      ownerMiddleName: "Kumar",
      ownerSurname: "Patil",
      district: "Nagpur",
      taluka: "Hingna",
      village: "Hingna",
      animalType: "Buffalo",
      tagNumber: "MH-31-BF-001234",
      examinationDate: "2024-12-10",
      veterinarianName: "Dr. Suresh Kamble",
      diagnosisSymptoms: ["Anestrus", "Repeat Breeding"],
      primaryTreatment: "Hormonal Therapy",
      actualTreatment: "GnRH Protocol",
      suggestedTreatment: "Hormonal Therapy (GnRH/PGF2α)",
      treatmentGiven: "Hormonal Therapy (GnRH/PGF2α)",
      treatmentDate: "2024-12-12",
      treatmentDays: "21",
      treatmentGap: "9",
      followUpObservations: "Animal responded well to treatment. Heat signs observed after 18 days.",
      medicines: [
        {
          date: "2024-12-12",
          name: "GnRH Injection",
          batchNumber: "BTN-2024-001",
          expiryDate: "2025-12-31",
          price: "250",
        },
      ],
    },
    componentDetails: {
      benefits: [
        "Free veterinary consultation",
        "Subsidized medication",
        "Follow-up treatment support",
      ],
      customQuestions: [
        { label: "Animal Age", answer: "4 years" },
        { label: "Previous Calving", answer: "1 time" },
      ],
    },
  },
  {
    id: "VMDDP-TIA-2024-002",
    applicantName: "Suresh Jadhav",
    mobile: "9876543211",
    village: "Kamptee",
    component: "Treatment of Infertile Animal",
    status: "approved",
    submittedDate: "2024-12-14",
    treatmentDetails: {
      ownerFirstName: "Suresh",
      ownerMiddleName: "Govind",
      ownerSurname: "Jadhav",
      district: "Nagpur",
      taluka: "Kamptee",
      village: "Kamptee",
      animalType: "Cow",
      tagNumber: "MH-31-CW-005678",
      examinationDate: "2024-12-08",
      veterinarianName: "Dr. Priya Deshmukh",
      diagnosisSymptoms: ["Silent Heat", "Ovarian Cyst"],
      primaryTreatment: "CIDR Protocol",
      actualTreatment: "Progesterone + GnRH",
      suggestedTreatment: "Hormonal Therapy (GnRH/PGF2α)",
      treatmentGiven: "Hormonal Therapy (GnRH/PGF2α)",
      treatmentDate: "2024-12-10",
      treatmentDays: "14",
      treatmentGap: "7",
      followUpObservations: "Heat signs observed. Animal ready for AI.",
      medicines: [
        {
          date: "2024-12-10",
          name: "Progesterone CIDR",
          batchNumber: "BTN-2024-002",
          expiryDate: "2025-06-30",
          price: "450",
        },
      ],
    },
    componentDetails: {
      benefits: [
        "Free veterinary consultation",
        "Subsidized medication",
        "Follow-up treatment support",
      ],
      customQuestions: [
        { label: "Animal Age", answer: "5 years" },
        { label: "Previous Calving", answer: "2 times" },
      ],
    },
  },
];

export default function TreatmentPage() {
  const router = useRouter();

  const assignedZone = {
    district: "Nagpur",
    taluka: "Hingna",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications = mockApplications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">Approved</Badge>;
      case "selected":
        return <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">Selected</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (app: Application) => {
    router.push(`/subadmin/treatment/${encodeURIComponent(app.id)}`);
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
              Manage applications for {assignedZone.district} - {assignedZone.taluka}
            </p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export">
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
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Application ID</th>
                          <th className="text-left p-3 text-sm font-medium">Applicant Name</th>
                          <th className="text-left p-3 text-sm font-medium">Mobile</th>
                          <th className="text-left p-3 text-sm font-medium">Village</th>
                          <th className="text-left p-3 text-sm font-medium">Status</th>
                          <th className="text-left p-3 text-sm font-medium">Submitted</th>
                          <th className="text-left p-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((app) => (
                          <tr key={app.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 text-sm font-mono">{app.id}</td>
                            <td className="p-3 text-sm">{app.applicantName}</td>
                            <td className="p-3 text-sm">{app.mobile}</td>
                            <td className="p-3 text-sm">{app.village}</td>
                            <td className="p-3 text-sm">{getStatusBadge(app.status)}</td>
                            <td className="p-3 text-sm">{app.submittedDate}</td>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
