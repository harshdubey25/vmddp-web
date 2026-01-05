"use client";

import { useRouter, useParams } from "next/navigation";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MapPin, User, Stethoscope, Pill, Loader2 } from "lucide-react";

interface TreatmentDoc {
  name: string;
  first_name: string;
  middle_name?: string;
  surname: string;
  aadhar_number?: string;
  village: string;
  creation: string;
  district: string;
  taluka: string;
  animal_type: string;
  tag_number: string;
  examination_date?: string;
  veterinarian_name?: string;
  symptom?: Array<{ symtomp: string }>;
  primary_treatment?: string;
  actual_treatment_outcome?: string;
  suggested_treatment?: string;
  treatment_given?: string;
  treatment_date?: string;
  follow_up_observations?: string;
  medicine?: Array<{
    date?: string;
    medicine_name?: string;
    batch_number?: string;
    expiry_date?: string;
    price?: number;
  }>;
}

export default function ViewTreatmentApplication() {
  const router = useRouter();
  const params = useParams();

  const applicationId = params?.id ? decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const { data: treatmentDoc, isLoading, error } = useFrappeGetDoc<TreatmentDoc>(
    "Treatment of Infertile Animal",
    applicationId || "",
    applicationId ? undefined : null 
  );

  const application = treatmentDoc ? {
      id: treatmentDoc.name,
      applicantName: `${treatmentDoc.first_name} ${treatmentDoc.middle_name ? treatmentDoc.middle_name + " " : ""}${treatmentDoc.surname}`,
      aadharNumber: treatmentDoc.aadhar_number || "-",
      village: treatmentDoc.village,
      component: "Treatment of Infertile Animal",
      submittedDate: treatmentDoc.creation ? new Date(treatmentDoc.creation).toLocaleDateString("en-GB") : "",
      treatmentDetails: {
        ownerFirstName: treatmentDoc.first_name,
        ownerMiddleName: treatmentDoc.middle_name || "",
        ownerSurname: treatmentDoc.surname,
        district: treatmentDoc.district,
        taluka: treatmentDoc.taluka,
        village: treatmentDoc.village,
        animalType: treatmentDoc.animal_type,
        tagNumber: treatmentDoc.tag_number,
        examinationDate: treatmentDoc.examination_date || "-",
        veterinarianName: treatmentDoc.veterinarian_name || "-",
        diagnosisSymptoms: treatmentDoc.symptom ? treatmentDoc.symptom.map((s: any) => s.symtomp) : [],
        primaryTreatment: treatmentDoc.primary_treatment || "-",
        actualTreatment: treatmentDoc.actual_treatment_outcome || "-",
        suggestedTreatment: treatmentDoc.suggested_treatment || "-",
        treatmentGiven: treatmentDoc.treatment_given || "-",
        treatmentDate: treatmentDoc.treatment_date || "-",
        treatmentDays: "-",
        treatmentGap: "-",
        followUpObservations: treatmentDoc.follow_up_observations || "-",
        medicines: treatmentDoc.medicine ? treatmentDoc.medicine.map((m: any) => ({
          date: m.date || "-",
          name: m.medicine_name || "-",
          batchNumber: m.batch_number || "-",
          expiryDate: m.expiry_date || "-",
          price: m.price ? m.price.toString() : "0",
        })) : [],
      },
      componentDetails: {
        benefits: [],
        customQuestions: [],
      },
    }
  : null;
  console.log('application', application)

  if (isLoading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Loading application details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error ? "Error loading application" : "Application not found"}
              </p>
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
                    <p className="text-sm text-muted-foreground" data-testid="text-mobile">{application.aadharNumber}</p>
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
                        {application.treatmentDetails.diagnosisSymptoms.length > 0 ? (
                          application.treatmentDetails.diagnosisSymptoms.map((symptom: string, idx: number) => (
                            <Badge key={idx} variant="outline">{symptom}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No symptoms recorded</p>
                        )}
                        
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
                            {application.treatmentDetails.medicines.map((medicine: { date: string; name: string; batchNumber: string; expiryDate: string; price: string; }, idx: number) => (
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
