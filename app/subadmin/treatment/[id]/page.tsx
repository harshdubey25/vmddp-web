"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MapPin, User, Stethoscope, Pill } from "lucide-react";

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

export default function ViewTreatmentApplication() {
  const router = useRouter();
  const params = useParams();

  const applicationId = params?.id ? decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const application = useMemo(
    () => mockApplications.find((app) => app.id === applicationId),
    [applicationId]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Approved</Badge>;
      case "selected":
        return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Selected</Badge>;
      case "rejected":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!application) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Application not found</p>
              <Button onClick={() => router.push("/subadmin/treatment")}>
                Back to Applications
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/subadmin/treatment")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                <FileText className="w-6 h-6" />
                Application Details
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-app-id">{application.id}</p>
            </div>
          </div>
          {getStatusBadge(application.status)}
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-4xl">
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-mono font-semibold text-lg" data-testid="text-application-id">{application.id}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-submitted-date">Submitted on {application.submittedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Applicant</p>
                    <p className="font-semibold" data-testid="text-applicant-name">{application.applicantName}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-mobile">{application.mobile}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {application.treatmentDetails && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">District</p>
                        <p className="font-medium">{application.treatmentDetails.district}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taluka</p>
                        <p className="font-medium">{application.treatmentDetails.taluka}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Village</p>
                        <p className="font-medium">{application.treatmentDetails.village}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Owner Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Owner Name</p>
                        <p className="font-medium">
                          {application.treatmentDetails.ownerFirstName} {application.treatmentDetails.ownerMiddleName} {application.treatmentDetails.ownerSurname}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Animal Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Animal Type</p>
                        <p className="font-medium">{application.treatmentDetails.animalType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tag Number</p>
                        <p className="font-mono font-medium">{application.treatmentDetails.tagNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Examination Date</p>
                        <p className="font-medium">{application.treatmentDetails.examinationDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Veterinarian</p>
                        <p className="font-medium">{application.treatmentDetails.veterinarianName}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Diagnosis & Treatment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {application.treatmentDetails.diagnosisSymptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="outline">{symptom}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Primary Treatment</p>
                        <p className="font-medium">{application.treatmentDetails.primaryTreatment}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Treatment Date</p>
                        <p className="font-medium">{application.treatmentDetails.treatmentDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Follow-up Observations</p>
                      <p className="font-medium mt-1">{application.treatmentDetails.followUpObservations}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medicines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {application.treatmentDetails.medicines && application.treatmentDetails.medicines.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Date</th>
                              <th className="text-left p-3 text-sm font-medium">Medicine Name</th>
                              <th className="text-left p-3 text-sm font-medium">Batch Number</th>
                              <th className="text-left p-3 text-sm font-medium">Expiry Date</th>
                              <th className="text-left p-3 text-sm font-medium">Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {application.treatmentDetails.medicines.map((medicine, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="p-3 text-sm">{medicine.date}</td>
                                <td className="p-3 text-sm">{medicine.name}</td>
                                <td className="p-3 text-sm font-mono">{medicine.batchNumber}</td>
                                <td className="p-3 text-sm">{medicine.expiryDate}</td>
                                <td className="p-3 text-sm">₹{medicine.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No medicines recorded</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
