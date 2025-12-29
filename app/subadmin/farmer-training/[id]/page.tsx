"use client";

export const runtime = 'edge';

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, GraduationCap, MapPin, Building, Users, Image, IndianRupee } from "lucide-react";

interface FundAllocation {
  trainingMaterial: number;
  logistics: number;
  refreshment: number;
  totalBudget: number;
}

interface Application {
  id: string;
  eventName: string;
  eventDate: string;
  district: string;
  taluka: string;
  village: string;
  trainingVenueType: string;
  venueName: string;
  numberOfParticipants: number;
  participantImages: string[];
  fundAllocation: FundAllocation;
  status: "pending" | "approved" | "completed" | "rejected";
  submittedDate: string;
}

const EXPENSE_PER_HEAD = 360;

const mockApplications: Application[] = [
  {
    id: "VMDDP-FT-2024-001",
    eventName: "Dairy Management Training",
    eventDate: "2024-12-20",
    district: "Nagpur",
    taluka: "Hingna",
    village: "Hingna",
    trainingVenueType: "govt. institute",
    venueName: "Krishi Vigyan Kendra, Nagpur",
    numberOfParticipants: 25,
    participantImages: [
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+1",
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+2",
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+3",
    ],
    fundAllocation: {
      trainingMaterial: 3000,
      logistics: 2500,
      refreshment: 2000,
      totalBudget: 25 * EXPENSE_PER_HEAD,
    },
    status: "pending",
    submittedDate: "2024-12-15",
  },
  {
    id: "VMDDP-FT-2024-002",
    eventName: "Cattle Breeding Workshop",
    eventDate: "2024-12-18",
    district: "Nagpur",
    taluka: "Kamptee",
    village: "Kamptee",
    trainingVenueType: "private Farms",
    venueName: "Sharma Dairy Farm",
    numberOfParticipants: 20,
    participantImages: [
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+1",
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+2",
    ],
    fundAllocation: {
      trainingMaterial: 2500,
      logistics: 2000,
      refreshment: 1800,
      totalBudget: 20 * EXPENSE_PER_HEAD,
    },
    status: "approved",
    submittedDate: "2024-12-14",
  },
  {
    id: "VMDDP-FT-2024-003",
    eventName: "Fodder Management Session",
    eventDate: "2024-12-22",
    district: "Nagpur",
    taluka: "Hingna",
    village: "Wadi",
    trainingVenueType: "progressive farmers",
    venueName: "Patil Krishi Farm",
    numberOfParticipants: 15,
    participantImages: [
      "https://placehold.co/400x300/e2e8f0/64748b?text=Participant+List+1",
    ],
    fundAllocation: {
      trainingMaterial: 2000,
      logistics: 1500,
      refreshment: 1200,
      totalBudget: 15 * EXPENSE_PER_HEAD,
    },
    status: "completed",
    submittedDate: "2024-12-12",
  },
];

export default function ViewFarmerTrainingApplication() {
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
      case "completed":
        return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Completed</Badge>;
      case "rejected":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!application) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Application not found</p>
              <Button onClick={() => router.push("/subadmin/farmer-training")}>
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
              onClick={() => router.push("/subadmin/farmer-training")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
                <FileText className="w-6 h-6" />
                Training Application Details
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
                    <p className="font-mono font-semibold text-lg">{application.id}</p>
                    <p className="text-sm text-muted-foreground">Submitted on {application.submittedDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="font-medium">{application.eventName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">{application.eventDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="font-medium">{application.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taluka</p>
                    <p className="font-medium">{application.taluka}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Village</p>
                    <p className="font-medium">{application.village}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Training Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Venue Type</p>
                    <p className="font-medium">{application.trainingVenueType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue Name</p>
                    <p className="font-medium">{application.venueName}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Participants</p>
                    <p className="font-medium text-2xl">{application.numberOfParticipants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="font-semibold text-lg">{formatCurrency(application.fundAllocation.totalBudget)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Participant List Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.participantImages && application.participantImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {application.participantImages.map((image, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`Participant list ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Fund Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Budget</span>
                      <span className="text-xl font-bold">{formatCurrency(application.fundAllocation.totalBudget)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {application.numberOfParticipants} participants × ₹{EXPENSE_PER_HEAD}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Training Material</p>
                      <p className="font-semibold">{formatCurrency(application.fundAllocation.trainingMaterial)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Logistics</p>
                      <p className="font-semibold">{formatCurrency(application.fundAllocation.logistics)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Refreshment</p>
                      <p className="font-semibold">{formatCurrency(application.fundAllocation.refreshment)}</p>
                    </div>
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
